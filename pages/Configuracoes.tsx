import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { EmpresaContexto } from '../types';
import { Save, Bell, Shield, Monitor, Building, RefreshCw, Database, Users, Trash2, Search, Loader2 } from 'lucide-react';

const TeamManagement: React.FC<{ themeColor: string; context: EmpresaContexto }> = ({ themeColor, context }) => {
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
            const response = await fetch('http://localhost:4000/api/organization/members', {
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
                    const response = await fetch(`http://localhost:4000/api/organization/candidates?q=${newMemberEmail}`, {
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
            const response = await fetch('http://localhost:4000/api/organization/members', {
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
            const response = await fetch(`http://localhost:4000/api/organization/members/${userId}`, {
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
            <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
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
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
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
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                        className={`px-6 py-2 bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white font-medium rounded-lg transition-colors disabled:opacity-70 h-[42px]`}
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
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
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

export const Configuracoes: React.FC = () => {
    const { currentContext } = useApp();
    const [activeTab, setActiveTab] = useState<'geral' | 'notificacoes' | 'aparencia' | 'sistema' | 'equipe'>('geral');

    // Mock Data based on Context
    const companyData = currentContext === EmpresaContexto.TURISMO ? {
        nome: 'JJê Turismo Ltda',
        cnpj: '12.345.678/0001-90',
        endereco: 'Rua das Flores, 123 - Centro, São Paulo - SP',
        email: 'contato@jjeturismo.com.br',
        telefone: '(11) 98765-4321'
    } : {
        nome: 'JJê Express Logística',
        cnpj: '98.765.432/0001-10',
        endereco: 'Av. das Indústrias, 456 - Distrito Industrial, Campinas - SP',
        email: 'logistica@jjeexpress.com.br',
        telefone: '(19) 3333-4444'
    };

    const themeColor = currentContext === EmpresaContexto.TURISMO ? 'blue' : 'orange';

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Configurações</h1>
                    <p className="text-slate-500 dark:text-slate-400">Gerencie as preferências do sistema e da empresa.</p>
                </div>
                <button className={`flex items-center gap-2 bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white px-4 py-2 rounded-lg transition-colors`}>
                    <Save size={18} />
                    <span>Salvar Alterações</span>
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-700">
                    <button
                        onClick={() => setActiveTab('geral')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'geral'
                            ? `border-${themeColor}-600 text-${themeColor}-600 dark:text-${themeColor}-400`
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                            }`}
                    >
                        <Building size={18} />
                        Geral
                    </button>
                    <button
                        onClick={() => setActiveTab('notificacoes')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'notificacoes'
                            ? `border-${themeColor}-600 text-${themeColor}-600 dark:text-${themeColor}-400`
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                            }`}
                    >
                        <Bell size={18} />
                        Notificações
                    </button>
                    <button
                        onClick={() => setActiveTab('aparencia')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'aparencia'
                            ? `border-${themeColor}-600 text-${themeColor}-600 dark:text-${themeColor}-400`
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                            }`}
                    >
                        <Monitor size={18} />
                        Aparência
                    </button>
                    <button
                        onClick={() => setActiveTab('equipe')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'equipe'
                            ? `border-${themeColor}-600 text-${themeColor}-600 dark:text-${themeColor}-400`
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                            }`}
                    >
                        <Users size={18} />
                        Equipe
                    </button>

                    <button
                        onClick={() => setActiveTab('sistema')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'sistema'
                            ? `border-${themeColor}-600 text-${themeColor}-600 dark:text-${themeColor}-400`
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                            }`}
                    >
                        <Shield size={18} />
                        Sistema
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {activeTab === 'geral' && (
                        <div className="space-y-6 max-w-2xl">
                            <div className="flex items-center gap-3 mb-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700">
                                <div className={`w-10 h-10 rounded-full bg-${themeColor}-100 dark:bg-${themeColor}-900/30 flex items-center justify-center text-${themeColor}-600 dark:text-${themeColor}-400`}>
                                    <Building size={20} />
                                </div>
                                <div>
                                    <h3 className="font-medium text-slate-800 dark:text-white">Dados da Empresa</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Editando configurações para: <span className="font-bold">{currentContext === EmpresaContexto.TURISMO ? 'Turismo B2C' : 'Logística Express'}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Razão Social</label>
                                    <input
                                        type="text"
                                        defaultValue={companyData.nome}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">CNPJ</label>
                                    <input
                                        type="text"
                                        defaultValue={companyData.cnpj}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Endereço</label>
                                    <input
                                        type="text"
                                        defaultValue={companyData.endereco}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email de Contato</label>
                                    <input
                                        type="email"
                                        defaultValue={companyData.email}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Telefone</label>
                                    <input
                                        type="text"
                                        defaultValue={companyData.telefone}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notificacoes' && (
                        <div className="space-y-6 max-w-2xl">
                            <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-4">Preferências de Notificação</h3>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-700 rounded-lg">
                                    <div>
                                        <p className="font-medium text-slate-800 dark:text-white">Notificações por Email</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Receber atualizações importantes via email</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" defaultChecked />
                                        <div className={`w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-${themeColor}-300 dark:peer-focus:ring-${themeColor}-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-${themeColor}-600`}></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-700 rounded-lg">
                                    <div>
                                        <p className="font-medium text-slate-800 dark:text-white">Notificações SMS</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Receber alertas urgentes via SMS</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" />
                                        <div className={`w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-${themeColor}-300 dark:peer-focus:ring-${themeColor}-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-${themeColor}-600`}></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-700 rounded-lg">
                                    <div>
                                        <p className="font-medium text-slate-800 dark:text-white">Notificações Push</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Receber notificações no navegador</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" defaultChecked />
                                        <div className={`w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-${themeColor}-300 dark:peer-focus:ring-${themeColor}-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-${themeColor}-600`}></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'aparencia' && (
                        <div className="space-y-6 max-w-2xl">
                            <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-4">Personalização</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                                    <div className="h-20 bg-slate-100 rounded mb-3"></div>
                                    <p className="font-medium text-center text-slate-700 dark:text-slate-300">Modo Claro</p>
                                </div>
                                <div className="p-4 border-2 border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:border-blue-500 transition-colors bg-slate-900">
                                    <div className="h-20 bg-slate-800 rounded mb-3"></div>
                                    <p className="font-medium text-center text-white">Modo Escuro</p>
                                </div>
                            </div>

                            <div className="mt-6">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Cor do Tema</label>
                                <div className="flex gap-3">
                                    <button className="w-8 h-8 rounded-full bg-blue-600 ring-2 ring-offset-2 ring-blue-600"></button>
                                    <button className="w-8 h-8 rounded-full bg-orange-600"></button>
                                    <button className="w-8 h-8 rounded-full bg-green-600"></button>
                                    <button className="w-8 h-8 rounded-full bg-purple-600"></button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'equipe' && <TeamManagement themeColor={themeColor} context={currentContext} />}

                    {activeTab === 'sistema' && (
                        <div className="space-y-6 max-w-2xl">
                            <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-4">Informações do Sistema</h3>

                            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-slate-500 dark:text-slate-400">Versão</span>
                                    <span className="font-mono text-slate-700 dark:text-slate-300">v2.1.0</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500 dark:text-slate-400">Build</span>
                                    <span className="font-mono text-slate-700 dark:text-slate-300">20231125-stable</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500 dark:text-slate-400">Ambiente</span>
                                    <span className="font-mono text-green-600 dark:text-green-400">Produção</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                                <h4 className="font-medium text-slate-800 dark:text-white mb-3">Manutenção de Dados</h4>
                                <div className="flex gap-3">
                                    <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                        <Database size={16} />
                                        Backup Manual
                                    </button>
                                    <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                        <RefreshCw size={16} />
                                        Limpar Cache
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
