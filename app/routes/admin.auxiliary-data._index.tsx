import React, { useState } from 'react';
import { data as json } from "react-router";
import type { ActionFunction } from "react-router";
import { useLoaderData, useNavigate, Link, useFetcher } from "react-router";
import {
    MapPin, Flag, Building, Plus, Search, Edit, Trash2, Save, X, Tag, AlertCircle, CheckCircle2, ArrowLeft, Layers, Loader2
} from 'lucide-react';
import { db } from "@/db/db.server";
import { state as stateTable, city as cityTable, neighborhood as neighborhoodTable } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { PageHeader } from '@/components/Layout/PageHeader';
import { ListFilterSection } from '@/components/Layout/ListFilterSection';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type TabType = 'territories' | 'cities' | 'neighborhoods' | 'tags';

export const loader = async () => {
    const states = await db.select().from(stateTable).orderBy(stateTable.name);
    const cities = await db.query.city.findMany({
        with: { state: true },
        orderBy: [cityTable.name]
    });
    const neighborhoods = await db.query.neighborhood.findMany({
        with: { city: true },
        orderBy: [neighborhoodTable.name]
    });

    return json({ states, cities, neighborhoods });
};

export const action: ActionFunction = async ({ request }) => {
    const formData = await request.formData();
    const intent = formData.get("intent");
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const type = formData.get("type") as TabType;

    if (intent === "delete") {
        if (type === 'cities') await db.delete(cityTable).where(eq(cityTable.id, parseInt(id)));
        if (type === 'neighborhoods') await db.delete(neighborhoodTable).where(eq(neighborhoodTable.id, parseInt(id)));
        return json({ success: true, message: "Removido com sucesso" });
    }

    if (intent === "save") {
        if (type === 'cities') {
            const stateId = parseInt(formData.get("state_id") as string);
            if (id) {
                await db.update(cityTable).set({ name }).where(eq(cityTable.id, parseInt(id)));
            } else {
                await db.insert(cityTable).values({ name, state_id: stateId });
            }
        }
        if (type === 'neighborhoods') {
            const cityId = parseInt(formData.get("city_id") as string);
            if (id) {
                await db.update(neighborhoodTable).set({ name }).where(eq(neighborhoodTable.id, parseInt(id)));
            } else {
                await db.insert(neighborhoodTable).values({ name, city_id: cityId });
            }
        }
        return json({ success: true, message: "Salvo com sucesso" });
    }

    return null;
};

