// Complete User Form Component - For User Management (Create/Edit) and Profile
// Includes: Avatar (base64), Name, Username, Email, Phone, CPF, Birth Date, Password, Role, Notes, Active status

import React, { useState, useEffect } from 'react';
import { User, Mail, Loader2, Camera, Trash2, Lock, Shield } from 'lucide-react';
import { PhoneInput } from '../Form/PhoneInput';
import { CPFInput } from '../Form/CPFInput';
import { DatePicker } from '../Form/DatePicker';
import { UsernameInput } from '../Form/UsernameInput';

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
    const [cpf, setCpf] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user');
    const [notes, setNotes] = useState('');
    const [isActive, setIsActive] = useState(true);

    const [isLoading, setIsLoading] = useState(mode !== 'create');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

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
                setRole(user.role || 'user');
                setNotes(user.notes || '');
                setIsActive(user.isActive !== false);

                // Extract phone without country code
                const fullPhone = user.phone || '';
                const phoneWithoutCode = fullPhone.startsWith('+55') ? fullPhone.substring(3) : fullPhone;
                setPhone(phoneWithoutCode);

                setCpf(user.cpf || '');

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
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecione apenas imagens');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            alert('A imagem deve ter no máximo 2MB');
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
        setIsSaving(true);

        try {
            const fullPhone = phone ? `${countryCode}${phone}` : '';

            const data: any = {
                name,
                email: email || null,
                phone: fullPhone,
                cpf: cpf || null,
                birthDate: birthDate || null,
                image: avatar || null,
            };

            // Add fields based on mode
            if (mode === 'create') {
                data.username = username;
                data.password = password;
            }

            if (showRole) {
                data.role = role;
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
        } finally {
            setIsSaving(false);
        }
    };

    const avatarUrl = avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || username)}&size=400`;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
                    {error}
                </div>
            )}

            {/* Avatar Section */}
            {showAvatar && (
                <div className="flex items-center gap-6 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
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
                        <h3 className="font-semibold text-slate-800 dark:text-white">{name || username || 'Novo Usuário'}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {username ? `@${username}` : 'Defina um username'}
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nome Completo */}
                <div>
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
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                            placeholder="Nome completo do usuário"
                        />
                    </div>
                </div>

                {/* Username */}
                <div>
                    <UsernameInput
                        value={username}
                        onChange={setUsername}
                        name={name}
                        disabled={!canEditUsername}
                        required={mode === 'create'}
                    />
                    {!canEditUsername && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            O username não pode ser alterado
                        </p>
                    )}
                </div>

                {/* Email */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Email
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
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

                {/* CPF */}
                <div>
                    <CPFInput value={cpf} onChange={setCpf} />
                </div>

                {/* Data de Nascimento */}
                <div>
                    <DatePicker value={birthDate} onChange={setBirthDate} label="Data de Nascimento" />
                </div>

                {/* Password (only for create mode) */}
                {showPassword && (
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Senha <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required={mode === 'create'}
                                minLength={6}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                                placeholder="Mínimo 6 caracteres"
                            />
                        </div>
                    </div>
                )}

                {/* Role */}
                {showRole && (
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            <Shield className="inline mr-1" size={16} />
                            Função
                        </label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                        >
                            <option value="user">Usuário</option>
                            <option value="admin">Administrador</option>
                            <option value="operacional">Operacional</option>
                            <option value="financeiro">Financeiro</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Notes */}
            {showNotes && (
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Observações
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                        placeholder="Observações internas sobre o usuário..."
                    />
                </div>
            )}

            {/* Is Active */}
            {showIsActive && (
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        id="isActive"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Usuário Ativo
                    </label>
                </div>
            )}

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-semibold transition-colors"
                    >
                        Cancelar
                    </button>
                )}
                <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="animate-spin" size={18} />
                            Salvando...
                        </>
                    ) : (
                        mode === 'create' ? 'Criar Usuário' : 'Salvar Alterações'
                    )}
                </button>
            </div>
        </form>
    );
};
