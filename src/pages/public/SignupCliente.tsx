import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Bus, ArrowRight, RefreshCcw, User, Mail, Lock, ShieldCheck, AlertCircle, CheckCircle2, Building2 } from 'lucide-react';
import { publicService } from '../../services/publicService';
import { UsernameInput } from '../../components/Form/UsernameInput';
import { DocumentInput } from '../../components/Form/DocumentInput';
import { PhoneInput } from '../../components/Form/PhoneInput';
import { TipoDocumento, TipoCliente } from '@/types';

export const SignupCliente: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const returnUrl = searchParams.get('returnUrl');

    // Client type
    const [tipoCliente, setTipoCliente] = useState<TipoCliente>(TipoCliente.PESSOA_FISICA);

    // Representative/Client data
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [countryCode, setCountryCode] = useState('+55');
    const [documentType, setDocumentType] = useState<TipoDocumento>(TipoDocumento.CPF);
    const [documentNumber, setDocumentNumber] = useState('');

    // Corporate data (only for PJ)
    const [razaoSocial, setRazaoSocial] = useState('');
    const [nomeFantasia, setNomeFantasia] = useState('');
    const [cnpj, setCnpj] = useState('');

    const [organizationId, setOrganizationId] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Password strength validation
    const getPasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
        if (!pwd) return { score: 0, label: '', color: '' };

        let score = 0;
        if (pwd.length >= 8) score++;
        if (pwd.length >= 12) score++;
        if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
        if (/\d/.test(pwd)) score++;
        if (/[^a-zA-Z0-9]/.test(pwd)) score++;

        if (score <= 2) return { score, label: 'Fraca', color: 'bg-red-500' };
        if (score === 3) return { score, label: 'Média', color: 'bg-yellow-500' };
        if (score === 4) return { score, label: 'Boa', color: 'bg-blue-500' };
        return { score, label: 'Forte', color: 'bg-green-500' };
    };

    const passwordStrength = getPasswordStrength(password);
    const isPasswordValid = password.length >= 8;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate password strength
        if (!isPasswordValid) {
            setError('A senha deve ter no mínimo 8 caracteres');
            return;
        }

        setIsLoading(true);

        try {
            const fullPhone = phone ? `${countryCode}${phone}` : '';

            await publicService.signupClient({
                tipo_cliente: tipoCliente,
                name,
                username,
                email,
                password,
                phone: fullPhone,
                documento_tipo: documentType,
                documento: documentNumber,
                razao_social: tipoCliente === TipoCliente.PESSOA_JURIDICA ? razaoSocial : null,
                nome_fantasia: tipoCliente === TipoCliente.PESSOA_JURIDICA ? nomeFantasia : null,
                cnpj: tipoCliente === TipoCliente.PESSOA_JURIDICA ? cnpj : null,
                organization_id: organizationId || null
            });

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
            <div className="bg-white dark:bg-slate-800 rounded-sm shadow-2xl p-8 max-w-2xl w-full border border-slate-200 dark:border-slate-700">

                {/* Logo Section */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-600 to-purple-600 rounded-sm flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
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
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 text-sm font-medium rounded-r-lg flex items-start gap-2">
                        <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Tipo de Cliente */}
                    <div className="mb-4">
                        <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1 mb-2">
                            Tipo de Cadastro <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setTipoCliente(TipoCliente.PESSOA_FISICA)}
                                className={`p-4 rounded-sm border-2 transition-all ${tipoCliente === TipoCliente.PESSOA_FISICA
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
                                    }`}
                            >
                                <User className="mx-auto mb-2" size={24} />
                                <div className="text-sm font-bold">Pessoa Física</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setTipoCliente(TipoCliente.PESSOA_JURIDICA)}
                                className={`p-4 rounded-sm border-2 transition-all ${tipoCliente === TipoCliente.PESSOA_JURIDICA
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
                                    }`}
                            >
                                <Building2 className="mx-auto mb-2" size={24} />
                                <div className="text-sm font-bold">Pessoa Jurídica</div>
                            </button>
                        </div>
                    </div>

                    {/* Corporate Fields (only for PJ) */}
                    {tipoCliente === TipoCliente.PESSOA_JURIDICA && (
                        <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-sm border border-blue-200 dark:border-blue-800 mb-4">
                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <Building2 size={16} />
                                Dados da Empresa
                            </h3>

                            <div>
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1 mb-1">
                                    Razão Social <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required={tipoCliente === TipoCliente.PESSOA_JURIDICA}
                                    value={razaoSocial}
                                    onChange={(e) => setRazaoSocial(e.target.value)}
                                    placeholder="Nome empresarial completo"
                                    disabled={isLoading}
                                    className="w-full h-14 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1 mb-1">
                                    Nome Fantasia
                                </label>
                                <input
                                    type="text"
                                    value={nomeFantasia}
                                    onChange={(e) => setNomeFantasia(e.target.value)}
                                    placeholder="Nome comercial (opcional)"
                                    disabled={isLoading}
                                    className="w-full h-14 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1 mb-1">
                                    CNPJ <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required={tipoCliente === TipoCliente.PESSOA_JURIDICA}
                                    value={cnpj}
                                    onChange={(e) => {
                                        const formatted = e.target.value.replace(/\D/g, '')
                                            .replace(/(\d{2})(\d)/, '$1.$2')
                                            .replace(/(\d{3})(\d)/, '$1.$2')
                                            .replace(/(\d{3})(\d)/, '$1/$2')
                                            .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
                                            .slice(0, 18);
                                        setCnpj(formatted);
                                    }}
                                    placeholder="00.000.000/0000-00"
                                    disabled={isLoading}
                                    className="w-full h-14 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all dark:text-white"
                                />
                            </div>

                            <hr className="border-blue-200 dark:border-blue-800" />
                            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                                <strong>Dados do Representante:</strong> Preencha abaixo as informações da pessoa responsável por esta conta.
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Nome Completo */}
                        <div className="md:col-span-2">
                            <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1 mb-1">
                                {tipoCliente === TipoCliente.PESSOA_JURIDICA ? 'Nome do Representante' : 'Nome Completo'} <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <User size={18} />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Como no documento"
                                    disabled={isLoading}
                                    className="w-full h-14 pl-11 pr-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Username */}
                        <div className="md:col-span-2">
                            <UsernameInput
                                value={username}
                                onChange={setUsername}
                                name={name}
                                required
                            />
                            <p className="mt-1 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest ml-1">
                                Seu identificador único para login. Mínimo 3 caracteres.
                            </p>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1 mb-1">
                                E-mail <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="exemplo@email.com"
                                    disabled={isLoading}
                                    className="w-full h-14 pl-11 pr-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Telefone */}
                        <div>
                            <PhoneInput
                                value={phone}
                                onChange={setPhone}
                                countryCode={countryCode}
                                onCountryCodeChange={setCountryCode}
                                required
                            />
                        </div>

                        {/* Document */}
                        <div className="md:col-span-2">
                            <DocumentInput
                                label={tipoCliente === TipoCliente.PESSOA_JURIDICA ? 'Documento do Representante' : 'Documento'}
                                documentType={documentType}
                                documentNumber={documentNumber}
                                onTypeChange={setDocumentType}
                                onNumberChange={setDocumentNumber}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        {/* Senha */}
                        <div className="md:col-span-2">
                            <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1 mb-1">
                                Senha <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    required
                                    minLength={8}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Mínimo 8 caracteres"
                                    disabled={isLoading}
                                    className="w-full h-14 pl-11 pr-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all dark:text-white"
                                />
                            </div>

                            {/* Password Strength Indicator */}
                            {password && (
                                <div className="mt-2">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            Força da senha:
                                        </span>
                                        <span className={`text-xs font-bold ${passwordStrength.score <= 2 ? 'text-red-600' :
                                            passwordStrength.score === 3 ? 'text-yellow-600' :
                                                passwordStrength.score === 4 ? 'text-blue-600' :
                                                    'text-green-600'
                                            }`}>
                                            {passwordStrength.label}
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${passwordStrength.color} transition-all duration-300`}
                                            style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                                        />
                                    </div>
                                    <div className="mt-2 space-y-1">
                                        <div className="flex items-center gap-2 text-xs">
                                            {password.length >= 8 ? (
                                                <CheckCircle2 size={14} className="text-green-600" />
                                            ) : (
                                                <AlertCircle size={14} className="text-slate-400" />
                                            )}
                                            <span className={password.length >= 8 ? 'text-green-600' : 'text-slate-500'}>
                                                Mínimo 8 caracteres
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            {/[a-z]/.test(password) && /[A-Z]/.test(password) ? (
                                                <CheckCircle2 size={14} className="text-green-600" />
                                            ) : (
                                                <AlertCircle size={14} className="text-slate-400" />
                                            )}
                                            <span className={/[a-z]/.test(password) && /[A-Z]/.test(password) ? 'text-green-600' : 'text-slate-500'}>
                                                Letras maiúsculas e minúsculas
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                            {/\d/.test(password) ? (
                                                <CheckCircle2 size={14} className="text-green-600" />
                                            ) : (
                                                <AlertCircle size={14} className="text-slate-400" />
                                            )}
                                            <span className={/\d/.test(password) ? 'text-green-600' : 'text-slate-500'}>
                                                Pelo menos um número
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed py-2">
                        Ao clicar em "Criar minha conta", você declara que leu e concorda com nossos
                        <a href="#" className="text-blue-600 font-bold ml-1">Termos de Uso</a> e
                        <a href="#" className="text-blue-600 font-bold ml-1">Política de Privacidade</a>.
                    </p>

                    <button
                        type="submit"
                        disabled={isLoading || !isPasswordValid}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-sm shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
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
                    <span className="text-[12px] font-bold uppercase tracking-wider">Seus dados estão protegidos</span>
                </div>
            </div>
        </div>
    );
};
