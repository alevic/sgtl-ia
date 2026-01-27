import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authClient } from '../lib/auth-client';
import { Building2, Plus, Loader2, CheckCircle, AlertCircle, Users, ArrowLeft, Save, Trash2 } from 'lucide-react';
import { TeamManagement } from '../components/TeamManagement';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { PageHeader } from '../components/Layout/PageHeader';

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
    const navigate = useNavigate();
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

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/organization/${id}/details`, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
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
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/organization/${orgDetails.id}/details`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
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

    const updateDetailField = (field: keyof OrganizationDetails, value: string) => {
        if (orgDetails) {
            setOrgDetails({ ...orgDetails, [field]: value });
        }
    };

    if (selectedOrgId && orgDetails) {
        const themeColor = 'blue';

        return (
            <div className="p-8 space-y-8 animate-in fade-in duration-300">
                <PageHeader
                    title={orgDetails.name}
                    subtitle="Gerenciando detalhes e equipe da organização"
                    icon={Building2}
                    backLink="#"
                    onClickBack={() => {
                        setSelectedOrgId(null);
                        setOrgDetails(null);
                        fetchOrgs();
                    }}
                    backLabel="Voltar para Lista"
                />

                <div className="flex gap-2 p-1.5 bg-muted   border border-border/40 rounded-sm w-fit">
                    <button
                        onClick={() => setActiveDetailTab('geral')}
                        className={`flex items-center gap-2 px-6 py-3 text-[12px] font-black uppercase tracking-widest transition-all rounded-sm ${activeDetailTab === 'geral'
                            ? 'bg-background text-primary shadow-lg shadow-muted/20'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                    >
                        <Building2 size={14} />
                        Dados Corporativos
                    </button>
                    <button
                        onClick={() => setActiveDetailTab('equipe')}
                        className={`flex items-center gap-2 px-6 py-3 text-[12px] font-black uppercase tracking-widest transition-all rounded-sm ${activeDetailTab === 'equipe'
                            ? 'bg-background text-primary shadow-lg shadow-muted/20'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                    >
                        <Users size={14} />
                        Gerenciar Equipe
                    </button>
                </div>

                {activeDetailTab === 'geral' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            <Card className="shadow-2xl shadow-muted/20 bg-card   border border-border/40 rounded-[2.5rem] overflow-hidden">
                                <div className="p-8 border-b border-border/50 bg-muted">
                                    <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                        <Building2 size={14} className="text-primary" />
                                        Informações de Registro
                                    </h3>
                                </div>
                                <div className="p-8">
                                    <form onSubmit={handleUpdateDetails} className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-1.5 opacity-60">
                                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Nome da Organização</label>
                                                <input
                                                    type="text"
                                                    value={orgDetails.name}
                                                    disabled
                                                    className="w-full h-14 px-4 bg-muted border border-border/40 rounded-sm font-semibold uppercase text-[12px] tracking-widest cursor-not-allowed"
                                                />
                                            </div>
                                            <div className="space-y-1.5 opacity-60">
                                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Identificador Slug</label>
                                                <input
                                                    type="text"
                                                    value={orgDetails.slug}
                                                    disabled
                                                    className="w-full h-14 px-4 bg-muted border border-border/40 rounded-sm font-semibold text-[12px] tracking-widest cursor-not-allowed"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Razão Social</label>
                                                <input
                                                    type="text"
                                                    value={orgDetails.legal_name || ''}
                                                    onChange={(e) => updateDetailField('legal_name', e.target.value)}
                                                    className="w-full h-14 px-4 bg-muted border border-border/50 rounded-sm font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                                                    placeholder="NOME EMPRESARIAL LTDA"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">CNPJ</label>
                                                <input
                                                    type="text"
                                                    value={orgDetails.cnpj || ''}
                                                    onChange={(e) => updateDetailField('cnpj', e.target.value)}
                                                    className="w-full h-14 px-4 bg-muted border border-border/50 rounded-sm font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                                                    placeholder="00.000.000/0000-00"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Endereço de Sede</label>
                                            <textarea
                                                value={orgDetails.address || ''}
                                                onChange={(e) => updateDetailField('address', e.target.value)}
                                                rows={3}
                                                className="w-full p-4 bg-muted border border-border/50 rounded-sm font-medium text-sm transition-all focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                                                placeholder="Rua, Número, Complemento, CEP..."
                                            />
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-border/50">
                                            <p className="text-[12px] font-bold text-muted-foreground italic flex items-center gap-2">
                                                <AlertCircle size={12} />
                                                Dados protegidos por protocolo de segurança
                                            </p>
                                            <Button
                                                type="submit"
                                                disabled={isSaving}
                                                className="h-14 rounded-sm px-10 bg-primary font-black uppercase text-[12px] tracking-widest shadow-lg shadow-primary/20"
                                            >
                                                {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save className="mr-2" size={16} strokeWidth={3} />}
                                                Sincronizar Dados
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </Card>
                        </div>

                        <div className="space-y-8">
                            <Card className="shadow-2xl shadow-muted/20 bg-card   border border-border/40 rounded-[2.5rem] overflow-hidden">
                                <div className="p-8 border-b border-border/50 bg-muted">
                                    <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                        <Users size={14} className="text-primary" />
                                        Canais de Contato
                                    </h3>
                                </div>
                                <div className="p-8 space-y-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Email Central</label>
                                        <input
                                            type="email"
                                            value={orgDetails.contact_email || ''}
                                            onChange={(e) => updateDetailField('contact_email', e.target.value)}
                                            className="w-full h-14 px-4 bg-muted border border-border/50 rounded-sm font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                                            placeholder="contato@empresa.com"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Telefone / WhatsApp</label>
                                        <input
                                            type="text"
                                            value={orgDetails.phone || ''}
                                            onChange={(e) => updateDetailField('phone', e.target.value)}
                                            className="w-full h-14 px-4 bg-muted border border-border/50 rounded-sm font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                                            placeholder="(00) 00000-0000"
                                        />
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-1 border border-destructive/20 bg-destructive/5 rounded-[2.5rem]">
                                <button
                                    onClick={async () => {
                                        if (!window.confirm('CUIDADO: Esta ação excluirá permanentemente a organização e todos os dados vinculados.')) return;
                                    }}
                                    className="w-full h-14 flex items-center justify-center gap-2 text-destructive font-black uppercase text-[12px] tracking-widest hover:bg-destructive shadow-sm hover:text-white transition-all rounded-[2.3rem]"
                                >
                                    <Trash2 size={16} />
                                    Rescindir Organização
                                </button>
                            </Card>
                        </div>
                    </div>
                )}

                {activeDetailTab === 'equipe' && (
                    <TeamManagement themeColor={themeColor} context={currentContext} />
                )}
            </div>
        );
    }

    return (
        <div key="organizacoes-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            <PageHeader
                title="Multigestão de Organizações"
                subtitle="Administre e configure múltiplas entidades empresariais e suas permissões"
                icon={Building2}
                backLink="/admin"
                backLabel="Controle Administrativo"
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <Card className="shadow-2xl shadow-muted/20 bg-card   border border-border/40 rounded-[2.5rem] overflow-hidden sticky top-6">
                        <div className="p-8 border-b border-border/50 bg-muted">
                            <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                <Plus size={14} className="text-primary" />
                                Adicionar Nova Organização
                            </h2>
                        </div>
                        <div className="p-8">
                            <form onSubmit={handleCreate} className="space-y-6">
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Denominação Comercial</label>
                                    <input
                                        type="text"
                                        value={newOrgName}
                                        onChange={(e) => {
                                            setNewOrgName(e.target.value);
                                            setNewOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                                        }}
                                        className="w-full h-14 px-4 bg-muted border border-border/50 rounded-sm font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                                        placeholder="Ex: JJê Turismo"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Identificador Slug (URL)</label>
                                    <input
                                        type="text"
                                        value={newOrgSlug}
                                        onChange={(e) => setNewOrgSlug(e.target.value)}
                                        className="w-full h-14 px-4 bg-muted border border-border/50 rounded-sm font-semibold text-[12px] tracking-widest outline-none opacity-80"
                                        placeholder="ex: jje-turismo"
                                        required
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isCreating}
                                    className="w-full h-14 rounded-sm bg-primary text-primary-foreground font-black uppercase text-[12px] tracking-widest shadow-lg shadow-primary/20"
                                >
                                    {isCreating ? <Loader2 className="animate-spin" size={18} /> : 'Processar Criação'}
                                </Button>
                            </form>
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 ml-4">
                        <Building2 size={16} className="text-primary" />
                        Sincronização de Entidades
                    </h2>

                    {isLoading ? (
                        <div className="flex justify-center p-20">
                            <Loader2 className="animate-spin text-primary" size={40} strokeWidth={3} />
                        </div>
                    ) : orgs.length === 0 ? (
                        <div className="p-20 text-center bg-card   rounded-[2.5rem] border border-dashed border-border/60">
                            <p className="text-muted-foreground font-bold text-sm">Nenhuma organização encontrada.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {orgs.map((org) => (
                                <Card
                                    key={org.id}
                                    onClick={() => setSelectedOrgId(org.id)}
                                    className="group shadow-xl shadow-muted/20 bg-card   border border-border/40 rounded-[2.5rem] p-8 hover:border-primary/40 cursor-pointer transition-all hover:bg-muted"
                                >
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="w-16 h-16 rounded-sm bg-primary/10 flex items-center justify-center text-primary font-black text-2xl group-hover:scale-110 transition-transform shadow-lg shadow-primary/5">
                                            {org.name.charAt(0)}
                                        </div>
                                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-sm border border-emerald-500/20 shadow-sm shadow-emerald-500/5">
                                            ATIVO
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="font-black text-lg uppercase tracking-tight text-foreground">{org.name}</h3>
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">{org.slug}</p>
                                    </div>

                                    <div className="mt-8 flex items-center text-[10px] font-black uppercase tracking-widest text-primary gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                        Explorar Entidade
                                        <ArrowLeft className="rotate-180 w-4 h-4 shadow-xl" strokeWidth={3} />
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {error && (
                <div className="fixed bottom-8 right-8 bg-rose-500 text-white px-6 py-4 rounded-sm shadow-2xl animate-in slide-in-from-right-4 font-bold text-sm flex items-center gap-3">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}
            {success && (
                <div className="fixed bottom-8 right-8 bg-emerald-500 text-white px-6 py-4 rounded-sm shadow-2xl animate-in slide-in-from-right-4 font-bold text-sm flex items-center gap-3">
                    <CheckCircle size={20} />
                    {success}
                </div>
            )}
        </div>
    );
};
