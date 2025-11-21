import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { IViagem, IVeiculo, IMotorista, Moeda, VeiculoStatus } from '../types';
import {
    Bus, Calendar, MapPin, Users, Filter, Plus, Search,
    CheckCircle, Clock, Loader, XCircle, TrendingUp
} from 'lucide-react';

const MOCK_VEICULOS: IVeiculo[] = [
    {
        id: 'V001',
        placa: 'ABC-1234',
        modelo: 'Mercedes-Benz O500',
        tipo: 'ONIBUS',
        status: VeiculoStatus.ATIVO,
        proxima_revisao_km: 150000
    }
];

const MOCK_MOTORISTAS: IMotorista[] = [
    {
        id: 'M001',
        nome: 'Carlos Silva',
        cnh: '12345678900',
        categoria_cnh: 'D',
        validade_cnh: '2026-12-31',
        status: 'DISPONIVEL'
    }
];

const MOCK_VIAGENS: IViagem[] = [
    {
        id: 'V001',
        titulo: 'São Paulo → Florianópolis',
        origem: 'São Paulo, SP',
        destino: 'Florianópolis, SC',
        paradas: [
            {
                id: 'P1',
                nome: 'Curitiba, PR',
                horario_chegada: '2023-11-25T02:00:00',
                horario_partida: '2023-11-25T02:30:00',
                tipo: 'PARADA_TECNICA'
            }
        ],
        data_partida: '2023-11-24T22:00:00',
        data_chegada_prevista: '2023-11-25T08:00:00',
        status: 'CONFIRMADA',
        veiculo_id: 'V001',
        motorista_id: 'M001',
        ocupacao_percent: 75,
        internacional: false,
        moeda_base: Moeda.BRL
    },
    {
        id: 'V002',
        titulo: 'Rio de Janeiro → Buenos Aires',
        origem: 'Rio de Janeiro, RJ',
        destino: 'Buenos Aires, Argentina',
        paradas: [
            {
                id: 'P2',
                nome: 'Curitiba, PR',
                horario_chegada: '2023-12-01T08:00:00',
                horario_partida: '2023-12-01T09:00:00',
                tipo: 'EMBARQUE'
            },
            {
                id: 'P3',
                nome: 'Porto Alegre, RS',
                horario_chegada: '2023-12-01T18:00:00',
                horario_partida: '2023-12-01T19:00:00',
                tipo: 'EMBARQUE'
            }
        ],
        data_partida: '2023-12-01T00:00:00',
        data_chegada_prevista: '2023-12-02T14:00:00',
        status: 'AGENDADA',
        veiculo_id: 'V001',
        motorista_id: 'M001',
        ocupacao_percent: 20,
        internacional: true,
        moeda_base: Moeda.USD
    }
];

const StatusBadge: React.FC<{ status: IViagem['status'] }> = ({ status }) => {
    const configs = {
        AGENDADA: { color: 'yellow', icon: Clock, label: 'Agendada' },
        CONFIRMADA: { color: 'green', icon: CheckCircle, label: 'Confirmada' },
        EM_CURSO: { color: 'blue', icon: Loader, label: 'Em Curso' },
        FINALIZADA: { color: 'slate', icon: CheckCircle, label: 'Finalizada' },
        CANCELADA: { color: 'red', icon: XCircle, label: 'Cancelada' }
    };

    const config = configs[status];
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-${config.color}-100 dark:bg-${config.color}-900/30 text-${config.color}-700 dark:text-${config.color}-300`}>
            <Icon size={14} />
            {config.label}
        </span>
    );
};

export const Viagens: React.FC = () => {
    const [viagens] = useState<IViagem[]>(MOCK_VIAGENS);
    const [veiculos] = useState<IVeiculo[]>(MOCK_VEICULOS);
    const [motoristas] = useState<IMotorista[]>(MOCK_MOTORISTAS);
    const [filtroStatus, setFiltroStatus] = useState<'TODOS' | IViagem['status']>('TODOS');
    const [busca, setBusca] = useState('');

    const getVeiculo = (veiculoId?: string) => veiculos.find(v => v.id === veiculoId);
    const getMotorista = (motoristaId?: string) => motoristas.find(m => m.id === motoristaId);

    const viagensFiltradas = viagens.filter(v => {
        const matchStatus = filtroStatus === 'TODOS' || v.status === filtroStatus;
        const matchBusca = busca === '' ||
            v.titulo.toLowerCase().includes(busca.toLowerCase()) ||
            v.origem.toLowerCase().includes(busca.toLowerCase()) ||
            v.destino.toLowerCase().includes(busca.toLowerCase());
        return matchStatus && matchBusca;
    });

    // Estatísticas
    const totalViagens = viagens.length;
    const viagensConfirmadas = viagens.filter(v => v.status === 'CONFIRMADA').length;
    const viagensEmCurso = viagens.filter(v => v.status === 'EM_CURSO').length;
    const ocupacaoMedia = Math.round(viagens.reduce((sum, v) => sum + v.ocupacao_percent, 0) / viagens.length);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Viagens</h1>
                    <p className="text-slate-500 dark:text-slate-400">Gestão de viagens e rotas</p>
                </div>
                <Link
                    to="/admin/viagens/nova"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                    <Plus size={18} />
                    Nova Viagem
                </Link>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total de Viagens</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{totalViagens}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <Bus size={24} className="text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Confirmadas</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{viagensConfirmadas}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                            <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Em Curso</p>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{viagensEmCurso}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <Loader size={24} className="text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Ocupação Média</p>
                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{ocupacaoMedia}%</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                            <TrendingUp size={24} className="text-purple-600 dark:text-purple-400" />
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
                                placeholder="Buscar por origem, destino ou título..."
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
                            onClick={() => setFiltroStatus('AGENDADA')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filtroStatus === 'AGENDADA' ? 'bg-yellow-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                        >
                            Agendada
                        </button>
                        <button
                            onClick={() => setFiltroStatus('CONFIRMADA')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filtroStatus === 'CONFIRMADA' ? 'bg-green-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                        >
                            Confirmada
                        </button>
                    </div>
                </div>
            </div>

            {/* Lista de Viagens */}
            <div className="grid gap-4">
                {viagensFiltradas.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                        <Bus size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">Nenhuma viagem encontrada</p>
                    </div>
                ) : (
                    viagensFiltradas.map((viagem) => {
                        const veiculo = getVeiculo(viagem.veiculo_id);
                        const motorista = getMotorista(viagem.motorista_id);

                        return (
                            <div
                                key={viagem.id}
                                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 hover:shadow-md transition-all"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                            <Bus size={28} className="text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                                {viagem.titulo}
                                                {viagem.internacional && (
                                                    <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded">
                                                        Internacional
                                                    </span>
                                                )}
                                            </h3>
                                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                <MapPin size={14} className="text-green-600" />
                                                <span>{viagem.origem}</span>
                                                <span>→</span>
                                                <MapPin size={14} className="text-red-600" />
                                                <span>{viagem.destino}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <StatusBadge status={viagem.status} />
                                </div>

                                {viagem.paradas.length > 0 && (
                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                                            {viagem.paradas.length} parada{viagem.paradas.length > 1 ? 's' : ''} intermediária{viagem.paradas.length > 1 ? 's' : ''}
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