export default function AuxiliaryDataPage() {
    const { states, cities, neighborhoods } = useLoaderData<typeof loader>();
    const fetcher = useFetcher();
    const [activeTab, setActiveTab] = useState<TabType>('territories');
    const [busca, setBusca] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    const handleNew = () => {
        setEditingItem(null);
        setIsEditing(true);
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setIsEditing(true);
    };

    const renderList = () => {
        let currentData: any[] = [];
        if (activeTab === 'territories') currentData = states;
        if (activeTab === 'cities') currentData = cities;
        if (activeTab === 'neighborhoods') currentData = neighborhoods;

        const filtered = currentData.filter(i => (i.name || i.nome || '').toLowerCase().includes(busca.toLowerCase()));

        return (
            <div className="divide-y divide-border/30">
                {filtered.length === 0 ? (
                    <div className="p-24 text-center">
                        <Layers size={64} className="mx-auto mb-6 text-muted-foreground/20" />
                        <p className="font-black text-muted-foreground uppercase tracking-widest text-sm">Nenhum registro encontrado</p>
                    </div>
                ) : (
                    filtered.map((item) => (
                        <div key={item.id} className="p-8 hover:bg-muted/30 transition-all flex items-center justify-between group">
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black uppercase shadow-sm">
                                    {item.name?.charAt(0) || item.uf}
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-black text-lg tracking-tight">{item.name}</h4>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-none bg-muted px-2 py-0.5">
                                            {activeTab === 'territories' ? 'ESTADO' : activeTab === 'cities' ? `ESTADO: ${item.state?.uf}` : `CIDADE: ${item.city?.name}`}
                                        </Badge>
                                        {item.uf && <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{item.uf}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {activeTab !== 'territories' && (
                                    <>
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary"><Edit size={18} /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => fetcher.submit({ intent: 'delete', id: item.id.toString(), type: activeTab }, { method: 'post' })} className="h-10 w-10 rounded-xl hover:bg-destructive/10 text-destructive"><Trash2 size={18} /></Button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        );
    };

    return (
        <div key="aux-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            <PageHeader
                title="Cadastros Auxiliares"
                subtitle="Gestão de territórios, cidades e parâmetros do ecossistema"
                icon={Layers}
                rightElement={
                    activeTab !== 'territories' && (
                        <Button onClick={handleNew} className="h-14 px-8 rounded-xl font-black uppercase text-[12px] tracking-widest shadow-lg shadow-primary/20">
                            <Plus size={18} className="mr-2" strokeWidth={3} /> NOVO REGISTRO
                        </Button>
                    )
                }
            />

            <div className="flex flex-col md:flex-row gap-6 justify-between items-end">
                <div className="flex bg-muted/40 p-1.5 rounded-2xl border border-border/50 h-14 w-full md:w-fit gap-2">
                    {[
                        { id: 'territories', label: 'Estados', icon: Flag },
                        { id: 'cities', label: 'Cidades', icon: Building },
                        { id: 'neighborhoods', label: 'Bairros', icon: MapPin },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={cn(
                                "flex-1 md:flex-none px-6 h-full text-[10px] font-black uppercase tracking-widest transition-all rounded-xl flex items-center gap-2",
                                activeTab === tab.id ? 'bg-background text-primary shadow-lg' : 'text-muted-foreground hover:bg-muted/30'
                            )}
                        >
                            <tab.icon size={14} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-96 group">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder={`Buscar em ${activeTab}...`}
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        className="w-full h-14 pl-12 bg-card/60 border-none rounded-xl font-bold shadow-sm"
                    />
                </div>
            </div>

            <Card className="shadow-2xl shadow-muted/20 bg-card/50 backdrop-blur-sm border-none rounded-[2.5rem] overflow-hidden">
                {renderList()}
            </Card>

            {isEditing && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-xl bg-card border-none rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 p-8">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black uppercase tracking-tighter">
                                {editingItem ? 'Editar' : 'Novo'} {activeTab === 'cities' ? 'Cidade' : 'Bairro'}
                            </h2>
                            <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)} className="rounded-xl"><X size={20} /></Button>
                        </div>

                        <fetcher.Form method="post" className="space-y-6">
                            <input type="hidden" name="intent" value="save" />
                            <input type="hidden" name="type" value={activeTab} />
                            {editingItem && <input type="hidden" name="id" value={editingItem.id} />}

                            <div className="space-y-2">
                                <label className="text-label-caps ml-1">Nome</label>
                                <Input name="name" defaultValue={editingItem?.name} required className="h-14 rounded-xl bg-muted/40" />
                            </div>

                            {activeTab === 'cities' && (
                                <div className="space-y-2">
                                    <label className="text-label-caps ml-1">Estado</label>
                                    <select name="state_id" defaultValue={editingItem?.state_id} className="w-full h-14 px-4 bg-muted/40 border border-border/50 rounded-xl font-bold outline-none" required>
                                        <option value="">Selecione...</option>
                                        {states.map(s => <option key={s.id} value={s.id}>{s.name} ({s.uf})</option>)}
                                    </select>
                                </div>
                            )}

                            {activeTab === 'neighborhoods' && (
                                <div className="space-y-2">
                                    <label className="text-label-caps ml-1">Cidade</label>
                                    <select name="city_id" defaultValue={editingItem?.city_id} className="w-full h-14 px-4 bg-muted/40 border border-border/50 rounded-xl font-bold outline-none" required>
                                        <option value="">Selecione...</option>
                                        {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            )}

                            <div className="flex gap-4 pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="flex-1 h-14 rounded-2xl font-black uppercase text-xs tracking-widest">CANCELAR</Button>
                                <Button type="submit" className="flex-1 h-14 rounded-2xl bg-primary text-primary-foreground font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20">
                                    {fetcher.state !== 'idle' ? <Loader2 className="animate-spin" /> : 'SALVAR REGISTRO'}
                                </Button>
                            </div>
                        </fetcher.Form>
                    </Card>
                </div>
            )}
        </div>
    );
}
