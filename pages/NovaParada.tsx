import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TipoParada } from '../types';
import { ArrowLeft, MapPin, Save, Clock } from 'lucide-react';

export const NovaParada: React.FC = () => {
    const navigate = useNavigate();

    const [nome, setNome] = useState('');
    const [tipo, setTipo] = useState<TipoParada>(TipoParada.EMBARQUE);
    const [horarioChegada, setHorarioChegada] = useState('');
    const [horarioPartida, setHorarioPartida] = useState('');

    const handleSalvar = () => {
        console.log({
            nome,
            tipo,
            horario_chegada: horarioChegada,
            horario_partida: horarioPartida
        });
        navigate('/admin/paradas');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/paradas')}
                    className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Nova Parada Intermediária</h1>
                    <p className="text-slate-500 dark:text-slate-400">Cadastre uma nova parada</p>
                </div>
                <button
                    onClick={handleSalvar}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                    <Save size={18} />
                    Salvar Parada
                </button>
            </div>

            <div className="max-w-2xl mx-auto">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <MapPin size={20} className="text-green-600" />
                        Informações da Parada
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Nome da Cidade/Local
                            </label>
                            <input
                                type="text"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                placeholder="Ex: Curitiba, PR"
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Tipo de Parada
                            </label>
                            <select
                                value={tipo}
                                onChange={(e) => setTipo(e.target.value as TipoParada)}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500"
                            >
                                <option value={TipoParada.EMBARQUE}>🟢 Embarque</option>
                                <option value={TipoParada.DESEMBARQUE}>🔴 Desembarque</option>
                                <option value={TipoParada.PARADA_TECNICA}>⚙️ Parada Técnica</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                                    <Clock size={14} className="text-green-600" />
                                    Horário de Chegada
                                </label>
                                <input
                                    type="time"
                                    value={horarioChegada}
                                    onChange={(e) => setHorarioChegada(e.target.value)}
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                                    <Clock size={14} className="text-red-600" />
                                    Horário de Partida
                                </label>
                                <input
                                    type="time"
                                    value={horarioPartida}
                                    onChange={(e) => setHorarioPartida(e.target.value)}
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Informação */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mt-6">
                    <div className="flex items-start gap-3">
                        <MapPin size={20} className="text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                                Sobre o Cadastro de Paradas
                            </p>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                Esta parada ficará disponível para uso em futuras viagens. Você poderá associá-la a qualquer viagem
                                através do formulário de "Nova Viagem" na seção "Paradas Intermediárias".
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
