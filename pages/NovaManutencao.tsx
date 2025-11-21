import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Save,
    Wrench,
    Calendar,
    DollarSign,
    FileText,
    AlertTriangle,
    CheckCircle
} from 'lucide-react';
import {
    IManutencao,
    TipoManutencao,
    StatusManutencao,
    Moeda,
    VeiculoStatus
} from '../types';
import { MOCK_VEICULOS } from './Frota';

export const NovaManutencao: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState<Partial<IManutencao>>({
        tipo: TipoManutencao.PREVENTIVA,
        status: StatusManutencao.AGENDADA,
        moeda: Moeda.BRL,
        custo_pecas: 0,
        custo_mao_de_obra: 0,
        data_agendada: new Date().toISOString().split('T')[0]
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: parseFloat(value) || 0
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simular API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log('Nova Manutenção:', formData);

        // TODO: Atualizar status do veículo se necessário

        setLoading(false);
        navigate('/admin/manutencao');
    };

    const selectedVeiculo = MOCK_VEICULOS.find(v => v.id === formData.veiculo_id);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/manutencao')}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <ArrowLeft size={24} className="text-slate-600 dark:text-slate-400" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Nova Manutenção</h1>
                    <p className="text-slate-500 dark:text-slate-400">Agendar ou registrar manutenção de veículo</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coluna Principal */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Dados do Veículo e Tipo */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Wrench size={20} className="text-blue-500" />
                            Dados Principais
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Veículo
                                </label>
                                <select
                                    name="veiculo_id"
                                    required
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    onChange={handleInputChange}
                                    value={formData.veiculo_id || ''}
                                >
                                    <option value="">Selecione um veículo</option>
                                    {MOCK_VEICULOS.map(veiculo => (
                                        <option key={veiculo.id} value={veiculo.id}>
                                            {veiculo.placa} - {veiculo.modelo}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    KM Atual do Veículo
                                </label>
                                <input
                                    type="number"
                                    name="km_veiculo"
                                    required
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    value={formData.km_veiculo || selectedVeiculo?.km_atual || ''}
                                    onChange={handleNumberChange}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Tipo de Manutenção
                                </label>
                                <select
                                    name="tipo"
                                    required
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    onChange={handleInputChange}
                                    value={formData.tipo}
                                >
                                    {Object.values(TipoManutencao).map(tipo => (
                                        <option key={tipo} value={tipo}>{tipo}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Status
                                </label>
                                <select
                                    name="status"
                                    required
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    onChange={handleInputChange}
                                    value={formData.status}
                                >
                                    {Object.values(StatusManutencao).map(status => (
                                        <option key={status} value={status}>{status.replace('_', ' ')}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Detalhes e Custos */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <FileText size={20} className="text-blue-500" />
                            Detalhes do Serviço
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Descrição do Serviço
                                </label>
                                <textarea
                                    name="descricao"
                                    required
                                    rows={3}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    placeholder="Descreva o serviço a ser realizado..."
                                    onChange={handleInputChange}
                                    value={formData.descricao || ''}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Oficina / Fornecedor
                                    </label>
                                    <input
                                        type="text"
                                        name="oficina"
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                        onChange={handleInputChange}
                                        value={formData.oficina || ''}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Responsável
                                    </label>
                                    <input
                                        type="text"
                                        name="responsavel"
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                        onChange={handleInputChange}
                                        value={formData.responsavel || ''}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Custo Peças ({formData.moeda})
                                    </label>
                                    <div className="relative">
                                        <DollarSign size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="number"
                                            name="custo_pecas"
                                            step="0.01"
                                            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                            onChange={handleNumberChange}
                                            value={formData.custo_pecas}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Custo Mão de Obra ({formData.moeda})
                                    </label>
                                    <div className="relative">
                                        <DollarSign size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="number"
                                            name="custo_mao_de_obra"
                                            step="0.01"
                                            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                            onChange={handleNumberChange}
                                            value={formData.custo_mao_de_obra}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Total Estimado
                                    </label>
                                    <div className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-800 dark:text-white font-bold">
                                        {formData.moeda} {((formData.custo_pecas || 0) + (formData.custo_mao_de_obra || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Coluna Lateral */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Calendar size={20} className="text-blue-500" />
                            Datas
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Data Agendada
                                </label>
                                <input
                                    type="date"
                                    name="data_agendada"
                                    required
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    onChange={handleInputChange}
                                    value={formData.data_agendada}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Data Início (Real)
                                </label>
                                <input
                                    type="date"
                                    name="data_inicio"
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    onChange={handleInputChange}
                                    value={formData.data_inicio || ''}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Data Conclusão
                                </label>
                                <input
                                    type="date"
                                    name="data_conclusao"
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    onChange={handleInputChange}
                                    value={formData.data_conclusao || ''}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
                        <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                            <AlertTriangle size={18} />
                            Atenção
                        </h3>
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                            Ao iniciar uma manutenção (Status: Em Andamento), o veículo ficará indisponível para novas viagens até a conclusão do serviço.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save size={20} />
                                Salvar Manutenção
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};
