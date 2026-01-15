import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Bus, ArrowRight, RefreshCcw, User, Mail, Lock, Phone, CreditCard, ShieldCheck } from 'lucide-react';
import { publicService } from '../../services/publicService';

export const SignupCliente: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const returnUrl = searchParams.get('returnUrl');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        document: '',
        organization_id: '' // We should ideally get this from settings
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await publicService.signupClient(formData);
            // After signup, better-auth usually handles the session. 
            // We can redirect the user back.
            if (returnUrl) {
                navigate(returnUrl);
            } else {
                navigate('/cliente/dashboard');
            }
        } catch (err: any) {
            console.error('[SIGNUP ERROR]', err);
            setError(err.message || 'Erro ao realizar cadastro.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-slate-900 dark:to-slate-800 p-4 font-sans">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-lg w-full border border-slate-200 dark:border-slate-700">

                {/* Logo Section */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                        <Bus size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                        Crie sua Conta
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
                        Cadastre-se para reservar suas passagens e gerenciar suas viagens.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 text-sm font-medium rounded-r-lg">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <User size={18} />
                                </div>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Como no documento"
                                    disabled={isLoading}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all dark:text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">E-mail</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="exemplo@email.com"
                                    disabled={isLoading}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all dark:text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">WhatsApp / Telefone</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Phone size={18} />
                                </div>
                                <input
                                    type="tel"
                                    name="phone"
                                    required
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="(00) 00000-0000"
                                    disabled={isLoading}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all dark:text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Documento (CPF/RG)</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <CreditCard size={18} />
                                </div>
                                <input
                                    type="text"
                                    name="document"
                                    required
                                    value={formData.document}
                                    onChange={handleChange}
                                    placeholder="000.000.000-00"
                                    disabled={isLoading}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all dark:text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Senha</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    disabled={isLoading}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all dark:text-white"
                                />
                            </div>
                        </div>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed py-2">
                        Ao clicar em "Criar minha conta", você declara que leu e concorda com nossos
                        <a href="#" className="text-blue-600 font-bold ml-1">Termos de Uso</a> e
                        <a href="#" className="text-blue-600 font-bold ml-1">Política de Privacidade</a>.
                    </p>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                        {isLoading ? (
                            <RefreshCcw className="animate-spin" size={20} />
                        ) : (
                            <>
                                Criar minha conta
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Já possui uma conta? {' '}
                        <Link
                            to={`/cliente/login${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`}
                            className="text-blue-600 font-bold hover:underline"
                        >
                            Fazer Login
                        </Link>
                    </p>
                </div>

                <div className="mt-6 flex items-center justify-center gap-2 text-slate-400">
                    <ShieldCheck size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Seus dados estão protegidos</span>
                </div>
            </div>
        </div>
    );
};
