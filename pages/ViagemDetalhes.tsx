import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Bus, User, DollarSign, Clock, Users, Globe } from 'lucide-react';
import { MOCK_VIAGENS } from './Viagens';

export const ViagemDetalhes: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const viagem = MOCK_VIAGENS.find(v => v.id === id);

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
                        <div className="relative pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                            <div className="relative">
                                <div className="absolute -left-[2.15rem] w-4 h-4 rounded-full bg-green-500 border-4 border-white dark:border-slate-800 shadow-sm"></div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Origem</p>
                                <p className="font-semibold text-slate-800 dark:text-white text-lg">{viagem.origem}</p>
                                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    <Calendar size={14} />
                                    {new Date(viagem.data_partida).toLocaleDateString()}
                                    <Clock size={14} className="ml-2" />
                                    {new Date(viagem.data_partida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>

                            {viagem.paradas.map((parada, index) => (
                                <div key={index} className="relative">
                                    <div className="absolute -left-[2.15rem] w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-600 border-4 border-white dark:border-slate-800 shadow-sm"></div>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">{parada.tipo.replace('_', ' ')}</p>
                                            <p className="font-medium text-slate-700 dark:text-slate-200">{parada.nome}</p>
                                        </div>
                                        <div className="text-right text-sm text-slate-500 dark:text-slate-400">
                                            <p>{new Date(parada.horario_chegada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <div className="relative">
                                <div className="absolute -left-[2.15rem] w-4 h-4 rounded-full bg-red-500 border-4 border-white dark:border-slate-800 shadow-sm"></div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Destino</p>
                                <p className="font-semibold text-slate-800 dark:text-white text-lg">{viagem.destino}</p>
                                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    <Calendar size={14} />
                                    {new Date(viagem.data_chegada_prevista).toLocaleDateString()}
                                    <Clock size={14} className="ml-2" />
                                    {new Date(viagem.data_chegada_prevista).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
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

                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                <User className="text-orange-600" size={20} />
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Motorista</p>
                                    <p className="font-medium text-slate-800 dark:text-white">Carlos Silva</p>
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
