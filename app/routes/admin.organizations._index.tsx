import React, { useState } from 'react';
import { data as json } from "react-router";
import type { LoaderFunction, ActionFunction } from "react-router";
import { useLoaderData, useNavigate, Link, useFetcher, redirect } from "react-router";
import { Building2, Plus, Loader2, CheckCircle, AlertCircle, Users, ArrowLeft, Save, Trash2, ChevronRight } from 'lucide-react';
import { TeamManagement } from '@/components/TeamManagement';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/Layout/PageHeader';
import { cn } from '@/lib/utils';

export const loader = async ({ request, params }: { request: Request, params: any }) => {
    const apiUrl = process.env.VITE_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/admin/organizations`, {
        headers: { Cookie: request.headers.get("Cookie") || "" }
    });

    if (response.status === 401 || response.status === 403) {
        // Se não autenticado/autorizado, deixa o layout lidar ou retorna vazio (layout protege)
        // Mas para evitar erro JSON
        return json({ organizations: [] });
    }

    if (!response.ok) {
        throw new Response("Falha ao carregar organizações", { status: response.status });
    }

    const organizations = await response.json();
    return json({ organizations });
};

export const action = async ({ request, params }: { request: Request, params: any }) => {
    const apiUrl = process.env.VITE_API_URL || 'http://localhost:3001';
    const formData = await request.formData();
    const intent = formData.get("intent");
    const id = formData.get("id") as string;

    // Pass body as JSON
    const body: any = {};
    formData.forEach((value, key) => body[key] = value);

    let url = `${apiUrl}/api/admin/organizations`;
    let method = "POST";

    if (intent === "delete") {
        url = `${apiUrl}/api/admin/organizations/${id}`;
        method = "DELETE";
    }

    const response = await fetch(url, {
        method,
        headers: {
            "Content-Type": "application/json",
            Cookie: request.headers.get("Cookie") || ""
        },
        body: method !== "GET" ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
        return json({ success: false, message: "Erro na operação" }, { status: response.status });
    }

    return json({ success: true, message: intent === "create" ? "Organização criada" : "Organização removida" });
};

export default function OrganizationsPage() {
    const { organizations: initialOrgs } = useLoaderData<typeof loader>();
    const fetcher = useFetcher();
    const { currentContext } = useApp();
    const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
    const [activeDetailTab, setActiveDetailTab] = useState<'geral' | 'equipe'>('geral');
    const [newOrgName, setNewOrgName] = useState('');
    const [newOrgSlug, setNewOrgSlug] = useState('');

    const organizations = initialOrgs as any[];

    if (selectedOrgId) {
        const org = organizations.find(o => o.id === selectedOrgId);
        return (
            <div className="p-8 space-y-8 animate-in fade-in duration-300">
                <PageHeader
                    title={org?.name || 'Organização'}
                    subtitle="Gerenciando detalhes corporativos e equipe"
                    icon={Building2}
                    onClickBack={() => setSelectedOrgId(null)}
                    backLabel="VOLTAR"
                />

                <div className="flex gap-2 p-1.5 bg-muted/40 backdrop-blur-sm border border-border/40 rounded-2xl w-fit">
                    <button onClick={() => setActiveDetailTab('geral')} className={cn("px-6 py-3 text-[12px] font-black uppercase tracking-widest transition-all rounded-xl", activeDetailTab === 'geral' ? 'bg-background text-primary shadow-lg' : 'text-muted-foreground')}>DADOS GERAIS</button>
                    <button onClick={() => setActiveDetailTab('equipe')} className={cn("px-6 py-3 text-[12px] font-black uppercase tracking-widest transition-all rounded-xl", activeDetailTab === 'equipe' ? 'bg-background text-primary shadow-lg' : 'text-muted-foreground')}>EQUIPE</button>
                </div>

                {activeDetailTab === 'geral' ? (
                    <Card className="p-8 shadow-2xl bg-card/50 rounded-[2.5rem]">
                        <form className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1.5"><label className="text-xs font-bold uppercase text-muted-foreground ml-1">Razão Social</label><input type="text" value={org?.name} disabled className="w-full h-14 px-4 bg-muted/20 border border-border/40 rounded-2xl font-bold opacity-60" /></div>
                                <div className="space-y-1.5"><label className="text-xs font-bold uppercase text-muted-foreground ml-1">Slug</label><input type="text" value={org?.slug} disabled className="w-full h-14 px-4 bg-muted/20 border border-border/40 rounded-2xl font-bold opacity-60" /></div>
                            </div>
                            <Button className="h-14 px-8 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg">SALVAR ALTERAÇÕES</Button>
                        </form>
                    </Card>
                ) : (
                    <TeamManagement themeColor="blue" context={currentContext} />
                )}
            </div>
        );
    }

    return (
        <div key="org-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            <PageHeader title="Multigestão de Organizações" subtitle="Administre múltiplas entidades e sessões multi-tenant" icon={Building2} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1 shadow-2xl bg-card/50 rounded-[2.5rem] p-8 h-fit">
                    <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-6">Cadastrar Entidade</h2>
                    <fetcher.Form method="post" className="space-y-6">
                        <input type="hidden" name="intent" value="create" />
                        <div className="space-y-1.5">
                            <label className="text-[12px] font-bold uppercase text-muted-foreground ml-1">Nome Comercial</label>
                            <input name="name" type="text" value={newOrgName} onChange={(e) => { setNewOrgName(e.target.value); setNewOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-')) }} className="w-full h-14 px-4 bg-muted/40 border border-border/50 rounded-2xl font-bold" required />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12px] font-bold uppercase text-muted-foreground ml-1">Slug (Identificador)</label>
                            <input name="slug" type="text" value={newOrgSlug} onChange={(e) => setNewOrgSlug(e.target.value)} className="w-full h-14 px-4 bg-muted/20 border border-border/50 rounded-2xl font-bold" required />
                        </div>
                        <Button type="submit" disabled={fetcher.state !== "idle"} className="w-full h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg">
                            {fetcher.state !== "idle" ? <Loader2 className="animate-spin" size={18} /> : 'PROCESSAR CRIAÇÃO'}
                        </Button>
                    </fetcher.Form>
                </Card>

                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-4">Sincronização de Entidades</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {organizations.map((org) => (
                            <Card key={org.id} onClick={() => setSelectedOrgId(org.id)} className="group shadow-xl bg-card/50 rounded-[2.5rem] p-8 hover:border-primary/40 cursor-pointer transition-all hover:bg-muted/20">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-2xl transition-transform group-hover:scale-110 shadow-lg">{org.name?.charAt(0)}</div>
                                    <Badge className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-lg">ATIVO</Badge>
                                </div>
                                <div><h3 className="font-black text-lg uppercase tracking-tight">{org.name}</h3><p className="text-[10px] font-black text-muted-foreground uppercase mt-1">{org.slug}</p></div>
                                <div className="mt-8 flex items-center text-[10px] font-black uppercase tracking-widest text-primary gap-2 opacity-0 group-hover:opacity-100 transition-all">EXPLORAR ENTIDADE <ChevronRight size={14} /></div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
