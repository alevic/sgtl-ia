import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IManutencao } from '../../types';
import { Edit, Trash2 } from 'lucide-react';
import { ResponsiveActions, ActionItem } from '../Common/ResponsiveActions';

interface MaintenanceActionsProps {
    manutencao: IManutencao;
    onDelete: (id: string) => void;
}

export const MaintenanceActions: React.FC<MaintenanceActionsProps> = ({ manutencao, onDelete }) => {
    const navigate = useNavigate();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/maintenance/${manutencao.id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Falha ao excluir');
            onDelete(manutencao.id);
        } catch (error) {
            console.error("Erro ao excluir:", error);
            alert("Erro ao excluir manutenção");
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const actions: ActionItem[] = [
        {
            icon: Edit,
            label: 'Editar',
            onClick: () => navigate(`/admin/manutencao/${manutencao.id}/editar`),
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
                            Tem certeza que deseja excluir esta manutenção?
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
