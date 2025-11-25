import React from 'react';
import { CheckCircle } from 'lucide-react';

interface ModalConfirmacaoProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    variant?: 'success' | 'danger' | 'warning' | 'info';
    icon?: React.ReactNode;
}

export const ModalConfirmacao: React.FC<ModalConfirmacaoProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'success',
    icon
}) => {
    if (!isOpen) return null;

    const getVariantStyles = () => {
        switch (variant) {
            case 'danger':
                return {
                    bgIcon: 'bg-red-100 dark:bg-red-900/30',
                    textIcon: 'text-red-600 dark:text-red-400',
                    button: 'bg-red-600 hover:bg-red-500'
                };
            case 'warning':
                return {
                    bgIcon: 'bg-yellow-100 dark:bg-yellow-900/30',
                    textIcon: 'text-yellow-600 dark:text-yellow-400',
                    button: 'bg-yellow-600 hover:bg-yellow-500'
                };
            case 'info':
                return {
                    bgIcon: 'bg-blue-100 dark:bg-blue-900/30',
                    textIcon: 'text-blue-600 dark:text-blue-400',
                    button: 'bg-blue-600 hover:bg-blue-500'
                };
            case 'success':
            default:
                return {
                    bgIcon: 'bg-green-100 dark:bg-green-900/30',
                    textIcon: 'text-green-600 dark:text-green-400',
                    button: 'bg-green-600 hover:bg-green-500'
                };
        }
    };

    const styles = getVariantStyles();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className={`w-16 h-16 ${styles.bgIcon} rounded-full flex items-center justify-center mb-4`}>
                        {icon ? (
                            <div className={styles.textIcon}>{icon}</div>
                        ) : (
                            <CheckCircle size={32} className={styles.textIcon} />
                        )}
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                        {title}
                    </h3>
                    <div className="text-slate-600 dark:text-slate-300">
                        {message}
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-2 ${styles.button} text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2`}
                    >
                        <CheckCircle size={18} />
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
