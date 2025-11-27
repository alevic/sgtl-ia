import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { IVeiculo, VeiculoStatus, IAssento } from '../types';
import { MapaAssentos } from '../components/Veiculos/MapaAssentos';
import {
    ArrowLeft, FileText, Map, History, Wrench,
    Bus, Truck, Gauge, Calendar, Edit, CheckCircle
} from 'lucide-react';

// Mock data - em produção virá do backend
const MOCK_VEICULO: IVeiculo & {
    km_atual: number;
    ano: number;
    ultima_revisao: string;
    motorista_atual?: string;
    observacoes?: string;
} = {
    id: 'V001',
    placa: 'ABC-1234',
    modelo: 'Mercedes-Benz O500 Double Deck',
    tipo: 'ONIBUS',
    status: VeiculoStatus.EM_VIAGEM,
    proxima_revisao_km: 95000,
    km_atual: 87500,
    ano: 2020,
    ultima_revisao: '2023-09-15',
    motorista_atual: 'José Silva',
    is_double_deck: true,
    capacidade_passageiros: 72,
    mapa_configurado: false,
    observacoes: 'Veículo Double Deck em excelente estado, última revisão completa realizada.'
};

type TabType = 'info' | 'mapa' | 'manutencao' | 'historico';

export const VeiculoDetalhes: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('info');
    const [veiculo, setVeiculo] = useState<typeof MOCK_VEICULO | null>(null);
    const [seats, setSeats] = useState<IAssento[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchVehicle = async () => {
        if (!id) return;

        setIsLoading(true);
        try {
            const response = await fetch(`http://localhost:4000/api/fleet/vehicles/${id}`, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch vehicle');
            }

            const data = await response.json();
            setVeiculo(data);

            // Fetch seats if it's a bus
            if (data.tipo === 'ONIBUS') {
                const seatsResponse = await fetch(`http://localhost:4000/api/fleet/vehicles/${id}/seats`, {
                    credentials: 'include'
                });

                if (seatsResponse.ok) {
                    const seatsData = await seatsResponse.json();
                    setSeats(seatsData);
                }
            }
        } catch (error) {
            console.error("Erro ao buscar veículo:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveSeats = async (newSeats: IAssento[]) => {
        if (!id) return;

        try {
            const response = await fetch(`http://localhost:4000/api/fleet/vehicles/${id}/seats`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ seats: newSeats })
            });

            if (!response.ok) {
                throw new Error('Failed to save seat map');
            }

            const savedSeats = await response.json();
            setSeats(savedSeats);

            // Refresh vehicle to update mapa_configurado flag
            await fetchVehicle();

            alert('Mapa de assentos salvo com sucesso!');
        } catch (error) {
            console.error("Erro ao salvar mapa de assentos:", error);
            alert('Erro ao salvar mapa de assentos. Por favor, tente novamente.');
        }
    };

    useEffect(() => {
        fetchVehicle();
    }, [id]);

    const isOnibus = veiculo?.tipo === 'ONIBUS';

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-slate-500 dark:text-slate-400">Carregando veículo...</p>
            </div>
        );
    }

    if (!veiculo) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-slate-500 dark:text-slate-400">Veículo não encontrado</p>
            </div>
        );
    }

    const tabs = [
        { id: 'info' as TabType, label: 'Informações Gerais', icon: FileText },
        ...(isOnibus ? [{ id: 'mapa' as TabType, label: 'Mapa de Assentos', icon: Map }] : []),
        { id: 'manutencao' as TabType, label: 'Manutenção', icon: Wrench },
        { id: 'historico' as TabType, label: 'Histórico', icon: History }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'info':
                return <InfoGeralTab veiculo={veiculo} />;
            case 'mapa':
                return isOnibus ? <MapaAssentos veiculo={veiculo} seats={seats} onSave={handleSaveSeats} /> : null;
            case 'manutencao':
                return <ManutencaoTab veiculo={veiculo} />;
            case 'historico':
                return <HistoricoTab veiculo={veiculo} />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/frota')}
                    className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{veiculo.placa}</h1>
                        {veiculo.tipo === 'ONIBUS' && veiculo.is_double_deck && (
                            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-semibold">
                                Double Deck
                            </span>
                        )}
                        {isOnibus && veiculo.mapa_configurado && (
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs font-semibold flex items-center gap-1">
                                <CheckCircle size={12} />
                                Mapa OK
                            </span>
                        )}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">{veiculo.modelo}</p>
                </div>
                <Link
                    to={`/admin/frota/${id}/editar`}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                    <Edit size={18} />
                    Editar Veículo
                </Link>
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="border-b border-slate-200 dark:border-slate-700">
                    <div className="flex gap-1 p-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === tab.id
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    <Icon size={18} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
};

// Tab: Informações Gerais
const InfoGeralTab: React.FC<{ veiculo: typeof MOCK_VEICULO }> = ({ veiculo }) => {
    const isOnibus = veiculo.tipo === 'ONIBUS';

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Tipo</p>
                    <div className="flex items-center gap-2">
                        {isOnibus ? <Bus size={20} className="text-blue-600" /> : <Truck size={20} className="text-orange-600" />}
                        <p className="font-bold text-slate-800 dark:text-white">
                            {isOnibus ? 'Ônibus' : 'Caminhão'}
                        </p>
                    </div>
                </div>
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Ano</p>
                    <p className="font-bold text-slate-800 dark:text-white">{veiculo.ano}</p>
                </div>
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Status</p>
                    <p className="font-bold text-slate-800 dark:text-white">
                        {veiculo.status === VeiculoStatus.ATIVO ? 'Ativo' :
                            veiculo.status === VeiculoStatus.EM_VIAGEM ? 'Em Viagem' : 'Manutenção'}
                    </p>
                </div>
            </div>

            {isOnibus && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Capacidade de Passageiros</p>
                        <p className="font-bold text-slate-800 dark:text-white">{veiculo.capacidade_passageiros} passageiros</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Configuração</p>
                        <p className="font-bold text-slate-800 dark:text-white">
                            {veiculo.is_double_deck ? 'Double Deck (2 andares)' : 'Convencional (1 andar)'}
                        </p>
                    </div>
                </div>
            )}

            {!isOnibus && (
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Capacidade de Carga</p>
                    <p className="font-bold text-slate-800 dark:text-white">{veiculo.capacidade_carga} toneladas</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                            {new Date(veiculo.ultima_revisao).toLocaleDateString('pt-BR')}
                        </p>
                    </div>
                </div>
            </div>

            {veiculo.observacoes && (
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Observações</p>
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                        <p className="text-slate-700 dark:text-slate-300">{veiculo.observacoes}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

// Tab: Manutenção
const ManutencaoTab: React.FC<{ veiculo: typeof MOCK_VEICULO }> = ({ veiculo }) => {
    return (
        <div className="text-center py-12">
            <Wrench size={48} className="mx-auto text-orange-600 mb-4" />
            <p className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                Histórico de Manutenção
            </p>
            <p className="text-slate-500 dark:text-slate-400">
                Em desenvolvimento...
            </p>
        </div>
    );
};

// Tab: Histórico
const HistoricoTab: React.FC<{ veiculo: typeof MOCK_VEICULO }> = ({ veiculo }) => {
    return (
        <div className="text-center py-12">
            <History size={48} className="mx-auto text-purple-600 mb-4" />
            <p className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                Histórico de Viagens
            </p>
            <p className="text-slate-500 dark:text-slate-400">
                Em desenvolvimento...
            </p>
        </div>
    );
};
