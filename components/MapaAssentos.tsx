import React, { useState } from 'react';
import { IAssento, IVeiculo } from '../types';
import { Plus, X, Bus as BusIcon, Save } from 'lucide-react';

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
    const [hasSeatPlan, setHasSeatPlan] = useState(true);
    const [driverPosition, setDriverPosition] = useState<DriverPosition>('Left');
    const [seatRows, setSeatRows] = useState(8);
    const [seatColumns, setSeatColumns] = useState(5);
    const [lowerDeckSeats, setLowerDeckSeats] = useState<string[][]>([]);
    const [upperDeckSeats, setUpperDeckSeats] = useState<string[][]>([]);

    const generateBusSeats = (isUpperDeck: boolean = false) => {
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

        if (isUpperDeck) {
            setUpperDeckSeats(seats);
        } else {
            setLowerDeckSeats(seats);
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



    const updateSeatName = (rowIndex: number, colIndex: number, newName: string, isUpperDeck: boolean = false) => {
        const currentSeats = isUpperDeck ? upperDeckSeats : lowerDeckSeats;
        const setSeats = isUpperDeck ? setUpperDeckSeats : setLowerDeckSeats;

        const newSeats = currentSeats.map((row, rIdx) => {
            if (rIdx === rowIndex) {
                return row.map((seat, cIdx) => cIdx === colIndex ? newName : seat);
            }
            return row;
        });

        setSeats(newSeats);
    };

    const handleSave = () => {
        alert('Configuração de assentos salva com sucesso!');
        // Aqui você converteria para IAssento[] e chamaria onSave
    };

    const renderSeatGrid = (seats: string[][], isUpperDeck: boolean = false, deckName: string) => {
        if (seats.length === 0) {
            return (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    <p>Clique em "Gerar Assentos" para criar o layout do {deckName}</p>
                </div>
            );
        }

        return (
            <div className="space-y-4">
                <div className="text-center">
                    <div className="inline-block px-6 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg">
                        <p className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <BusIcon size={20} />
                            Frente do Ônibus
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto pb-4">
                    <div className="space-y-3 min-w-max flex flex-col items-center">
                        {seats.map((row, rowIndex) => (
                            <div key={rowIndex} className="flex items-center gap-3">
                                {row.map((seat, colIndex) => (
                                    seat === 'Blank' ? (
                                        <div key={colIndex} className="w-14 h-14 flex items-center justify-center">
                                            <div className="w-full h-full flex items-center justify-center bg-slate-50/50 dark:bg-slate-800/30 border-x-2 border-dashed border-slate-200 dark:border-slate-700 rounded-sm">
                                                <span className="text-[9px] text-slate-300 dark:text-slate-600 font-bold tracking-widest rotate-90 select-none whitespace-nowrap">
                                                    CORREDOR
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div key={colIndex} className="relative">
                                            <input
                                                type="text"
                                                value={seat}
                                                onChange={(e) => updateSeatName(rowIndex, colIndex, e.target.value, isUpperDeck)}
                                                className="w-14 h-14 rounded-lg text-center text-sm font-bold transition-all duration-200 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-2 border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 shadow-sm"
                                                placeholder="..."
                                            />
                                            <div className="absolute -top-2 -right-2 w-5 h-5 bg-slate-100 dark:bg-slate-600 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-500 shadow-sm">
                                                <span className="text-[10px] text-slate-500 dark:text-slate-300 font-medium">{colIndex + 1}</span>
                                            </div>
                                        </div>
                                    )
                                ))}

                                <div className="flex gap-2 flex-shrink-0 ml-8 opacity-50 hover:opacity-100 transition-opacity">

                                    <button
                                        onClick={() => deleteRow(rowIndex, isUpperDeck)}
                                        className="p-2 bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded-lg transition-colors border border-slate-200 hover:border-red-200"
                                        title="Deletar linha"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    onClick={() => addNewRow(isUpperDeck)}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                    <Plus size={18} />
                    Adicionar Nova Linha
                </button>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-1">Configuração de Assentos</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Configure o layout dos assentos do ônibus.</p>
            </div>

            {/* Seat Information */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-2">Informações dos Assentos</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Aqui você pode planejar os assentos do ônibus.</p>
            </div>

            {/* Seat Type - Optional */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Tipo de Plano <span className="text-red-500">*</span>
                </label>
                <select
                    className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={hasSeatPlan ? 'Com Plano de Assentos' : 'Sem Plano de Assentos'}
                    onChange={(e) => setHasSeatPlan(e.target.value === 'Com Plano de Assentos')}
                >
                    <option value="Com Plano de Assentos">Com Plano de Assentos</option>
                    <option value="Sem Plano de Assentos">Sem Plano de Assentos</option>
                </select>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Selecione o tipo de plano - Padrão: Sem Plano de Assentos
                </p>
            </div>

            {hasSeatPlan ? (
                <>
                    {/* Lower Deck Configuration */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-2">Andar Térreo</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Plano de assentos do andar térreo</p>

                        {/* Show Upper Deck Toggle */}
                        {veiculo.is_double_deck && (
                            <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                                <div>
                                    <p className="font-medium text-slate-700 dark:text-slate-200">Mostrar Andar Superior</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Ative ou desative o plano do andar superior</p>
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
                                    Posição do Motorista
                                </label>
                                <select
                                    value={driverPosition}
                                    onChange={(e) => setDriverPosition(e.target.value as DriverPosition)}
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="Left">Esquerda</option>
                                    <option value="Right">Direita</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Linhas de Assentos
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
                                    Colunas de Assentos
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
                                    Use números ímpares (3, 5, 7) para corredor central
                                </p>
                            </div>
                        </div>

                        {/* Generate Button for Lower Deck */}
                        <button
                            onClick={() => generateBusSeats(false)}
                            className="mb-6 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Gerar Assentos - Andar Térreo
                        </button>

                        {/* Seat Grid for Lower Deck */}
                        {renderSeatGrid(lowerDeckSeats, false, 'andar térreo')}
                    </div>

                    {/* Upper Deck Configuration */}
                    {veiculo.is_double_deck && showUpperDeck && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-2">Andar Superior</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Plano de assentos do andar superior (Double Deck)</p>

                            {/* Generate Button for Upper Deck */}
                            <button
                                onClick={() => generateBusSeats(true)}
                                className="mb-6 px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                            >
                                <Plus size={18} />
                                Gerar Assentos - Andar Superior
                            </button>

                            {/* Seat Grid for Upper Deck */}
                            {renderSeatGrid(upperDeckSeats, true, 'andar superior')}
                        </div>
                    )}
                </>
            ) : (
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-8 text-center border border-slate-200 dark:border-slate-700 border-dashed">
                    <p className="text-slate-500 dark:text-slate-400 mb-2">
                        Este veículo opera sem lugares marcados.
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        A capacidade total será usada para controle de lotação.
                    </p>
                </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end gap-3">
                <button
                    onClick={() => {
                        setLowerDeckSeats([]);
                        setUpperDeckSeats([]);
                    }}
                    className="px-6 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                    <X size={18} />
                    Limpar Tudo
                </button>
                <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                    <Save size={18} />
                    Salvar Configuração
                </button>
            </div>
        </div>
    );
};
