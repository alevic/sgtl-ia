import React, { useState, useEffect } from 'react';
import { IAssento, IVeiculo, TipoAssento, AssentoStatus } from '../../types';
import { Plus, X, Bus as BusIcon, Save, PaintBucket, Type, MousePointer2 } from 'lucide-react';

interface MapaAssentosProps {
    veiculo: IVeiculo & {
        km_atual?: number;
        ano?: number;
        capacidade_passageiros?: number;
    };
    seats?: IAssento[];
    onSave?: (assentos: IAssento[]) => void;
}

type DriverPosition = 'Left' | 'Right';

export const MapaAssentos: React.FC<MapaAssentosProps> = ({ veiculo, seats = [], onSave }) => {
    const [showUpperDeck, setShowUpperDeck] = useState(false);
    const [hasSeatPlan, setHasSeatPlan] = useState(true);
    const [driverPosition, setDriverPosition] = useState<DriverPosition>('Left');
    const [seatRows, setSeatRows] = useState(8);
    const [seatColumns, setSeatColumns] = useState(5);
    const [lowerDeckSeats, setLowerDeckSeats] = useState<string[][]>([]);
    const [upperDeckSeats, setUpperDeckSeats] = useState<string[][]>([]);
    const [activeTab, setActiveTab] = useState<'LOWER' | 'UPPER'>('LOWER');

    // Novos estados para configuração de tipos
    const [editMode, setEditMode] = useState<'NUMBER' | 'TYPE'>('NUMBER');
    const [selectedType, setSelectedType] = useState<TipoAssento>(TipoAssento.CONVENCIONAL);

    const [seatTypes, setSeatTypes] = useState<Record<string, TipoAssento>>({});
    const [seatStatuses, setSeatStatuses] = useState<Record<string, AssentoStatus>>({});

    const SEAT_COLORS: Record<TipoAssento, string> = {
        [TipoAssento.CONVENCIONAL]: 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600',
        [TipoAssento.EXECUTIVO]: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700',
        [TipoAssento.SEMI_LEITO]: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700',
        [TipoAssento.LEITO]: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700',
        [TipoAssento.CAMA]: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700',
        [TipoAssento.CAMA_MASTER]: 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-700',
    };

    useEffect(() => {
        if (seats && seats.length > 0) {
            loadSavedSeats();
        }
    }, [seats]);

    const loadSavedSeats = () => {
        try {
            // Find dimensions
            let maxRow = 0;
            let maxCol = 0;
            const types: Record<string, TipoAssento> = {};

            seats.forEach(seat => {
                if (seat.posicao_y > maxRow) maxRow = seat.posicao_y;
                if (seat.posicao_x > maxCol) maxCol = seat.posicao_x;
                if (seat.numero && !seat.numero.startsWith('DISABLED_')) {
                    types[seat.numero] = seat.tipo;
                }
            });

            // Update dimensions state
            setSeatRows(maxRow + 1);
            setSeatColumns(maxCol + 1);
            setSeatRows(maxRow + 1);
            setSeatColumns(maxCol + 1);
            setSeatTypes(types);

            // Populate statuses
            const statuses: Record<string, AssentoStatus> = {};
            seats.forEach(seat => {
                if (seat.numero) {
                    statuses[seat.numero] = seat.status;
                }
            });
            setSeatStatuses(statuses);

            // Check if upper deck has seats
            const hasUpper = seats.some(s => s.andar === 2);
            setShowUpperDeck(hasUpper);

            // Initialize grids with empty string (editable slot) instead of Blank (Corridor)
            const lower: string[][] = Array(maxRow + 1).fill(null).map(() => Array(maxCol + 1).fill(''));
            // Only initialize upper grid if there are seats for it
            const upper: string[][] = hasUpper
                ? Array(maxRow + 1).fill(null).map(() => Array(maxCol + 1).fill(''))
                : [];

            // Populate grids
            seats.forEach(seat => {
                const grid = seat.andar === 1 ? lower : upper;
                if (grid && grid.length > 0 && grid[seat.posicao_y]) {
                    if (seat.disabled || (seat.numero && seat.numero.startsWith('DISABLED_'))) {
                        grid[seat.posicao_y][seat.posicao_x] = ''; // Empty string for disabled
                    } else {
                        grid[seat.posicao_y][seat.posicao_x] = seat.numero || '';
                    }
                }
            });

            // Auto-detect corridors: If a column is completely empty in a deck, mark it as 'Blank'
            const detectCorridors = (grid: string[][]) => {
                if (!grid || grid.length === 0) return;

                // Get number of columns from first row
                const numCols = grid[0].length;

                for (let c = 0; c < numCols; c++) {
                    let isColumnEmpty = true;
                    for (let r = 0; r < grid.length; r++) {
                        if (grid[r][c] !== '' && grid[r][c] !== 'Driver') {
                            isColumnEmpty = false;
                            break;
                        }
                    }

                    if (isColumnEmpty) {
                        for (let r = 0; r < grid.length; r++) {
                            grid[r][c] = 'Blank';
                        }
                    }
                }
            };

            detectCorridors(lower);
            if (hasUpper) detectCorridors(upper);

            setLowerDeckSeats(lower);
            setUpperDeckSeats(upper);
        } catch (error) {
            console.error("Error loading saved seats:", error);
        }
    };

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
                    const prefix = isUpperDeck ? 'S' : 'T';
                    rowSeats.push(`${prefix}${rowLetter}${seatNumber}`);
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
                const prefix = isUpperDeck ? 'S' : 'T';
                newRow.push(`${prefix}${rowLetter}${seatNumber}`);
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

    const handleSeatClick = (seatNumber: string) => {
        if (editMode === 'TYPE' && seatNumber !== 'Blank') {
            setSeatTypes(prev => ({
                ...prev,
                [seatNumber]: selectedType
            }));
        }
    };

    const getSeatType = (seatNumber: string) => seatTypes[seatNumber] || TipoAssento.CONVENCIONAL;

    const handleSave = () => {
        // Converter grids para IAssento[]
        const allSeats: IAssento[] = [];

        const processDeck = (seats: string[][], deck: 1 | 2) => {
            seats.forEach((row, rowIndex) => {
                row.forEach((seat, colIndex) => {
                    if (seat === 'Blank' || seat === 'Driver') {
                        // Skip corridors and driver position
                        return;
                    }

                    const isEmpty = seat.trim() === '';

                    allSeats.push({
                        numero: isEmpty ? `DISABLED_D${deck}_R${rowIndex}_C${colIndex}` : seat.trim(),
                        andar: deck,
                        posicao_x: colIndex,
                        posicao_y: rowIndex,
                        tipo: seatTypes[seat] || TipoAssento.CONVENCIONAL,
                        status: isEmpty ? 'BLOQUEADO' as AssentoStatus : (seatStatuses[seat.trim()] || AssentoStatus.LIVRE),
                        disabled: isEmpty
                    } as IAssento);
                });
            });
        };

        processDeck(lowerDeckSeats, 1);
        if (veiculo.is_double_deck) {
            processDeck(upperDeckSeats, 2);
        }

        if (onSave) {
            onSave(allSeats);
        } else {
            console.log('Assentos salvos:', allSeats);
            alert('Configuração salva com sucesso! (Verifique o console)');
        }
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
                <div className="overflow-x-auto pb-4 pr-16">
                    <div className="space-y-3 min-w-max flex flex-col items-center">
                        {/* Frente do Ônibus */}
                        <div className="mb-4">
                            <div className="inline-block px-6 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg">
                                <p className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <BusIcon size={20} />
                                    Frente do Ônibus
                                </p>
                            </div>
                        </div>

                        {seats.map((row, rowIndex) => (
                            <div key={rowIndex} className="flex items-center gap-3">
                                {/* Ghost element for centering */}
                                <div className="w-[42px] flex-shrink-0 opacity-0 pointer-events-none" aria-hidden="true" />
                                {row.map((seat, colIndex) => {
                                    // Safety check
                                    if (typeof seat !== 'string') {
                                        return null;
                                    }

                                    const isEmpty = seat.trim() === '';
                                    const isBlank = seat === 'Blank';

                                    if (isBlank) {
                                        // Render corridor
                                        return (
                                            <div key={colIndex} className="w-14 h-14 flex items-center justify-center">
                                                <div className="w-full h-full flex items-center justify-center bg-slate-50/50 dark:bg-slate-800/30 border-x-2 border-dashed border-slate-200 dark:border-slate-700 rounded-sm">
                                                    <span className="text-[9px] text-slate-300 dark:text-slate-600 font-bold tracking-widest rotate-90 select-none whitespace-nowrap">
                                                        CORREDOR
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    } else if (isEmpty && editMode !== 'NUMBER') {
                                        // Render disabled seat
                                        return (
                                            <div key={colIndex} className="w-14 h-14 flex items-center justify-center">
                                                <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 rounded-lg opacity-50">
                                                    <X size={20} className="text-slate-400 dark:text-slate-500" />
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        // Render normal seat
                                        return (
                                            <div
                                                key={colIndex}
                                                className="relative group cursor-pointer"
                                                onClick={() => handleSeatClick(seat)}
                                            >
                                                <div className={`w-14 h-14 rounded-lg transition-all duration-200 border-2 shadow-sm flex items-center justify-center ${SEAT_COLORS[getSeatType(seat)]} ${editMode === 'TYPE' ? 'hover:ring-2 hover:ring-offset-2 ring-blue-500' : ''}`}>
                                                    {editMode === 'NUMBER' ? (
                                                        <input
                                                            type="text"
                                                            value={seat}
                                                            onChange={(e) => updateSeatName(rowIndex, colIndex, e.target.value, isUpperDeck)}
                                                            className="w-full h-full bg-transparent text-center text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none"
                                                            placeholder="..."
                                                        />
                                                    ) : (
                                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 select-none">
                                                            {seat}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Tooltip do Tipo */}
                                                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                                    {(isEmpty || seatStatuses[seat] === 'BLOQUEADO') ? 'BLOQUEADO' : getSeatType(seat).replace('_', ' ')}
                                                </div>


                                            </div>
                                        );
                                    }
                                })}

                                <div className="flex gap-2 flex-shrink-0 ml-4 opacity-50 hover:opacity-100 transition-opacity w-[42px] justify-center">
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
                    className="w-full px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-400 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl font-medium transition-all flex items-center justify-center gap-2 group"
                >
                    <div className="bg-slate-100 dark:bg-slate-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 p-1 rounded-full transition-colors">
                        <Plus size={16} />
                    </div>
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
                    {/* Tabs */}
                    <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab('LOWER')}
                                className={`
                                    group inline-flex items-center py-4 px-1 border-b-2 font-bold text-lg transition-all duration-200
                                    ${activeTab === 'LOWER'
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'}
                                `}
                            >
                                <span className={`flex items-center justify-center w-6 h-6 rounded-full mr-3 text-xs ${activeTab === 'LOWER' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'}`}>
                                    1
                                </span>
                                Andar Térreo
                            </button>
                            {veiculo.is_double_deck && (
                                <button
                                    onClick={() => setActiveTab('UPPER')}
                                    className={`
                                        group inline-flex items-center py-4 px-1 border-b-2 font-bold text-lg transition-all duration-200
                                        ${activeTab === 'UPPER'
                                            ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'}
                                    `}
                                >
                                    <span className={`flex items-center justify-center w-6 h-6 rounded-full mr-3 text-xs ${activeTab === 'UPPER' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'}`}>
                                        2
                                    </span>
                                    Andar Superior
                                </button>
                            )}
                        </nav>
                    </div>

                    <div className="mt-6">
                        {/* Configuration Controls (Shared Inputs, but applied on Generate) */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 mb-6">
                            <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-4">
                                Parâmetros de Geração ({activeTab === 'LOWER' ? 'Térreo' : 'Superior'})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        </div>

                        {/* Toolbar de Edição */}
                        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-4 mb-4">
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                        <MousePointer2 size={18} className="text-blue-500" />
                                        Ferramentas de Edição
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        Escolha uma ferramenta para interagir com o mapa
                                    </p>
                                </div>
                                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                                    <button
                                        onClick={() => setEditMode('NUMBER')}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${editMode === 'NUMBER'
                                            ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                            }`}
                                    >
                                        <Type size={16} />
                                        Numeração
                                    </button>
                                    <button
                                        onClick={() => setEditMode('TYPE')}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${editMode === 'TYPE'
                                            ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                            }`}
                                    >
                                        <PaintBucket size={16} />
                                        Tipos
                                    </button>
                                </div>
                            </div>

                            {editMode === 'TYPE' && (
                                <div className="animate-in fade-in slide-in-from-top-2 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700/50">
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                                        Selecione um tipo de assento para aplicar:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.values(TipoAssento).map((tipo) => (
                                            <button
                                                key={tipo}
                                                onClick={() => setSelectedType(tipo)}
                                                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all flex items-center gap-2 ${selectedType === tipo
                                                    ? 'ring-2 ring-blue-500 ring-offset-2 ' + SEAT_COLORS[tipo]
                                                    : 'hover:bg-white dark:hover:bg-slate-800 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                                    }`}
                                            >
                                                <div className={`w-3 h-3 rounded-full border border-slate-300 ${SEAT_COLORS[tipo].split(' ')[0]}`} />
                                                {tipo.replace('_', ' ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Active Tab Content */}
                        {activeTab === 'LOWER' && (
                            <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                                <div className="flex items-center justify-between mb-6">
                                    <h4 className="text-lg font-bold text-slate-800 dark:text-white">Mapa do Andar Térreo</h4>
                                    <button
                                        onClick={() => generateBusSeats(false)}
                                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                                    >
                                        <Plus size={18} />
                                        Gerar Assentos Térreo
                                    </button>
                                </div>
                                {renderSeatGrid(lowerDeckSeats, false, 'andar térreo')}
                            </div>
                        )}

                        {activeTab === 'UPPER' && veiculo.is_double_deck && (
                            <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                                <div className="flex items-center justify-between mb-6">
                                    <h4 className="text-lg font-bold text-slate-800 dark:text-white">Mapa do Andar Superior</h4>
                                    <button
                                        onClick={() => generateBusSeats(true)}
                                        className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                                    >
                                        <Plus size={18} />
                                        Gerar Assentos Superior
                                    </button>
                                </div>
                                {renderSeatGrid(upperDeckSeats, true, 'andar superior')}
                            </div>
                        )}
                    </div>
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
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                    onClick={() => {
                        if (confirm('Tem certeza que deseja limpar todos os assentos?')) {
                            setLowerDeckSeats([]);
                            setUpperDeckSeats([]);
                        }
                    }}
                    className="px-6 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                    <X size={18} />
                    Limpar Tudo
                </button>
                <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-2 shadow-sm"
                >
                    <Save size={18} />
                    Salvar Configuração
                </button>
            </div>
        </div>
    );
};
