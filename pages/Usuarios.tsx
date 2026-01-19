import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Plus, Search, Trash2, Shield, Mail, Calendar, Edit, Key, X } from 'lucide-react';
import { authClient } from '../lib/auth-client';
import { UserRole } from '../types';

const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
    const config = {
        [UserRole.ADMIN]: { label: 'Administrador', color: 'purple' },
        [UserRole.FINANCEIRO]: { label: 'Financeiro', color: 'green' },
        [UserRole.OPERACIONAL]: { label: 'Operacional', color: 'orange' },
        [UserRole.USER]: { label: 'Usuário', color: 'blue' },
    };

    const { label, color } = config[role as UserRole] || config[UserRole.USER];

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-${color}-100 text-${color}-700 dark:bg-${color}-900/30 dark:text-${color}-400`}>
            <Shield size={10} />
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
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Gerenciar Usuários</h1>
                    <p className="text-slate-500 dark:text-slate-400">Administração de acesso e permissões</p>
                </div>
                <button
                    onClick={() => navigate('/admin/usuarios/novo')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center gap-2 transition-colors shadow-sm shadow-blue-600/20"
                >
                    <Plus size={20} />
                    Novo Usuário
                </button>
            </div>

            {/* Filtros */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou email..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>

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
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                            {user.name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{user.name || 'Sem nome'}</h3>
                                            <RoleBadge role={user.role} />
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

                            <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                                <button
                                    onClick={() => navigate(`/admin/usuarios/${user.id}/editar`)}
                                    className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <Edit size={16} />
                                    Editar
                                </button>
                                <button
                                    onClick={() => setResetPasswordUser(user)}
                                    className="px-3 py-2 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                                    title="Redefinir Senha"
                                >
                                    <Key size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(user.id)}
                                    className="px-3 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                                    title="Excluir Usuário"
                                >
                                    <Trash2 size={16} />
                                </button>
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
