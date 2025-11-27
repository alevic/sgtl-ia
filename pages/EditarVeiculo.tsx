import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VeiculoStatus } from '../types';
import { ArrowLeft, Save, Bus, Truck, FileText, Gauge, Calendar, Wrench } from 'lucide-react';

export const EditarVeiculo: React.FC = () => {
    const { id } = useParams<{ id: string }>();
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
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    useEffect(() => {
        const fetchVehicle = async () => {
            if (!id) return;

            setIsFetching(true);
            try {
                const response = await fetch(`http://localhost:4000/api/fleet/vehicles/${id}`, {
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch vehicle');
                }

                const data = await response.json();

                // Pre-populate form
                setPlaca(data.placa || '');
                setModelo(data.modelo || '');
                setTipo(data.tipo || 'ONIBUS');
                setStatus(data.status || VeiculoStatus.ATIVO);
                setAno(data.ano?.toString() || '');
                setKmAtual(data.km_atual?.toString() || '');
                setProximaRevisaoKm(data.proxima_revisao_km?.toString() || '');
                setUltimaRevisao(data.ultima_revisao || '');
                setCapacidadePassageiros(data.capacidade_passageiros?.toString() || '');
                setCapacidadeCarga(data.capacidade_carga?.toString() || '');
                setObservacoes(data.observacoes || '');
            } catch (error) {
                console.error("Erro ao buscar veículo:", error);
                alert('Erro ao carregar veículo. Redirecionando...');
                navigate('/admin/frota');
            } finally {
                setIsFetching(false);
            }
        };

        fetchVehicle();
    }, [id, navigate]);

    const handleSalvar = async () => {
        setIsLoading(true);
        try {
            const vehicleData = {
                placa,
                modelo,
                tipo,
                status,
                ano: parseInt(ano),
                km_atual: parseInt(kmAtual),
                proxima_revisao_km: parseInt(proximaRevisaoKm),
                ultima_revisao: ultimaRevisao || null,
                is_double_deck: false,
                capacidade_passageiros: tipo === 'ONIBUS' ? parseInt(capacidadePassageiros) : null,
                capacidade_carga: tipo === 'CAMINHAO' ? parseFloat(capacidadeCarga) : null,
                observacoes: observacoes || null
            };

            const response = await fetch(`http://localhost:4000/api/fleet/vehicles/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(vehicleData)
            });

            if (!response.ok) {
                throw new Error('Failed to update vehicle');
            }

            navigate(`/admin/frota/${id}`);
        } catch (error) {
            console.error("Erro ao atualizar veículo:", error);
            alert('Erro ao atualizar veículo. Por favor, tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-slate-500 dark:text-slate-400">Carregando veículo...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(`/admin/frota/${id}`)}
                    className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Editar Veículo</h1>
                    <p className="text-slate-500 dark:text-slate-400">Atualize as informações do veículo</p>
                </div>
                <button
                    onClick={handleSalvar}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                    <Save size={18} />
                    {isLoading ? 'Salvando...' : 'Salvar Alterações'}
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
            </div>
        </div>
    );
};
