import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VeiculoStatus } from '../types';
import { ArrowLeft, Save, Bus, Truck, FileText, Gauge, Calendar, Wrench } from 'lucide-react';

export const NovoVeiculo: React.FC = () => {
    const navigate = useNavigate();

    const [placa, setPlaca] = useState('');
    const [modelo, setModelo] = useState('');
    const [tipo, setTipo] = useState<'ONIBUS' | 'CAMINHAO'>('ONIBUS');
    const [status, setStatus] = useState<VeiculoStatus>(VeiculoStatus.ATIVO);
    const [ano, setAno] = useState('');
    const [kmAtual, setKmAtual] = useState('');
    const [proximaRevisaoKm, setProximaRevisaoKm] = useState('');
    const [ultimaRevisao, setUltimaRevisao] = useState('');
    const [capacidadePassageiros, setCapacidadePassageiros] = useState('');
    const [capacidadeCarga, setCapacidadeCarga] = useState('');
    const [observacoes, setObservacoes] = useState('');

    const handleSalvar = () => {
        console.log({
            placa,
            modelo,
            tipo,
            status,
            ano: parseInt(ano),
            km_atual: parseInt(kmAtual),
            proxima_revisao_km: parseInt(proximaRevisaoKm),
            ultima_revisao: ultimaRevisao,
            capacidade_passageiros: tipo === 'ONIBUS' ? parseInt(capacidadePassageiros) : undefined,
            capacidade_carga: tipo === 'CAMINHAO' ? parseFloat(capacidadeCarga) : undefined,
            observacoes
        });
        navigate('/admin/frota');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/frota')}
                    className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Novo Veículo</h1>
                    <p className="text-slate-500 dark:text-slate-400">Cadastre um novo veículo na frota</p>
                </div>
                <button
                    onClick={handleSalvar}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                    <Save size={18} />
                    Salvar Veículo
                </button>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Informações Básicas */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <FileText size={20} className="text-blue-600" />
                        Informações Básicas
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Placa *
                            </label>
                            <input
                                type="text"
                                value={placa}
                                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                                placeholder="ABC-1234"
                                maxLength={8}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Modelo *
                            </label>
                            <input
                                type="text"
                                value={modelo}
                                onChange={(e) => setModelo(e.target.value)}
                                placeholder="Ex: Mercedes-Benz O500"
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Tipo de Veículo *
                            </label>
                            <select
                                value={tipo}
                                onChange={(e) => setTipo(e.target.value as 'ONIBUS' | 'CAMINHAO')}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="ONIBUS">🚌 Ônibus</option>
                                <option value="CAMINHAO">🚛 Caminhão</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Ano de Fabricação *
                            </label>
                            <input
                                type="number"
                                value={ano}
                                onChange={(e) => setAno(e.target.value)}
                                placeholder="2023"
                                min="1990"
                                max={new Date().getFullYear() + 1}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Status *
                            </label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as VeiculoStatus)}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value={VeiculoStatus.ATIVO}>✅ Ativo</option>
                                <option value={VeiculoStatus.MANUTENCAO}>🔧 Manutenção</option>
                                <option value={VeiculoStatus.EM_VIAGEM}>🚀 Em Viagem</option>
                            </select>
                        </div>

                        {tipo === 'ONIBUS' ? (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                                    <Bus size={14} className="text-blue-600" />
                                    Capacidade de Passageiros
                                </label>
                                <input
                                    type="number"
                                    value={capacidadePassageiros}
                                    onChange={(e) => setCapacidadePassageiros(e.target.value)}
                                    placeholder="46"
                                    min="1"
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                                    <Truck size={14} className="text-orange-600" />
                                    Capacidade de Carga (ton)
                                </label>
                                <input
                                    type="number"
                                    value={capacidadeCarga}
                                    onChange={(e) => setCapacidadeCarga(e.target.value)}
                                    placeholder="25.5"
                                    step="0.1"
                                    min="0"
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Quilometragem e Manutenção */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <Wrench size={20} className="text-orange-600" />
                        Quilometragem e Manutenção
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                                <Gauge size={14} className="text-blue-600" />
                                Quilometragem Atual (km) *
                            </label>
                            <input
                                type="number"
                                value={kmAtual}
                                onChange={(e) => setKmAtual(e.target.value)}
                                placeholder="87500"
                                min="0"
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                                <Wrench size={14} className="text-orange-600" />
                                Próxima Revisão (km) *
                            </label>
                            <input
                                type="number"
                                value={proximaRevisaoKm}
                                onChange={(e) => setProximaRevisaoKm(e.target.value)}
                                placeholder="95000"
                                min="0"
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                                <Calendar size={14} className="text-purple-600" />
                                Data da Última Revisão
                            </label>
                            <input
                                type="date"
                                value={ultimaRevisao}
                                onChange={(e) => setUltimaRevisao(e.target.value)}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Observações */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4">
                        Observações
                    </h3>

                    <div>
                        <textarea
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                            placeholder="Informações adicionais sobre o veículo..."
                            rows={4}
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Informação */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        {tipo === 'ONIBUS' ? (
                            <Bus size={20} className="text-blue-600 dark:text-blue-400 mt-0.5" />
                        ) : (
                            <Truck size={20} className="text-blue-600 dark:text-blue-400 mt-0.5" />
                        )}
                        <div>
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                                Cadastro de {tipo === 'ONIBUS' ? 'Ônibus' : 'Caminhão'}
                            </p>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                {tipo === 'ONIBUS'
                                    ? 'Este veículo ficará disponível para alocação em viagens de turismo. Certifique-se de preencher a capacidade de passageiros corretamente.'
                                    : 'Este veículo ficará disponível para transporte de cargas expressas. Especifique a capacidade de carga em toneladas.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
