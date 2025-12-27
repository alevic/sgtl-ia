import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, CheckCircle, Clock } from 'lucide-react';
import { ITransacao, StatusTransacao } from '../../types';
import { ResponsiveActions, ActionGroup } from '../Common/ResponsiveActions';

interface TransactionActionsProps {
    transacao: ITransacao;
    onUpdate: () => void;
}

export const TransactionActions: React.FC<TransactionActionsProps> = ({ transacao, onUpdate }) => {
    const navigate = useNavigate();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/finance/transactions/${transacao.id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Falha ao excluir');
            onUpdate();
        } catch (error) {
            console.error("Erro ao excluir:", error);
            alert("Erro ao excluir transação");
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleStatusChange = async (newStatus: StatusTransacao) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/finance/transactions/${transacao.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...transacao, status: newStatus }),
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Falha ao atualizar status');
            onUpdate();
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
            alert("Erro ao atualizar status");
        }
    };

    const actionGroups: ActionGroup[] = [
        {
            actions: [
                {
                    icon: Edit,
                    label: 'Editar',
                    onClick: () => navigate('/admin/financeiro/transacoes/nova', { state: transacao }),
                    color: 'slate'
                }
            ]
        },
        {
            label: 'Alterar Status',
            actions: [
                {
                    icon: CheckCircle,
                    label: 'Marcar como Paga',
                    onClick: () => handleStatusChange(StatusTransacao.PAGA),
                    color: 'green',
                    hidden: transacao.status === StatusTransacao.PAGA
                },
                {
                    icon: Clock,
                    label: 'Marcar como Pendente',
                    onClick: () => handleStatusChange(StatusTransacao.PENDENTE),
                    color: 'yellow',
                    hidden: transacao.status === StatusTransacao.PENDENTE
                }
            ]
        },
        {
            actions: [
                {
                    icon: Trash2,
                    label: isDeleting ? 'Excluindo...' : 'Excluir',
                    onClick: () => setShowDeleteConfirm(true),
                    color: 'red'
                }
            ]
        }
    ];

    return (
        <>
            <ResponsiveActions actions={actionGroups} />

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                            Confirmar Exclusão
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            Tem certeza que deseja excluir esta transação de <strong>R$ {Number(transacao.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>?
                            Esta ação não pode ser desfeita.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isDeleting}
                                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                <Trash2 size={16} />
                                {isDeleting ? 'Excluindo...' : 'Excluir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
