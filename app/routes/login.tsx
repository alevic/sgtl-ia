import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { authClient } from '../lib/auth-client';
import { Bus, Truck, Lock, Mail, Loader2, User } from 'lucide-react';

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        await authClient.signIn.email({
            email,
            password,
        }, {
            onSuccess: () => {
                navigate('/admin/dashboard');
            },
            onError: (ctx) => {
                setError(ctx.error.message);
                setIsLoading(false);
            }
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="p-8">
                    <div className="flex justify-center mb-8">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                            <Bus size={32} />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-white mb-2">Bem-vindo de volta</h2>
                    <p className="text-center text-slate-500 dark:text-slate-400 mb-8">Acesse sua conta para continuar</p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Identificação de Acesso</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white font-semibold"
                                    placeholder="Username, Email, CPF ou Telefone"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Entrar'}
                        </button>

                        <div className="flex justify-between text-sm">
                            <a
                                href="/esqueci-username"
                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                            >
                                Esqueceu seu username?
                            </a>
                            <a
                                href="/esqueci-senha"
                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                            >
                                Esqueceu sua senha?
                            </a>
                        </div>
                    </form>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 text-center border-t border-slate-100 dark:border-slate-700">
                    <p className="text-xs text-slate-500">
                        SGTL v2.1 - Sistema de Gestão de Turismo e Logística
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
