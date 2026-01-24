import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Plus, Search, Trash2, Shield, Mail, Calendar, Edit, Key, X } from 'lucide-react';
import { authClient } from '../lib/auth-client';
import { UserRole } from '../types';
import { PageHeader } from '../components/Layout/PageHeader';
import { ListFilterSection } from '../components/Layout/ListFilterSection';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
    const config = {
        [UserRole.ADMIN]: { label: 'ADMINISTRADOR', color: 'purple' },
        [UserRole.FINANCEIRO]: { label: 'FINANCEIRO', color: 'green' },
        [UserRole.OPERACIONAL]: { label: 'OPERACIONAL', color: 'orange' },
        [UserRole.USER]: { label: 'USUÁRIO', color: 'blue' },
    };

    const { label, color } = config[role as UserRole] || config[UserRole.USER];

    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[9px] font-black tracking-widest border-none",
            color === 'purple' ? "bg-purple-100 text-purple-700" :
                color === 'green' ? "bg-emerald-100 text-emerald-700" :
                    color === 'orange' ? "bg-amber-100 text-amber-700" :
                        "bg-blue-100 text-blue-700"
        )}>
            <Shield size={10} strokeWidth={3} />
            {label}
        </span>
    );
};

export const Usuarios: React.FC = () => {
    // ... existing code ...

    const navigate = useNavigate();
    const [users, setUsers] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [busca, setBusca] = useState('');
    const [resetPasswordUser, setResetPasswordUser] = useState<any>(null);
    const [newPassword, setNewPassword] = useState('');
    const [isResetting, setIsResetting] = useState(false);

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        fetchUsers();
    }, []);

    const handleDelete = async (userId: string) => {
        if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${userId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                fetchUsers();
            } else {
                alert('Erro ao excluir usuário');
            }
        } catch (error) {
            console.error('Failed to delete user:', error);
            alert('Erro ao excluir usuário');
        }
    };

    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 8) {
            alert('A senha deve ter no mínimo 8 caracteres');
            return;
        }

        setIsResetting(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${resetPasswordUser.id}/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ newPassword }),
            });

            if (response.ok) {
                alert(`Senha redefinida com sucesso para ${resetPasswordUser.name}`);
                setResetPasswordUser(null);
                setNewPassword('');
            } else {
                const data = await response.json();
                alert(data.error || 'Erro ao redefinir senha');
            }
        } catch (error) {
            console.error('Failed to reset password:', error);
            alert('Erro ao redefinir senha');
        } finally {
            setIsResetting(false);
        }
    };

    const usersFiltrados = users.filter(user =>
        user.name?.toLowerCase().includes(busca.toLowerCase()) ||
        user.email?.toLowerCase().includes(busca.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Module */}
            <PageHeader
                title="Gestão de Usuários"
                subtitle="Administração de acesso, permissões e segurança do sistema"
                icon={User}
                rightElement={
                    <Button
                        onClick={() => navigate('/admin/usuarios/novo')}
                        className="h-14 px-8 rounded-xl bg-primary text-primary-foreground font-black uppercase text-[12px] tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus size={20} className="mr-2" strokeWidth={3} />
                        NOVO USUÁRIO
                    </Button>
                }
            />

            {/* Filters Module */}
            <ListFilterSection>
                <div className="relative flex-1 group">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Buscar usuários por nome ou email..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        className="pl-12 h-14 bg-muted/40 border-input rounded-xl font-bold transition-all focus-visible:ring-2 focus-visible:ring-primary/20"
                    />
                </div>
            </ListFilterSection>

            {/* Lista de Usuários (Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                    <div className="col-span-full p-12 text-center text-slate-500">Carregando usuários...</div>
                ) : usersFiltrados.length === 0 ? (
                    <div className="col-span-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                        <User size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">Nenhum usuário encontrado</p>
                    </div>
                ) : (
                    usersFiltrados.map((user) => (
                        <div
                            key={user.id}
                            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 hover:shadow-md transition-all hover:border-blue-300 dark:hover:border-blue-700 flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl shadow-lg shadow-primary/5">
                                            {user.name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-foreground tracking-tight leading-tight">{user.name || 'Sem nome'}</h3>
                                            <div className="mt-1">
                                                <RoleBadge role={user.role} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                        <Mail size={16} className="text-slate-400" />
                                        <span className="text-sm truncate">{user.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                        <Calendar size={16} className="text-slate-400" />
                                        <span className="text-sm">
                                            Membro desde {new Date(user.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-5 border-t border-border/40">
                                <Button
                                    onClick={() => navigate(`/admin/usuarios/${user.id}/editar`)}
                                    variant="outline"
                                    className="flex-1 h-11 bg-muted/20 hover:bg-primary/10 hover:text-primary rounded-xl font-bold transition-all border-none"
                                >
                                    <Edit size={16} className="mr-2" />
                                    EDITAR
                                </Button>
                                <Button
                                    onClick={() => setResetPasswordUser(user)}
                                    variant="outline"
                                    className="w-11 h-11 p-0 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 rounded-xl transition-all border-none"
                                    title="Redefinir Senha"
                                >
                                    <Key size={16} />
                                </Button>
                                <Button
                                    onClick={() => handleDelete(user.id)}
                                    variant="outline"
                                    className="w-11 h-11 p-0 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-xl transition-all border-none"
                                    title="Excluir Usuário"
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal de Redefinir Senha */}
            {resetPasswordUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                    <Key className="text-orange-600 dark:text-orange-400" size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Redefinir Senha</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{resetPasswordUser.name}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setResetPasswordUser(null);
                                    setNewPassword('');
                                }}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Nova Senha <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all dark:text-white"
                                    placeholder="Mínimo 8 caracteres"
                                    minLength={8}
                                />
                                <p className="text-xs text-slate-500 mt-1">A senha deve ter no mínimo 8 caracteres</p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => {
                                        setResetPasswordUser(null);
                                        setNewPassword('');
                                    }}
                                    className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleResetPassword}
                                    disabled={isResetting || !newPassword || newPassword.length < 8}
                                    className="flex-1 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isResetting ? 'Redefinindo...' : 'Redefinir Senha'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
