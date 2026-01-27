import React, { useState } from 'react';
import { Shield, Key, Monitor, Clock, Loader2 } from 'lucide-react';
import { PasswordChangeModal } from '../Profile/PasswordChangeModal';

interface UserSecurityPanelProps {
    userId: string;
}

export const UserSecurityPanel: React.FC<UserSecurityPanelProps> = ({ userId }) => {
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [sessions, setSessions] = useState<any[]>([]);
    const [isLoadingSessions, setIsLoadingSessions] = useState(false);

    return (
        <div className="space-y-6">
            {/* Password Section */}
            <div className="bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <Key size={20} className="text-orange-600" />
                    Senha
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Mantenha sua conta segura com uma senha forte
                </p>
                <button
                    onClick={() => setShowPasswordModal(true)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-sm font-medium transition-colors flex items-center gap-2"
                >
                    <Key size={18} />
                    Alterar Senha
                </button>
            </div>

            {/* Sessions Section */}
            <div className="bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <Monitor size={20} className="text-blue-600" />
                    Sessões Ativas
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Gerencie os dispositivos onde você está conectado
                </p>

                {isLoadingSessions ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="animate-spin text-blue-600" size={24} />
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                        <Monitor size={48} className="mx-auto mb-2 opacity-50" />
                        <p>Funcionalidade em desenvolvimento</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sessions.map((session, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-sm">
                                <div className="flex items-center gap-3">
                                    <Monitor size={20} className="text-slate-400" />
                                    <div>
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            {session.device}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {session.location} • {session.lastActive}
                                        </p>
                                    </div>
                                </div>
                                <button className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                                    Encerrar
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Login History */}
            <div className="bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <Clock size={20} className="text-green-600" />
                    Histórico de Logins
                </h3>
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                    <Clock size={48} className="mx-auto mb-2 opacity-50" />
                    <p>Funcionalidade em desenvolvimento</p>
                </div>
            </div>

            {/* Password Change Modal */}
            <PasswordChangeModal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                onSuccess={() => alert('Senha alterada com sucesso!')}
            />
        </div>
    );
};
