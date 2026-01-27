import React, { useState } from 'react';
import { data as json } from "react-router";
import type { LoaderFunction, ActionFunction } from "react-router";
import { useLoaderData, useNavigate, Link, useFetcher } from "react-router";
import { useDateFormatter } from '@/hooks/useDateFormatter';
import {
    FileText, Search, Filter, Download, Upload, Trash2,
    AlertTriangle, CheckCircle, Clock,
    Truck, Users, Building, ArrowLeft, MoreHorizontal
} from 'lucide-react';
import { db } from "@/db/db.server";
import { document as documentTable } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/Layout/PageHeader';
import { ListFilterSection } from '@/components/Layout/ListFilterSection';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from "@/lib/utils";

export const loader = async ({ request, params }: { request: Request, params: any }) => {
    const documentsData = await db.select().from(documentTable).orderBy(desc(documentTable.createdAt));
    return json({ documents: documentsData });
};

export const action = async ({ request, params }: { request: Request, params: any }) => {
    const formData = await request.formData();
    const intent = formData.get("intent");
    const id = formData.get("id") as string;

    if (intent === "delete") {
        await db.delete(documentTable).where(eq(documentTable.id, id));
        return json({ success: true });
    }

    return null;
};

export default function DocumentsPage() {
    const { documents: initialDocuments } = useLoaderData<typeof loader>();
    const fetcher = useFetcher();
    const navigate = useNavigate();
    const { formatDate } = useDateFormatter();
    const [activeTab, setActiveTab] = useState<'VEHICLE' | 'DRIVER' | 'ADMIN'>('VEHICLE');
    const [searchTerm, setSearchTerm] = useState('');

    const documents = initialDocuments as any[];

    const filteredDocs = documents.filter(doc => {
        const matchesTab = doc.type === activeTab;
        const matchesSearch = (doc.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (doc.entity_name || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'VALID': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
            case 'EXPIRING': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
            case 'EXPIRED': return 'bg-destructive/10 text-destructive border-destructive/20';
            default: return 'bg-muted text-muted-foreground';
        }
    };

    return (
        <div key="documentos-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            <PageHeader
                title="Gestão de Documentos"
                subtitle="Custódia digital e controle de validades operacionais"
                icon={FileText}
                rightElement={
                    <Button onClick={() => { }} className="h-14 px-8 rounded-xl font-bold uppercase text-[12px] tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                        <Upload className="w-4 h-4 mr-2" /> NOVO DOCUMENTO
                    </Button>
                }
            />

            <ListFilterSection>
                <div className="flex bg-muted/40 p-1.5 rounded-xl border border-border/50 h-14 w-full md:w-fit gap-2">
                    <button onClick={() => setActiveTab('VEHICLE')} className={cn("flex-1 md:flex-none flex items-center gap-2 px-6 h-full text-[10px] font-bold uppercase tracking-widest transition-all rounded-lg", activeTab === 'VEHICLE' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:bg-muted/50')}>
                        <Truck size={14} /> Veículos
                    </button>
                    <button onClick={() => setActiveTab('DRIVER')} className={cn("flex-1 md:flex-none flex items-center gap-2 px-6 h-full text-[10px] font-bold uppercase tracking-widest transition-all rounded-lg", activeTab === 'DRIVER' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:bg-muted/50')}>
                        <Users size={14} /> Motoristas
                    </button>
                    <button onClick={() => setActiveTab('ADMIN')} className={cn("flex-1 md:flex-none flex items-center gap-2 px-6 h-full text-[10px] font-bold uppercase tracking-widest transition-all rounded-lg", activeTab === 'ADMIN' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:bg-muted/50')}>
                        <Building size={14} /> Empresa
                    </button>
                </div>

                <div className="relative w-full md:w-80 group">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Filtrar documentos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full h-14 pl-12 bg-muted/40 border-none rounded-xl font-bold" />
                </div>
            </ListFilterSection>

            <Card className="shadow-2xl shadow-muted/20 bg-card/50 backdrop-blur-sm border-none rounded-[2.5rem] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-muted/20 border-b border-border/50">
                            <tr>
                                <th className="px-8 py-6 text-[12px] font-black uppercase tracking-widest text-muted-foreground">Documento</th>
                                <th className="px-8 py-6 text-[12px] font-black uppercase tracking-widest text-muted-foreground">Entidade</th>
                                <th className="px-8 py-6 text-[12px] font-black uppercase tracking-widest text-muted-foreground">Vencimento</th>
                                <th className="px-8 py-6 text-[12px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                                <th className="px-8 py-6 text-right text-[12px] font-black uppercase tracking-widest text-muted-foreground">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {filteredDocs.map((doc) => (
                                <tr key={doc.id} className="group hover:bg-muted/30 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><FileText size={18} /></div>
                                            <div>
                                                <p className="font-black text-xs uppercase tracking-tight text-foreground">{doc.name}</p>
                                                <p className="text-[12px] font-bold text-muted-foreground opacity-60 tracking-widest">{doc.file_size || '0 KB'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-[12px] font-black uppercase text-muted-foreground">{doc.entity_name || 'Geral'}</td>
                                    <td className="px-8 py-5 text-xs font-bold">{formatDate(doc.expiry_date)}</td>
                                    <td className="px-8 py-5">
                                        <Badge variant="outline" className={cn("rounded-full text-[9px] font-black uppercase tracking-widest border-none px-3 py-1", getStatusStyle(doc.status))}>
                                            {doc.status}
                                        </Badge>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 transition-colors"><Download size={16} /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => fetcher.submit({ intent: "delete", id: doc.id }, { method: "post" })} className="h-9 w-9 rounded-xl hover:bg-destructive/10 text-destructive transition-colors"><Trash2 size={16} /></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
