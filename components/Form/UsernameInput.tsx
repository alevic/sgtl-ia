import React, { useState, useEffect } from 'react';
import { User, Loader2, RefreshCw, Check, X } from 'lucide-react';

interface UsernameInputProps {
    value: string;
    onChange: (value: string) => void;
    name: string;
    required?: boolean;
    disabled?: boolean;
    showLabel?: boolean;
}

// Get API URL
function getApiUrl(): string {
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname === 'jjeturismo.com.br' || hostname.endsWith('.jjeturismo.com.br')) {
            return 'https://api.jjeturismo.com.br';
        }
        if (hostname === '192.168.0.113') {
            return 'http://192.168.0.113:4000';
        }
        return window.location.origin;
    }
    return "http://localhost:4000";
}

export const UsernameInput: React.FC<UsernameInputProps> = ({ value, onChange, name, required = true, disabled = false, showLabel = true }) => {
    const [isChecking, setIsChecking] = useState(false);
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [error, setError] = useState('');

    // Validate username format
    const validateFormat = (username: string): string | null => {
        if (!username) return null;
        if (username.length < 3) return 'Mínimo 3 caracteres';
        if (username.length > 30) return 'Máximo 30 caracteres';
        if (!/^[a-zA-Z]/.test(username)) return 'Deve começar com letra';
        if (/[._]$/.test(username)) return 'Não pode terminar com . ou _';
        if (!/^[a-zA-Z0-9._]+$/.test(username)) return 'Apenas letras, números, . e _';
        if (/[._]{2,}/.test(username)) return 'Não pode ter .. ou __ consecutivos';
        return null;
    };

    // Check availability with debounce
    useEffect(() => {
        // Skip validation if disabled (edit mode)
        if (disabled) {
            setIsAvailable(null);
            setError('');
            return;
        }

        const formatError = validateFormat(value);
        if (formatError) {
            setError(formatError);
            setIsAvailable(false);
            return;
        }

        if (!value || value.length < 3) {
            setIsAvailable(null);
            setError('');
            return;
        }

        setError('');
        const timer = setTimeout(async () => {
            setIsChecking(true);
            try {
                const apiUrl = getApiUrl();
                const response = await fetch(`${apiUrl}/api/auth/check-username/${value}`);
                const data = await response.json();
                setIsAvailable(data.available);
                if (data.error) {
                    setError(data.error);
                }
            } catch (err) {
                console.error('Error checking username:', err);
            } finally {
                setIsChecking(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [value, disabled]);

    // Generate suggestions
    const generateSuggestions = async () => {
        if (!name) return;

        try {
            const apiUrl = getApiUrl();
            const response = await fetch(`${apiUrl}/api/auth/suggest-username`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            const data = await response.json();
            setSuggestions(data.suggestions || []);
        } catch (err) {
            console.error('Error generating suggestions:', err);
        }
    };

    const getStatusIcon = () => {
        if (isChecking) return <Loader2 className="animate-spin text-blue-500" size={18} />;
        if (error) return <X className="text-red-500" size={18} />;
        if (isAvailable === true) return <Check className="text-green-500" size={18} />;
        if (isAvailable === false) return <X className="text-red-500" size={18} />;
        return null;
    };

    const getStatusText = () => {
        if (isChecking) return 'Verificando...';
        if (error) return error;
        if (isAvailable === true) return 'Disponível';
        if (isAvailable === false) return 'Já existe';
        return '';
    };

    return (
        <div className="space-y-2">
            {showLabel && (
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Username {required && <span className="text-red-500">*</span>}
                </label>
            )}

            <div className="flex gap-2">
                <div className="relative flex-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value.toLowerCase())}
                        disabled={disabled}
                        className={`w-full pl-10 pr-10 h-14 bg-slate-50 dark:bg-slate-900 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white disabled:opacity-50 disabled:cursor-not-allowed ${error || isAvailable === false
                            ? 'border-red-300 dark:border-red-700'
                            : isAvailable === true
                                ? 'border-green-300 dark:border-green-700'
                                : 'border-slate-200 dark:border-slate-700'
                            }`}
                        placeholder="seu.username"
                        required={required}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {getStatusIcon()}
                    </div>
                </div>

                <button
                    type="button"
                    onClick={generateSuggestions}
                    disabled={disabled || !name}
                    className="px-4 h-14 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    title="Gerar sugestões"
                >
                    <RefreshCw size={18} />
                    Gerar
                </button>
            </div>

            {getStatusText() && (
                <p className={`text-xs ${error || isAvailable === false ? 'text-red-600 dark:text-red-400' :
                    isAvailable === true ? 'text-green-600 dark:text-green-400' :
                        'text-slate-500'
                    }`}>
                    {getStatusText()}
                </p>
            )}

            {suggestions.length > 0 && (
                <div className="space-y-1">
                    <p className="text-xs text-slate-600 dark:text-slate-400">Sugestões disponíveis:</p>
                    <div className="flex flex-wrap gap-2">
                        {suggestions.map((suggestion) => (
                            <button
                                key={suggestion}
                                type="button"
                                onClick={() => onChange(suggestion)}
                                className="px-3 py-1 text-sm bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg transition-colors"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
