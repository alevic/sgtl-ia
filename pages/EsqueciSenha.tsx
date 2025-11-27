import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authClient } from '../lib/auth-client';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

export const EsqueciSenha: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        await authClient.forgetPassword({
            email,
            redirectTo: '/redefinir-senha',
        }, {
            onSuccess: () => {
                setIsSuccess(true);
                setIsLoading(false);
            },
            onError: (ctx) => {
                setError(ctx.error.message);
                setIsLoading(false);
            }
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Mail className="text-blue-600 dark:text-blue-400" size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Recuperar Senha</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        Digite seu email para receber o link de redefinição.
                    </p>
                </div>

                {isSuccess ? (
                    <div className="text-center space-y-6">
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl flex flex-col items-center gap-2">
                            <CheckCircle size={32} />
                            <p className="font-medium">Email enviado com sucesso!</p>
                        </div>
                        <p className="text-sm text-slate-500">
                            Verifique sua caixa de entrada (e spam) para redefinir sua senha.
                        </p>
                        <Link
                            to="/login"
                            className="block w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition-colors"
                        >
                            Voltar para o Login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                                    placeholder="seu@email.com"
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
                            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Enviar Link'}
                        </button>

                        <div className="text-center">
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                            >
                                <ArrowLeft size={16} />
                                Voltar para o Login
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};
