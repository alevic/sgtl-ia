import React, { useState, useEffect } from 'react';
import { authClient } from '../lib/auth-client';
import { Building2, Plus, Loader2, CheckCircle, AlertCircle, Users, ArrowLeft, Save, Trash2 } from 'lucide-react';
import { TeamManagement } from '../components/TeamManagement';
import { useApp } from '../context/AppContext';

interface OrganizationDetails {
    id: string;
    name: string;
    slug: string;
    legal_name?: string;
    cnpj?: string;
    address?: string;
    contact_email?: string;
    phone?: string;
    website?: string;
}

export const Organizacoes: React.FC = () => {
    const { currentContext } = useApp();
    const [orgs, setOrgs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
    const [orgDetails, setOrgDetails] = useState<OrganizationDetails | null>(null);
    const [activeDetailTab, setActiveDetailTab] = useState<'geral' | 'equipe'>('geral');

    // Creation State
    const [isCreating, setIsCreating] = useState(false);
    const [newOrgName, setNewOrgName] = useState('');
    const [newOrgSlug, setNewOrgSlug] = useState('');

    // Feedback State
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const fetchOrgs = async () => {
        setIsLoading(true);
        const { data } = await authClient.organization.list();
        if (data) {
            setOrgs(data);
        }
        setIsLoading(false);
    };

    const fetchOrgDetails = async (id: string) => {
        setIsLoading(true);
        try {
            await authClient.organization.setActive({ organizationId: id });

            const response = await fetch(`http://localhost:4000/api/organization/${id}/details`, {
                credentials: 'include',
                headers: {
                    ...await authClient.getHeaders()
                }
            });

            if (response.ok) {
                const data = await response.json();
                setOrgDetails(data);
            } else {
                setError('Falha ao carregar detalhes da organização.');
            }
        } catch (err) {
            console.error(err);
            setError('Erro de conexão.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrgs();
    }, []);

    useEffect(() => {
        if (selectedOrgId) {
            fetchOrgDetails(selectedOrgId);
        }
    }, [selectedOrgId]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        setError('');
        setSuccess('');

        await authClient.organization.create({
            name: newOrgName,
            slug: newOrgSlug,
        }, {
            onSuccess: () => {
                setSuccess('Organização criada com sucesso!');
                setNewOrgName('');
                setNewOrgSlug('');
                fetchOrgs();
                setIsCreating(false);
            },
            onError: (ctx) => {
                setError(ctx.error.message);
                setIsCreating(false);
            }
        });
    };

    const handleUpdateDetails = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orgDetails) return;

        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`http://localhost:4000/api/organization/${orgDetails.id}/details`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...await authClient.getHeaders()
                },
                body: JSON.stringify({
                    legal_name: orgDetails.legal_name,
                    cnpj: orgDetails.cnpj,
                    address: orgDetails.address,
                    contact_email: orgDetails.contact_email,
                    phone: orgDetails.phone,
                    website: orgDetails.website
                })
            });

            if (response.ok) {
                setSuccess('Dados atualizados com sucesso!');
            } else {
                setError('Falha ao atualizar dados.');
            }
        } catch (err) {
            setError('Erro ao salvar.');
        } finally {
            setIsSaving(false);
        }
    };

    // Helper to update local state
    const updateDetailField = (field: keyof OrganizationDetails, value: string) => {
        if (orgDetails) {
            setOrgDetails({ ...orgDetails, [field]: value });
        }
    };

    const themeColor = 'blue';

    if (selectedOrgId && orgDetails) {
        return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            setSelectedOrgId(null);
                            setOrgDetails(null);
                            fetchOrgs(); // Refresh list
                        }}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <ArrowLeft size={24} className="text-slate-600 dark:text-slate-400" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{orgDetails.name}</h1>
                        <p className="text-slate-500 dark:text-slate-400">Gerenciando organização</p>
                    </div>
                </div>

                {/* Detail Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-700">
                    <button
                        onClick={() => setActiveDetailTab('geral')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeDetailTab === 'geral'
                            ? `border-${themeColor}-600 text-${themeColor}-600 dark:text-${themeColor}-400`
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                            }`}
                    >
                        <Building2 size={18} />
                        Dados da Empresa
                    </button>
                    <button
                        onClick={() => setActiveDetailTab('equipe')}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeDetailTab === 'equipe'
                            ? `border-${themeColor}-600 text-${themeColor}-600 dark:text-${themeColor}-400`
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                            }`}
                    >
                        <Users size={18} />
                        Equipe
                    </button>
                </div>

                {activeDetailTab === 'geral' && (
                    <div className="max-w-3xl bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <form onSubmit={handleUpdateDetails} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome da Organização</label>
                                    <input
                                        type="text"
                                        value={orgDetails.name}
                                        disabled
                                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 cursor-not-allowed"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Slug</label>
                                    <input
                                        type="text"
                                        value={orgDetails.slug}
                                        disabled
                                        className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 cursor-not-allowed"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Razão Social</label>
                                    <input
                                        type="text"
                                        value={orgDetails.legal_name || ''}
                                        onChange={(e) => updateDetailField('legal_name', e.target.value)}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Razão Social Ltda"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">CNPJ</label>
                                    <input
                                        type="text"
                                        value={orgDetails.cnpj || ''}
                                        onChange={(e) => updateDetailField('cnpj', e.target.value)}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="00.000.000/0000-00"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Telefone</label>
                                    <input
                                        type="text"
                                        value={orgDetails.phone || ''}
                                        onChange={(e) => updateDetailField('phone', e.target.value)}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="(00) 00000-0000"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email de Contato</label>
                                    <input
                                        type="email"
                                        value={orgDetails.contact_email || ''}
                                        onChange={(e) => updateDetailField('contact_email', e.target.value)}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="contato@empresa.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Website</label>
                                    <input
                                        type="text"
                                        value={orgDetails.website || ''}
                                        onChange={(e) => updateDetailField('website', e.target.value)}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="https://www.empresa.com.br"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Endereço Completo</label>
                                    <textarea
                                        value={orgDetails.address || ''}
                                        onChange={(e) => updateDetailField('address', e.target.value)}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                                        placeholder="Rua, Número, Bairro, Cidade - UF"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm rounded-lg flex items-center gap-2">
                                    <CheckCircle size={16} />
                                    {success}
                                </div>
                            )}

                            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-700">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-70"
                                >
                                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                    <span>Salvar Alterações</span>
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {activeDetailTab === 'equipe' && (
                    <TeamManagement themeColor={themeColor} context={currentContext} />
                )}
            </div>
        );
    }

    // List View
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Organizações</h1>
                <p className="text-slate-500 dark:text-slate-400">Gerencie suas empresas e acessos.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Create Organization Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 sticky top-6">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Plus size={20} className="text-blue-600" />
                            Nova Organização
                        </h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome da Empresa</label>
                                <input
                                    type="text"
                                    value={newOrgName}
                                    onChange={(e) => {
                                        setNewOrgName(e.target.value);
                                        setNewOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                                    }}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Ex: JJê Turismo"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Slug (URL)</label>
                                <input
                                    type="text"
                                    value={newOrgSlug}
                                    onChange={(e) => setNewOrgSlug(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 rounded-lg outline-none"
                                    placeholder="ex: jje-turismo"
                                    required
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm rounded-lg flex items-center gap-2">
                                    <CheckCircle size={16} />
                                    {success}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isCreating}
                                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {isCreating ? <Loader2 className="animate-spin" size={20} /> : 'Criar Organização'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* List Organizations */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Building2 size={20} className="text-slate-600 dark:text-slate-400" />
                        Suas Empresas
                    </h2>

                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="animate-spin text-slate-400" size={24} />
                        </div>
                    ) : orgs.length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                            <p className="text-slate-500 dark:text-slate-400">Nenhuma organização encontrada.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {orgs.map((org) => (
                                <div
                                    key={org.id}
                                    onClick={() => setSelectedOrgId(org.id)}
                                    className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer transition-all group"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xl group-hover:scale-110 transition-transform">
                                            {org.name.charAt(0)}
                                        </div>
                                        <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs rounded-full font-medium">
                                            Ativo
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-1">{org.name}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{org.slug}</p>

                                    <div className="flex items-center text-sm text-blue-600 dark:text-blue-400 font-medium">
                                        Gerenciar Empresa
                                        <ArrowLeft className="rotate-180 ml-1 w-4 h-4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
