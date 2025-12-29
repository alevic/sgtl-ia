import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { EmpresaContexto } from '../types';
import { Save, Bell, Shield, Monitor, RefreshCw, Database, Settings2, Plus, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { authClient } from '../lib/auth-client';

interface IParameter {
    id: string;
    key: string;
    value: string;
    description: string;
    updated_at: string;
}

export const Configuracoes: React.FC = () => {
    const { currentContext } = useApp();
    const [activeTab, setActiveTab] = useState<'notificacoes' | 'aparencia' | 'sistema' | 'parametros'>('notificacoes');

    // Parameters State
    const [parameters, setParameters] = React.useState<IParameter[]>([]);
    const [isLoadingParams, setIsLoadingParams] = React.useState(false);
    const [error, setError] = React.useState('');
    const [success, setSuccess] = React.useState('');

    // New/Edit Parameter State
    const [isSavingParam, setIsSavingParam] = React.useState(false);
    const [newParam, setNewParam] = React.useState({ key: '', value: '', description: '' });

    const fetchParameters = async () => {
        setIsLoadingParams(true);
        setError('');
        try {
            const { data: session } = await authClient.getSession();
            if (!session?.session.activeOrganizationId) return;

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/organization/${session.session.activeOrganizationId}/parameters`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                setParameters(data);
            } else {
                setError('Falha ao carregar parâmetros.');
            }
        } catch (err) {
            setError('Erro de conexão ao buscar parâmetros.');
        } finally {
            setIsLoadingParams(false);
        }
    };

    const handleSaveParameter = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingParam(true);
        setError('');
        setSuccess('');

        try {
            const { data: session } = await authClient.getSession();
            if (!session?.session.activeOrganizationId) return;

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/organization/${session.session.activeOrganizationId}/parameters`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newParam)
            });

            if (response.ok) {
                setSuccess('Parâmetro salvo com sucesso!');
                setNewParam({ key: '', value: '', description: '' });
                fetchParameters();
            } else {
                const data = await response.json();
                setError(data.error || 'Falha ao salvar parâmetro.');
            }
        } catch (err) {
            setError('Erro ao salvar parâmetro.');
        } finally {
            setIsSavingParam(false);
        }
    };

    const handleDeleteParameter = async (paramId: string) => {
        if (!window.confirm('Excluir este parâmetro?')) return;

        try {
            const { data: session } = await authClient.getSession();
            if (!session?.session.activeOrganizationId) return;

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/organization/${session.session.activeOrganizationId}/parameters/${paramId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                setSuccess('Parâmetro excluído.');
                fetchParameters();
            } else {
                setError('Falha ao excluir.');
            }
        } catch (err) {
            setError('Erro ao excluir.');
        }
    };

    React.useEffect(() => {
        if (activeTab === 'parametros') {
            fetchParameters();
        }
    }, [activeTab]);

    const themeColor = currentContext === EmpresaContexto.TURISMO ? 'blue' : 'orange';

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Configurações</h1>
                    <p className="text-slate-500 dark:text-slate-400">Gerencie as preferências do sistema.</p>
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
                        onClick={() => setActiveTab('sistema')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'sistema'
                            ? `border-${themeColor}-600 text-${themeColor}-600 dark:text-${themeColor}-400`
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                            }`}
                    >
                        <Shield size={18} />
                        Sistema
                    </button>
                    <button
                        onClick={() => setActiveTab('parametros')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'parametros'
                            ? `border-${themeColor}-600 text-${themeColor}-600 dark:text-${themeColor}-400`
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                            }`}
                    >
                        <Settings2 size={18} />
                        Parâmetros
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
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

                    {activeTab === 'parametros' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Form */}
                                <div className="lg:col-span-1">
                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                            <Plus size={18} className="text-blue-500" />
                                            Novo Parâmetro
                                        </h3>
                                        <form onSubmit={handleSaveParameter} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Chave (Key)</label>
                                                <input
                                                    type="text"
                                                    value={newParam.key}
                                                    onChange={(e) => setNewParam({ ...newParam, key: e.target.value })}
                                                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="ex: trip_safety_margin"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor (Value)</label>
                                                <input
                                                    type="text"
                                                    value={newParam.value}
                                                    onChange={(e) => setNewParam({ ...newParam, value: e.target.value })}
                                                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="ex: 168"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
                                                <textarea
                                                    value={newParam.description}
                                                    onChange={(e) => setNewParam({ ...newParam, description: e.target.value })}
                                                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                                                    placeholder="Para que serve este parâmetro?"
                                                />
                                            </div>

                                            {error && (
                                                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-lg flex items-center gap-2">
                                                    <AlertCircle size={14} />
                                                    {error}
                                                </div>
                                            )}

                                            {success && (
                                                <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs rounded-lg">
                                                    {success}
                                                </div>
                                            )}

                                            <button
                                                type="submit"
                                                disabled={isSavingParam}
                                                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                                            >
                                                {isSavingParam ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                                Salvar Parâmetro
                                            </button>
                                        </form>
                                    </div>
                                </div>

                                {/* List */}
                                <div className="lg:col-span-2">
                                    <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-4">Configurações Atuais</h3>
                                    {isLoadingParams ? (
                                        <div className="flex justify-center p-8">
                                            <Loader2 className="animate-spin text-slate-400" size={24} />
                                        </div>
                                    ) : parameters.length === 0 ? (
                                        <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-500">
                                            Nenhum parâmetro cadastrado.
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {parameters.map((param) => (
                                                <div key={param.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex justify-between items-start">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <code className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded text-sm font-bold">
                                                                {param.key}
                                                            </code>
                                                            <span className="text-slate-400 text-xs">=</span>
                                                            <span className="font-mono text-slate-900 dark:text-slate-100">{param.value}</span>
                                                        </div>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">{param.description}</p>
                                                        <p className="text-[10px] text-slate-400">Atualizado em: {new Date(param.updated_at).toLocaleString()}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setNewParam({ key: param.key, value: param.value, description: param.description })}
                                                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                            title="Editar"
                                                        >
                                                            <Settings2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteParameter(param.id)}
                                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                            title="Excluir"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
