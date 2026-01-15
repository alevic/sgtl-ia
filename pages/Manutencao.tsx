import React, { useState, useEffect } from 'react';
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
    FileText,
    DollarSign,
    TrendingUp
} from 'lucide-react';
import { IManutencao, TipoManutencao, StatusManutencao, Moeda, StatusManutencaoLabel, TipoManutencaoLabel } from '../types';
import { MaintenanceActions } from '../components/Manutencao/MaintenanceActions';

export const Manutencao: React.FC = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('TODOS');
    const [manutencoes, setManutencoes] = useState<IManutencao[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchMaintenances = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/maintenance`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setManutencoes(data);
            } else {
                console.error('Failed to fetch maintenances');
            }
        } catch (error) {
            console.error('Error fetching maintenances:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMaintenances();
    }, []);

    const handleDeleteFromList = (id: string) => {
        setManutencoes(prev => prev.filter(m => m.id !== id));
    };

    const getStatusColor = (status: StatusManutencao) => {
        switch (status) {
            case StatusManutencao.SCHEDULED: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            case StatusManutencao.IN_PROGRESS: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
            case StatusManutencao.COMPLETED: return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            case StatusManutencao.CANCELLED: return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            // Legacy fallbacks
            case 'AGENDADA' as any: return 'bg-blue-100 text-blue-800';
            case 'EM_ANDAMENTO' as any: return 'bg-yellow-100 text-yellow-800';
            case 'CONCLUIDA' as any: return 'bg-green-100 text-green-800';
            case 'CANCELADA' as any: return 'bg-red-100 text-red-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    const getTipoIcon = (tipo: TipoManutencao) => {
        switch (tipo) {
            case TipoManutencao.PREVENTIVE: return <Clock size={16} className="text-blue-500" />;
            case TipoManutencao.CORRECTIVE: return <AlertTriangle size={16} className="text-red-500" />;
            case TipoManutencao.PREDICTIVE: return <TrendingUp size={16} className="text-purple-500" />;
            case TipoManutencao.INSPECTION: return <CheckCircle size={16} className="text-green-500" />;
            // Legacy fallbacks
            case 'PREVENTIVA' as any: return <Clock size={16} className="text-blue-500" />;
            case 'CORRETIVA' as any: return <AlertTriangle size={16} className="text-red-500" />;
            default: return <Wrench size={16} />;
        }
    };

    const filteredMaintenances = manutencoes.filter(m => {
        const matchesSearch =
            (m.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
            (m.oficina?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
            ((m as any).placa?.toLowerCase().includes(searchTerm.toLowerCase()) || ''); // Assuming join brings placa

        const matchesStatus = filterStatus === 'TODOS' || m.status === filterStatus;

        return matchesSearch && matchesStatus;
    });

    // KPIs Calculation
    const totalMaintenances = manutencoes.length;
    const inProgress = manutencoes.filter(m => m.status === StatusManutencao.IN_PROGRESS || (m.status as any) === 'EM_ANDAMENTO').length;
    const totalCost = manutencoes.reduce((acc, curr) => acc + Number(curr.custo_pecas || 0) + Number(curr.custo_mao_de_obra || 0), 0);
    const scheduledNext7Days = manutencoes.filter(m => {
        if (m.status !== StatusManutencao.SCHEDULED && (m.status as any) !== 'AGENDADA') return false;
        const date = new Date(m.data_agendada);
        const now = new Date();
        const diffTime = Math.abs(date.getTime() - now.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7 && date >= now;
    }).length;

    if (isLoading) {
        return <div className="p-8 text-center">Carregando manutenções...</div>;
    }

    return (
        <div className="space-y-6">
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
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{totalMaintenances}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manutenções registradas</p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                            <Clock className="text-yellow-600 dark:text-yellow-400" size={20} />
                        </div>
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">Em Andamento</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{inProgress}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Veículos na oficina</p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <DollarSign className="text-green-600 dark:text-green-400" size={20} />
                        </div>
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">Custo Total</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Investimento em manutenção</p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <Calendar className="text-purple-600 dark:text-purple-400" size={20} />
                        </div>
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">Próximas</span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{scheduledNext7Days}</h3>
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
                        <option value={StatusManutencao.SCHEDULED}>Agendada</option>
                        <option value={StatusManutencao.IN_PROGRESS}>Em Andamento</option>
                        <option value={StatusManutencao.COMPLETED}>Concluída</option>
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
                        {filteredMaintenances.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                                    Nenhuma manutenção encontrada.
                                </td>
                            </tr>
                        ) : (
                            filteredMaintenances.map((manutencao) => (
                                <tr key={manutencao.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors relative">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                                <Wrench className="text-slate-500 dark:text-slate-400" size={20} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-800 dark:text-white">
                                                    {(manutencao as any).placa ? `${(manutencao as any).placa} - ${(manutencao as any).modelo}` : `Veículo #${manutencao.veiculo_id.substring(0, 8)}`}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{manutencao.km_veiculo.toLocaleString()} km</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-start gap-2">
                                            <div className="mt-1">{getTipoIcon(manutencao.tipo)}</div>
                                            <div>
                                                <p className="font-medium text-slate-800 dark:text-white">
                                                    {TipoManutencaoLabel[manutencao.tipo] || (manutencao.tipo as any)}
                                                </p>
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
                                                {StatusManutencaoLabel[manutencao.status] || (manutencao.status as any).replace('_', ' ')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-slate-800 dark:text-white">
                                            {manutencao.moeda} {(Number(manutencao.custo_pecas) + Number(manutencao.custo_mao_de_obra)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Peças: {Number(manutencao.custo_pecas).toLocaleString()} | M.O.: {Number(manutencao.custo_mao_de_obra).toLocaleString()}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <MaintenanceActions
                                            manutencao={manutencao}
                                            onDelete={handleDeleteFromList}
                                        />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
