import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

export const MOCK_MOTORISTAS: IMotorista[] = [
    {
        id: 'M001',
        nome: 'Carlos Silva',
        cnh: '12345678900',
        categoria_cnh: 'D',
        validade_cnh: '2026-12-31',
        status: 'DISPONIVEL'
    }
];

export const MOCK_VIAGENS: IViagem[] = [
    {
        id: 'V001',
        titulo: 'São Paulo → Florianópolis',
        origem: 'São Paulo, SP',
        destino: 'Florianópolis, SC',
        paradas: [], // Calculado via rotas
        data_partida: '2023-11-24T22:00:00',
        data_chegada_prevista: '2023-11-25T08:00:00',
        status: 'CONFIRMADA',
        veiculo_id: 'V001',
        motorista_ids: ['M001'],
        ocupacao_percent: 75,
        internacional: false,
        moeda_base: Moeda.BRL,
        tipo_viagem: 'IDA',
        precos_por_tipo: {},
        imagem_capa: 'https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?auto=format&fit=crop&q=80&w=1000',
        galeria: [
            'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=1000',
            'https://images.unsplash.com/photo-1570125909232-eb2be3b11374?auto=format&fit=crop&q=80&w=1000'
        ],
        usa_sistema_rotas: true,
        rota_ida: {
            id: 'R003',
            nome: 'SP → Florianópolis (via Curitiba)',
            tipo_rota: 'IDA',
            ativa: true,
            pontos: [
                {
                    id: 'P6',
                    nome: 'São Paulo, SP',
                    ordem: 0,
                    tipo: 'ORIGEM',
                    horario_partida: '2023-11-24T22:00:00',
                    permite_embarque: true,
                    permite_desembarque: false
                },
                {
                    id: 'P7',
                    nome: 'Curitiba, PR',
                    ordem: 1,
                    tipo: 'PARADA_INTERMEDIARIA',
                    horario_chegada: '2023-11-25T04:00:00',
                    horario_partida: '2023-11-25T04:30:00',
                    permite_embarque: true,
                    permite_desembarque: true
                },
                {
                    id: 'P8',
                    nome: 'Florianópolis, SC',
                    ordem: 2,
                    tipo: 'DESTINO',
                    horario_chegada: '2023-11-25T09:00:00',
                    permite_embarque: false,
                    permite_desembarque: true
                }
            ],
            duracao_estimada_minutos: 660,
            distancia_total_km: 700
        }
    },
    {
        id: 'V002',
        titulo: 'Rio de Janeiro → Buenos Aires',
        origem: 'Rio de Janeiro, RJ',
        destino: 'Buenos Aires, Argentina',
        paradas: [], // Calculado via rotas
        data_partida: '2023-12-01T00:00:00',
        data_chegada_prevista: '2023-12-02T14:00:00',
        status: 'AGENDADA',
        veiculo_id: 'V001',
        motorista_ids: ['M001', 'M002'],
        ocupacao_percent: 20,
        internacional: true,
        moeda_base: Moeda.USD,
        tipo_viagem: 'IDA_E_VOLTA',
        precos_por_tipo: {},
        imagem_capa: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?auto=format&fit=crop&q=80&w=1000',
        galeria: [
            'https://images.unsplash.com/photo-1612294037637-ec328d0e075e?auto=format&fit=crop&q=80&w=1000'
        ],
        usa_sistema_rotas: true,
        rota_ida: {
            id: 'R_INT_01',
            nome: 'RJ → Buenos Aires (Ida)',
            tipo_rota: 'IDA',
            ativa: true,
            pontos: [
                {
                    id: 'P_INT_1',
                    nome: 'Rio de Janeiro, RJ',
                    ordem: 0,
                    tipo: 'ORIGEM',
                    horario_partida: '2023-12-01T00:00:00',
                    permite_embarque: true,
                    permite_desembarque: false
                },
                {
                    id: 'P_INT_2',
                    nome: 'Curitiba, PR',
                    ordem: 1,
                    tipo: 'PARADA_INTERMEDIARIA',
                    horario_chegada: '2023-12-01T08:00:00',
                    horario_partida: '2023-12-01T09:00:00',
                    permite_embarque: true,
                    permite_desembarque: true
                },
                {
                    id: 'P_INT_3',
                    nome: 'Porto Alegre, RS',
                    ordem: 2,
                    tipo: 'PARADA_INTERMEDIARIA',
                    horario_chegada: '2023-12-01T18:00:00',
                    horario_partida: '2023-12-01T19:00:00',
                    permite_embarque: true,
                    permite_desembarque: true
                },
                {
                    id: 'P_INT_4',
                    nome: 'Buenos Aires, AR',
                    ordem: 3,
                    tipo: 'DESTINO',
                    horario_chegada: '2023-12-02T14:00:00',
                    permite_embarque: false,
                    permite_desembarque: true
                }
            ],
            duracao_estimada_minutos: 2280,
            distancia_total_km: 2600
        },
        rota_volta: {
            id: 'R_INT_02',
            nome: 'Buenos Aires → RJ (Volta)',
            tipo_rota: 'VOLTA',
            ativa: true,
            pontos: [
                {
                    id: 'P_INT_5',
                    nome: 'Buenos Aires, AR',
                    ordem: 0,
                    tipo: 'ORIGEM',
                    horario_partida: '2023-12-05T08:00:00',
                    permite_embarque: true,
                    permite_desembarque: false
                },
                {
                    id: 'P_INT_6',
                    nome: 'Rio de Janeiro, RJ',
                    ordem: 1,
                    tipo: 'DESTINO',
                    horario_chegada: '2023-12-06T22:00:00',
                    permite_embarque: false,
                    permite_desembarque: true
                }
            ],
            duracao_estimada_minutos: 2280,
            distancia_total_km: 2600
        }
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

    const navigate = useNavigate();

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
                                onClick={() => navigate(`/admin/viagens/${viagem.id}`)}
                                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 hover:shadow-md transition-all cursor-pointer group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-4">
                                        {viagem.imagem_capa ? (
                                            <img
                                                src={viagem.imagem_capa}
                                                alt={viagem.titulo}
                                                className="w-16 h-16 rounded-lg object-cover shadow-sm"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                                                <Bus size={28} className="text-white" />
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                                {viagem.titulo}
                                                {viagem.internacional && (
                                                    <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded">
                                                        Internacional
                                                    </span>
                                                )}
                                                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
                                                    {viagem.tipo_viagem === 'IDA_E_VOLTA' ? 'Ida e Volta' : viagem.tipo_viagem === 'IDA' ? 'Ida' : 'Volta'}
                                                </span>
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
