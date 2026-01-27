import React, { useState } from 'react';
import { data as json } from "react-router";
import type { LoaderFunction, ActionFunction } from "react-router";
import { useLoaderData, useNavigate, Link, useFetcher } from "react-router";
import { useApp } from '@/context/AppContext';
import { EmpresaContexto } from '@/types';
import {
    Save, Bell, Shield, Monitor, RefreshCw, Database,
    Settings2, Plus, Trash2, AlertCircle, Loader2,
    Globe, CalendarClock, Wallet, Truck, Users, CreditCard,
    Search, X, ChevronRight, Check, AlertTriangle, CheckCircle2, ArrowLeft
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { db } from "@/db/db.server";
import { organization_parameter as paramTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/Layout/PageHeader';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const loader = async ({ request, params }: { request: Request, params: any }) => {
    // In a real app, we would get the org ID from the session
    // For now, we'll fetch all parameters or use a dummy org ID
    const parameters = await db.select().from(paramTable);
    return json({ parameters });
};

export const action = async ({ request, params }: { request: Request, params: any }) => {
    const formData = await request.formData();
    const intent = formData.get("intent");
    const id = formData.get("id") as string;
    const organizationId = formData.get("organizationId") as string || "default";

    if (intent === "save-batch") {
        const data = JSON.parse(formData.get("data") as string);
        for (const item of data) {
            await db.insert(paramTable).values({
                id: crypto.randomUUID(),
                organization_id: organizationId,
                key: item.key,
                value: String(item.value),
                description: item.description,
                group_name: item.group_name
            } as any).onConflictDoUpdate({
                target: [paramTable.organization_id, paramTable.key],
                set: { value: String(item.value), updatedAt: new Date() } as any
            });
        }
        return json({ success: true, message: "Configurações sincronizadas" });
    }

    if (intent === "delete") {
        await db.delete(paramTable).where(eq(paramTable.id, id));
        return json({ success: true, message: "Parâmetro removido" });
    }

    return null;
};

interface ISettingFieldProps {
    label: string;
    description?: string;
    k: string;
    type?: 'text' | 'number' | 'textarea' | 'select' | 'checkbox';
    placeholder?: string;
    options?: { label: string, value: string }[];
    allSettings: Record<string, string>;
    setAllSettings: (val: any) => void;
}

const SettingField: React.FC<ISettingFieldProps> = ({
    label, description, k, type = 'text', placeholder = '', options = [], allSettings, setAllSettings
}) => {
    const value = allSettings[k] || '';
    const handleChange = (newVal: string) => setAllSettings((prev: any) => ({ ...prev, [k]: newVal }));

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-baseline">
                <label className="text-label-caps ml-1">{label}</label>
                <code className="text-[10px] bg-primary/5 px-2 py-0.5 rounded-lg border border-primary/10 text-primary font-mono">{k}</code>
            </div>
            {description && <p className="text-[11px] font-medium text-muted-foreground/80 leading-relaxed mb-2 px-1">{description}</p>}
            {type === 'textarea' ? (
                <textarea value={value} onChange={(e) => handleChange(e.target.value)} placeholder={placeholder} className="w-full p-4 bg-muted/40 border border-border/50 rounded-xl font-medium text-sm transition-all focus:ring-2 focus:ring-primary/20 outline-none resize-none h-28" />
            ) : type === 'select' ? (
                <div className="relative group">
                    <select value={value} onChange={(e) => handleChange(e.target.value)} className="w-full h-14 px-4 bg-muted/40 border border-border/50 rounded-xl font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer text-sm">
                        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                    <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-muted-foreground" />
                </div>
            ) : type === 'checkbox' ? (
                <div className="flex items-center gap-3 bg-muted/20 p-4 rounded-xl border border-border/40">
                    <input type="checkbox" checked={value === 'true'} onChange={(e) => handleChange(e.target.checked ? 'true' : 'false')} className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground">{value === 'true' ? 'ATIVADO' : 'DESATIVADO'}</span>
                </div>
            ) : (
                <Input type={type} value={value} onChange={(e) => handleChange(e.target.value)} placeholder={placeholder} className="h-14 bg-muted/40 border-input rounded-xl font-bold" />
            )}
        </div>
    );
};

