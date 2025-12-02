import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IRota } from '../types';
import { EditorRota } from '../components/Rotas/EditorRota';
import { criarRotaVazia } from '../utils/rotaValidation';
import { routesService } from '../services/routesService';
import { ArrowLeft, Save, Route, Loader } from 'lucide-react';

export const NovaRota: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdicao = Boolean(id);

    const [rota, setRota] = useState<IRota>(criarRotaVazia('IDA'));
    const [loading, setLoading] = useState(isEdicao);
    const [saving, setSaving] = useState(false);

    // Form states
    const [nomeRota, setNomeRota] = useState('');
    const [tipoRota, setTipoRota] = useState<'IDA' | 'VOLTA'>('IDA');
    const [distanciaTotal, setDistanciaTotal] = useState<number | ''>('');
    const [rotaAtiva, setRotaAtiva] = useState(true);

    useEffect(() => {
        if (isEdicao && id) {
            loadRota(id);
        }
    }, [id, isEdicao]);

    const loadRota = async (rotaId: string) => {
        try {
            setLoading(true);
            const data = await routesService.getById(rotaId);
            setRota(data);

            // Populate form fields
            setNomeRota(data.nome);
            setTipoRota(data.tipo_rota);
            setDistanciaTotal(data.distancia_total_km || '');
            setRotaAtiva(data.ativa);
        } catch (error) {
            console.error('Erro ao carregar rota:', error);
            alert('Erro ao carregar detalhes da rota.');
            navigate('/admin/rotas');
        } finally {
            setLoading(false);
        }
    };

    const handleTipoChange = (novoTipo: 'IDA' | 'VOLTA') => {
        setTipoRota(novoTipo);
        setRota({ ...rota, tipo_rota: novoTipo });
    };

    const handleSalvar = async () => {
        if (!nomeRota) {
            alert('Por favor, informe um nome para a rota.');
            return;
        }

        if (rota.pontos.length < 2) {
            alert('A rota deve ter pelo menos origem e destino.');
            return;
        }

        try {
            setSaving(true);

            // Parse origin and destination
            const origemPonto = rota.pontos[0];
            const destinoPonto = rota.pontos[rota.pontos.length - 1];

            const parseLocation = (location: string) => {
                const parts = location.split(/[,-]/).map(s => s.trim());
                if (parts.length >= 2) {
                    return { city: parts[0], state: parts[1].substring(0, 2).toUpperCase() };
                }
                return { city: location, state: 'UF' };
            };

            const origem = parseLocation(origemPonto.nome);
            const destino = parseLocation(destinoPonto.nome);

            const payload: any = {
                name: nomeRota,
                origin_city: origem.city,
                origin_state: origem.state,
                destination_city: destino.city,
                destination_state: destino.state,
                distance_km: distanciaTotal ? Number(distanciaTotal) : 0,
                duration_minutes: rota.duracao_estimada_minutos || 0,
                stops: rota.pontos,
                active: rotaAtiva,
                type: tipoRota
            };

            if (isEdicao && id) {
                await routesService.update(id, payload);
            } else {
                await routesService.create(payload);
            }

            navigate('/admin/rotas');
        } catch (error) {
            console.error('Erro ao salvar rota:', error);
            alert('Erro ao salvar rota. Verifique os dados e tente novamente.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/rotas')}
                    className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                        {isEdicao ? 'Editar Rota' : 'Nova Rota'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Configure uma rota reutilizável para suas viagens
                    </p>
                </div>
                <button
                    onClick={handleSalvar}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
                    {saving ? 'Salvando...' : 'Salvar Rota'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Formulário de Configuração */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <Route size={20} className="text-purple-600" />
                            Configurações
                        </h3>

                        <div className="space-y-4">
                            {/* Nome da Rota */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Nome da Rota
                                </label>
                                <input
                                    type="text"
                                    value={nomeRota}
                                    onChange={(e) => setNomeRota(e.target.value)}
                                    placeholder="Ex: SP-RJ Expressa"
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Se vazio, será gerado automaticamente
                                </p>
                            </div>

                            {/* Tipo de Rota */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Tipo de Rota
                                </label>
                                <div className="flex gap-3">
                                    <label className="flex-1 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="tipoRota"
                                            value="IDA"
                                            checked={tipoRota === 'IDA'}
                                            onChange={() => handleTipoChange('IDA')}
                                            className="sr-only peer"
                                        />
                                        <div className="px-4 py-2 text-center border-2 border-slate-300 dark:border-slate-600 rounded-lg peer-checked:border-green-600 peer-checked:bg-green-50 dark:peer-checked:bg-green-900/20 peer-checked:text-green-700 dark:peer-checked:text-green-400 transition-colors">
                                            Ida
                                        </div>
                                    </label>
                                    <label className="flex-1 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="tipoRota"
                                            value="VOLTA"
                                            checked={tipoRota === 'VOLTA'}
                                            onChange={() => handleTipoChange('VOLTA')}
                                            className="sr-only peer"
                                        />
                                        <div className="px-4 py-2 text-center border-2 border-slate-300 dark:border-slate-600 rounded-lg peer-checked:border-orange-600 peer-checked:bg-orange-50 dark:peer-checked:bg-orange-900/20 peer-checked:text-orange-700 dark:peer-checked:text-orange-400 transition-colors">
                                            Volta
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Distância Total */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Distância Total (km)
                                </label>
                                <input
                                    type="number"
                                    value={distanciaTotal}
                                    onChange={(e) => setDistanciaTotal(e.target.value === '' ? '' : Number(e.target.value))}
                                    placeholder="Ex: 430"
                                    min="0"
                                    step="1"
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Opcional
                                </p>
                            </div>

                            {/* Duração Estimada */}
                            {rota.duracao_estimada_minutos && rota.duracao_estimada_minutos > 0 && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Duração Calculada
                                    </p>
                                    <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                                        {Math.floor(rota.duracao_estimada_minutos / 60)}h{' '}
                                        {rota.duracao_estimada_minutos % 60}min
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        Baseado nos horários configurados
                                    </p>
                                </div>
                            )}

                            {/* Status da Rota */}
                            <div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={rotaAtiva}
                                        onChange={(e) => setRotaAtiva(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Rota ativa
                                    </span>
                                </label>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-6">
                                    Rotas inativas não estarão disponíveis para uso
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Editor de Rota */}
                <div className="lg:col-span-3">
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-6">
                            Pontos da Rota
                        </h3>
                        <EditorRota rota={rota} onChange={setRota} />
                    </div>
                </div>
            </div>
        </div>
    );
};
