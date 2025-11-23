import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IRota } from '../types';
import { VisualizadorRota } from '../components/Rotas/VisualizadorRota';
import {
    Plus, Search, Route as RouteIcon, Filter, Edit, Copy, ToggleLeft, ToggleRight, Trash2
} from 'lucide-react';

// Mock de rotas para demonstração
const MOCK_ROTAS: IRota[] = [
    {
        id: 'R001',
        nome: 'São Paulo → Rio de Janeiro',
        tipo_rota: 'IDA',
        ativa: true,
        duracao_estimada_minutos: 360,
        distancia_total_km: 430,
        pontos: [
            {
                id: 'P1',
                nome: 'São Paulo, SP',
                ordem: 0,
                tipo: 'ORIGEM',
                horario_partida: '2024-01-20T08:00:00',
                permite_embarque: true,
                permite_desembarque: false
            },
            {
                id: 'P2',
                nome: 'Rio de Janeiro, RJ',
                ordem: 1,
                tipo: 'DESTINO',
                horario_chegada: '2024-01-20T14:00:00',
                permite_embarque: false,
                permite_desembarque: true
            }
        ]
    },
    {
        id: 'R002',
        nome: 'São Paulo → Florianópolis (via Curitiba)',
        tipo_rota: 'IDA',
        ativa: true,
        duracao_estimada_minutos: 660,
        distancia_total_km: 700,
        pontos: [
            {
                id: 'P3',
                nome: 'São Paulo, SP',
                ordem: 0,
                tipo: 'ORIGEM',
                horario_partida: '2024-01-20T20:00:00',
                permite_embarque: true,
                permite_desembarque: false
            },
            {
                id: 'P4',
                nome: 'Curitiba, PR',
                ordem: 1,
                tipo: 'PARADA_INTERMEDIARIA',
                horario_chegada: '2024-01-21T02:00:00',
                horario_partida: '2024-01-21T02:30:00',
                permite_embarque: true,
                permite_desembarque: true,
                observacoes: 'Terminal Rodoviário Central'
            },
            {
                id: 'P5',
                nome: 'Florianópolis, SC',
                ordem: 2,
                tipo: 'DESTINO',
                horario_chegada: '2024-01-21T07:00:00',
                permite_embarque: false,
                permite_desembarque: true
            }
        ]
    }
];

export const Rotas: React.FC = () => {
    const navigate = useNavigate();
    const [rotas] = useState<IRota[]>(MOCK_ROTAS);
    const [busca, setBusca] = useState('');
    const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'IDA' | 'VOLTA'>('TODOS');
    const [filtroStatus, setFiltroStatus] = useState<'TODOS' | 'ATIVA' | 'INATIVA'>('TODOS');

    const rotasFiltradas = rotas.filter(rota => {
        const matchBusca = busca === '' ||
            rota.nome?.toLowerCase().includes(busca.toLowerCase()) ||
            rota.pontos.some(p => p.nome.toLowerCase().includes(busca.toLowerCase()));

        const matchTipo = filtroTipo === 'TODOS' || rota.tipo_rota === filtroTipo;
        const matchStatus = filtroStatus === 'TODOS' ||
            (filtroStatus === 'ATIVA' && rota.ativa) ||
            (filtroStatus === 'INATIVA' && !rota.ativa);

        return matchBusca && matchTipo && matchStatus;
    });

    const handleNovaRota = () => {
        navigate('/admin/rotas/nova');
    };

    const handleEditarRota = (id: string) => {
        navigate(`/admin/rotas/${id}`);
    };

    const handleDuplicarRota = (id: string) => {
        console.log('Duplicar rota:', id);
        // Implementar lógica de duplicação
    };

    const handleToggleStatus = (id: string) => {
        console.log('Toggle status rota:', id);
        // Implementar lógica de ativar/desativar
    };

    const handleExcluirRota = (id: string) => {
        if (confirm('Tem certeza que deseja excluir esta rota?')) {
            console.log('Excluir rota:', id);
            // Implementar lógica de exclusão
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                        Gerenciamento de Rotas
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Configure rotas reutilizáveis para suas viagens
                    </p>
                </div>
                <button
                    onClick={handleNovaRota}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                    <Plus size={18} />
                    Nova Rota
                </button>
            </div>

            {/* Filtros */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
                <div className="flex flex-wrap gap-4">
                    {/* Busca */}
                    <div className="flex-1 min-w-[250px]">
                        <div className="relative">
                            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                placeholder="Buscar por nome ou cidade..."
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Filtro Tipo */}
                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-slate-500" />
                        <select
                            value={filtroTipo}
                            onChange={(e) => setFiltroTipo(e.target.value as any)}
                            className="px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="TODOS">Todos os tipos</option>
                            <option value="IDA">Ida</option>
                            <option value="VOLTA">Volta</option>
                        </select>
                    </div>

                    {/* Filtro Status */}
                    <div>
                        <select
                            value={filtroStatus}
                            onChange={(e) => setFiltroStatus(e.target.value as any)}
                            className="px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="TODOS">Todos os status</option>
                            <option value="ATIVA">Ativas</option>
                            <option value="INATIVA">Inativas</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Lista de Rotas */}
            {rotasFiltradas.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-12 text-center">
                    <RouteIcon size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Nenhuma rota encontrada
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6">
                        {busca || filtroTipo !== 'TODOS' || filtroStatus !== 'TODOS'
                            ? 'Tente ajustar os filtros de busca'
                            : 'Crie sua primeira rota para começar'}
                    </p>
                    {!busca && filtroTipo === 'TODOS' && filtroStatus === 'TODOS' && (
                        <button
                            onClick={handleNovaRota}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors inline-flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Criar Primeira Rota
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid gap-6">
                    {rotasFiltradas.map((rota) => (
                        <div
                            key={rota.id}
                            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                        >
                            {/* Card Header */}
                            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                                                {rota.nome || 'Rota sem nome'}
                                            </h3>
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${rota.ativa
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                                }`}>
                                                {rota.ativa ? 'Ativa' : 'Inativa'}
                                            </span>
                                        </div>

                                        {/* Informações resumidas */}
                                        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                                            <span>{rota.pontos.length} pontos</span>
                                            {rota.pontos.length > 2 && (
                                                <span>• {rota.pontos.length - 2} parada(s)</span>
                                            )}
                                            {rota.distancia_total_km && (
                                                <span>• {rota.distancia_total_km} km</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Ações */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEditarRota(rota.id)}
                                            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                            title="Editar"
                                        >
                                            <Edit size={18} className="text-slate-600 dark:text-slate-400" />
                                        </button>
                                        <button
                                            onClick={() => handleDuplicarRota(rota.id)}
                                            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                            title="Duplicar"
                                        >
                                            <Copy size={18} className="text-slate-600 dark:text-slate-400" />
                                        </button>
                                        <button
                                            onClick={() => handleToggleStatus(rota.id)}
                                            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                            title={rota.ativa ? 'Desativar' : 'Ativar'}
                                        >
                                            {rota.ativa ? (
                                                <ToggleRight size={18} className="text-green-600 dark:text-green-400" />
                                            ) : (
                                                <ToggleLeft size={18} className="text-slate-400" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleExcluirRota(rota.id)}
                                            className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 size={18} className="text-red-600 dark:text-red-400" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Visualização da Rota */}
                            <div className="p-6 bg-slate-50 dark:bg-slate-900/50">
                                <VisualizadorRota rota={rota} compact />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
