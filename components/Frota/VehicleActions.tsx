import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IVeiculo } from '../../types';
import { Edit, Trash2, MoreVertical } from 'lucide-react';

interface VehicleActionsProps {
    veiculo: IVeiculo & { km_atual?: number; ano?: number };
    onUpdate?: () => void;
}

export const VehicleActions: React.FC<VehicleActionsProps> = ({ veiculo, onUpdate }) => {
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleEdit = () => {
        navigate(`/admin/frota/${veiculo.id}/editar`);
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/fleet/vehicles/${veiculo.id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to delete vehicle');
            }

            if (onUpdate) {
                onUpdate();
            }
        } catch (error) {
            console.error("Erro ao excluir veículo:", error);
            alert('Erro ao excluir veículo. Por favor, tente novamente.');
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
            setShowMenu(false);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
                <MoreVertical size={18} className="text-slate-600 dark:text-slate-400" />
            </button>

            {showMenu && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-20">
                        <button
                            onClick={handleEdit}
                            className="w-full px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-300 rounded-t-lg transition-colors"
                        >
                            <Edit size={16} />
                            Editar
                        </button>
                        <button
                            onClick={() => {
                                setShowDeleteConfirm(true);
                                setShowMenu(false);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 text-red-600 dark:text-red-400 rounded-b-lg transition-colors"
                        >
                            <Trash2 size={16} />
                            Excluir
                        </button>
                    </div>
                </>
            )}

            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                            Confirmar Exclusão
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            Tem certeza que deseja excluir o veículo <strong>{veiculo.placa}</strong>?
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
        </div>
    );
};
