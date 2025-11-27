import React from 'react';
import { useApp } from '../context/AppContext';
import { User, Mail, Shield, Camera } from 'lucide-react';

export const Perfil: React.FC = () => {
    const { user } = useApp();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Meu Perfil</h1>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-400"></div>
                <div className="px-8 pb-8">
                    <div className="relative flex justify-between items-end -mt-12 mb-6">
                        <div className="relative">
                            <img
                                src={user.avatar || "https://ui-avatars.com/api/?name=" + user.name}
                                alt={user.name}
                                className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-800 shadow-md object-cover bg-white"
                            />
                            <button className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-sm">
                                <Camera size={14} />
                            </button>
                        </div>
                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shadow-blue-600/20">
                            Editar Perfil
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Nome Completo</label>
                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <User size={18} className="text-slate-400" />
                                    <span className="text-slate-700 dark:text-slate-300 font-medium">{user.name}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email</label>
                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <Mail size={18} className="text-slate-400" />
                                    <span className="text-slate-700 dark:text-slate-300 font-medium">{user.email || 'email@exemplo.com'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Função / Cargo</label>
                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <Shield size={18} className="text-slate-400" />
                                    <span className="text-slate-700 dark:text-slate-300 font-medium">{user.role}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
