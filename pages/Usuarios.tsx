import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Plus, Search, Trash2, Shield, Mail, Calendar, Edit } from 'lucide-react';
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

    const fetchUsers = async () => {
        try {
            const response = await fetch('http://localhost:4000/api/users', {
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
            const response = await fetch(`http://localhost:4000/api/users/${userId}`, {
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
                                    onClick={() => navigate(`/admin/usuarios/${user.id}`)}
                                    className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <Edit size={16} />
                                    Editar
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
        </div>
    );
};
