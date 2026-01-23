import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { UserForm } from '../components/User/UserForm';

export const NovoUsuario: React.FC = () => {
    const navigate = useNavigate();

    const handleSubmit = async (data: any) => {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users`, {
            method: 'POST',
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
            throw new Error(errorData.error || 'Erro ao criar usuário');
        }
    };

    return (
        <div key="novo-usuario-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Header Executivo */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <button
                        onClick={() => navigate('/admin/usuarios')}
                        className="group flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                        <span className="text-[12px] font-black uppercase tracking-widest">Painel Administrativo</span>
                    </button>
                    <div>
                        <h1 className="text-4xl font-black text-foreground tracking-tight">
                            NOVO <span className="text-primary italic">OPERADOR</span>
                        </h1>
                        <p className="text-muted-foreground font-medium mt-1">
                            Credenciamento de novos usuários e definição de protocolos de acesso
                        </p>
                    </div>
                </div>
            </div>

            <UserForm
                mode="create"
                onSubmit={handleSubmit}
                onCancel={() => navigate('/admin/usuarios')}
                showAvatar={true}
                showPassword={true}
                showRole={true}
                showNotes={true}
                showIsActive={true}
            />
        </div>
    );
};
