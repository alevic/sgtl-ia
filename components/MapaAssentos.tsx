import React, { useState } from 'react';
import { IAssento, IVeiculo } from '../types';
import { Plus, Trash2, X, Bus as BusIcon, Save } from 'lucide-react';

interface MapaAssentosProps {
    veiculo: IVeiculo & {
        km_atual?: number;
        ano?: number;
        capacidade_passageiros?: number;
    };
    onSave?: (assentos: IAssento[]) => void;
}

type DriverPosition = 'Left' | 'Right';

export const MapaAssentos: React.FC<MapaAssentosProps> = ({ veiculo, onSave }) => {
    const [showUpperDeck, setShowUpperDeck] = useState(false);
    const [driverPosition, setDriverPosition] = useState<DriverPosition>('Left');
    const [seatRows, setSeatRows] = useState(8);
    const [seatColumns, setSeatColumns] = useState(5);
    const [lowerDeckSeats, setLowerDeckSeats] = useState<string[][]>([]);
    const [upperDeckSeats, setUpperDeckSeats] = useState<string[][]>([]);

    const generateBusSeats = () => {
        const seats: string[][] = [];
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

        for (let row = 0; row < seatRows; row++) {
            const rowSeats: string[] = [];
            const rowLetter = letters[row];

            for (let col = 0; col < seatColumns; col++) {
                // Coluna do meio é sempre "Blank" (corredor)
                if (col === Math.floor(seatColumns / 2)) {
                    rowSeats.push('Blank');
                } else {
                    // Ajustar numeração considerando o corredor
                    const seatNumber = col < Math.floor(seatColumns / 2) ? col + 1 : col;
                    rowSeats.push(`${rowLetter}${seatNumber}`);
                }
            }
            seats.push(rowSeats);
        }

        setLowerDeckSeats(seats);
        if (showUpperDeck) {
            setUpperDeckSeats(seats.map(row => [...row])); // Cópia para upper deck
        }
    };

    const addNewRow = (isUpperDeck: boolean = false) => {
        const currentSeats = isUpperDeck ? upperDeckSeats : lowerDeckSeats;
        const setSeats = isUpperDeck ? setUpperDeckSeats : setLowerDeckSeats;

        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const rowLetter = letters[currentSeats.length];
        const newRow: string[] = [];

        for (let col = 0; col < seatColumns; col++) {
            if (col === Math.floor(seatColumns / 2)) {
                newRow.push('Blank');
            } else {
                const seatNumber = col < Math.floor(seatColumns / 2) ? col + 1 : col;
                newRow.push(`${rowLetter}${seatNumber}`);
            }
        }

        setSeats([...currentSeats, newRow]);
    };

    const deleteRow = (rowIndex: number, isUpperDeck: boolean = false) => {
        const currentSeats = isUpperDeck ? upperDeckSeats : lowerDeckSeats;
        const setSeats = isUpperDeck ? setUpperDeckSeats : setLowerDeckSeats;

        const newSeats = currentSeats.filter((_, index) => index !== rowIndex);
        setSeats(newSeats);
    };

    const deleteSeat = (rowIndex: number, colIndex: number, isUpperDeck: boolean = false) => {
        const currentSeats = isUpperDeck ? upperDeckSeats : lowerDeckSeats;
        const setSeats = isUpperDeck ? setUpperDeckSeats : setLowerDeckSeats;

        const newSeats = currentSeats.map((row, rIdx) => {
            if (rIdx === rowIndex) {
                return row.map((seat, cIdx) => cIdx === colIndex ? 'Blank' : seat);
            }
            return row;
        });

        setSeats(newSeats);
    };

    const handleSave = () => {
        alert('Configuração de assentos salva com sucesso!');
        // Aqui você converteria para IAssento[] e chamaria onSave
    };

    const renderSeatGrid = (seats: string[][], isUpperDeck: boolean = false) => {
        if (seats.length === 0) {
            return (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    Clique em "Generate Bus Seat" para criar o layout
                </div>
            );
        }

        return (
            <div className="space-y-4">
                <div className="text-center">
                    <div className="inline-block px-6 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg">
                        <p className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <BusIcon size={20} />
                            Bus Front
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    {seats.map((row, rowIndex) => (
                        <div key={rowIndex} className="flex items-center gap-2">
                            {row.map((seat, colIndex) => (
                                <div
                                    key={colIndex}
                                    className={`flex-1 px-3 py-2 rounded text-center font-medium ${seat === 'Blank'
                                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-dashed border-slate-300 dark:border-slate-600'
                                            : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white border border-slate-300 dark:border-slate-600'
                                        }`}
                                >
                                    {seat}
                                </div>
                            ))}

                            <div className="flex gap-1">
                                <button
                                    onClick={() => deleteSeat(rowIndex, row.length - 1, isUpperDeck)}
                                    className="p-2 bg-pink-500 hover:bg-pink-600 text-white rounded transition-colors"
                                    title="Delete last seat"
                                >
                                    <Trash2 size={16} />
                                </button>
                                <button
                                    onClick={() => deleteRow(rowIndex, isUpperDeck)}
                                    className="p-2 bg-pink-500 hover:bg-pink-600 text-white rounded transition-colors"
                                    title="Delete row"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    onClick={() => addNewRow(isUpperDeck)}
                    className="w-full px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                    <Plus size={18} />
                    Add New Row
                </button>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-1">Seat Configuration</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Bus seat configuration. Plan your bus seat.</p>
            </div>

            {/* Seat Information */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-2">Seat Information</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Here you can plan seat of the bus.</p>
            </div>

            {/* Seat Type - Optional */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Seat Type <span className="text-red-500">*</span>
                </label>
                <select className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option>Seat Plan</option>
                    <option>Without Seat Plan</option>
                </select>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Please select your bus seat type - Default Without Seat Plan
                </p>
            </div>

            {/* Lower Deck Configuration */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4">Lower Deck</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Lower deck seat plan</p>

                {/* Show Upper Deck Toggle */}
                {veiculo.is_double_deck && (
                    <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                        <div>
                            <p className="font-medium text-slate-700 dark:text-slate-200">Show Upper Deck</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Turn On or Off upper deck seat plan</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showUpperDeck}
                                onChange={(e) => setShowUpperDeck(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                )}

                {/* Configuration Controls */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Driver Position
                        </label>
                        <select
                            value={driverPosition}
                            onChange={(e) => setDriverPosition(e.target.value as DriverPosition)}
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="Left">Left</option>
                            <option value="Right">Right</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Seat Rows
                        </label>
                        <input
                            type="number"
                            value={seatRows}
                            onChange={(e) => setSeatRows(parseInt(e.target.value) || 0)}
                            min="1"
                            max="20"
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Seat Columns
                        </label>
                        <input
                            type="number"
                            value={seatColumns}
                            onChange={(e) => setSeatColumns(parseInt(e.target.value) || 0)}
                            min="3"
                            max="7"
                            step="2"
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Use odd numbers (3, 5, 7) for center aisle
                        </p>
                    </div>
                </div>

                {/* Generate Button */}
                <button
                    onClick={generateBusSeats}
                    className="mb-6 px-6 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                    <Plus size={18} />
                    Generate Bus Seat
                </button>

                {/* Seat Grid */}
                {renderSeatGrid(lowerDeckSeats, false)}
            </div>

            {/* Upper Deck Configuration */}
            {veiculo.is_double_deck && showUpperDeck && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4">Upper Deck</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Upper deck seat plan</p>

                    {renderSeatGrid(upperDeckSeats, true)}
                </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                    <Save size={18} />
                    Save Configuration
                </button>
            </div>
        </div>
    );
};
