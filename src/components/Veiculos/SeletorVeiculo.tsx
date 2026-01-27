import React, { useState, useEffect, useRef } from 'react';
import { IVeiculo } from '@/types';

interface SeletorVeiculoProps {
    value?: string;
    onChange: (vehicleId: string, vehicle?: IVeiculo) => void;
    initialVehicle?: Partial<IVeiculo>;
    placeholder?: string;
    className?: string;
}

export const SeletorVeiculo: React.FC<SeletorVeiculoProps> = ({
    value,
    onChange,
    initialVehicle,
    placeholder = "Buscar veículo...",
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [options, setOptions] = useState<IVeiculo[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState<Partial<IVeiculo> | null>(initialVehicle || null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Update selected vehicle if initialVehicle changes
    useEffect(() => {
        if (initialVehicle) {
            setSelectedVehicle(initialVehicle);
        }
    }, [initialVehicle]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isOpen) {
                fetchVehicles(searchTerm);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, isOpen]);

    const fetchVehicles = async (term: string) => {
        setLoading(true);
        try {
            const url = term
                ? `${import.meta.env.VITE_API_URL}/api/fleet/vehicles?q=${encodeURIComponent(term)}`
                : `${import.meta.env.VITE_API_URL}/api/fleet/vehicles`;

            const response = await fetch(url, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setOptions(data);
            }
        } catch (error) {
            console.error('Error fetching vehicles:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (vehicle: IVeiculo) => {
        setSelectedVehicle(vehicle);
        onChange(vehicle.id, vehicle);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedVehicle(null);
        onChange('');
        setSearchTerm('');
    };

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <div
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus-within:ring-2 focus-within:ring-blue-500 cursor-pointer flex items-center justify-between min-h-[42px]"
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (!isOpen) fetchVehicles('');
                }}
            >
                {selectedVehicle && selectedVehicle.placa ? (
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-xs bg-slate-200 dark:bg-slate-700 px-1 rounded">
                            {selectedVehicle.tipo === 'ONIBUS' ? 'BUS' : 'TRUCK'}
                        </span>
                        <span className="font-medium">{selectedVehicle.placa}</span>
                        <span className="text-slate-500 dark:text-slate-400 text-sm">- {selectedVehicle.modelo}</span>
                    </div>
                ) : (
                    <span className="text-slate-500 dark:text-slate-400">{placeholder}</span>
                )}

                <div className="flex items-center gap-2">
                    {selectedVehicle && selectedVehicle.placa && (
                        <button onClick={handleClear} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full font-bold text-slate-500">
                            X
                        </button>
                    )}
                    <span className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm shadow-lg max-h-60 overflow-hidden flex flex-col">
                    <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">🔍</span>
                            <input
                                type="text"
                                className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                                placeholder="Digite placa ou modelo..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    <div className="overflow-y-auto flex-1">
                        {loading ? (
                            <div className="p-4 text-center text-sm text-slate-500">Carregando...</div>
                        ) : options.length === 0 ? (
                            <div className="p-4 text-center text-sm text-slate-500">Nenhum veículo encontrado</div>
                        ) : (
                            <div className="py-1">
                                {options.map((vehicle) => (
                                    <button
                                        key={vehicle.id}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between group ${vehicle.id === value ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}
                                        onClick={() => handleSelect(vehicle)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-1.5 rounded-md ${vehicle.tipo === 'ONIBUS' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600'}`}>
                                                <span className="text-xs font-bold">{vehicle.tipo === 'ONIBUS' ? 'BUS' : 'TRK'}</span>
                                            </div>
                                            <div>
                                                <p className="font-medium">{vehicle.placa}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{vehicle.modelo}</p>
                                            </div>
                                        </div>
                                        {vehicle.id === value && <span className="text-blue-600 dark:text-blue-400">✓</span>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
