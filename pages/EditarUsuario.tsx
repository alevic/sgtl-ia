import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, User, Lock, Settings, Activity } from 'lucide-react';
import { UserForm } from '../components/User/UserForm';
import { useApp } from '../context/AppContext';

type TabType = 'perfil' | 'seguranca' | 'preferencias' | 'atividades';

export const EditarUsuario: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { user: currentUser } = useApp();
    const [activeTab, setActiveTab] = useState<TabType>('perfil');

    const isOwnProfile = currentUser?.id === id;
    const isAdmin = currentUser?.role === 'admin';

    const handleSubmit = async (data: any) => {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(data),
        });

        if (response.ok) {
            alert('Dados atualizados com sucesso!');
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao atualizar usuário');
        }
    };

    const tabs = [
        {
            id: 'perfil' as TabType,
            label: 'Perfil',
            icon: User,
            description: 'Dados pessoais e avatar'
        },
        {
            id: 'seguranca' as TabType,
            label: 'Segurança',
            icon: Lock,
            description: 'Senha e autenticação'
        },
        {
            id: 'preferencias' as TabType,
            label: 'Preferências',
            icon: Settings,
            description: 'Configurações e notificações'
        },
        {
            id: 'atividades' as TabType,
            label: 'Atividades',
            icon: Activity,
            description: 'Histórico e logs'
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(isOwnProfile ? '/admin/dashboard' : '/admin/usuarios')}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                        {isOwnProfile ? 'Meu Perfil' : 'Editar Usuário'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        {isOwnProfile ? 'Gerencie suas informações pessoais' : 'Atualize as informações do usuário'}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="border-b border-slate-200 dark:border-slate-700">
                    <div className="flex overflow-x-auto">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                                        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                        }`}
                                >
                                    <Icon size={18} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="p-8">
                    {activeTab === 'perfil' && (
                        <div>
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Informações Pessoais</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Atualize seus dados pessoais e foto de perfil
                                </p>
                            </div>
                            <UserForm
                                mode="edit"
                                userId={id!}
                                onSubmit={handleSubmit}
                                showAvatar={true}
                                showPassword={false}
                                showRole={isAdmin}
                                showNotes={isAdmin}
                                showIsActive={isAdmin}
                                canEditUsername={false}
                            />
                        </div>
                    )}

                    {activeTab === 'seguranca' && (
                        <div>
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Segurança</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Gerencie sua senha e configurações de segurança
                                </p>
                            </div>
                            <div className="space-y-6">
                                {/* Password Change Section */}
                                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Alterar Senha</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Senha Atual
                                            </label>
                                            <input
                                                type="password"
                                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                                                placeholder="Digite sua senha atual"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Nova Senha
                                            </label>
                                            <input
                                                type="password"
                                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                                                placeholder="Digite sua nova senha"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Confirmar Nova Senha
                                            </label>
                                            <input
                                                type="password"
                                                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                                                placeholder="Confirme sua nova senha"
                                            />
                                        </div>
                                        <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-colors">
                                            Alterar Senha
                                        </button>
                                    </div>
                                </div>

                                {/* 2FA Section (Future) */}
                                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <h3 className="font-semibold text-slate-800 dark:text-white mb-2">Autenticação de Dois Fatores</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                        Adicione uma camada extra de segurança à sua conta
                                    </p>
                                    <button className="px-6 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold transition-colors opacity-50 cursor-not-allowed">
                                        Em breve
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'preferencias' && (
                        <div>
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Preferências</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Personalize sua experiência no sistema
                                </p>
                            </div>
                            <div className="space-y-6">
                                {/* Notifications */}
                                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Notificações</h3>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-3">
                                            <input type="checkbox" className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500" />
                                            <span className="text-sm text-slate-700 dark:text-slate-300">Notificações por email</span>
                                        </label>
                                        <label className="flex items-center gap-3">
                                            <input type="checkbox" className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500" />
                                            <span className="text-sm text-slate-700 dark:text-slate-300">Notificações push</span>
                                        </label>
                                        <label className="flex items-center gap-3">
                                            <input type="checkbox" className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500" />
                                            <span className="text-sm text-slate-700 dark:text-slate-300">Atualizações de viagens</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Theme (Future) */}
                                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <h3 className="font-semibold text-slate-800 dark:text-white mb-2">Tema</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                        Escolha entre tema claro, escuro ou automático
                                    </p>
                                    <button className="px-6 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold transition-colors opacity-50 cursor-not-allowed">
                                        Em breve
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'atividades' && (
                        <div>
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Atividades Recentes</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Histórico de ações e acessos
                                </p>
                            </div>
                            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                                <Activity className="mx-auto mb-4 text-slate-400" size={48} />
                                <h3 className="font-semibold text-slate-800 dark:text-white mb-2">Histórico de Atividades</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                    Em breve você poderá visualizar todas as suas atividades no sistema
                                </p>
                                <button className="px-6 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold transition-colors opacity-50 cursor-not-allowed">
                                    Em breve
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
