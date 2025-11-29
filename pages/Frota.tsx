import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IVeiculo, VeiculoStatus } from '../types';
import { useAppContext } from '../context/AppContext';
import {
    Bus, Truck, Plus, Search, Filter, Gauge, Calendar,
    Wrench, CheckCircle, AlertTriangle, XCircle, TrendingUp
} from 'lucide-react';
import { VehicleActions } from '../components/Frota/VehicleActions';

// Mock data - em produção virá do backend
export const MOCK_VEICULOS: (IVeiculo & {
    km_atual: number;
    ano: number;
    ultima_revisao?: string;
    motorista_atual?: string;
})[] = [
        {
            id: 'V001',
            placa: 'ABC-1234',
            modelo: 'Mercedes-Benz O500',
            tipo: 'ONIBUS',
            status: VeiculoStatus.EM_VIAGEM,
            proxima_revisao_km: 95000,
            km_atual: 87500,
            ano: 2020,
            ultima_revisao: '2023-09-15',
            motorista_atual: 'José Silva'
        },
        {
            id: 'V002',
            placa: 'DEF-5678',
            modelo: 'Scania Touring',
            tipo: 'ONIBUS',
            status: VeiculoStatus.ATIVO,
            proxima_revisao_km: 105000,
            km_atual: 92000,
            ano: 2021,
            ultima_revisao: '2023-08-20'
        },
        {
            id: 'V003',
            placa: 'GHI-9012',
            modelo: 'Volvo FH 540',
            tipo: 'CAMINHAO',
            status: VeiculoStatus.MANUTENCAO,
            proxima_revisao_km: 120000,
            km_atual: 118500,
            ano: 2019,
            ultima_revisao: '2023-10-01'
        },
        {
            id: 'V004',
            placa: 'JKL-3456',
            modelo: 'Mercedes-Benz Actros',
            tipo: 'CAMINHAO',
            status: VeiculoStatus.ATIVO,
            proxima_revisao_km: 130000,
            km_atual: 115000,
            ano: 2022,
            ultima_revisao: '2023-09-10'
        },
        {
            id: 'V005',
            placa: 'MNO-7890',
            modelo: 'Marcopolo Paradiso',
            tipo: 'ONIBUS',
            status: VeiculoStatus.EM_VIAGEM,
            proxima_revisao_km: 100000,
            km_atual: 88000,
            ano: 2021,
            ultima_revisao: '2023-08-05',
            motorista_atual: 'Carlos Souza'
        }
    ];

