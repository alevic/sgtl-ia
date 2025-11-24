import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Bus, User, DollarSign, Clock, Users, Globe } from 'lucide-react';
import { MOCK_VIAGENS, MOCK_MOTORISTAS } from './Viagens';
import { VisualizadorRota } from '../components/Rotas/VisualizadorRota';

export const ViagemDetalhes: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const viagem = MOCK_VIAGENS.find(v => v.id === id);
    const [abaRotaAtiva, setAbaRotaAtiva] = useState<'IDA' | 'VOLTA'>('IDA');

    if (!viagem) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400">
                <p className="text-lg font-semibold">Viagem não encontrada</p>
                <button
                    onClick={() => navigate('/admin/viagens')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                >
                    Voltar para Viagens
                </button>
            </div>
        );
    }

    // Buscar motoristas
    const motoristasViagem = viagem.motorista_ids
        ? viagem.motorista_ids.map(id => MOCK_MOTORISTAS.find(m => m.id === id)).filter(Boolean)
        : viagem.motorista_id
            ? [MOCK_MOTORISTAS.find(m => m.id === viagem.motorista_id)].filter(Boolean)
            : [];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/viagens')}
                    className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{viagem.titulo}</h1>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${viagem.status === 'CONFIRMADA' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                            viagem.status === 'AGENDADA' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                            {viagem.status}
                        </span>
                        <span>•</span>
                        <span>{viagem.tipo_viagem === 'IDA_E_VOLTA' ? 'Ida e Volta' : viagem.tipo_viagem === 'IDA' ? 'Ida' : 'Volta'}</span>
                    </div>
                </div>
            </div>

            {/* Cover Image */}
            {viagem.imagem_capa && (
                <div className="w-full h-64 md:h-80 rounded-xl overflow-hidden shadow-md">
                    <img
                        src={viagem.imagem_capa}
                        alt={`Capa de ${viagem.titulo}`}
                        className="w-full h-full object-cover"
                    />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Route Info */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <MapPin size={20} className="text-blue-600" />
                            Rota
                        </h3>

                        {/* Tabs para Ida e Volta */}
                        {viagem.tipo_viagem === 'IDA_E_VOLTA' && (
                            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 mb-6">
                                <button
                                    onClick={() => setAbaRotaAtiva('IDA')}
                                    className={`px-4 py-2 font-medium transition-colors border-b-2 ${abaRotaAtiva === 'IDA'
                                            ? 'border-green-600 text-green-600 dark:text-green-400'
                                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                >
                                    Rota de Ida
                                </button>
                                <button
                                    onClick={() => setAbaRotaAtiva('VOLTA')}
                                    className={`px-4 py-2 font-medium transition-colors border-b-2 ${abaRotaAtiva === 'VOLTA'
                                            ? 'border-orange-600 text-orange-600 dark:text-orange-400'
                                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                >
                                    Rota de Volta
                                </button>
                            </div>
                        )}

                        {/* Visualização da Rota */}
                        {viagem.usa_sistema_rotas ? (
                            <>
                                {(viagem.tipo_viagem === 'IDA' || (viagem.tipo_viagem === 'IDA_E_VOLTA' && abaRotaAtiva === 'IDA')) && viagem.rota_ida && (
                                    <VisualizadorRota rota={viagem.rota_ida} />
                                )}
                                {(viagem.tipo_viagem === 'VOLTA' || (viagem.tipo_viagem === 'IDA_E_VOLTA' && abaRotaAtiva === 'VOLTA')) && viagem.rota_volta && (
                                    <VisualizadorRota rota={viagem.rota_volta} />
                                )}
                                {((viagem.tipo_viagem === 'IDA' && !viagem.rota_ida) ||
                                    (viagem.tipo_viagem === 'VOLTA' && !viagem.rota_volta)) && (
                                        <p className="text-slate-500 dark:text-slate-400">Rota não definida</p>
                                    )}
                            </>
                        ) : (
                            // Fallback para sistema antigo (se houver)
                            <div className="relative pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                                {/* Renderização manual antiga... mantida apenas como fallback se necessário, mas idealmente migrada */}
                                <p className="text-slate-500">Visualização legado não suportada nesta versão.</p>
                            </div>
                        )}
                    </div>

                    {/* Gallery */}
                    {viagem.galeria && viagem.galeria.length > 0 && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                                <Bus size={20} className="text-purple-600" />
                                Galeria de Imagens
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {viagem.galeria.map((img, idx) => (
                                    <div key={idx} className="aspect-video rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group relative">
                                        <img
                                            src={img}
                                            alt={`Galeria ${idx + 1}`}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4">Detalhes da Viagem</h3>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                <Bus className="text-blue-600" size={20} />
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Veículo</p>
                                    <p className="font-medium text-slate-800 dark:text-white">Mercedes-Benz O500</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                <User className="text-orange-600 mt-1" size={20} />
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Motorista(s)</p>
                                    {motoristasViagem.length > 0 ? (
                                        <div className="flex flex-col gap-1">
                                            {motoristasViagem.map((m, idx) => (
                                                <p key={idx} className="font-medium text-slate-800 dark:text-white">
                                                    {m?.nome}
                                                </p>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="font-medium text-slate-800 dark:text-white">Não atribuído</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                <Users className="text-purple-600" size={20} />
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Ocupação</p>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-purple-600 rounded-full"
                                                style={{ width: `${viagem.ocupacao_percent}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-sm font-medium text-slate-800 dark:text-white">{viagem.ocupacao_percent}%</span>
                                    </div>
                                </div>
                            </div>

                            {viagem.internacional && (
                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                    <Globe className="text-indigo-600" size={20} />
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Moeda Base</p>
                                        <p className="font-medium text-slate-800 dark:text-white">{viagem.moeda_base}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
