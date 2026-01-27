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
import { DatePicker } from '../components/Form/DatePicker';
import { PageHeader } from '../components/Layout/PageHeader';
import { FormSection } from '../components/Layout/FormSection';
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { AlertCircle, Loader } from 'lucide-react';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import {
    IManutencao,
    TipoManutencao,
    StatusManutencao,
    Moeda,
    IVeiculo,
    StatusTransacao,
    StatusManutencaoLabel,
    TipoManutencaoLabel
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
        tipo: TipoManutencao.PREVENTIVE,
        status: StatusManutencao.SCHEDULED,
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
                                tipo: maintenanceData.vehicle_type
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
        onCancel: () => { },
        hideConfirmButton: false
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

                    setFinancialModalContent({
                        title: 'Lançar Despesa',
                        message: (
                            <div className="space-y-2">
                                <p>Manutenção salva com sucesso!</p>
                                <p>
                                    Deseja lançar o custo total de <strong>{formData.moeda} {custoTotal.toFixed(2)}</strong> no módulo Financeiro agora para detalhar o pagamento?
                                </p>
                            </div>
                        ),
                        confirmText: 'Sim, lançar despesa',
                        cancelText: 'Não, apenas salvar',
                        onConfirm: () => {
                            setShowFinancialModal(false);
                            navigate('/admin/financeiro/transacoes/nova', {
                                state: {
                                    valor: custoTotal,
                                    descricao: `Manutenção ${placa} - ${formData.tipo}`,
                                    categoria_despesa: 'MANUTENCAO',
                                    centro_custo: 'VENDAS', // Custo Variável
                                    manutencao_id: savedData.id
                                }
                            });
                        },
                        onCancel: handleSkipFinance,
                        hideConfirmButton: false
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

    const handleCancelAndRelaunch = async () => {
        if (!transactionInfo) return;

        setLoading(true);
        setShowFinancialModal(false);

        try {
            // 1. Fetch full transaction data to preserve fields during PUT
            const transRes = await fetch(`${import.meta.env.VITE_API_URL}/api/finance/transactions/${transactionInfo.id}`, { credentials: 'include' });
            if (!transRes.ok) throw new Error('Não foi possível carregar os dados da transação anterior.');
            const fullTrans = await transRes.json();

            // 2. Save maintenance (direct API call to avoid executeSave redirection logic)
            const saveUrl = isEditing
                ? `${import.meta.env.VITE_API_URL}/api/maintenance/${id}`
                : `${import.meta.env.VITE_API_URL}/api/maintenance`;

            const payload = { ...formData, vehicle_id: formData.veiculo_id };
            const saveResponse = await fetch(saveUrl, {
                method: isEditing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include'
            });
            if (!saveResponse.ok) throw new Error('Falha ao salvar manutenção');
            const savedData = await saveResponse.json();

            // 3. Cancel old transaction (Soft delete/Audit friendly)
            await fetch(`${import.meta.env.VITE_API_URL}/api/finance/transactions/${transactionInfo.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tipo: fullTrans.type,
                    descricao: fullTrans.description,
                    valor: fullTrans.amount,
                    moeda: fullTrans.currency,
                    data_emissao: fullTrans.date,
                    data_vencimento: fullTrans.due_date,
                    data_pagamento: fullTrans.payment_date,
                    status: 'CANCELLED',
                    forma_pagamento: fullTrans.payment_method,
                    categoria_despesa: fullTrans.type === 'EXPENSE' ? fullTrans.category : undefined,
                    categoria_receita: fullTrans.type === 'INCOME' ? fullTrans.category : undefined,
                    centro_custo: fullTrans.cost_center,
                    classificacao_contabil: fullTrans.accounting_classification,
                    numero_documento: fullTrans.document_number,
                    observacoes: (fullTrans.notes || '') + '\n[Cancelada devido a alteração de custo na manutenção]'
                }),
                credentials: 'include'
            });

            // 4. Redirect to NEW transaction form
            const currentCusto = (Number(formData.custo_pecas) || 0) + (Number(formData.custo_mao_de_obra) || 0);
            const placa = selectedVehicleDetails ? selectedVehicleDetails.placa : 'Veículo';

            navigate('/admin/financeiro/transacoes/nova', {
                state: {
                    valor: currentCusto,
                    descricao: `Manutenção ${placa} - ${formData.tipo}`,
                    categoria_despesa: 'MANUTENCAO',
                    centro_custo: 'VENDAS',
                    manutencao_id: savedData.id
                }
            });
        } catch (error: any) {
            console.error('Erro no fluxo auditável:', error);
            alert(error.message || 'Erro ao processar alteração financeira.');
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
            if (formData.status === StatusManutencao.CANCELLED) {
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
            else if (formData.status === StatusManutencao.COMPLETED && transactionInfo.status === StatusTransacao.PENDING) {
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
                const originalCusto = (Number(originalData?.custo_pecas) || 0) + (Number(originalData?.custo_mao_de_obra) || 0);
                const currentCusto = (Number(formData.custo_pecas) || 0) + (Number(formData.custo_mao_de_obra) || 0);

                const hasFinancialChanges =
                    Math.abs(originalCusto - currentCusto) > 0.01 ||
                    originalData?.data_agendada !== formData.data_agendada ||
                    originalData?.tipo !== formData.tipo ||
                    originalData?.veiculo_id !== formData.veiculo_id;

                if (!hasFinancialChanges) {
                    executeSave();
                    return;
                }

                setFinancialModalContent({
                    title: 'Alteração de Custo',
                    message: (
                        <div className="space-y-4 pt-2">
                            <Alert variant="default" className="bg-amber-50 dark:bg-amber-900/10 border-amber-200">
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                                <AlertDescription className="text-xs text-amber-800 dark:text-amber-300">
                                    O valor da manutenção foi alterado. Como deseja tratar o registro financeiro atual para manter a auditoria?
                                </AlertDescription>
                            </Alert>

                            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-sm border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                                <div className="text-xs text-slate-500 uppercase font-bold">Resumo</div>
                                <div className="flex gap-4">
                                    <span className="text-sm line-through text-slate-400">{formData.moeda} {originalCusto.toFixed(2)}</span>
                                    <span className="text-sm font-black text-slate-900 dark:text-slate-100">{formData.moeda} {currentCusto.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                                <button
                                    onClick={handleCancelAndRelaunch}
                                    className="flex flex-col items-start p-3 text-left border-2 border-blue-100 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50 dark:border-blue-900/20 dark:hover:border-blue-700 dark:bg-blue-900/10 dark:hover:bg-blue-900/20 rounded-sm transition-all group"
                                >
                                    <span className="text-sm font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2">
                                        <CheckCircle size={16} /> Cancelar e Relançar (Recomendado)
                                    </span>
                                    <span className="text-[10px] text-blue-600/70 dark:text-blue-500/70 mt-1 uppercase leading-tight font-medium">
                                        Marca o lançamento antigo como CANCELADO e redireciona para um novo formulário. Mantém o histórico limpo para auditoria.
                                    </span>
                                </button>

                                <button
                                    onClick={executeSave}
                                    className="flex flex-col items-start p-3 text-left border border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-50 dark:border-slate-800 dark:hover:border-slate-600 dark:bg-slate-800/50 dark:hover:bg-slate-800 rounded-sm transition-all"
                                >
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        <Loader className="animate-spin group-hover:block hidden" size={14} /> Apenas Corrigir Existente
                                    </span>
                                    <span className="text-[10px] text-slate-500 mt-1 uppercase leading-tight font-medium outline-offset-1">
                                        Apenas atualiza o valor do registro que já existe no financeiro. Indicado para correções simples de digitação.
                                    </span>
                                </button>
                            </div>
                        </div>
                    ),
                    confirmText: '', // Using custom buttons
                    cancelText: 'Voltar e Revisar',
                    onConfirm: () => { },
                    onCancel: () => setShowFinancialModal(false),
                    hideConfirmButton: true
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
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
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
                type="success"
                hideConfirmButton={(financialModalContent as any).hideConfirmButton}
            />

            <PageHeader
                title={isEditing ? 'Editar Manutenção' : 'Nova Manutenção'}
                subtitle="Agendar ou registrar manutenção de veículo"
                backLink="/admin/manutencao"
                backText="Voltar para Manutenções"
                rightElement={
                    <Button
                        onClick={(e) => handleSubmit(e as any)}
                        disabled={loading}
                        className="h-14 rounded-sm px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[12px] tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {loading ? (
                            <Loader className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        {loading ? 'Processando...' : isEditing ? 'Atualizar Manutenção' : 'Salvar Manutenção'}
                    </Button>
                }
            />

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coluna Principal */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Dados do Veículo e Tipo */}
                    <FormSection
                        title="Dados Principais"
                        icon={Wrench}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1 mb-2 block">
                                    Veículo
                                </label>
                                <SeletorVeiculo
                                    value={formData.veiculo_id}
                                    onChange={handleVehicleChange}
                                    initialVehicle={selectedVehicleDetails || undefined}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">
                                    Tipo de Manutenção
                                </label>
                                <select
                                    name="tipo"
                                    required
                                    className="w-full h-14 px-4 rounded-sm bg-muted border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-black uppercase text-[12px] tracking-widest outline-none appearance-none"
                                    onChange={handleInputChange}
                                    value={formData.tipo}
                                >
                                    {Object.values(TipoManutencao).map(tipo => (
                                        <option key={tipo} value={tipo}>
                                            {TipoManutencaoLabel[tipo as TipoManutencao] || tipo}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">
                                    Status
                                </label>
                                <select
                                    name="status"
                                    required
                                    className="w-full h-14 px-4 rounded-sm bg-muted border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-black uppercase text-[12px] tracking-widest outline-none appearance-none"
                                    onChange={handleInputChange}
                                    value={formData.status}
                                >
                                    {Object.values(StatusManutencao).map(status => (
                                        <option key={status} value={status}>
                                            {StatusManutencaoLabel[status as StatusManutencao] || status}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">
                                    KM Atual do Veículo
                                </label>
                                <input
                                    type="number"
                                    name="km_veiculo"
                                    required
                                    className="w-full h-14 px-4 rounded-sm bg-muted border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium outline-none"
                                    onChange={handleNumberChange}
                                    value={formData.km_veiculo || 0}
                                />
                            </div>
                        </div>
                    </FormSection>

                    {/* Detalhes e Custos */}
                    <FormSection
                        title="Detalhes do Serviço"
                        icon={FileText}
                    >
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">
                                    Descrição do Serviço
                                </label>
                                <textarea
                                    name="descricao"
                                    required
                                    rows={3}
                                    className="w-full p-4 rounded-sm bg-muted border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium text-sm resize-none outline-none"
                                    placeholder="Descreva o serviço a ser realizado..."
                                    onChange={handleInputChange}
                                    value={formData.descricao || ''}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">
                                        Oficina / Fornecedor
                                    </label>
                                    <input
                                        type="text"
                                        name="oficina"
                                        className="w-full h-14 px-4 rounded-sm bg-muted border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium outline-none"
                                        onChange={handleInputChange}
                                        value={formData.oficina || ''}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">
                                        Responsável
                                    </label>
                                    <input
                                        type="text"
                                        name="responsavel"
                                        className="w-full h-14 px-4 rounded-sm bg-muted border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium outline-none"
                                        onChange={handleInputChange}
                                        value={formData.responsavel || ''}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-border/50">
                                <div className="space-y-2">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">
                                        Custo Peças ({formData.moeda})
                                    </label>
                                    <div className="relative group">
                                        <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="number"
                                            name="custo_pecas"
                                            step="0.01"
                                            className="w-full h-14 pl-10 pr-4 rounded-sm bg-muted border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium outline-none"
                                            onChange={handleNumberChange}
                                            value={formData.custo_pecas}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">
                                        Custo Mão de Obra ({formData.moeda})
                                    </label>
                                    <div className="relative group">
                                        <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="number"
                                            name="custo_mao_de_obra"
                                            step="0.01"
                                            className="w-full h-14 pl-10 pr-4 rounded-sm bg-muted border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium outline-none"
                                            onChange={handleNumberChange}
                                            value={formData.custo_mao_de_obra}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">
                                        Total Estimado
                                    </label>
                                    <div className="h-14 flex items-center px-4 bg-muted dark:bg-muted border border-border/50 rounded-sm text-foreground font-black tracking-tight text-lg">
                                        {formData.moeda} {((Number(formData.custo_pecas) || 0) + (Number(formData.custo_mao_de_obra) || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </FormSection>
                </div>

                {/* Coluna Lateral */}
                <div className="space-y-6">
                    <FormSection
                        title="Agendamento"
                        icon={Calendar}
                    >
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">
                                    Data Agendada
                                </label>
                                <DatePicker
                                    value={formData.data_agendada || ''}
                                    onChange={(val) => setFormData(prev => ({ ...prev, data_agendada: val }))}
                                    required={true}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">
                                    Data Início (Real)
                                </label>
                                <DatePicker
                                    value={formData.data_inicio || ''}
                                    onChange={(val) => setFormData(prev => ({ ...prev, data_inicio: val }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">
                                    Data Conclusão
                                </label>
                                <DatePicker
                                    value={formData.data_conclusao || ''}
                                    onChange={(val) => setFormData(prev => ({ ...prev, data_conclusao: val }))}
                                />
                            </div>
                        </div>
                    </FormSection>

                    <div className="bg-primary/5 rounded-sm p-6 border border-primary/10">
                        <h3 className="text-[12px] font-black uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                            <AlertTriangle size={14} />
                            Diretriz Operacional
                        </h3>
                        <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                            Ao iniciar uma manutenção (Status: Em Andamento), o veículo ficará indisponível para novas viagens até a conclusão do serviço.
                        </p>
                    </div>
                </div>
            </form>
        </div >
    );
};
