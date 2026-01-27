import React, { useState } from 'react';
import { Users, Trash2, Search, Loader2 } from 'lucide-react';
import { EmpresaContexto } from '../types';

interface TeamManagementProps {
    themeColor: string;
    context: EmpresaContexto;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({ themeColor, context }) => {
    const [members, setMembers] = useState<any[]>([]);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [newMemberRole, setNewMemberRole] = useState('user');
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Search State
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    const fetchMembers = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/organization/members`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setMembers(data);
            }
        } catch (err) {
            console.error('Failed to fetch members');
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        fetchMembers();
    }, [context]);

    // Debounce Search
    React.useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (newMemberEmail.length >= 2 && !newMemberEmail.includes('@')) { // Only search if not typing a full email manually yet
                setIsSearching(true);
                try {
                    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/organization/candidates?q=${newMemberEmail}`, {
                        credentials: 'include'
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setSearchResults(data);
                        setShowResults(true);
                    }
                } catch (error) {
                    console.error(error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
                setShowResults(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [newMemberEmail]);

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsAdding(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/organization/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email: newMemberEmail, role: newMemberRole }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Membro adicionado com sucesso!');
                setNewMemberEmail('');
                fetchMembers();
            } else {
                setError(data.error || 'Erro ao adicionar membro');
            }
        } catch (err) {
            setError('Erro ao conectar com o servidor');
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!confirm('Tem certeza que deseja remover este membro da equipe?')) return;

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/organization/members/${userId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                fetchMembers();
            } else {
                alert('Erro ao remover membro');
            }
        } catch (err) {
            alert('Erro ao remover membro');
        }
    };

    return (
        <div className="space-y-8 max-w-3xl">
            {/* Add Member Form */}
            <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <Users size={20} className={`text-${themeColor}-600`} />
                    Adicionar Membro à Equipe
                </h3>
                <form onSubmit={handleAddMember} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email do Usuário</label>
                        <div className="relative">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    value={newMemberEmail}
                                    onChange={(e) => {
                                        setNewMemberEmail(e.target.value);
                                        setShowResults(true);
                                    }}
                                    onFocus={() => setShowResults(true)}
                                    placeholder="Buscar por nome ou email..."
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                    autoComplete="off"
                                />
                                {isSearching && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Loader2 className="animate-spin text-slate-400" size={16} />
                                    </div>
                                )}
                            </div>

                            {/* Search Results Dropdown */}
                            {showResults && searchResults.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm shadow-lg max-h-60 overflow-y-auto">
                                    {searchResults.map((user) => (
                                        <button
                                            key={user.id}
                                            type="button"
                                            onClick={() => {
                                                setNewMemberEmail(user.email);
                                                setShowResults(false);
                                            }}
                                            className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-0"
                                        >
                                            <p className="font-medium text-slate-800 dark:text-white">{user.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="w-48">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Função</label>
                        <select
                            value={newMemberRole}
                            onChange={(e) => setNewMemberRole(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="user">Usuário</option>
                            <option value="operacional">Operacional</option>
                            <option value="financeiro">Financeiro</option>
                            <option value="admin">Administrador</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={isAdding}
                        className={`px-6 py-2 bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white font-medium rounded-sm transition-colors disabled:opacity-70 h-[42px]`}
                    >
                        {isAdding ? 'Adicionando...' : 'Adicionar'}
                    </button>
                </form>
                {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
                {success && <p className="mt-3 text-sm text-green-600 dark:text-green-400">{success}</p>}
            </div>

            {/* Members List */}
            <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Membros Atuais</h3>
                <div className="bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nome</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Função</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">Carregando equipe...</td>
                                </tr>
                            ) : members.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">Nenhum membro encontrado nesta organização.</td>
                                </tr>
                            ) : (
                                members.map((member) => (
                                    <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{member.name}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{member.email}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 capitalize`}>
                                                {member.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right">
                                            <button
                                                onClick={() => handleRemoveMember(member.id)}
                                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                                title="Remover membro"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
