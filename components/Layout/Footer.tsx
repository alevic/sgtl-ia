import React from 'react';
import { useApp } from '../../context/AppContext';

export const Footer: React.FC = () => {
    const { systemSettings } = useApp();
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 py-4 px-6 transition-colors duration-200">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <div>
                    &copy; {currentYear} {systemSettings.system_footer_text || 'SGTL - Sistema de Gestão de Transporte e Logística. Todos os direitos reservados.'}
                </div>
                <div className="flex items-center gap-4">
                    <span>Versão {systemSettings.system_display_version || '1.0.0'}</span>
                    <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Termos de Uso</a>
                    <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Política de Privacidade</a>
                </div>
            </div>
        </footer>
    );
};
