import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IReserva, StatusReservaLabel } from '../types';
import { reservationsService } from '../services/reservationsService';
import { transactionsService } from '../services/transactionsService';
import { clientsService } from '../services/clientsService';
import { TipoTransacao, StatusTransacao, CategoriaReceita, CategoriaDespesa } from '../types';
import {
    Ticket, User, Bus, Calendar, DollarSign, Filter, Plus, Search, Loader,
    Edit, Trash2, XCircle, RefreshCw, MoreVertical, X, Save, AlertTriangle,
    UserCheck, CheckCircle, ChevronDown, Check
} from 'lucide-react';

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const configs: any = {
        PENDENTE: { color: 'yellow', label: StatusReservaLabel.PENDING },
        PENDING: { color: 'yellow', label: StatusReservaLabel.PENDING },
        CONFIRMADA: { color: 'green', label: StatusReservaLabel.CONFIRMED },
        CONFIRMED: { color: 'green', label: StatusReservaLabel.CONFIRMED },
        CANCELADA: { color: 'red', label: StatusReservaLabel.CANCELLED },
        CANCELLED: { color: 'red', label: StatusReservaLabel.CANCELLED },
        UTILIZADA: { color: 'blue', label: StatusReservaLabel.USED },
        USED: { color: 'blue', label: StatusReservaLabel.USED },
        COMPLETED: { color: 'blue', label: StatusReservaLabel.USED },
        CHECKED_IN: { color: 'indigo', label: StatusReservaLabel.CHECKED_IN },
        EMBARCADO: { color: 'indigo', label: StatusReservaLabel.CHECKED_IN },
        NO_SHOW: { color: 'gray', label: StatusReservaLabel.NO_SHOW }
    };

    const config = configs[status] || configs['PENDENTE'];

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-${config.color}-100 dark:bg-${config.color}-900/30 text-${config.color}-700 dark:text-${config.color}-300`}>
            {config.label}
        </span>
    );
};

export const Reservas: React.FC = () => {
    const [reservas, setReservas] = useState<IReserva[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtroStatus, setFiltroStatus] = useState<string[]>(['PENDING', 'CONFIRMED']);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const [busca, setBusca] = useState('');

    // Action States
    const [editingReserva, setEditingReserva] = useState<IReserva | null>(null);
    const [cancelingReserva, setCancelingReserva] = useState<IReserva | null>(null);
    const [paymentReserva, setPaymentReserva] = useState<IReserva | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Cancel Form State
    const [cancelReason, setCancelReason] = useState('');
    const [refundAction, setRefundAction] = useState<'NONE' | 'REFUND' | 'CREDIT'>('NONE');

    // Payment Form State
    const [paymentMethod, setPaymentMethod] = useState<'DINHEIRO' | 'CARTAO' | 'PIX' | 'BOLETO'>('PIX');
    const [amountToPay, setAmountToPay] = useState<string>('');

    // Edit Form State
    const [editForm, setEditForm] = useState({
        passenger_name: '',
        passenger_document: '',
        passenger_email: '',
        passenger_phone: ''
    });

    const navigate = useNavigate();

    const fetchReservas = async () => {
        try {
            setLoading(true);
            const data = await reservationsService.getAll();
            setReservas(data);
        } catch (error) {
            console.error('Erro ao carregar reservas:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReservas();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsStatusDropdownOpen(false);
            }
        };

        if (isStatusDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isStatusDropdownOpen]);

    const handleEditClick = (reserva: IReserva) => {
        setEditingReserva(reserva);
        setEditForm({
            passenger_name: (reserva as any).passenger_name || '',
            passenger_document: (reserva as any).passenger_document || '',
            passenger_email: (reserva as any).passenger_email || '',
            passenger_phone: (reserva as any).passenger_phone || ''
        });
    };

    const handleSaveEdit = async () => {
        if (!editingReserva) return;
        try {
            setActionLoading(true);
            await reservationsService.update(editingReserva.id, editForm);
            alert('Reserva atualizada com sucesso!');
            setEditingReserva(null);
            fetchReservas();
        } catch (error) {
            console.error('Erro ao atualizar reserva:', error);
            alert('Erro ao atualizar reserva.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelClick = (reserva: IReserva) => {
        setCancelingReserva(reserva);
        setCancelReason('');
        // Default to REFUND if paid, NONE if not
        const amountPaid = Number(reserva.amount_paid || reserva.valor_pago || 0);
        setRefundAction(amountPaid > 0 ? 'REFUND' : 'NONE');
    };

    const handleConfirmCancel = async () => {
        if (!cancelingReserva) return;
        try {
            setActionLoading(true);
            const amountPaid = Number(cancelingReserva.amount_paid || cancelingReserva.valor_pago || 0);

            // 1. Process Financial Action
            if (refundAction === 'REFUND' && amountPaid > 0) {
                await transactionsService.create({
                    tipo: TipoTransacao.DESPESA,
                    descricao: `Reembolso Reserva ${cancelingReserva.ticket_code || cancelingReserva.codigo} - ${cancelingReserva.passenger_name}`,
                    valor: amountPaid,
                    moeda: cancelingReserva.moeda || 'BRL',
                    data_emissao: new Date().toISOString(),
                    data_vencimento: new Date().toISOString(),
                    data_pagamento: new Date().toISOString(),
                    status: StatusTransacao.PAGA,
                    categoria_despesa: CategoriaDespesa.OUTROS, // Could be specialized category
                    reserva_id: cancelingReserva.id,
                    criado_por: 'Sistema',
                    observacoes: `Motivo cancelamento: ${cancelReason}`
                });
            } else if (refundAction === 'CREDIT' && amountPaid > 0) {
                // Determine Client ID - check common fields
                let clientId = (cancelingReserva as any).client_id || cancelingReserva.cliente_id;

                // Fallback: Try to find client by Document or Email if not linked
                if (!clientId) {
                    const doc = (cancelingReserva as any).passenger_document || (cancelingReserva as any).passenger_cpf;
                    const email = (cancelingReserva as any).passenger_email;

                    if (doc || email) {
                        try {
                            // Search by document first
                            if (doc) {
                                const cleanDoc = doc.replace(/\D/g, '');
                                const searchRes = await clientsService.getAll(doc);
                                const match = searchRes.find((c: any) => {
                                    const cDoc = (c.documento_numero || '').replace(/\D/g, '');
                                    const cCpf = (c.cpf || '').replace(/\D/g, '');
                                    const cCnpj = (c.cnpj || '').replace(/\D/g, '');
                                    return (cDoc && cDoc === cleanDoc) || (cCpf && cCpf === cleanDoc) || (cCnpj && cCnpj === cleanDoc);
                                });
                                if (match) clientId = match.id;
                            }
                            // If not found, try email
                            if (!clientId && email) {
                                const searchRes = await clientsService.getAll(email);
                                const match = searchRes.find((c: any) => c.email && c.email.toLowerCase() === email.toLowerCase());
                                if (match) clientId = match.id;
                            }
                        } catch (err) {
                            console.warn('Erro ao buscar cliente para vinculo:', err);
                        }
                    }
                }

                if (clientId) {
                    // Fetch client to get current balance
                    try {
                        const clientData = await clientsService.getById(clientId);
                        const currentCredit = Number(clientData.saldo_creditos || 0);
                        await clientsService.update(clientId, {
                            saldo_creditos: currentCredit + amountPaid
                        });
                        // Optional: Log this credit update somewhere if detailed history is needed
                    } catch (err) {
                        console.error('Erro ao buscar cliente para crédito:', err);
                        alert('Aviso: Não foi possível localizar o cadastro do cliente para gerar o crédito automaticaente.');
                    }
                } else {
                    alert('Aviso: Cliente não identificado na reserva. O crédito não pode ser gerado automaticamente.');
                }
            }

            // 2. Update Reservation Status
            await reservationsService.update(cancelingReserva.id, {
                status: 'CANCELLED',
                observacoes: cancelingReserva.observacoes
                    ? `${cancelingReserva.observacoes}\n[Cancelamento]: ${cancelReason}`
                    : `[Cancelamento]: ${cancelReason}`
            });

            alert('Reserva cancelada com sucesso!');
            setCancelingReserva(null);
            fetchReservas();
        } catch (error) {
            console.error('Erro ao cancelar reserva:', error);
            alert('Erro ao cancelar reserva.');
        } finally {
            setActionLoading(false);
        }
    };



    const handlePaymentClick = (reserva: IReserva) => {
        setPaymentReserva(reserva);
        setPaymentMethod('PIX'); // Default
        const pending = Math.max(0, Number(reserva.valor_total || reserva.price || 0) - Number(reserva.amount_paid || reserva.valor_pago || 0));
        setAmountToPay(pending.toFixed(2));
    };

    const handleConfirmPayment = async () => {
        if (!paymentReserva || !amountToPay) return;
        const paidAmount = Number(amountToPay.replace(',', '.'));

        if (isNaN(paidAmount) || paidAmount <= 0) {
            alert('Por favor, insira um valor válido.');
            return;
        }

        try {
            setActionLoading(true);

            // 1. Create Financial Transaction (Revenue)
            await transactionsService.create({
                tipo: TipoTransacao.RECEITA,
                descricao: `Pagamento Reserva ${paymentReserva.ticket_code || paymentReserva.codigo} - ${paymentReserva.passenger_name}`,
                valor: paidAmount,
                moeda: paymentReserva.moeda || 'BRL',
                data_emissao: new Date().toISOString(),
                data_vencimento: new Date().toISOString(),
                data_pagamento: new Date().toISOString(),
                status: StatusTransacao.PAGA,
                forma_pagamento: paymentMethod,
                categoria_receita: CategoriaReceita.VENDA_PASSAGEM,
                reserva_id: paymentReserva.id,
                criado_por: 'Sistema' // Should ideally be user ID
            });

            // 2. Update Reservation
            const currentTotalPaid = Number(paymentReserva.amount_paid || paymentReserva.valor_pago || 0) + paidAmount;
            const totalPrice = Number(paymentReserva.valor_total || paymentReserva.price || 0);

            // Auto-confirm if paid >= total, otherwise just update amount
            const newStatus = (currentTotalPaid >= totalPrice && totalPrice > 0) ? 'CONFIRMED' : paymentReserva.status;

            // Updated payload to match backend expectations
            await reservationsService.update(paymentReserva.id, {
                status: newStatus,
                forma_pagamento: paymentMethod,
                valor_pago: currentTotalPaid, // Legacy/Frontend field
                amount_paid: currentTotalPaid // Backend field
            });

            alert('Pagamento registrado com sucesso!');
            setPaymentReserva(null);
            fetchReservas();
        } catch (error) {
            console.error('Erro ao registrar pagamento:', error);
            alert('Erro ao registrar pagamento.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleTransferClick = (reserva: IReserva) => {
        // Placeholder for transfer functionality
        // In a real implementation, this would open a similar flow to NovaReserva but pre-filled
        alert('Funcionalidade de transferência: Em breve você poderá alterar a viagem ou assento.');
    };

    const handleStatusChange = async (reserva: IReserva, newStatus: string) => {
        const label = newStatus === 'CHECKED_IN' ? 'EMBARCADO' : 'UTILIZADA';
        if (!confirm(`Confirma a alteração do status para ${label}?`)) return;

        try {
            setActionLoading(true);
            await reservationsService.update(reserva.id, { status: newStatus });
            // alert('Status atualizado com sucesso!'); // Optional: reduce noise
            fetchReservas();
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            alert('Erro ao atualizar status.');
        } finally {
            setActionLoading(false);
        }
    };

    const toggleStatus = (status: string) => {
        setFiltroStatus(prev =>
            prev.includes(status)
                ? prev.filter(s => s !== status)
                : [...prev, status]
        );
    };

    const statusOptions = [
        { value: 'PENDING', label: 'Pendente' },
        { value: 'CONFIRMED', label: 'Confirmada' },
        { value: 'CHECKED_IN', label: 'Embarcado' },
        { value: 'USED', label: 'Utilizada' },
        { value: 'NO_SHOW', label: 'Não Compareceu' },
        { value: 'CANCELLED', label: 'Cancelada' },
    ];

    const reservasFiltradas = reservas.filter(r => {
        const matchStatus = filtroStatus.length === 0 || filtroStatus.includes(r.status);
        const passengerName = (r as any).passenger_name || '';
        const ticketCode = (r as any).ticket_code || r.codigo || '';

        const matchBusca = busca === '' ||
            ticketCode.toLowerCase().includes(busca.toLowerCase()) ||
            passengerName.toLowerCase().includes(busca.toLowerCase());
        return matchStatus && matchBusca;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Gerenciamento de Reservas</h1>
                    <p className="text-slate-500 dark:text-slate-400">Gestão de reservas de passagens</p>
                </div>
                <Link
                    to="/admin/reservas/nova"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                    <Plus size={18} />
                    Nova Reserva
                </Link>
            </div>

            {/* Filtros */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar por código ou nome do passageiro..."
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 flex-wrap items-center">
                        <div className="flex items-center gap-2 relative" ref={dropdownRef}>
                            <Filter size={18} className="text-slate-500" />
                            <div className="relative">
                                <button
                                    type="button"
                                    className="flex items-center justify-between min-w-[200px] px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 text-left text-sm"
                                    onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                                >
                                    <span className="truncate">
                                        {filtroStatus.length === 0
                                            ? 'Todos os status'
                                            : `${filtroStatus.length} selecionado(s)`}
                                    </span>
                                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isStatusDropdownOpen && (
                                    <div className="absolute top-full left-0 mt-1 w-[220px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
                                        <div className="p-2 space-y-1">
                                            <button
                                                onClick={() => {
                                                    setFiltroStatus([]);
                                                    setIsStatusDropdownOpen(false);
                                                }}
                                                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${filtroStatus.length === 0 ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'}`}
                                            >
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${filtroStatus.length === 0 ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-slate-600'}`}>
                                                    {filtroStatus.length === 0 && <Check size={12} className="text-white" />}
                                                </div>
                                                Todos os status
                                            </button>
                                            <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
                                            {statusOptions.map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => toggleStatus(option.value)}
                                                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${filtroStatus.includes(option.value) ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'}`}
                                                >
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${filtroStatus.includes(option.value) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-slate-600'}`}>
                                                        {filtroStatus.includes(option.value) && <Check size={12} className="text-white" />}
                                                    </div>
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lista de Reservas */}
            <div className="grid gap-4">
                {reservasFiltradas.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                        <Ticket size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">Nenhuma reserva encontrada</p>
                    </div>
                ) : (
                    reservasFiltradas.map((reserva: any) => {
                        const isCancelled = reserva.status === 'CANCELLED' || reserva.status === 'CANCELADA';

                        return (
                            <div key={reserva.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-md transition-all group">
                                <div className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            {/* Header: Código, Status e Valor */}
                                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                                        <Ticket size={20} className="text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                                                        {reserva.ticket_code || reserva.codigo}
                                                    </h3>
                                                </div>
                                                <StatusBadge status={reserva.status} />

                                                {/* Digital Pending Confirmation Badge */}
                                                {reserva.status === 'PENDING' && (reserva.payment_method === 'DIGITAL' || (reserva as any).forma_pagamento === 'DIGITAL') && (
                                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                                                        Aguardando Confirmação (Digital)
                                                    </span>
                                                )}

                                                <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md">
                                                    <DollarSign size={14} />
                                                    <span>R$ {Number(reserva.valor_total || reserva.price || 0).toFixed(2)}</span>
                                                </div>
                                                {/* Pending Amount Display */}
                                                {(Number(reserva.valor_total || reserva.price || 0) - Number(reserva.amount_paid || reserva.valor_pago || 0)) > 0.01 && (
                                                    <div className="flex items-center gap-1 text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md" title="Valor Pendente">
                                                        <DollarSign size={14} />
                                                        <span>Pendente: R$ {Math.max(0, Number(reserva.valor_total || reserva.price || 0) - Number(reserva.amount_paid || reserva.valor_pago || 0)).toFixed(2)}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Informações detalhadas */}
                                            <div className="space-y-2">
                                                {/* Passageiro */}
                                                <div className="flex items-center gap-2.5 text-sm">
                                                    <User size={16} className="text-slate-400 shrink-0" />
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                                        {reserva.passenger_name}
                                                    </span>
                                                    <span className="text-slate-400">•</span>
                                                    <span className="text-slate-500 dark:text-slate-400">
                                                        Reservado em {new Date(reserva.created_at || reserva.data_reserva).toLocaleDateString('pt-BR')} às {new Date(reserva.created_at || reserva.data_reserva).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>

                                                {/* Viagem */}
                                                <div className="flex items-center gap-2.5 text-sm">
                                                    <Bus size={16} className="text-slate-400 shrink-0" />
                                                    <span className="text-slate-600 dark:text-slate-400">
                                                        {reserva.trip_title || reserva.route_name || 'Viagem sem título'}
                                                    </span>
                                                </div>

                                                {/* Data e Assento */}
                                                <div className="flex flex-wrap items-center gap-4 text-sm mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                        <Calendar size={16} className="text-slate-400" />
                                                        <span>
                                                            Partida: {reserva.departure_date ? new Date(reserva.departure_date).toLocaleDateString('pt-BR') : '--'}
                                                            {' '}às{' '}
                                                            {reserva.departure_time || '--'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded text-slate-700 dark:text-slate-300 font-medium">
                                                        <span className="text-xs">Assento</span>
                                                        <span className="text-sm font-bold">{reserva.seat_number || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Ações (Top-Right) */}
                                        <div className="flex items-center gap-2 ml-4">
                                            {/* Check-in Button */}
                                            {/* Allow Check-in if CONFIRMED OR (PENDING and has paid something) */}
                                            {((reserva.status === 'CONFIRMED') ||
                                                (reserva.status === 'PENDING' && Number(reserva.amount_paid || reserva.valor_pago || 0) > 0)) && (
                                                    <button
                                                        onClick={() => handleStatusChange(reserva, 'CHECKED_IN')}
                                                        className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                                                        title="Realizar Check-in (Embarque)"
                                                        disabled={actionLoading}
                                                    >
                                                        <UserCheck size={18} className="text-indigo-600 dark:text-indigo-400" />
                                                    </button>
                                                )}

                                            {/* Finalize Button */}
                                            {reserva.status === 'CHECKED_IN' && (
                                                <button
                                                    onClick={() => handleStatusChange(reserva, 'USED')}
                                                    className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30 hover:bg-teal-200 dark:hover:bg-teal-900/50 transition-colors"
                                                    title="Finalizar Viagem (Utilizada)"
                                                    disabled={actionLoading}
                                                >
                                                    <CheckCircle size={18} className="text-teal-600 dark:text-teal-400" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleEditClick(reserva)}
                                                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                                title="Editar"
                                            >
                                                <Edit size={18} className="text-slate-600 dark:text-slate-400" />
                                            </button>
                                            <button
                                                onClick={() => handleTransferClick(reserva)}
                                                className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
                                                title="Transferir / Trocar Assento"
                                                disabled={isCancelled}
                                            >
                                                <RefreshCw size={18} className={`text-orange-600 dark:text-orange-400 ${isCancelled ? 'opacity-50' : ''}`} />
                                            </button>
                                            {!isCancelled && (
                                                <button
                                                    onClick={() => handleCancelClick(reserva)}
                                                    className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                                    title="Cancelar"
                                                >
                                                    <XCircle size={18} className="text-red-600 dark:text-red-400" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handlePaymentClick(reserva)}
                                                className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                                                title="Realizar Pagamento"
                                                disabled={isCancelled}
                                            >
                                                <DollarSign size={18} className={`text-green-600 dark:text-green-400 ${isCancelled ? 'opacity-50' : ''}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Edit Modal */}
            {editingReserva && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Editar Reserva</h3>
                            <button onClick={() => setEditingReserva(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do Passageiro</label>
                                <input
                                    type="text"
                                    value={editForm.passenger_name}
                                    onChange={e => setEditForm({ ...editForm, passenger_name: e.target.value })}
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Documento</label>
                                <input
                                    type="text"
                                    value={editForm.passenger_document}
                                    onChange={e => setEditForm({ ...editForm, passenger_document: e.target.value })}
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={editForm.passenger_email}
                                    onChange={e => setEditForm({ ...editForm, passenger_email: e.target.value })}
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefone</label>
                                <input
                                    type="tel"
                                    value={editForm.passenger_phone}
                                    onChange={e => setEditForm({ ...editForm, passenger_phone: e.target.value })}
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 p-6 border-t border-slate-100 dark:border-slate-700">
                            <button
                                onClick={() => setEditingReserva(null)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                {actionLoading ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
                                Salvar Alterações
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Confirmation Modal */}
            {/* Cancel Confirmation Modal */}
            {cancelingReserva && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="text-center mb-6">
                                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Cancelar Reserva?</h3>
                                <p className="text-slate-500 dark:text-slate-400">
                                    Esta ação não pode ser desfeita.
                                </p>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Motivo do Cancelamento
                                    </label>
                                    <textarea
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        placeholder="Informe o motivo..."
                                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white resize-none h-24 focus:ring-2 focus:ring-red-500 outline-none"
                                    />
                                </div>

                                {Number(cancelingReserva.amount_paid || cancelingReserva.valor_pago || 0) > 0 && (
                                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
                                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 block">
                                            Valor Pago: R$ {Number(cancelingReserva.amount_paid || cancelingReserva.valor_pago || 0).toFixed(2)}
                                        </p>
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="refundAction"
                                                    value="NONE"
                                                    checked={refundAction === 'NONE'}
                                                    onChange={(e) => setRefundAction(e.target.value as any)}
                                                    className="text-red-600 focus:ring-red-500"
                                                />
                                                <span className="text-sm text-slate-600 dark:text-slate-400">Nenhuma devolução (Multa/Retenção)</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="refundAction"
                                                    value="REFUND"
                                                    checked={refundAction === 'REFUND'}
                                                    onChange={(e) => setRefundAction(e.target.value as any)}
                                                    className="text-red-600 focus:ring-red-500"
                                                />
                                                <span className="text-sm text-slate-600 dark:text-slate-400">Devolver Dinheiro (Gerar Despesa)</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="refundAction"
                                                    value="CREDIT"
                                                    checked={refundAction === 'CREDIT'}
                                                    onChange={(e) => setRefundAction(e.target.value as any)}
                                                    className="text-red-600 focus:ring-red-500"
                                                />
                                                <span className="text-sm text-slate-600 dark:text-slate-400">Gerar Crédito para Cliente</span>
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setCancelingReserva(null)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirmCancel}
                                    disabled={actionLoading}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                >
                                    {actionLoading ? <Loader size={18} className="animate-spin" /> : 'Confirmar Cancelamento'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {/* Payment Modal */}
            {paymentReserva && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-sm w-full animate-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="bg-green-600 p-4 text-center">
                            <h3 className="text-lg font-bold text-white flex items-center justify-center gap-2">
                                <DollarSign size={24} />
                                Registrar Pagamento
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-3 gap-2 text-center mb-6">
                                <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
                                    <p className="font-semibold text-slate-700 dark:text-slate-300">R$ {Number(paymentReserva.valor_total || paymentReserva.price || 0).toFixed(2)}</p>
                                </div>
                                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <p className="text-xs text-green-600 dark:text-green-400">Já Pago</p>
                                    <p className="font-semibold text-green-700 dark:text-green-300">
                                        R$ {((paymentReserva.status === 'PENDING' && (paymentReserva.payment_method === 'DIGITAL' || (paymentReserva as any).forma_pagamento === 'DIGITAL'))
                                            ? 0
                                            : Number(paymentReserva.amount_paid || paymentReserva.valor_pago || 0)).toFixed(2)}
                                    </p>
                                </div>
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                                    <p className="text-xs text-blue-600 dark:text-blue-400 font-bold">Restante</p>
                                    <p className="font-bold text-blue-700 dark:text-blue-300">
                                        R$ {Number(Number(paymentReserva.valor_total || paymentReserva.price || 0) - ((paymentReserva.status === 'PENDING' && (paymentReserva.payment_method === 'DIGITAL' || (paymentReserva as any).forma_pagamento === 'DIGITAL'))
                                            ? 0
                                            : Number(paymentReserva.amount_paid || paymentReserva.valor_pago || 0))).toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 space-y-2 border border-slate-100 dark:border-slate-700">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">Passageiro:</span>
                                    <span className="font-medium text-slate-800 dark:text-white truncate max-w-[150px]">{paymentReserva.passenger_name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">Código:</span>
                                    <span className="font-mono text-slate-800 dark:text-white">{paymentReserva.ticket_code || paymentReserva.codigo}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Forma de Pagamento</label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                                    className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                                >
                                    <option value="PIX">Pix</option>
                                    <option value="DINHEIRO">Dinheiro</option>
                                    <option value="CARTAO">Cartão de Crédito/Débito</option>
                                    <option value="BOLETO">Boleto (Compensado)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Valor do Pagamento</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">R$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={amountToPay}
                                        onChange={(e) => setAmountToPay(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-green-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                            <button
                                onClick={() => setPaymentReserva(null)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmPayment}
                                disabled={actionLoading}
                                className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold transition-colors flex items-center gap-2 shadow-lg shadow-green-600/20"
                            >
                                {actionLoading ? <Loader size={18} className="animate-spin" /> : 'Confirmar Pagamento'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
