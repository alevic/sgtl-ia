import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, ArrowRight, MessageCircle, ShieldCheck, RefreshCcw, Lock, User, Key, Eye, EyeOff } from 'lucide-react';
import { authClient } from '../../lib/auth-client';
import { publicService } from '../../services/publicService';

type LoginStep = 'IDENTIFIER' | 'VERIFICATION';
type LoginMode = 'WHATSAPP' | 'PASSWORD';

export const LoginCliente: React.FC = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState<LoginMode>('WHATSAPP');
    const [step, setStep] = useState<LoginStep>('IDENTIFIER');
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendTimer, setResendTimer] = useState(0);

    // Resend countdown effect
    React.useEffect(() => {
        let timer: any;
        if (resendTimer > 0) {
            timer = setInterval(() => {
                setResendTimer(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [resendTimer]);

    const handleWhatsAppSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!identifier.trim()) {
            setError('Por favor, informe seu CPF ou Telefone.');
            return;
        }

        setIsLoading(true);
        try {
            // Normalize: remove non-digits
            let cleanIdentifier = identifier.replace(/\D/g, '');

            // Handle E.164 normalization (assuming Brazil for now)
            if (cleanIdentifier.length === 10 || cleanIdentifier.length === 11) {
                if (!cleanIdentifier.startsWith('55')) {
                    cleanIdentifier = '55' + cleanIdentifier;
                }
            }
            if (!cleanIdentifier.startsWith('+') && cleanIdentifier.length >= 10) {
                cleanIdentifier = '+' + cleanIdentifier;
            }

            if (cleanIdentifier.length < 10) {
                setError('Telefone inválido. Informe o DDD + Número.');
                setIsLoading(false);
                return;
            }

            console.log(`[AUTH] Solicitando OTP para: ${cleanIdentifier}`);

            const { error: authError } = await authClient.phoneNumber.sendOtp({
                phoneNumber: cleanIdentifier,
            });

            if (authError) {
                console.error('[AUTH ERROR] sendOtp:', authError);
                setError(authError.message || 'Erro ao enviar código.');
                return;
            }

            setStep('VERIFICATION');
            setResendTimer(45); // Start 45s countdown
        } catch (err: any) {
            console.error('[AUTH EXCEPTION] sendOtp:', err);
            setError('Ocorreu um erro ao enviar o código. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!identifier.trim() || !password.trim()) {
            setError('Por favor, informe suas credenciais.');
            return;
        }

        setIsLoading(true);
        try {
            let email = identifier;

            // If identifier looks like a CPF or Phone (mostly digits), resolve it to Email first
            const isDigitIdentifier = identifier.replace(/\D/g, '').length >= 10;
            if (isDigitIdentifier && !identifier.includes('@')) {
                try {
                    const resolved = await publicService.resolveIdentifier(identifier);
                    email = resolved.email;
                } catch (err: any) {
                    console.error('[AUTH] Erro ao resolver identificador:', err);
                    setError('Não encontramos uma conta vinculada a este identificador.');
                    setIsLoading(false);
                    return;
                }
            }

            console.log(`[AUTH] Tentando login com email: ${email}`);

            const { error: authError } = await authClient.signIn.email({
                email,
                password,
            });

            if (authError) {
                console.error('[AUTH ERROR] signIn.email:', authError);
                setError(authError.message || 'E-mail ou senha incorretos.');
                return;
            }

            navigate('/cliente/dashboard');
        } catch (err: any) {
            console.error('[AUTH EXCEPTION] login:', err);
            setError('Erro ao realizar login. Verifique seus dados.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCodeChange = (index: number, value: string) => {
        if (value.length > 1) value = value.slice(-1);
        if (!/^\d*$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        // Auto focus next input
        if (value && index < 5) {
            const nextInput = document.getElementById(`code-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            const prevInput = document.getElementById(`code-${index - 1}`);
            prevInput?.focus();
        }
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const fullCode = code.join('');
        if (fullCode.length < 6) {
            setError('Informe o código completo de 6 dígitos.');
            return;
        }

        setIsLoading(true);
        try {
            let cleanIdentifier = identifier.replace(/\D/g, '');

            // Apply same normalization as sendOtp
            if (cleanIdentifier.length === 10 || cleanIdentifier.length === 11) {
                if (!cleanIdentifier.startsWith('55')) {
                    cleanIdentifier = '55' + cleanIdentifier;
                }
            }
            if (!cleanIdentifier.startsWith('+') && cleanIdentifier.length >= 10) {
                cleanIdentifier = '+' + cleanIdentifier;
            }

            console.log(`[AUTH] Verificando OTP para: ${cleanIdentifier} - Código: ${fullCode}`);

            const { data, error: authError } = await authClient.phoneNumber.verify({
                phoneNumber: cleanIdentifier,
                code: fullCode,
            });

            if (authError) {
                console.error('[AUTH ERROR] verify:', authError);
                setError(authError.message || 'Código inválido ou expirado.');
                return;
            }

            console.log('[AUTH SUCCESS] verify:', data);
            navigate('/cliente/dashboard');
        } catch (err: any) {
            console.error('[AUTH EXCEPTION] verify:', err);
            setError('Erro ao verificar código.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-slate-900 dark:to-slate-800 p-4 font-sans">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full border border-slate-200 dark:border-slate-700">

                {/* Logo Section */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                        <Bus size={40} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                        SGTL Cliente
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
                        {step === 'IDENTIFIER'
                            ? 'Sua viagem começa com um acesso seguro.'
                            : 'Enviamos um código para seu WhatsApp.'}
                    </p>
                </div>

                {/* Login Method Tabs */}
                {step === 'IDENTIFIER' && (
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl mb-8">
                        <button
                            onClick={() => setMode('WHATSAPP')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${mode === 'WHATSAPP'
                                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            <MessageCircle size={16} />
                            WhatsApp
                        </button>
                        <button
                            onClick={() => setMode('PASSWORD')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${mode === 'PASSWORD'
                                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            <Lock size={16} />
                            Senha
                        </button>
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 text-sm font-medium rounded-r-lg">
                        {error}
                    </div>
                )}

                {step === 'IDENTIFIER' ? (
                    <form onSubmit={mode === 'WHATSAPP' ? handleWhatsAppSubmit : handlePasswordSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                {mode === 'WHATSAPP' ? 'CPF ou Telefone' : 'E-mail ou CPF'}
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <User size={20} />
                                </div>
                                <input
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    placeholder={mode === 'WHATSAPP' ? "000.000.000-00 ou (00) 00000-0000" : "exemplo@email.com ou CPF"}
                                    disabled={isLoading}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all dark:text-white text-lg"
                                />
                            </div>
                        </div>

                        {mode === 'PASSWORD' && (
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Sua Senha
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Key size={20} />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        disabled={isLoading}
                                        className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all dark:text-white text-lg"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                <div className="flex justify-end mt-2">
                                    <a href="#" className="text-xs font-bold text-blue-600 hover:underline">Esqueceu a senha?</a>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <RefreshCcw className="animate-spin" size={20} />
                            ) : (
                                <>
                                    {mode === 'WHATSAPP' ? 'Receber código no WhatsApp' : 'Acessar minha conta'}
                                    {mode === 'WHATSAPP' ? <MessageCircle size={20} /> : <ArrowRight size={20} />}
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyCode} className="space-y-8">
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                    Código de Verificação
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setStep('IDENTIFIER')}
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-500"
                                >
                                    Alterar número
                                </button>
                            </div>
                            <div className="flex justify-between gap-2">
                                {code.map((digit, index) => (
                                    <input
                                        key={index}
                                        id={`code-${index}`}
                                        type="text"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleCodeChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        disabled={isLoading}
                                        className="w-full aspect-square text-center text-2xl font-bold bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all dark:text-white"
                                    />
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <RefreshCcw className="animate-spin" size={20} />
                            ) : (
                                <>
                                    Confirmar e Entrar
                                    <ShieldCheck size={20} />
                                </>
                            )}
                        </button>

                        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                            Não recebeu o código? {' '}
                            <button
                                type="button"
                                onClick={handleWhatsAppSubmit}
                                disabled={resendTimer > 0 || isLoading}
                                className={`font-bold ${resendTimer > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-blue-600 hover:underline'}`}
                            >
                                {resendTimer > 0
                                    ? `Reenviar em 0:${resendTimer < 10 ? `0${resendTimer}` : resendTimer}`
                                    : 'Reenviar código'}
                            </button>
                        </p>
                    </form>
                )}

                {/* Footer Info */}
                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 text-center">
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        Ao entrar, você concorda com nossos <br />
                        <a href="#" className="underline">Termos de Uso</a> e <a href="#" className="underline">Privacidade</a>.
                    </p>
                </div>
            </div>
        </div>
    );
};
