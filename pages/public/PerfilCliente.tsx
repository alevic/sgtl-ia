import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, CreditCard, Calendar, Loader2, Camera, Trash2, Lock, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { authClient } from '../../lib/auth-client';
import { publicService } from '../../services/publicService';
import { PhoneInput } from '../../components/Form/PhoneInput';
import { DocumentInput } from '../../components/Form/DocumentInput';
import { SwissDatePicker } from '../../components/Form/SwissDatePicker';
import { TipoDocumento } from '../../types';

export const PerfilCliente: React.FC = () => {
    const navigate = useNavigate();

    // Profile state
    const [avatar, setAvatar] = useState('');
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [countryCode, setCountryCode] = useState('+55');
    const [documentoTipo, setDocumentoTipo] = useState<TipoDocumento>(TipoDocumento.CPF);
    const [documento, setDocumento] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [credits, setCredits] = useState(0);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setIsLoading(true);
            const profile = await publicService.getClientProfile();

            setName(profile.name || '');
            setUsername(profile.username || '');
            setEmail(profile.email || '');
            setAvatar(profile.image || '');
            setCredits(profile.saldo_creditos || 0);

            // Extract phone without country code
            const fullPhone = profile.phone || '';
            const phoneWithoutCode = fullPhone.startsWith('+55') ? fullPhone.substring(3) : fullPhone;
            setPhone(phoneWithoutCode);

            setDocumento(profile.documento || profile.cpf || '');
            setDocumentoTipo(profile.documento_tipo || TipoDocumento.CPF);

            // Convert birth_date from ISO to YYYY-MM-DD
            if (profile.birth_date) {
                setBirthDate(profile.birth_date.split('T')[0]);
            }
        } catch (err: any) {
            console.error('Error fetching profile:', err);
            if (err.message.includes('401') || err.message.includes('Unauthorized')) {
                navigate('/cliente/login');
            } else {
                setError('Erro ao carregar perfil');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarUpload = (file: File) => {
        setError('');
        setSuccess('');

        if (!file.type.startsWith('image/')) {
            setError('Por favor, selecione apenas imagens');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setError('A imagem deve ter no máximo 2MB');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatar(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveAvatar = () => {
        if (!confirm('Deseja remover a foto do perfil?')) {
            return;
        }
        setAvatar('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsSaving(true);

        try {
            const fullPhone = phone ? `${countryCode}${phone}` : '';

            await publicService.updateClientProfile({
                name,
                email,
                phone: fullPhone,
                documento: documento || null,
                documento_tipo: documentoTipo,
                birthDate: birthDate || null,
                image: avatar || null,
            });

            setSuccess('Perfil atualizado com sucesso!');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            console.error('Save error:', err);
            setError(err.message || 'Erro ao salvar perfil');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        await authClient.signOut();
        navigate('/cliente/login');
    };

    const avatarUrl = avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || username)}&size=400`;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
                <Loader2 className="animate-spin text-blue-600 mb-4" size={32} />
                <p className="text-slate-500 font-medium">Carregando perfil...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
            {/* Mobile Header */}
            <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-4 sticky top-0 z-10">
                <div className="flex items-center justify-between max-w-2xl mx-auto">
                    <button
                        onClick={() => navigate('/cliente/dashboard')}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-sm transition-colors"
                    >
                        <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
                    </button>
                    <h1 className="font-bold text-slate-800 dark:text-white">Meu Perfil</h1>
                    <button
                        onClick={handleLogout}
                        className="text-sm text-red-600 dark:text-red-400 font-bold"
                    >
                        Sair
                    </button>
                </div>
            </header>

            {/* Content Area */}
            <main className="flex-1 max-w-2xl mx-auto w-full p-4 space-y-6 pb-24">
                {error && (
                    <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Erro na Operação</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 animate-in fade-in slide-in-from-top-2 duration-300">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <AlertTitle>Sucesso</AlertTitle>
                        <AlertDescription>{success}</AlertDescription>
                    </Alert>
                )}

                {/* Credit Balance Card */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-sm p-6 text-white shadow-xl shadow-blue-500/20">
                    <p className="text-blue-100 text-sm font-medium">Saldo de Créditos</p>
                    <h2 className="text-3xl font-bold mt-1">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(credits)}
                    </h2>
                </div>

                {/* Profile Form */}
                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-6">
                    {/* Avatar Section */}
                    <div className="flex items-center gap-6 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-sm border border-slate-200 dark:border-slate-700">
                        <div className="relative group">
                            <img
                                src={avatarUrl}
                                alt={name || username}
                                className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-lg"
                            />
                            <div className="absolute bottom-0 right-0 flex gap-1">
                                <label className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg cursor-pointer group-hover:scale-110 transform">
                                    <Camera size={16} />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
                                        className="hidden"
                                    />
                                </label>
                                {avatar && (
                                    <button
                                        type="button"
                                        onClick={handleRemoveAvatar}
                                        className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg group-hover:scale-110 transform"
                                        title="Remover foto"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-800 dark:text-white">{name || username}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">@{username}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Username não pode ser alterado</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Nome Completo */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Nome Completo <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                                    placeholder="Nome completo"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                E-mail <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                                    placeholder="email@exemplo.com"
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

                        {/* Documento */}
                        <div className="md:col-span-2">
                            <DocumentInput
                                documentType={documentoTipo}
                                documentNumber={documento}
                                onTypeChange={setDocumentoTipo}
                                onNumberChange={setDocumento}
                                label="Documento"
                                required={false}
                            />
                        </div>

                        {/* Data de Nascimento */}
                        <div>
                            <SwissDatePicker value={birthDate} onChange={setBirthDate} label="Data de Nascimento" />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={() => navigate('/cliente/dashboard')}
                            className="flex-1 px-6 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-sm font-semibold transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Salvar Alterações
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Change Password Link */}
                <button
                    onClick={() => {/* TODO: Implement password change modal */ }}
                    className="w-full bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-sm flex items-center justify-center">
                            <Lock size={20} />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-bold text-slate-800 dark:text-white">Alterar Senha</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Mantenha sua conta segura</p>
                        </div>
                    </div>
                    <ArrowLeft size={20} className="text-slate-400 rotate-180" />
                </button>
            </main>
        </div>
    );
};