const PARAM_METADATA: Record<string, any> = {
    'system_name': { label: 'Nome do Sistema', group: 'Sistema', type: 'text', description: 'Nome do dashboard administrativo.' },
    'system_slogan': { label: 'Slogan/Subtítulo', group: 'Sistema', type: 'text', description: 'Slogan ou subtítulo do sistema.' },
    'system_support_email': { label: 'Email de Suporte', group: 'Sistema', type: 'text', description: 'Email para suporte técnico.' },
    'auto_start_trips': { label: 'Automação de Status', group: 'Viagens', type: 'checkbox', description: 'Mudar para \'Em Trânsito\' automaticamente no horário de partida.' },
    'system_currency': { label: 'Moeda', group: 'Financeiro', type: 'text', description: 'Símbolo monetário (ex: R$, $).' },
};

export default function SettingsPage() {
    const { parameters } = useLoaderData<typeof loader>();
    const fetcher = useFetcher();
    const { currentContext } = useApp();
    const [selectedGroup, setSelectedGroup] = useState<string>('Sistema');
    const [searchQuery, setSearchQuery] = useState('');
    const [allSettings, setAllSettings] = useState<Record<string, string>>(() => {
        const dict: Record<string, string> = {};
        parameters.forEach((p: any) => { dict[p.key] = p.value; });
        return dict;
    });

    const groups = ['Sistema', 'Viagens', 'Financeiro', 'Frota', 'Portal Público', 'Avançado'];

    const filteredParameters = parameters.filter((p: any) => {
        const meta = PARAM_METADATA[p.key];
        const group = p.group_name || meta?.group || 'Avançado';
        return group === selectedGroup;
    });

    const handleSaveBatch = () => {
        const batchData = filteredParameters.map((p: any) => ({
            key: p.key,
            value: allSettings[p.key],
            description: p.description,
            group_name: p.group_name
        }));
        fetcher.submit({ intent: "save-batch", data: JSON.stringify(batchData) }, { method: "post" });
    };

    return (
        <div key="settings-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            <PageHeader
                title="Configurações do Sistema"
                subtitle="Ajustes globais e políticas de infraestrutura"
                icon={Settings2}
                rightElement={
                    <div className="flex items-center gap-3">
                        <div className="relative md:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <Input placeholder="Localizar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-14 pl-12 bg-card/50 rounded-xl" />
                        </div>
                        <Button className="h-14 rounded-xl px-8 font-black uppercase text-[12px] tracking-widest shadow-lg shadow-primary/20">
                            <Plus size={16} className="mr-2" strokeWidth={3} /> NOVO
                        </Button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <Card className="lg:col-span-1 shadow-2xl bg-card/50 backdrop-blur-sm rounded-[2.5rem] p-3 flex flex-col h-fit">
                    <div className="p-4 border-b border-border/50 mb-2 font-bold text-xs uppercase tracking-widest text-muted-foreground/60">Módulos</div>
                    {groups.map(group => (
                        <button key={group} onClick={() => setSelectedGroup(group)} className={cn("w-full flex items-center justify-between px-6 py-4 rounded-xl transition-all font-bold text-sm tracking-tight", selectedGroup === group ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:bg-muted/50")}>
                            {group}
                            {selectedGroup === group && <ChevronRight size={14} />}
                        </button>
                    ))}
                </Card>

                <div className="lg:col-span-3 space-y-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black flex items-center gap-3 tracking-tighter uppercase">{selectedGroup}</h2>
                        <Button onClick={handleSaveBatch} disabled={fetcher.state !== "idle"} className="h-12 rounded-xl px-10 bg-foreground text-background font-black uppercase text-[12px]">
                            {fetcher.state !== "idle" ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
                            SALVAR MÓDULO
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {filteredParameters.map((param: any) => {
                            const meta = PARAM_METADATA[param.key];
                            return (
                                <Card key={param.id} className="group/card shadow-xl bg-card/50 backdrop-blur-sm border border-border/40 rounded-3xl p-8 hover:border-primary/40 transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="space-y-1">
                                            <h4 className="font-black text-sm uppercase tracking-tight">{meta?.label || param.key}</h4>
                                            <code className="text-[10px] bg-muted/50 px-2 py-0.5 rounded-lg text-primary font-mono">{param.key}</code>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => fetcher.submit({ intent: "delete", id: param.id }, { method: "post" })} className="opacity-0 group-hover/card:opacity-100"><Trash2 size={14} /></Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-6 leading-relaxed">{meta?.description || param.description}</p>
                                    <div className="p-6 bg-muted/20 rounded-xl border border-border/30">
                                        <SettingField label="" k={param.key} type={meta?.type || 'text'} options={meta?.options} allSettings={allSettings} setAllSettings={setAllSettings} />
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
