import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Wrench,
    Plus,
    Search,
    Filter,
    Calendar,
    AlertTriangle,
    CheckCircle,
    Clock,
    MoreVertical,
    FileText,
    DollarSign,
    TrendingUp,
    Edit,
    Trash2,
    Eye
} from 'lucide-react';
import { IManutencao, TipoManutencao, StatusManutencao, Moeda } from '../types';

// Mock Data
const MOCK_MANUTENCOES: IManutencao[] = [
    {
        id: '1',
        veiculo_id: '1', // Mercedes-Benz O500
        tipo: TipoManutencao.PREVENTIVA,
        status: StatusManutencao.AGENDADA,
        data_agendada: '2024-04-15',
        km_veiculo: 50000,
        descricao: 'Revisão de 50.000km - Troca de óleo e filtros',
        custo_pecas: 1500,
        custo_mao_de_obra: 800,
        moeda: Moeda.BRL,
        oficina: 'Oficina Central Diesel',
        responsavel: 'João Mecânico'
    },
    {
        id: '2',
        veiculo_id: '2', // Volvo 9800
        tipo: TipoManutencao.CORRETIVA,
        status: StatusManutencao.CONCLUIDA,
        data_agendada: '2024-03-10',
        data_inicio: '2024-03-10',
        data_conclusao: '2024-03-12',
        km_veiculo: 120000,
        descricao: 'Troca de pastilhas de freio dianteiras',
        custo_pecas: 2200,
        custo_mao_de_obra: 600,
        moeda: Moeda.BRL,
        oficina: 'Volvo Service',
        responsavel: 'Carlos Silva'
    },
    {
        id: '3',
        veiculo_id: '3', // Scania K440
        tipo: TipoManutencao.INSPECAO,
        status: StatusManutencao.EM_ANDAMENTO,
        data_agendada: '2024-03-20',
        data_inicio: '2024-03-20',
        km_veiculo: 85000,
        descricao: 'Inspeção pré-viagem internacional',
        custo_pecas: 0,
        custo_mao_de_obra: 300,
        moeda: Moeda.BRL,
        oficina: 'Garagem Interna',
        responsavel: 'Pedro Santos'
    }
];

export const Manutencao: React.FC = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('TODOS');
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    const toggleDropdown = (id: string) => {
        if (activeDropdown === id) {
            setActiveDropdown(null);
        } else {
            setActiveDropdown(id);
        }
    };

    const getStatusColor = (status: StatusManutencao) => {
        switch (status) {
            case StatusManutencao.AGENDADA: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            case StatusManutencao.EM_ANDAMENTO: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
            case StatusManutencao.CONCLUIDA: return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            case StatusManutencao.CANCELADA: return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    const getTipoIcon = (tipo: TipoManutencao) => {
        switch (tipo) {
            case TipoManutencao.PREVENTIVA: return <Clock size={16} className="text-blue-500" />;
            case TipoManutencao.CORRETIVA: return <AlertTriangle size={16} className="text-red-500" />;
            case TipoManutencao.PREDITIVA: return <TrendingUp size={16} className="text-purple-500" />;
            case TipoManutencao.INSPECAO: return <CheckCircle size={16} className="text-green-500" />;
            default: return <Wrench size={16} />;
        }
    };

    return (
        <div className="space-y-6" onClick={() => activeDropdown && setActiveDropdown(null)}>
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Gestão de Manutenção</h1>
                    <p className="text-slate-500 dark:text-slate-400">Controle preventivo e corretivo da frota</p>
                </div>
                <button
                    onClick={() => navigate('/admin/manutencao/nova')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Plus size={20} />
                    Nova Manutenção
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Wrench className="text-blue-600 dark:text-blue-400" size={20} />
                        </div>
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">Total</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">12</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manutenções este mês</p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                            <Clock className="text-yellow-600 dark:text-yellow-400" size={20} />
                        </div>
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">Em Andamento</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">3</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Veículos na oficina</p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <DollarSign className="text-green-600 dark:text-green-400" size={20} />
                        </div>
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">Custo</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">R$ 15.400</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gasto total este mês</p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <Calendar className="text-purple-600 dark:text-purple-400" size={20} />
                        </div>
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">Próximas</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">5</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Agendadas para 7 dias</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por veículo, descrição ou oficina..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="TODOS">Todos os Status</option>
                        <option value="AGENDADA">Agendada</option>
                        <option value="EM_ANDAMENTO">Em Andamento</option>
                        <option value="CONCLUIDA">Concluída</option>
                    </select>
                    <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-2">
                        <Filter size={20} />
                        Filtros
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-visible">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Veículo</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tipo / Descrição</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Data / Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Custo Total</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {MOCK_MANUTENCOES.map((manutencao) => (
                            <tr key={manutencao.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors relative">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                            <Wrench className="text-slate-500 dark:text-slate-400" size={20} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-800 dark:text-white">Veículo #{manutencao.veiculo_id}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{manutencao.km_veiculo.toLocaleString()} km</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-start gap-2">
                                        <div className="mt-1">{getTipoIcon(manutencao.tipo)}</div>
                                        <div>
                                            <p className="font-medium text-slate-800 dark:text-white">{manutencao.tipo}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{manutencao.descricao}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                            <Calendar size={14} />
                                            {new Date(manutencao.data_agendada).toLocaleDateString()}
                                        </div>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(manutencao.status)}`}>
                                            {manutencao.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="font-medium text-slate-800 dark:text-white">
                                        {manutencao.moeda} {(manutencao.custo_pecas + manutencao.custo_mao_de_obra).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Peças: {manutencao.custo_pecas.toLocaleString()} | M.O.: {manutencao.custo_mao_de_obra.toLocaleString()}
                                    </p>
                                </td>
                                <td className="px-6 py-4 text-right relative">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleDropdown(manutencao.id);
                                        }}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                    >
                                        <MoreVertical size={20} />
                                    </button>

                                    {activeDropdown === manutencao.id && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-10">
                                            <div className="py-1">
                                                <button className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2">
                                                    <Eye size={16} />
                                                    Detalhes
                                                </button>
                                                <button className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2">
                                                    <Edit size={16} />
                                                    Editar
                                                </button>
                                                <button className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                                                    <Trash2 size={16} />
                                                    Excluir
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
