// SIMPLIFIED VERSION - Using base64 for avatar (same as Trip/Vehicle images)
// Key changes:
// 1. Removed async avatar upload endpoint
// 2. Avatar now uses FileReader to convert to base64
// 3. Avatar saved directly in handleSubmit with other fields
// 4. Removed isUploadingAvatar state

import React, { useState, useEffect } from 'react';
import { User, Mail, Loader2, Camera, Upload, Trash2 } from 'lucide-react';
import { PhoneInput } from '../Form/PhoneInput';
import { CPFInput } from '../Form/CPFInput';
import { DatePicker } from '../Form/DatePicker';

interface UserProfileFormProps {
    userId: string;
    onSave?: (data: any) => Promise<void>;
    canEditRole?: boolean;
    canEditUsername?: boolean;
    showAvatar?: boolean;
    showNotes?: boolean;
    showIsActive?: boolean;
    isCurrentUser?: boolean;
}

export const UserProfileForm: React.FC<UserProfileFormProps> = ({
    userId,
    onSave,
    canEditRole = false,
    canEditUsername = false,
    showAvatar = true,
    showNotes = false,
    showIsActive = false,
    isCurrentUser = false,
}) => {
    const [username, setUsername] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [cpf, setCpf] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [avatar, setAvatar] = useState('');
    const [role, setRole] = useState('user');
    const [notes, setNotes] = useState('');
    const [isActive, setIsActive] = useState(true);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchUserData();
    }, [userId]);

    const fetchUserData = async () => {
        try {
            setIsLoading(true);
            const endpoint = isCurrentUser
                ? `${import.meta.env.VITE_API_URL}/api/profile`
                : `${import.meta.env.VITE_API_URL}/api/users/${userId}`;

            const response = await fetch(endpoint, {
                credentials: 'include',
            });

            if (response.ok) {
                const user = await response.json();
                console.log('📅 User data received:', { birth_date: user.birth_date });
                setUsername(user.username || '');
                setName(user.name || '');
                setEmail(user.email || '');
                console.log('🖼️ Avatar from DB (image field):', user.image);
                console.log('🖼️ Avatar state will be set to:', user.image || '');
                setAvatar(user.image || '');
                setRole(user.role || 'user');
                setNotes(user.notes || '');
                setIsActive(user.isActive !== false);

                // Extract phone without country code
                const fullPhone = user.phone || '';
                const phoneWithoutCode = fullPhone.startsWith('+55') ? fullPhone.substring(3) : fullPhone;
                setPhone(phoneWithoutCode);

                setCpf(user.cpf || '');

                // Convert birth_date from ISO timestamp to YYYY-MM-DD
                let birthDateValue = '';
                if (user.birth_date) {
                    birthDateValue = user.birth_date.split('T')[0]; // Extract YYYY-MM-DD
                }
                setBirthDate(birthDateValue);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            setError('Erro ao carregar dados do usuário');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSaving(true);

        try {
            const fullPhone = phone ? `+55${phone}` : '';
            const formattedBirthDate = birthDate || null;

            const data = {
                name,
                email: email || null,
                phone: fullPhone,
                cpf: cpf || null,
                birthDate: formattedBirthDate,
                image: avatar || null, // Save base64 avatar
                role: canEditRole ? role : undefined,
                notes: showNotes ? notes : undefined,
                isActive: showIsActive ? isActive : undefined,
            };

            if (onSave) {
                await onSave(data);
            } else {
                const endpoint = isCurrentUser
                    ? `${import.meta.env.VITE_API_URL}/api/profile`
                    : `${import.meta.env.VITE_API_URL}/api/users/${userId}`;

                const response = await fetch(endpoint, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify(data),
                });

                if (response.ok) {
                    alert('Perfil atualizado com sucesso!');
                    fetchUserData();
                } else {
                    const errorData = await response.json();
                    setError(errorData.error || 'Erro ao atualizar perfil');
                }
            }
        } catch (err) {
            console.error('Save error:', err);
            setError('Erro ao atualizar perfil');
        } finally {
            setIsSaving(false);
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

        // Use FileReader to convert to base64 (same as Trip/Vehicle image upload)
        const reader = new FileReader();
        reader.onloadend = () => {
            console.log('🖼️ Avatar converted to base64');
            setAvatar(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveAvatar = () => {
        if (!confirm('Deseja remover a foto do perfil?')) {
            return;
        }
        console.log('🖼️ Removing avatar');
        setAvatar('');
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
                        <h3 className="font-semibold text-slate-800 dark:text-white">{name || username}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">@{username}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Username */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Username
                    </label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            value={username}
                            disabled={!canEditUsername}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>
                    {!canEditUsername && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            O username não pode ser alterado
                        </p>
                    )}
                </div>

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
                        />
                    </div>
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
                        />
                    </div>
                </div>

                {/* Telefone */}
                <div>
                    <PhoneInput value={phone} onChange={setPhone} required />
                </div>

                {/* CPF */}
                <div>
                    <CPFInput value={cpf} onChange={setCpf} />
                </div>

                {/* Data de Nascimento */}
                <div>
                    <DatePicker value={birthDate} onChange={setBirthDate} label="Data de Nascimento" />
                </div>

                {/* Role (if allowed) */}
                {canEditRole && (
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Função
                        </label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                        >
                            <option value="user">Usuário</option>
                            <option value="admin">Administrador</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Notes (if allowed) */}
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
                    />
                </div>
            )}

            {/* Is Active (if allowed) */}
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

            {/* Submit Button */}
            <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
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
                        'Salvar Alterações'
                    )}
                </button>
            </div>
        </form>
    );
};
