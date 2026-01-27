import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { authClient } from '../lib/auth-client';
import { Bus, User, Lock, Mail, Loader2, ArrowLeft, Phone, FileText, CheckCircle } from 'lucide-react';
import { TipoDocumento } from '@/types'; // Assuming types are here, otherwise I'll define local string literals

export const Signup: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        phone: '',
        documento_tipo: 'CPF',
        documento: '',
        password: '',
        confirmPassword: ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setError("As senhas não coincidem");
            return;
        }

        setIsLoading(true);
        setError('');

        await authClient.signUp.email({
            email: formData.email,
            password: formData.password,
            name: formData.name,
            username: formData.username,
            phone: formData.phone,
            documento: formData.documento,
            documento_tipo: formData.documento_tipo
        } as any, {
            onSuccess: () => {
                navigate('/admin/dashboard');
            },
            onError: (ctx) => {
                setError(ctx.error.message || "Erro ao criar conta. Verifique os dados.");
                setIsLoading(false);
            }
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col md:flex-row">

                {/* Visual Side */}
                <div className="hidden md:flex w-1/3 bg-blue-600 p-8 flex-col justify-between text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                            <Bus size={24} />
                        </div>
                        <h2 className="text-xl font-black uppercase tracking-widest mb-2">J.Jê Turismo</h2>
                        <p className="text-blue-100 text-xs font-medium leading-relaxed">
                            Junte-se à plataforma de gestão de logística e turismo mais completa.
                        </p>
                    </div>
                    <div className="relative z-10 space-y-4">
                        <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10">
                            <div className="flex items-center gap-3 mb-2">
                                <CheckCircle size={16} className="text-emerald-400" />
                                <span className="text-xs font-bold uppercase tracking-wider">Gestão Total</span>
                            </div>
                            <p className="text-[10px] text-blue-100/80">Controle frotas, motoristas e viagens em um só lugar.</p>
                        </div>
                    </div>

                    {/* Abstract circles */}
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500 rounded-full blur-3xl opacity-50"></div>
                    <div className="absolute top-10 -left-10 w-40 h-40 bg-blue-400 rounded-full blur-3xl opacity-30"></div>
                </div>

                {/* Form Side */}
                <div className="flex-1 p-8 md:p-12">
                    <Link to="/login" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 mb-8 transition-colors w-fit">
                        <ArrowLeft size={14} /> Voltar para Login
                    </Link>

                    <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Criar Nova Conta</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 font-medium">Preencha os dados completos para acesso ao sistema.</p>

                    <form onSubmit={handleSignup} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nome Completo</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        name="name"
                                        type="text"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 h-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-semibold"
                                        placeholder="Seu nome"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Username</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">@</span>
                                    <input
                                        name="username"
                                        type="text"
                                        value={formData.username}
                                        onChange={handleChange}
                                        className="w-full pl-8 pr-4 h-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-semibold lowercase"
                                        placeholder="usuario"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 h-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-semibold"
                                        placeholder="seu@email.com"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Telefone (WhatsApp)</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        name="phone"
                                        type="text"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 h-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-semibold"
                                        placeholder="(00) 00000-0000"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Documento</label>
                            <div className="flex gap-2">
                                <select
                                    name="documento_tipo"
                                    value={formData.documento_tipo}
                                    onChange={handleChange}
                                    className="w-24 h-12 px-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold"
                                >
                                    <option value="CPF">CPF</option>
                                    <option value="RG">RG</option>
                                    <option value="CNPJ">CNPJ</option>
                                    <option value="PASSAPORTE">PASSP</option>
                                </select>
                                <div className="relative flex-1">
                                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        name="documento"
                                        type="text"
                                        value={formData.documento}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 h-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-semibold"
                                        placeholder="Número do documento"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Senha</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 h-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-semibold"
                                        placeholder="••••••••"
                                        required
                                        minLength={8}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Confirmar Senha</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        name="confirmPassword"
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 h-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm font-semibold"
                                        placeholder="••••••••"
                                        required
                                        minLength={8}
                                    />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl animate-shake">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'FINALIZAR CADASTRO'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
