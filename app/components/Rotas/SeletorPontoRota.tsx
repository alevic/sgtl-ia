import React, { useState, useEffect } from 'react';
import { IPontoRota } from '../../types';
import { MapPin, Clock, CheckSquare, Plus, X } from 'lucide-react';
import { locationService, IState, ICity, INeighborhood } from '../../services/locationService';
import { TimePicker } from '../Form/TimePicker';

interface SeletorPontoRotaProps {
    ponto: IPontoRota;
    onChange: (ponto: IPontoRota) => void;
    readonly?: boolean;
}

export const SeletorPontoRota: React.FC<SeletorPontoRotaProps> = ({
    ponto,
    onChange,
    readonly = false
}) => {
    const [states, setStates] = useState<IState[]>([]);
    const [cities, setCities] = useState<ICity[]>([]);
    const [neighborhoods, setNeighborhoods] = useState<INeighborhood[]>([]);

    const [selectedState, setSelectedState] = useState<number | ''>('');
    const [selectedCity, setSelectedCity] = useState<number | ''>('');
    const [selectedNeighborhood, setSelectedNeighborhood] = useState<number | ''>('');

    const [newNeighborhoodName, setNewNeighborhoodName] = useState('');
    const [showNewNeighborhoodInput, setShowNewNeighborhoodInput] = useState(false);

    const [newCityName, setNewCityName] = useState('');
    const [showNewCityInput, setShowNewCityInput] = useState(false);

    // Initial load of states
    useEffect(() => {
        if (!readonly) {
            locationService.getStates().then(setStates).catch(console.error);
        }
    }, [readonly]);

    // Load existing location IDs when editing
    useEffect(() => {
        console.log('Loading location IDs from ponto:', {
            state_id: ponto.state_id,
            city_id: ponto.city_id,
            neighborhood_id: ponto.neighborhood_id,
            selectedState,
            selectedCity,
            selectedNeighborhood
        });

        if (ponto.state_id && !selectedState) {
            console.log('Setting selectedState to:', ponto.state_id);
            setSelectedState(ponto.state_id);
        }
        if (ponto.city_id && !selectedCity) {
            console.log('Setting selectedCity to:', ponto.city_id);
            setSelectedCity(ponto.city_id);
        }
        if (ponto.neighborhood_id && !selectedNeighborhood) {
            console.log('Setting selectedNeighborhood to:', ponto.neighborhood_id);
            setSelectedNeighborhood(ponto.neighborhood_id);
        }
    }, [ponto.state_id, ponto.city_id, ponto.neighborhood_id, selectedState, selectedCity, selectedNeighborhood]);

    // Load cities when state changes
    useEffect(() => {
        if (selectedState) {
            locationService.getCities(Number(selectedState)).then(setCities).catch(console.error);
            setNeighborhoods([]);
            setSelectedCity('');
            setSelectedNeighborhood('');
        }
    }, [selectedState]);

    // Load neighborhoods when city changes
    useEffect(() => {
        if (selectedCity) {
            locationService.getNeighborhoods(Number(selectedCity)).then(setNeighborhoods).catch(console.error);
            setSelectedNeighborhood('');
        }
    }, [selectedCity]);

    const handleLocationChange = (neighborhoodName: string, cityName: string, stateUf: string, stateId: number, cityId: number, neighborhoodId: number) => {
        const fullName = `${neighborhoodName}, ${cityName} - ${stateUf}`;
        onChange({
            ...ponto,
            nome: fullName,
            state_id: stateId,
            city_id: cityId,
            neighborhood_id: neighborhoodId
        });
    };

    const handleStateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const stateId = Number(e.target.value);
        setSelectedState(stateId);
        // Reset downstream selections and input modes
        setSelectedCity('');
        setSelectedNeighborhood('');
        setShowNewCityInput(false);
        setShowNewNeighborhoodInput(false);
        setNewCityName('');
        setNewNeighborhoodName('');
    };

    const handleCitySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === 'new') {
            setShowNewCityInput(true);
            setSelectedCity('');
            // Reset downstream
            setSelectedNeighborhood('');
        } else {
            const cityId = Number(value);
            setSelectedCity(cityId);
            setShowNewCityInput(false);
            // Reset downstream
            setSelectedNeighborhood('');
        }
    };

    const handleNeighborhoodSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === 'new') {
            setShowNewNeighborhoodInput(true);
            setSelectedNeighborhood('');
        } else {
            const neighborhoodId = Number(value);
            setSelectedNeighborhood(neighborhoodId);
            setShowNewNeighborhoodInput(false);

            // Update full name
            const neighborhood = neighborhoods.find(n => n.id === neighborhoodId);
            const city = cities.find(c => c.id === Number(selectedCity));
            const state = states.find(s => s.id === Number(selectedState));

            if (neighborhood && city && state) {
                handleLocationChange(neighborhood.name, city.name, state.uf, state.id, city.id, neighborhood.id);
            }
        }
    };

    const handleCreateCity = async () => {
        if (!newCityName || !selectedState) return;

        try {
            const newCity = await locationService.createCity(newCityName, Number(selectedState));
            setCities([...cities, newCity]);
            setSelectedCity(newCity.id);
            setShowNewCityInput(false);
            setNewCityName('');

            // Update location with new city (no neighborhood yet)
            const state = states.find(s => s.id === Number(selectedState));
            if (state) {
                onChange({
                    ...ponto,
                    nome: `${newCity.name} - ${state.uf}`,
                    state_id: state.id,
                    city_id: newCity.id,
                    neighborhood_id: undefined
                });
            }
        } catch (error) {
            console.error("Error creating city:", error);
            alert("Erro ao criar cidade. Verifique se já existe.");
        }
    };

    const handleCreateNeighborhood = async () => {
        if (!newNeighborhoodName || !selectedCity) return;

        try {
            const newNeighborhood = await locationService.createNeighborhood(newNeighborhoodName, Number(selectedCity));
            setNeighborhoods([...neighborhoods, newNeighborhood]);
            setSelectedNeighborhood(newNeighborhood.id);
            setShowNewNeighborhoodInput(false);
            setNewNeighborhoodName('');

            // Update full name
            const city = cities.find(c => c.id === Number(selectedCity));
            const state = states.find(s => s.id === Number(selectedState));

            if (city && state) {
                handleLocationChange(newNeighborhood.name, city.name, state.uf, state.id, city.id, newNeighborhood.id);
            }
        } catch (error) {
            console.error("Error creating neighborhood:", error);
            alert("Erro ao criar bairro. Verifique se já existe.");
        }
    };

    const handleChange = (campo: keyof IPontoRota, valor: any) => {
        onChange({ ...ponto, [campo]: valor });
    };

    const getTipoLabel = () => {
        switch (ponto.tipo) {
            case 'ORIGEM': return 'Origem';
            case 'DESTINO': return 'Destino';
            case 'PARADA_INTERMEDIARIA': return 'Parada';
            default: return ponto.tipo;
        }
    };

    const getTipoColor = () => {
        switch (ponto.tipo) {
            case 'ORIGEM': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
            case 'DESTINO': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
            case 'PARADA_INTERMEDIARIA': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
            default: return 'text-slate-600 bg-slate-50';
        }
    };

    // Helper to convert minutes to HH:MM
    const minutesToHHMM = (minutes?: number) => {
        if (!minutes) return '00:00';
        const h = Math.floor(minutes / 60).toString().padStart(2, '0');
        const m = (minutes % 60).toString().padStart(2, '0');
        return `${h}:${m}`;
    };

    // Helper to convert HH:MM to minutes
    const hhmmToMinutes = (hhmm: string) => {
        const [h, m] = hhmm.split(':').map(Number);
        if (!isNaN(h) && !isNaN(m)) {
            return h * 60 + m;
        }
        return 0;
    };

    return (
        <div className="space-y-4">
            {/* Tipo do Ponto */}
            <div className="flex items-center gap-2">
                <MapPin size={18} className={ponto.tipo === 'ORIGEM' ? 'text-green-600' : ponto.tipo === 'DESTINO' ? 'text-red-600' : 'text-blue-600'} />
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getTipoColor()}`}>
                    {getTipoLabel()}
                </span>
            </div>

            {/* Seleção de Localidade */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Estado */}
                <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Estado
                    </label>
                    <select
                        value={selectedState}
                        onChange={handleStateSelect}
                        disabled={readonly}
                        className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50"
                    >
                        <option value="">Selecione...</option>
                        {states.map(state => (
                            <option key={state.id} value={state.id}>{state.name} ({state.uf})</option>
                        ))}
                    </select>
                </div>

                {/* Cidade */}
                <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Cidade
                    </label>
                    {!showNewCityInput ? (
                        <select
                            value={selectedCity}
                            onChange={handleCitySelect}
                            disabled={readonly || !selectedState}
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50"
                        >
                            <option value="">Selecione...</option>
                            {cities.map(city => (
                                <option key={city.id} value={city.id}>{city.name}</option>
                            ))}
                            <option value="new" className="font-semibold text-blue-600">+ Nova Cidade</option>
                        </select>
                    ) : (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newCityName}
                                onChange={(e) => setNewCityName(e.target.value)}
                                placeholder="Nome da cidade"
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') setShowNewCityInput(false);
                                    if (e.key === 'Enter' && newCityName) handleCreateCity();
                                }}
                                className="flex-1 p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                autoFocus
                            />
                            <button
                                onClick={handleCreateCity}
                                disabled={!newCityName}
                                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50"
                                title="Criar cidade"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Bairro */}
                <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Bairro
                    </label>
                    {!showNewNeighborhoodInput ? (
                        <select
                            value={selectedNeighborhood}
                            onChange={handleNeighborhoodSelect}
                            disabled={readonly || !selectedCity}
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50"
                        >
                            <option value="">Selecione...</option>
                            {neighborhoods.map(neighborhood => (
                                <option key={neighborhood.id} value={neighborhood.id}>{neighborhood.name}</option>
                            ))}
                            <option value="new" className="font-semibold text-blue-600">+ Novo Bairro</option>
                        </select>
                    ) : (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newNeighborhoodName}
                                onChange={(e) => setNewNeighborhoodName(e.target.value)}
                                placeholder="Nome do bairro"
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') setShowNewNeighborhoodInput(false);
                                    if (e.key === 'Enter' && newNeighborhoodName) handleCreateNeighborhood();
                                }}
                                className="flex-1 p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                autoFocus
                            />
                            <button
                                onClick={handleCreateNeighborhood}
                                disabled={!newNeighborhoodName}
                                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50"
                                title="Criar bairro"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Campo de Local (editável) */}
            <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Local
                </label>
                <input
                    type="text"
                    value={ponto.nome}
                    onChange={(e) => handleChange('nome', e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm"
                />
            </div>

            {/* Campos de Deslocamento e Tempo (V2) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Deslocamento do Anterior (não para origem) */}
                {ponto.tipo !== 'ORIGEM' && (
                    <>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                                <MapPin size={14} />
                                Distância do anterior (km)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.1"
                                value={ponto.distancia_do_anterior_km || ''}
                                onChange={(e) => handleChange('distancia_do_anterior_km', parseFloat(e.target.value))}
                                disabled={readonly}
                                placeholder="0 km"
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-50"
                            />
                        </div>
                        {/* Tempo do anterior (min) */}
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                                <Clock size={14} />
                                Tempo do anterior
                            </label>
                            <TimePicker
                                value={minutesToHHMM(ponto.duracao_deslocamento_minutos)}
                                onChange={(val) => handleChange('duracao_deslocamento_minutos', hhmmToMinutes(val))}
                                disabled={readonly}
                                showIcon={false}
                                className="text-sm py-1.5"
                            />
                        </div>
                    </>
                )}

                {/* Tempo de Parada (apenas para intermediário) */}
                {ponto.tipo === 'PARADA_INTERMEDIARIA' && (
                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                            <Clock size={14} className="text-orange-500" />
                            Tempo de Parada
                        </label>
                        <TimePicker
                            value={minutesToHHMM(ponto.duracao_parada_minutos)}
                            onChange={(val) => handleChange('duracao_parada_minutos', hhmmToMinutes(val))}
                            disabled={readonly}
                            showIcon={false}
                            className="text-sm py-1.5"
                        />
                    </div>
                )}
            </div>

            {/* Display de Tempo Acumulado (Informativo) */}
            {ponto.tipo !== 'ORIGEM' && (
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded">
                    <Clock size={12} />
                    <span>
                        Chegada estimada após início:
                        <strong className="ml-1 text-slate-700 dark:text-slate-300">
                            {ponto.tempo_acumulado_minutos
                                ? `+ ${Math.floor(ponto.tempo_acumulado_minutos / 60)}h ${ponto.tempo_acumulado_minutos % 60}min`
                                : '--'}
                        </strong>
                    </span>
                </div>
            )}

            {/* Permissões de Embarque/Desembarque (apenas para paradas intermediárias) */}
            {ponto.tipo === 'PARADA_INTERMEDIARIA' && (
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        Operações Permitidas
                    </label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={ponto.permite_embarque}
                                onChange={(e) => handleChange('permite_embarque', e.target.checked)}
                                disabled={readonly}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                <CheckSquare size={16} className="text-green-600" />
                                Permite Embarque
                            </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={ponto.permite_desembarque}
                                onChange={(e) => handleChange('permite_desembarque', e.target.checked)}
                                disabled={readonly}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                <CheckSquare size={16} className="text-red-600" />
                                Permite Desembarque
                            </span>
                        </label>
                    </div>
                </div>
            )}

            {/* Observações */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Observações (opcional)
                </label>
                <textarea
                    value={ponto.observacoes || ''}
                    onChange={(e) => handleChange('observacoes', e.target.value)}
                    placeholder="Ex: Terminal Rodoviário Central"
                    disabled={readonly}
                    rows={2}
                    className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-50"
                />
            </div>
        </div>
    );
};
