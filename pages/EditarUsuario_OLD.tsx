import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { UserProfileForm } from '../components/User/UserProfileForm';

export const EditarUsuario: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const handleSave = async (data: any) => {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(data),
        });

        if (response.ok) {
            navigate('/admin/usuarios');
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao atualizar usuário');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/usuarios')}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Editar Usuário</h1>
                    <p className="text-slate-500 dark:text-slate-400">Atualize as informações do usuário</p>
                </div>
            </div>

            <div className="max-w-4xl">
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
                    <UserProfileForm
                        userId={id!}
                        onSave={handleSave}
                        showAvatar={true}
                        canEditRole={true}
                        canEditUsername={false}
                        showNotes={true}
                        showIsActive={true}
                    />
                </div>
            </div>
        </div>
    );
};
