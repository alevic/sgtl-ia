import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, Edit, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { ITransacao, StatusTransacao } from '../../types';

interface TransactionActionsProps {
    transacao: ITransacao;
    onUpdate: () => void;
}

export const TransactionActions: React.FC<TransactionActionsProps> = ({ transacao, onUpdate }) => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm('Tem certeza que deseja excluir esta transação?')) return;

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
            setIsOpen(false);
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
        } finally {
            setIsOpen(false);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"
            >
                <MoreVertical size={20} />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 py-1 z-20 animate-in fade-in slide-in-from-top-2">
                        <button
                            onClick={() => navigate('/admin/financeiro/transacoes/nova', { state: transacao })}
                            className="w-full px-4 py-2 text-left text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                        >
                            <Edit size={16} /> Editar
                        </button>

                        <div className="my-1 border-t border-slate-100 dark:border-slate-700"></div>

                        <div className="px-4 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Alterar Status
                        </div>

                        {transacao.status !== StatusTransacao.PAGA && (
                            <button
                                onClick={() => handleStatusChange(StatusTransacao.PAGA)}
                                className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-2"
                            >
                                <CheckCircle size={16} /> Marcar como Paga
                            </button>
                        )}

                        {transacao.status !== StatusTransacao.PENDENTE && (
                            <button
                                onClick={() => handleStatusChange(StatusTransacao.PENDENTE)}
                                className="w-full px-4 py-2 text-left text-sm text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 flex items-center gap-2"
                            >
                                <Clock size={16} /> Marcar como Pendente
                            </button>
                        )}

                        <div className="my-1 border-t border-slate-100 dark:border-slate-700"></div>

                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                        >
                            <Trash2 size={16} /> {isDeleting ? 'Excluindo...' : 'Excluir'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};
