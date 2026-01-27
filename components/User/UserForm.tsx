// Complete User Form Component - For User Management (Create/Edit) and Profile
// Includes: Avatar (base64), Name, Username, Email, Phone, CPF, Birth Date, Password, Role, Notes, Active status

import React, { useState, useEffect } from 'react';
import { User, Mail, Loader2, Camera, Trash2, Lock, Shield, AlertTriangle, CheckCircle2, Phone, CreditCard, Calendar, FileText } from 'lucide-react';
import { PhoneInput } from '../Form/PhoneInput';
import { DocumentInput } from '../Form/DocumentInput';
import { DatePicker } from '../Form/DatePicker';
import { UsernameInput } from '../Form/UsernameInput';
import { TipoDocumento } from '../../types';
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../ui/alert-dialog";

interface UserFormProps {
    // Mode
    mode: 'create' | 'edit' | 'profile';
    userId?: string;

    // Callbacks
    onSubmit: (data: any) => Promise<void>;
    onCancel?: () => void;

    // Field visibility
    showAvatar?: boolean;
    showPassword?: boolean;
    showRole?: boolean;
    showNotes?: boolean;
    showIsActive?: boolean;

    // Field editability
    canEditUsername?: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({
    mode,
    userId,
    onSubmit,
    onCancel,
    showAvatar = true,
    showPassword = mode === 'create',
    showRole = mode !== 'profile',
    showNotes = mode !== 'profile',
    showIsActive = mode !== 'profile',
    canEditUsername = mode === 'create',
}) => {
    // Form state
    const [avatar, setAvatar] = useState('');
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [countryCode, setCountryCode] = useState('+55');
    const [documentoTipo, setDocumentoTipo] = useState<TipoDocumento>(TipoDocumento.CPF);
    const [documento, setDocumento] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<string[]>(['user']);
    const [notes, setNotes] = useState('');
    const [isActive, setIsActive] = useState(true);

    const [isLoading, setIsLoading] = useState(mode !== 'create');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showDeleteAvatarConfirm, setShowDeleteAvatarConfirm] = useState(false);

    useEffect(() => {
        if (mode !== 'create' && userId) {
            fetchUserData();
        }
    }, [mode, userId]);

