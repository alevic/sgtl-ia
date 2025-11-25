import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { EmpresaContexto } from '../types';
import { Save, Bell, Shield, Monitor, Building, RefreshCw, Database } from 'lucide-react';

export const Configuracoes: React.FC = () => {
    const { currentContext } = useApp();
    const [activeTab, setActiveTab] = useState<'geral' | 'notificacoes' | 'aparencia' | 'sistema'>('geral');

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
