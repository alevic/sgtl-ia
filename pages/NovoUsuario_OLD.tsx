import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authClient } from '../lib/auth-client';
import { Lock, Mail, Loader2, Save, ArrowLeft, Shield } from 'lucide-react';
import { UserRole } from '../types';
import { UsernameInput } from '../components/Form/UsernameInput';
import { PhoneInput } from '../components/Form/PhoneInput';
import { CPFInput } from '../components/Form/CPFInput';
import { DateInput } from '../components/Form/DateInput';

export const NovoUsuario: React.FC = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [countryCode, setCountryCode] = useState('+55');
    const [cpf, setCpf] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<string>(UserRole.USER);
    const [notes, setNotes] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Format phone with country code
            const fullPhone = `${countryCode}${phone}`;

            // Create user via API
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    username,
                    name,
                    phone: fullPhone,
                    email: email || undefined,
                    cpf: cpf || undefined,
                    birthDate: birthDate ? `${birthDate.substring(4, 8)}-${birthDate.substring(2, 4)}-${birthDate.substring(0, 2)}` : undefined,
                    role,
                    password,
                }),
            });

            if (response.ok) {
                navigate('/admin/usuarios');
            } else {
                const data = await response.json();
                setError(data.error || 'Erro ao criar usuário');
            }
        } catch (err) {
            setError('Erro ao conectar com o servidor');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/usuarios')}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
                </button>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Novo Usuário</h1>
            </div>

            <div className="max-w-2xl bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
                <form onSubmit={handleSignup} className="space-y-6">
                    {/* Nome Completo */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Nome Completo <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                            placeholder="Nome do usuário"
                            required
                        />
                    </div>

                    {/* Username */}
                    <UsernameInput
                        value={username}
                        onChange={setUsername}
                        name={name}
                        required
                    />

                    {/* Telefone */}
                    <PhoneInput
                        value={phone}
                        onChange={setPhone}
                        countryCode={countryCode}
                        onCountryChange={setCountryCode}
                        required
                    />

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
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                                placeholder="email@empresa.com"
                            />
                        </div>
                    </div>

                    {/* CPF */}
                    <CPFInput
                        value={cpf}
                        onChange={setCpf}
                        required={false}
                    />

                    {/* Data de Nascimento */}
                    <DateInput
                        value={birthDate}
                        onChange={setBirthDate}
                        required={false}
                        minAge={18}
                    />

                    {/* Role */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Função (Role) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white appearance-none"
                            >
                                <option value={UserRole.USER}>Usuário Padrão</option>
                                <option value={UserRole.ADMIN}>Administrador</option>
                                <option value={UserRole.FINANCEIRO}>Financeiro</option>
                                <option value={UserRole.OPERACIONAL}>Operacional</option>
                            </select>
                        </div>
                    </div>

                    {/* Observações */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Observações <span className="text-xs text-slate-500 ml-1">(opcional)</span>
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white resize-none"
                            placeholder="Observações sobre o usuário..."
                            rows={3}
                        />
                    </div>

                    {/* Ativo */}
                    <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                            Usuário ativo (pode fazer login)
                        </label>
                    </div>

                    {/* Senha */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Senha Inicial <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                                placeholder="••••••••"
                                required
                                minLength={8}
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Mínimo de 8 caracteres.</p>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Criar Usuário</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
