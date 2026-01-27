import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { ICliente } from '../../types';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { clientsService } from '../../services/clientsService';
import { ResponsiveActions, ActionItem } from '../Common/ResponsiveActions';

interface ClientActionsProps {
    cliente: ICliente;
    onUpdate?: () => void;
}

export const ClientActions: React.FC<ClientActionsProps> = ({ cliente, onUpdate }) => {
    const navigate = useNavigate();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await clientsService.delete(cliente.id);
            if (onUpdate) {
                onUpdate();
            }
        } catch (error) {
            console.error("Erro ao excluir cliente:", error);
            alert('Erro ao excluir cliente. Por favor, tente novamente.');
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const actions: ActionItem[] = [
        {
            icon: Eye,
            label: 'Ver Detalhes',
            onClick: () => navigate(`/admin/clientes/${cliente.id}`),
            color: 'blue'
        },
        {
            icon: Edit,
            label: 'Editar',
            onClick: () => navigate(`/admin/clientes/${cliente.id}/editar`),
            color: 'slate'
        },
        {
            icon: Trash2,
            label: 'Excluir',
            onClick: () => setShowDeleteConfirm(true),
            color: 'red'
        }
    ];

    return (
        <>
            <ResponsiveActions actions={actions} />

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                            Confirmar Exclusão
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            Tem certeza que deseja excluir o cliente <strong>{cliente.nome}</strong>?
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
