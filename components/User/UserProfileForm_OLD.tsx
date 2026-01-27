import React, { useState, useEffect } from 'react';
import { User, Mail, Loader2, Camera, Upload, Trash2 } from 'lucide-react';
import { PhoneInput } from '../Form/PhoneInput';
import { CPFInput } from '../Form/CPFInput';
import { SwissDatePicker } from '../Form/SwissDatePicker';

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
    isCurrentUser = false
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [error, setError] = useState('');

    // Form fields
    const [username, setUsername] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [countryCode, setCountryCode] = useState('+55');
    const [cpf, setCpf] = useState('');
    const [birthDate, setBirthDate] = useState(''); // YYYY-MM-DD format
    const [role, setRole] = useState('user');
    const [notes, setNotes] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [avatar, setAvatar] = useState('');

    useEffect(() => {
        fetchUserData();
    }, [userId]);

    const fetchUserData = async () => {
        setIsLoading(true);
        setError('');
        try {
            const endpoint = isCurrentUser
                ? `${import.meta.env.VITE_API_URL}/api/profile`
                : `${import.meta.env.VITE_API_URL}/api/users/${userId}`;

            const response = await fetch(endpoint, {
                credentials: 'include'
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
                setIsActive(user.is_active !== false);

                // Parse phone
                if (user.phone) {
                    const match = user.phone.match(/^(\+\d{1,3})(.+)$/);
                    if (match) {
                        setCountryCode(match[1]);
                        setPhone(match[2].replace(/\D/g, ''));
                    } else {
                        setPhone(user.phone.replace(/\D/g, ''));
                    }
                }

                setCpf(user.cpf || '');

                // Convert birth_date from ISO timestamp to YYYY-MM-DD format
                let birthDateValue = '';
                if (user.birth_date) {
                    // birth_date comes as "1982-01-16T03:00:00.000Z" from database
                    // Extract just the YYYY-MM-DD part
                    birthDateValue = user.birth_date.split('T')[0];
                }
                console.log('📅 Setting birthDate to:', birthDateValue);
                setBirthDate(birthDateValue);
            } else {
                setError('Erro ao carregar dados do usuário');
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setError('Erro ao carregar dados do usuário');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !phone) {
            setError('Nome e telefone são obrigatórios');
            return;
        }

        setIsSaving(true);
        setError('');

        try {
            const fullPhone = `${countryCode}${phone}`;
            // birthDate is already in YYYY-MM-DD format
            const formattedBirthDate = birthDate || null;

            console.log('📅 Saving birthDate:', formattedBirthDate);

            const data = {
                name,
                email: email || null,
                phone: fullPhone,
                cpf: cpf || null,
                birthDate: formattedBirthDate,
                role: canEditRole ? role : undefined,
                notes: showNotes ? (notes || null) : undefined,
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

    const handleAvatarUpload = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecione apenas imagens');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            alert('A imagem deve ter no máximo 2MB');
            return;
        }

        setIsUploadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append('avatar', file);

            const endpoint = isCurrentUser
                ? `${import.meta.env.VITE_API_URL}/api/profile/avatar`
                : `${import.meta.env.VITE_API_URL}/api/users/${userId}/avatar`;

            const response = await fetch(endpoint, {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                console.log('🖼️ Avatar upload response:', data);
                setAvatar(data.imageUrl);
                // Reload user data to ensure avatar is updated
                await fetchUserData();
                alert('Foto atualizada com sucesso!');
            } else {
                const error = await response.json();
                alert(error.error || 'Erro ao fazer upload da imagem');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Erro ao fazer upload da imagem');
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const handleRemoveAvatar = async () => {
        if (!confirm('Deseja remover a foto do perfil?')) {
            return;
        }

        setIsUploadingAvatar(true);
        try {
            const endpoint = isCurrentUser
                ? `${import.meta.env.VITE_API_URL}/api/profile`
                : `${import.meta.env.VITE_API_URL}/api/users/${userId}`;

            const response = await fetch(endpoint, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ image: null }),
            });

            if (response.ok) {
                setAvatar('');
                await fetchUserData();
                alert('Foto removida com sucesso!');
            } else {
                alert('Erro ao remover foto');
            }
        } catch (error) {
            console.error('Remove avatar error:', error);
            alert('Erro ao remover foto');
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const avatarUrl = avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || username)}&size=400`;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-sm">
                    {error}
                </div>
            )}

            {/* Avatar Section */}
            {showAvatar && (
                <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-sm">
                    <div className="relative group">
                        <img
                            src={avatarUrl}
                            alt={name}
                            className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-slate-700"
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
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={!canEditUsername}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white disabled:bg-slate-100 dark:disabled:bg-slate-900/50 disabled:text-slate-500 dark:disabled:text-slate-400 disabled:cursor-not-allowed"
                        />
                    </div>
                    {!canEditUsername && (
                        <p className="text-xs text-slate-500 mt-1">O username não pode ser alterado</p>
                    )}
                </div>

                {/* Name */}
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
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                        />
                    </div>
                </div>

                {/* Email */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Email <span className="text-xs text-slate-500 ml-1">(opcional)</span>
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@empresa.com"
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                        />
                    </div>
                </div>

                {/* Phone */}
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
                    <CPFInput
                        value={cpf}
                        onChange={setCpf}
                        required={false}
                    />
                </div>

                {/* Birth Date */}
                <div>
                    {console.log('📅 Rendering DatePicker with birthDate:', birthDate)}
                    <SwissDatePicker
                        value={birthDate}
                        onChange={setBirthDate}
                        label="Data de Nascimento"
                        required={false}
                        minAge={0}
                    />
                </div>

                {/* Role (if admin) */}
                {canEditRole && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Função
                        </label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                        >
                            <option value="user">Usuário</option>
                            <option value="operacional">Operacional</option>
                            <option value="financeiro">Financeiro</option>
                            <option value="admin">Administrador</option>
                        </select>
                    </div>
                )}

                {/* Is Active (if admin) */}
                {showIsActive && (
                    <div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                                className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Usuário Ativo
                            </span>
                        </label>
                    </div>
                )}
            </div>

            {/* Notes (if admin) */}
            {showNotes && (
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Observações
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                        placeholder="Informações adicionais sobre o usuário..."
                    />
                </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
