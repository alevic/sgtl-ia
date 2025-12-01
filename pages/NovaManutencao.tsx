import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
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
    IVeiculo
} from '../types';
import { ModalConfirmacao } from '../components/ui/ModalConfirmacao';
import { SeletorVeiculo } from '../components/Veiculos/SeletorVeiculo';

// ...

export const NovaManutencao: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;
    const [loading, setLoading] = useState(false);
    const [selectedVehicleDetails, setSelectedVehicleDetails] = useState<Partial<IVeiculo> | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [originalData, setOriginalData] = useState<Partial<IManutencao> | null>(null);

    const [formData, setFormData] = useState<Partial<IManutencao>>({
        tipo: TipoManutencao.PREVENTIVA,
        status: StatusManutencao.AGENDADA,
        moeda: Moeda.BRL,
        custo_pecas: 0,
        custo_mao_de_obra: 0,
        data_agendada: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        const fetchData = async () => {
            setIsLoadingData(true);
            try {
                // If editing, fetch maintenance details
                if (isEditing) {
                    const maintenanceRes = await fetch(`${import.meta.env.VITE_API_URL}/api/maintenance/${id}`, {
                        credentials: 'include'
                    });
                    if (maintenanceRes.ok) {
                        const maintenanceData = await maintenanceRes.json();
                        const formattedData = {
                            ...maintenanceData,
                            data_agendada: maintenanceData.data_agendada ? maintenanceData.data_agendada.split('T')[0] : '',
                            data_inicio: maintenanceData.data_inicio ? maintenanceData.data_inicio.split('T')[0] : '',
                            data_conclusao: maintenanceData.data_conclusao ? maintenanceData.data_conclusao.split('T')[0] : '',
                            veiculo_id: maintenanceData.vehicle_id
                        };
                        setFormData(formattedData);
                        setOriginalData(formattedData);

                        if (maintenanceData.vehicle_id) {
                            setSelectedVehicleDetails({
                                id: maintenanceData.vehicle_id,
                                placa: maintenanceData.placa,
                                modelo: maintenanceData.modelo,
                                tipo: maintenanceData.tipo
                            });
                        }

                        console.log('Dados da manutenção carregados:', maintenanceData);
                        console.log('Transaction ID from API:', maintenanceData.transaction_id);

                        if (maintenanceData.transaction_id) {
                            console.log('Setting transaction info state');
                            setTransactionInfo({
                                id: maintenanceData.transaction_id,
                                status: maintenanceData.transaction_status
                            });
                        } else {
                            console.log('No transaction linked to this maintenance');
                            setTransactionInfo(null);
                        }
                    } else {
                        console.error('Failed to fetch maintenance details');
                        navigate('/admin/manutencao');
                    }
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchData();
        fetchData();
    }, [id, isEditing, navigate]);

    // Handle initial vehicle from navigation state (e.g. from Fleet module)
    useEffect(() => {
        if (!isEditing && location.state?.initialVehicle && !formData.veiculo_id) {
            const vehicle = location.state.initialVehicle;
            setFormData(prev => ({
                ...prev,
                veiculo_id: vehicle.id,
                km_veiculo: vehicle.km_atual
            }));
            setSelectedVehicleDetails({
                id: vehicle.id,
                placa: vehicle.placa,
                modelo: vehicle.modelo,
                tipo: vehicle.tipo
            });
        }
    }, [location.state, isEditing, formData.veiculo_id]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleVehicleChange = (vehicleId: string, vehicle?: IVeiculo) => {
        setFormData(prev => ({
            ...prev,
            veiculo_id: vehicleId
        }));

        if (vehicle) {
            setSelectedVehicleDetails(vehicle);
            // Auto-fill KM if empty
            if (!formData.km_veiculo) {
                setFormData(prev => ({
                    ...prev,
                    km_veiculo: vehicle.km_atual
                }));
            }
        } else if (!vehicleId) {
            setSelectedVehicleDetails(null);
        }
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: parseFloat(value) || 0
        }));
    };

    const [showFinancialModal, setShowFinancialModal] = useState(false);
    const [savedMaintenanceData, setSavedMaintenanceData] = useState<{ custoTotal: number, placa: string, id: string } | null>(null);
    const [transactionInfo, setTransactionInfo] = useState<{ id: string, status: string } | null>(null);
    const [financialModalContent, setFinancialModalContent] = useState({
        title: '',
        message: <></>,
        confirmText: '',
        cancelText: '',
        onConfirm: () => { },
        onCancel: () => { }
    });

    const executeSave = async () => {
        setLoading(true);
        setShowFinancialModal(false); // Close modal if open

        try {
            const url = isEditing
                ? `${import.meta.env.VITE_API_URL}/api/maintenance/${id}`
                : `${import.meta.env.VITE_API_URL}/api/maintenance`;

            const method = isEditing ? 'PUT' : 'POST';

            // Map frontend keys to backend expected keys
            const payload = {
                ...formData,
                vehicle_id: formData.veiculo_id
            };

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            if (response.ok) {
                const savedData = await response.json();
                console.log('Manutenção salva:', savedData);

                // Calcular custo total
                const custoTotal = (Number(formData.custo_pecas) || 0) + (Number(formData.custo_mao_de_obra) || 0);

                // Scenario: Create Transaction (Only if NO transaction exists)
                if (custoTotal > 0 && !transactionInfo) {
                    const placa = selectedVehicleDetails ? selectedVehicleDetails.placa : 'Veículo';
                    // We don't rely on state for the callback to avoid stale closures

                    setFinancialModalContent({
                        title: 'Lançar Despesa',
                        message: (
                            <div className="space-y-2">
                                <p>Manutenção salva com sucesso!</p>
                                <p>
                                    Deseja lançar o custo total de <strong>{formData.moeda} {custoTotal.toFixed(2)}</strong> no módulo Financeiro agora?
                                </p>
                            </div>
                        ),
                        confirmText: 'Sim, lançar despesa',
                        cancelText: 'Não, apenas salvar',
                        onConfirm: () => {
                            navigate('/admin/financeiro/transacoes/nova', {
                                state: {
                                    valor: custoTotal,
                                    descricao: `Manutenção ${placa || 'Veículo'} - ${formData.tipo}`,
                                    categoria_despesa: 'MANUTENCAO',
                                    centro_custo: 'VENDAS', // Custo Variável
                                    manutencao_id: savedData.id
                                }
                            });
                        },
                        onCancel: handleSkipFinance
                    });
                    setShowFinancialModal(true);
                    setLoading(false);
                    return;
                }

                // If no new transaction needed, just go back
                navigate('/admin/manutencao');
            } else {
                console.error('Failed to save maintenance');
                alert('Erro ao salvar manutenção.');
            }
        } catch (error) {
            console.error('Error saving maintenance:', error);
            alert('Erro ao salvar manutenção.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.veiculo_id) {
            alert('Por favor, selecione um veículo.');
            return;
        }

        // Check for scenarios requiring pre-save confirmation (Only when Editing with existing transaction)
        if (isEditing && transactionInfo) {
            const custoTotal = (Number(formData.custo_pecas) || 0) + (Number(formData.custo_mao_de_obra) || 0);

            // Scenario 1: Cancellation
            if (formData.status === 'CANCELADA') {
                setFinancialModalContent({
                    title: 'Cancelar Manutenção e Financeiro',
                    message: (
                        <div className="space-y-2">
                            <p className="text-red-600 font-medium">Atenção!</p>
                            <p>
                                Esta manutenção possui uma transação financeira vinculada.
                                Ao cancelar a manutenção, a transação também será <strong>CANCELADA</strong>.
                            </p>
                            <p>Deseja continuar?</p>
                        </div>
                    ),
                    confirmText: 'Sim, cancelar ambos',
                    cancelText: 'Voltar',
                    onConfirm: executeSave,
                    onCancel: () => setShowFinancialModal(false)
                });
                setShowFinancialModal(true);
                return;
            }

            // Scenario 2: Completion (Pay Pending Transaction)
            else if (formData.status === 'CONCLUIDA' && transactionInfo.status === 'PENDENTE') {
                setFinancialModalContent({
                    title: 'Concluir e Pagar',
                    message: (
                        <div className="space-y-2">
                            <p className="text-green-600 font-medium">Conclusão de Serviço</p>
                            <p>
                                Esta manutenção possui uma transação financeira <strong>PENDENTE</strong>.
                                Ao concluir, a transação será marcada como <strong>PAGA</strong> automaticamente.
                            </p>
                            <p>Deseja continuar?</p>
                        </div>
                    ),
                    confirmText: 'Sim, concluir e pagar',
                    cancelText: 'Voltar',
                    onConfirm: executeSave,
                    onCancel: () => setShowFinancialModal(false)
                });
                setShowFinancialModal(true);
                return;
            }

            // Scenario 3: General Update (Value/Date)
            else {
                // Check if financial relevant data changed
                const originalCusto = (Number(originalData?.custo_pecas) || 0) + (Number(originalData?.custo_mao_de_obra) || 0);
                const currentCusto = (Number(formData.custo_pecas) || 0) + (Number(formData.custo_mao_de_obra) || 0);

                const hasFinancialChanges =
                    Math.abs(originalCusto - currentCusto) > 0.01 ||
                    originalData?.data_agendada !== formData.data_agendada ||
                    originalData?.tipo !== formData.tipo ||
                    originalData?.veiculo_id !== formData.veiculo_id ||
                    originalData?.status !== formData.status;

                if (!hasFinancialChanges) {
                    executeSave();
                    return;
                }

                setFinancialModalContent({
                    title: 'Atualizar Financeiro',
                    message: (
                        <div className="space-y-2">
                            <p>
                                Esta manutenção possui uma transação financeira vinculada.
                                Os dados financeiros serão atualizados para refletir esta manutenção.
                            </p>
                            <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-md">
                                <p><strong>Novo Valor:</strong> {formData.moeda} {custoTotal.toFixed(2)}</p>
                                <p><strong>Nova Data:</strong> {formData.data_agendada?.split('-').reverse().join('/')}</p>
                            </div>
                            <p>Deseja confirmar a atualização?</p>
                        </div>
                    ),
                    confirmText: 'Sim, atualizar',
                    cancelText: 'Voltar',
                    onConfirm: executeSave,
                    onCancel: () => setShowFinancialModal(false)
                });
                setShowFinancialModal(true);
                return;
            }
        }

        // If no pre-save confirmation needed, proceed
        executeSave();
    };

    const handleSkipFinance = () => {
        setShowFinancialModal(false);
        navigate('/admin/manutencao');
    };

    if (isLoadingData) {
        return <div className="p-8 text-center">Carregando dados...</div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 relative">
            {/* Modal de Confirmação Financeira */}
            <ModalConfirmacao
                isOpen={showFinancialModal}
                onClose={() => financialModalContent.onCancel()}
                onConfirm={() => financialModalContent.onConfirm()}
                title={financialModalContent.title}
                message={financialModalContent.message}
                confirmText={financialModalContent.confirmText}
                cancelText={financialModalContent.cancelText}
                icon={<DollarSign size={32} />}
                variant="success"
            />

            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/manutencao')}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <ArrowLeft size={24} className="text-slate-600 dark:text-slate-400" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                        {isEditing ? 'Editar Manutenção' : 'Nova Manutenção'}
                    </h1>
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
                                <SeletorVeiculo
                                    value={formData.veiculo_id}
                                    onChange={handleVehicleChange}
                                    initialVehicle={selectedVehicleDetails || undefined}
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
                                        {formData.moeda} {((Number(formData.custo_pecas) || 0) + (Number(formData.custo_mao_de_obra) || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
        </div >
    );
};
