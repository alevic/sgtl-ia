import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { IParada, TipoParada } from '../types';
import {
    MapPin, Search, Filter, Calendar, Bus, ArrowRight
} from 'lucide-react';

// Mock data - em produção virá do backend
const MOCK_PARADAS: (IParada & { viagem_titulo: string; viagem_id: string })[] = [
    {
        id: 'P1',
        nome: 'Curitiba, PR',
        horario_chegada: '2023-11-25T02:00:00',
        horario_partida: '2023-11-25T02:30:00',
        tipo: TipoParada.PARADA_TECNICA,
        viagem_titulo: 'São Paulo → Florianópolis',
        viagem_id: 'V001'
    },
    {
        id: 'P2',
        nome: 'Curitiba, PR',
        horario_chegada: '2023-12-01T08:00:00',
        horario_partida: '2023-12-01T09:00:00',
        tipo: TipoParada.EMBARQUE,
        viagem_titulo: 'Rio de Janeiro → Buenos Aires',
        viagem_id: 'V002'
    },
    {
        id: 'P3',
        nome: 'Porto Alegre, RS',
        horario_chegada: '2023-12-01T18:00:00',
        horario_partida: '2023-12-01T19:00:00',
        tipo: TipoParada.EMBARQUE,
        viagem_titulo: 'Rio de Janeiro → Buenos Aires',
        viagem_id: 'V002'
    },
    {
        id: 'P4',
        nome: 'Aracaju, SE',
        horario_chegada: '2023-12-15T10:00:00',
        horario_partida: '2023-12-15T10:30:00',
        tipo: TipoParada.EMBARQUE,
        viagem_titulo: 'Salvador → Recife',
        viagem_id: 'V004'
    },
    {
        id: 'P5',
        nome: 'Maceió, AL',
        horario_chegada: '2023-12-15T14:00:00',
        horario_partida: '2023-12-15T14:30:00',
        tipo: TipoParada.DESEMBARQUE,
        viagem_titulo: 'Salvador → Recife',
        viagem_id: 'V004'
    }
];

const TipoBadge: React.FC<{ tipo: TipoParada }> = ({ tipo }) => {
    const configs = {
        EMBARQUE: { color: 'green', label: 'Embarque', icon: '🟢' },
        DESEMBARQUE: { color: 'red', label: 'Desembarque', icon: '🔴' },
        PARADA_TECNICA: { color: 'blue', label: 'Parada Técnica', icon: '⚙️' }
    };

    const config = configs[tipo];

    return (
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-${config.color}-100 dark:bg-${config.color}-900/30 text-${config.color}-700 dark:text-${config.color}-300`}>
            <span>{config.icon}</span>
            {config.label}
        </span>
    );
};

export const ParadasIntermediarias: React.FC = () => {
    const [paradas] = useState(MOCK_PARADAS);
    const [filtroTipo, setFiltroTipo] = useState<'TODOS' | TipoParada>('TODOS');
    const [busca, setBusca] = useState('');

    const paradasFiltradas = paradas.filter(p => {
        const matchTipo = filtroTipo === 'TODOS' || p.tipo === filtroTipo;
        const matchBusca = busca === '' ||
            p.nome.toLowerCase().includes(busca.toLowerCase()) ||
            p.viagem_titulo.toLowerCase().includes(busca.toLowerCase());
        return matchTipo && matchBusca;
    });

    // Estatísticas
    const totalParadas = paradas.length;
    const paradasEmbarque = paradas.filter(p => p.tipo === TipoParada.EMBARQUE).length;
    const paradasDesembarque = paradas.filter(p => p.tipo === TipoParada.DESEMBARQUE).length;
    const paradasTecnicas = paradas.filter(p => p.tipo === TipoParada.PARADA_TECNICA).length;

    const formatarHorario = (datetime: string) => {
        const date = new Date(datetime);
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Paradas Intermediárias</h1>
                    <p className="text-slate-500 dark:text-slate-400">Visualização de todas as paradas cadastradas nas viagens</p>
                </div>
                <Link
                    to="/admin/paradas/nova"
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                    <MapPin size={18} />
                    Nova Parada
                </Link>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total de Paradas</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{totalParadas}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <MapPin size={24} className="text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Embarques</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{paradasEmbarque}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-2xl">
                            🟢
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Desembarques</p>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{paradasDesembarque}</p>
                        </div>
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center text-2xl">
                            🔴
                        </div>
                    </div>
                </div>

                <div className="bg-white dark-bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Paradas Técnicas</p>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{paradasTecnicas}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-2xl">
                            ⚙️
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar por cidade ou viagem..."
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => setFiltroTipo('TODOS')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${filtroTipo === 'TODOS' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                        >
                            <Filter size={16} />
                            Todos
                        </button>
                        <button
                            onClick={() => setFiltroTipo(TipoParada.EMBARQUE)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filtroTipo === TipoParada.EMBARQUE ? 'bg-green-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                        >
                            🟢 Embarque
                        </button>
                        <button
                            onClick={() => setFiltroTipo(TipoParada.DESEMBARQUE)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filtroTipo === TipoParada.DESEMBARQUE ? 'bg-red-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                        >
                            🔴 Desembarque
                        </button>
                        <button
                            onClick={() => setFiltroTipo(TipoParada.PARADA_TECNICA)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filtroTipo === TipoParada.PARADA_TECNICA ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                        >
                            ⚙️ Parada Técnica
                        </button>
                    </div>
                </div>
            </div>

            {/* Lista de Paradas */}
            <div className="grid gap-4">
                {paradasFiltradas.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                        <MapPin size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">Nenhuma parada encontrada</p>
                    </div>
                ) : (
                    paradasFiltradas.map((parada) => (
                        <div
                            key={parada.id}
                            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 hover:shadow-md transition-all"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                                        <MapPin size={24} className="text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                                {parada.nome}
                                            </h3>
                                            <TipoBadge tipo={parada.tipo} />
                                        </div>

                                        <Link
                                            to={`/admin/viagens`}
                                            className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline mb-3"
                                        >
                                            <Bus size={14} />
                                            <span>{parada.viagem_titulo}</span>
                                            <ArrowRight size={12} />
                                        </Link>

                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                <Calendar size={14} className="text-green-600" />
                                                <div>
                                                    <span className="font-medium">Chegada:</span>
                                                    <span className="ml-2">{formatarHorario(parada.horario_chegada)}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                <Calendar size={14} className="text-red-600" />
                                                <div>
                                                    <span className="font-medium">Partida:</span>
                                                    <span className="ml-2">{formatarHorario(parada.horario_partida)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Informação */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <MapPin size={20} className="text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                            Sobre Paradas Intermediárias
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            As paradas intermediárias são gerenciadas dentro do cadastro de cada viagem.
                            Para adicionar ou editar paradas, acesse a página de "Viagens" e crie/edite uma viagem.
                            Uma viagem pode ter uma ou mais paradas para embarques, desembarques ou paradas técnicas.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
