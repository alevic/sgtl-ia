import React, { useState, useEffect } from 'react';
import { Palette, Globe, Bell, Save, Loader2 } from 'lucide-react';

interface UserPreferencesProps {
    userId: string;
}

export const UserPreferences: React.FC<UserPreferencesProps> = ({ userId }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [theme, setTheme] = useState('auto');
    const [language, setLanguage] = useState('pt-BR');
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // TODO: Implement preferences save endpoint
            await new Promise(resolve => setTimeout(resolve, 1000));
            alert('Preferências salvas com sucesso!');
        } catch (error) {
            alert('Erro ao salvar preferências');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Theme Section */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <Palette size={20} className="text-purple-600" />
                    Aparência
                </h3>
                <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Tema
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { value: 'light', label: 'Claro', icon: '☀️' },
                            { value: 'dark', label: 'Escuro', icon: '🌙' },
                            { value: 'auto', label: 'Automático', icon: '🔄' }
                        ].map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setTheme(option.value)}
                                className={`p-4 rounded-lg border-2 transition-all ${theme === option.value
                                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                    }`}
                            >
                                <div className="text-2xl mb-1">{option.icon}</div>
                                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {option.label}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Language Section */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <Globe size={20} className="text-blue-600" />
                    Idioma
                </h3>
                <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                >
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                </select>
            </div>

            {/* Notifications Section */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <Bell size={20} className="text-orange-600" />
                    Notificações
                </h3>
                <div className="space-y-4">
                    <label className="flex items-center justify-between cursor-pointer">
                        <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Notificações por Email
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Receba atualizações importantes por email
                            </p>
                        </div>
                        <input
                            type="checkbox"
                            checked={emailNotifications}
                            onChange={(e) => setEmailNotifications(e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500"
                        />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                        <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Notificações Push
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Receba notificações em tempo real
                            </p>
                        </div>
                        <input
                            type="checkbox"
                            checked={pushNotifications}
                            onChange={(e) => setPushNotifications(e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500"
                        />
                    </label>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="animate-spin" size={18} />
                            Salvando...
                        </>
                    ) : (
                        <>
                            <Save size={18} />
                            Salvar Preferências
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