const StatusBadge: React.FC<{ status: VeiculoStatus }> = ({ status }) => {
    const configs = {
        ATIVO: {
            color: 'green',
            label: 'Ativo',
            icon: CheckCircle,
            bgClass: 'bg-green-100 dark:bg-green-900/30',
            textClass: 'text-green-700 dark:text-green-300'
        },
        MANUTENCAO: {
            color: 'orange',
            label: 'Manutenção',
            icon: Wrench,
            bgClass: 'bg-orange-100 dark:bg-orange-900/30',
            textClass: 'text-orange-700 dark:text-orange-300'
        },
        EM_VIAGEM: {
            color: 'blue',
            label: 'Em Viagem',
            icon: TrendingUp,
            bgClass: 'bg-blue-100 dark:bg-blue-900/30',
            textClass: 'text-blue-700 dark:text-blue-300'
        }
    };

    const config = configs[status];
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.bgClass} ${config.textClass}`}>
            <Icon size={12} />
            {config.label}
        </span>
    );
};

export const Frota: React.FC = () => {
    const { currentContext } = useAppContext();
    const [veiculos, setVeiculos] = useState<(IVeiculo & { km_atual: number; ano: number; ultima_revisao: string; motorista_atual?: string })[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filtroStatus, setFiltroStatus] = useState<'TODOS' | VeiculoStatus>('TODOS');
    const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'ONIBUS' | 'CAMINHAO'>('TODOS');
    const [busca, setBusca] = useState('');

    const fetchVeiculos = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/fleet/vehicles`, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch vehicles');
            }

            const data = await response.json();
            setVeiculos(data);
        } catch (error) {
            console.error("Erro ao buscar veículos:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchVeiculos();
    }, [currentContext]);

    const veiculosFiltrados = veiculos.filter(v => {
        const matchStatus = filtroStatus === 'TODOS' || v.status === filtroStatus;
        const matchTipo = filtroTipo === 'TODOS' || v.tipo === filtroTipo;
        const matchBusca = busca === '' ||
            v.placa.toLowerCase().includes(busca.toLowerCase()) ||
            v.modelo.toLowerCase().includes(busca.toLowerCase());
        return matchStatus && matchTipo && matchBusca;
    });

    // Estatísticas
    const totalVeiculos = veiculos.length;
    const veiculosAtivos = veiculos.filter(v => v.status === VeiculoStatus.ATIVO).length;
    const veiculosEmViagem = veiculos.filter(v => v.status === VeiculoStatus.EM_VIAGEM).length;
    const veiculosManutencao = veiculos.filter(v => v.status === VeiculoStatus.MANUTENCAO).length;

    const calcularProgressoManutencao = (kmAtual: number, proximaRevisao: number) => {
        const kmDesdeUltimaRevisao = kmAtual % 10000;
        const kmAteProxima = proximaRevisao - kmAtual;
        const progresso = ((10000 - kmAteProxima) / 10000) * 100;
        return Math.min(Math.max(progresso, 0), 100);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Gestão de Frota</h1>
                    <p className="text-slate-500 dark:text-slate-400">Controle completo de veículos e manutenções</p>
                </div>
                <Link
                    to="/admin/frota/novo"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                    <Plus size={18} />
                    Novo Veículo
                </Link>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total de Veículos</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{totalVeiculos}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <Bus size={24} className="text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Ativos</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{veiculosAtivos}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                            <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Em Viagem</p>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{veiculosEmViagem}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <TrendingUp size={24} className="text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Manutenção</p>
                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{veiculosManutencao}</p>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                            <Wrench size={24} className="text-orange-600 dark:text-orange-400" />
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
                                placeholder="Buscar por placa ou modelo..."
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => setFiltroStatus('TODOS')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${filtroStatus === 'TODOS' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                        >
                            <Filter size={16} />
                            Todos
                        </button>
                        <button
                            onClick={() => setFiltroStatus(VeiculoStatus.ATIVO)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filtroStatus === VeiculoStatus.ATIVO ? 'bg-green-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                        >
                            Ativo
                        </button>
                        <button
                            onClick={() => setFiltroStatus(VeiculoStatus.EM_VIAGEM)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filtroStatus === VeiculoStatus.EM_VIAGEM ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                        >
                            Em Viagem
                        </button>
                        <button
                            onClick={() => setFiltroStatus(VeiculoStatus.MANUTENCAO)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filtroStatus === VeiculoStatus.MANUTENCAO ? 'bg-orange-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                        >
                            Manutenção
                        </button>
                        <div className="w-px bg-slate-300 dark:bg-slate-600" />
                        <button
                            onClick={() => setFiltroTipo('ONIBUS')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${filtroTipo === 'ONIBUS' ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                        >
                            <Bus size={16} />
                            Ônibus
                        </button>
                        <button
                            onClick={() => setFiltroTipo('CAMINHAO')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${filtroTipo === 'CAMINHAO' ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                        >
                            <Truck size={16} />
                            Caminhão
                        </button>
                    </div>
                </div>
            </div>

            {/* Lista de Veículos */}
            <div className="grid gap-4">
                {isLoading ? (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                        <p className="text-slate-500 dark:text-slate-400">Carregando veículos...</p>
                    </div>
                ) : veiculosFiltrados.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                        <Bus size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">Nenhum veículo encontrado</p>
                    </div>
                ) : (
                    veiculosFiltrados.map((veiculo) => {
                        const progressoManutencao = calcularProgressoManutencao(veiculo.km_atual, veiculo.proxima_revisao_km);
                        const proximoManutencao = veiculo.proxima_revisao_km - veiculo.km_atual;
                        const alertaManutencao = proximoManutencao <= 5000;

                        return (
                            <Link
                                key={veiculo.id}
                                to={`/admin/frota/${veiculo.id}`}
                                className="block bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${veiculo.tipo === 'ONIBUS'
                                            ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                                            : 'bg-gradient-to-br from-orange-500 to-red-600'
                                            }`}>
                                            {veiculo.tipo === 'ONIBUS' ? (
                                                <Bus size={28} className="text-white" />
                                            ) : (
                                                <Truck size={28} className="text-white" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{veiculo.placa}</h3>
                                                <StatusBadge status={veiculo.status} />
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">{veiculo.modelo}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-500">Ano: {veiculo.ano}</p>
                                        </div>
                                    </div>
                                    {alertaManutencao && (
                                        <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg text-sm font-semibold">
                                            <AlertTriangle size={16} />
                                            Manutenção Próxima
                                        </div>
                                    )}
                                    <div onClick={(e) => e.preventDefault()}>
                                        <VehicleActions veiculo={veiculo} onUpdate={fetchVeiculos} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                    <div className="flex items-center gap-2">
                                        <Gauge size={16} className="text-blue-600" />
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">KM Atual</p>
                                            <p className="font-bold text-slate-800 dark:text-white">{veiculo.km_atual.toLocaleString()} km</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Wrench size={16} className="text-orange-600" />
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Próxima Revisão</p>
                                            <p className="font-bold text-slate-800 dark:text-white">{veiculo.proxima_revisao_km.toLocaleString()} km</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar size={16} className="text-purple-600" />
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Última Revisão</p>
                                            <p className="font-bold text-slate-800 dark:text-white">
                                                {veiculo.ultima_revisao ? new Date(veiculo.ultima_revisao).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    {veiculo.motorista_atual && (
                                        <div className="flex items-center gap-2">
                                            <TrendingUp size={16} className="text-green-600" />
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Motorista</p>
                                                <p className="font-bold text-slate-800 dark:text-white">{veiculo.motorista_atual}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Barra de Progresso de Manutenção */}
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Faltam {proximoManutencao.toLocaleString()} km para a próxima revisão
                                        </p>
                                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            {Math.round(progressoManutencao)}%
                                        </p>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all ${alertaManutencao
                                                ? 'bg-orange-500'
                                                : 'bg-green-500'
                                                }`}
                                            style={{ width: `${progressoManutencao}%` }}
                                        />
                                    </div>
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
};