    const fetchUserData = async () => {
        try {
            setIsLoading(true);
            const endpoint = mode === 'profile'
                ? `${import.meta.env.VITE_API_URL}/api/profile`
                : `${import.meta.env.VITE_API_URL}/api/users/${userId}`;

            const response = await fetch(endpoint, {
                credentials: 'include',
            });

            if (response.ok) {
                const user = await response.json();
                setName(user.name || '');
                setUsername(user.username || '');
                setEmail(user.email || '');
                setAvatar(user.image || '');
                const roleString = user.role || 'user';
                setRole(roleString.split(',').map((r: string) => r.trim()));
                setNotes(user.notes || '');
                setIsActive(user.isActive !== false);

                // Extract phone without country code
                const fullPhone = user.phone || '';
                const phoneWithoutCode = fullPhone.startsWith('+55') ? fullPhone.substring(3) : fullPhone;
                setPhone(phoneWithoutCode);

                setDocumento(user.documento || user.cpf || '');
                setDocumentoTipo(user.documento_tipo || TipoDocumento.CPF);

                // Convert birth_date from ISO to YYYY-MM-DD
                if (user.birth_date) {
                    setBirthDate(user.birth_date.split('T')[0]);
                }
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            setError('Erro ao carregar dados do usuário');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarUpload = (file: File) => {
        setError('');
        if (!file.type.startsWith('image/')) {
            setError('Por favor, selecione apenas imagens');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setError('A imagem deve ter no máximo 2MB');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setAvatar(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveAvatar = () => {
        setShowDeleteAvatarConfirm(true);
    };

    const confirmRemoveAvatar = () => {
        setAvatar('');
        setShowDeleteAvatarConfirm(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsSaving(true);

        try {
            const fullPhone = phone ? `${countryCode}${phone}` : '';

            const data: any = {
                name,
                email: email || null,
                phone: fullPhone,
                documento: documento || null,
                documento_tipo: documentoTipo,
                birthDate: birthDate || null,
                image: avatar || null,
            };

            // Add fields based on mode
            if (mode === 'create') {
                data.username = username;
                data.password = password;
            }

            if (showRole) {
                data.role = role.join(',');
            }

            if (showNotes) {
                data.notes = notes;
            }

            if (showIsActive) {
                data.isActive = isActive;
            }

            await onSubmit(data);
        } catch (err) {
            console.error('Save error:', err);
            setError(err instanceof Error ? err.message : 'Erro ao salvar');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsSaving(false);
        }
    };

    const avatarUrl = avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || username)}&size=400`;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4 animate-in fade-in duration-500">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground">Sincronizando Dados...</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8 pb-20">
            <AlertDialog open={showDeleteAvatarConfirm} onOpenChange={setShowDeleteAvatarConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remover Foto?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Deseja remover a foto do perfil?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmRemoveAvatar} className="bg-red-600 hover:bg-red-700">
                            Remover
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {error && (
                <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro Operacional</AlertTitle>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Lateral: Foto e Status */}
                <div className="lg:col-span-1 space-y-8">
                    {showAvatar && (
                        <Card className="shadow-2xl shadow-muted/20 bg-card   border border-border/40 rounded-[2.5rem] overflow-hidden p-8 text-center flex flex-col items-center">
                            <div className="relative group mb-6">
                                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl relative">
                                    <img
                                        src={avatarUrl}
                                        alt={name || username}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="absolute -bottom-2 -right-2 flex gap-2">
                                    <label className="p-3 bg-primary text-primary-foreground rounded-sm hover:scale-110 transition-transform shadow-lg cursor-pointer flex items-center justify-center">
                                        <Camera size={18} strokeWidth={2.5} />
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
                                            className="p-3 bg-destructive text-destructive-foreground rounded-sm hover:scale-110 transition-transform shadow-lg flex items-center justify-center"
                                        >
                                            <Trash2 size={18} strokeWidth={2.5} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-black text-xs uppercase tracking-tight text-foreground">{name || 'NOME NÃO DEFINIDO'}</h3>
                                <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest">
                                    {username ? `@${username}` : 'AGUARDANDO IDENTIFICADOR'}
                                </p>
                            </div>

                            {showIsActive && (
                                <div className="mt-8 pt-8 border-t border-border/50 w-full">
                                    <label className="flex items-center justify-center gap-3 cursor-pointer group">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={isActive}
                                                onChange={(e) => setIsActive(e.target.checked)}
                                                className="sr-only"
                                            />
                                            <div className={`w-12 h-6 rounded-full transition-colors duration-300 ${isActive ? 'bg-primary' : 'bg-muted'}`} />
                                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                                        </div>
                                        <span className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
                                            {isActive ? 'Acesso Ativo' : 'Acesso Revogado'}
                                        </span>
                                    </label>
                                </div>
                            )}
                        </Card>
                    )}

                    {showRole && (
                        <Card className="shadow-2xl shadow-muted/20 bg-card   border border-border/40 rounded-[2.5rem] overflow-hidden p-8">
                            <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-6 flex items-center gap-2">
                                <Shield size={14} className="text-primary" />
                                Nível de Acesso
                            </h4>
                            <div className="space-y-3">
                                {[
                                    { id: 'admin', label: 'Administrador', desc: 'Controle total do ecossistema' },
                                    { id: 'operacional', label: 'Operacional', desc: 'Gestão de viagens e reservas' },
                                    { id: 'financeiro', label: 'Financeiro', desc: 'Controle de caixa e contas' },
                                    { id: 'user', label: 'Usuário Padrão', desc: 'Acesso às rotinas básicas' },
                                ].map((r) => {
                                    const isSelected = role.includes(r.id);
                                    return (
                                        <button
                                            key={r.id}
                                            type="button"
                                            onClick={() => {
                                                if (isSelected) {
                                                    // Don't allow deselecting 'user' if it's the only one, or deselecting if it's the last role
                                                    if (role.length > 1) {
                                                        setRole(role.filter(id => id !== r.id));
                                                    }
                                                } else {
                                                    setRole([...role, r.id]);
                                                }
                                            }}
                                            className={`w-full p-4 rounded-sm border transition-all text-left group ${isSelected
                                                ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5'
                                                : 'border-border/40 hover:border-primary/40'
                                                }`}
                                        >
                                            <p className={`text-[12px] font-black uppercase tracking-widest ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>{r.label}</p>
                                            <p className="text-[9px] font-bold text-muted-foreground/60 mt-1 uppercase leading-tight">{r.desc}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </Card>
                    )}
                </div>

                {/* Principal: Dados do Usuário */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="shadow-2xl shadow-muted/20 bg-card   border border-border/40 rounded-[2.5rem] overflow-hidden">
                        <div className="p-8 border-b border-border/50 bg-muted">
                            <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                <User size={14} className="text-primary" />
                                Identidade e Acesso
                            </h3>
                        </div>
                        <div className="p-8 space-y-8">
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Nome Completo</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        className="w-full h-14 pl-12 pr-4 bg-muted border border-border/50 rounded-sm font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                                        placeholder="Ex: Alexandre de Moraes"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Identificador / Username</label>
                                    <div className="relative group">
                                        <UsernameInput
                                            value={username}
                                            onChange={setUsername}
                                            name={name}
                                            disabled={!canEditUsername}
                                            required={mode === 'create'}
                                            showLabel={false}
                                        />
                                    </div>
                                    {!canEditUsername && (
                                        <p className="mt-1.5 ml-1 text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                                            <Lock size={10} /> Identificador inalterável conforme protocolo
                                        </p>
                                    )}
                                </div>
                                {showPassword && (
                                    <div className="space-y-1.5">
                                        <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Senha Corporativa</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required={mode === 'create'}
                                                minLength={6}
                                                className="w-full h-14 pl-12 pr-4 bg-muted border border-border/50 rounded-sm font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                                                placeholder="Defina uma senha segura"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">E-mail Corporativo</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full h-14 pl-12 pr-4 bg-muted border border-border/50 rounded-sm font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                                            placeholder="email@ecossistema.com"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Telefone / WhatsApp</label>
                                    <PhoneInput
                                        value={phone}
                                        onChange={setPhone}
                                        countryCode={countryCode}
                                        onCountryCodeChange={setCountryCode}
                                        required
                                        showLabel={false}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5 md:col-span-2">
                                    <DocumentInput
                                        documentType={documentoTipo}
                                        documentNumber={documento}
                                        onTypeChange={setDocumentoTipo}
                                        onNumberChange={setDocumento}
                                        required={false}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Data de Nascimento</label>
                                    <DatePicker value={birthDate} onChange={setBirthDate} />
                                </div>
                            </div>


                        </div>
                    </Card>

                    {showNotes && (
                        <Card className="shadow-2xl shadow-muted/20 bg-card   border border-border/40 rounded-[2.5rem] overflow-hidden">
                            <div className="p-8 border-b border-border/50 bg-muted">
                                <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                    <FileText size={14} className="text-primary" />
                                    Observações Operacionais
                                </h3>
                            </div>
                            <div className="p-8">
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={4}
                                    className="w-full p-4 bg-muted border border-border/50 rounded-sm font-medium text-sm transition-all focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                                    placeholder="Notas internas relevantes sobre o histórico do operador..."
                                />
                            </div>
                        </Card>
                    )}

                    {/* Botões de Ação Standardized */}
                    <div className="flex gap-4 pt-4">
                        {onCancel && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                                className="flex-1 h-14 rounded-sm border-border/40 font-black uppercase text-[12px] tracking-widest"
                            >
                                Cancelar Registro
                            </Button>
                        )}
                        <Button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 h-14 rounded-sm bg-primary text-primary-foreground font-black uppercase text-[12px] tracking-widest shadow-lg shadow-primary/20 group"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="animate-spin mr-2" size={18} />
                                    Processando...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="mr-2 group-hover:scale-110 transition-transform" size={18} />
                                    {mode === 'create' ? 'Finalizar Cadastro' : 'Sincronizar Alterações'}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    );
};
