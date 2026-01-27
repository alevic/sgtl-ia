import React, { useState } from 'react';
import { data as json } from "react-router";
import type { LoaderFunction, ActionFunction } from "react-router";
import { useLoaderData, useNavigate, useFetcher, Link } from "react-router";
import {
    User, Mail, Phone, MapPin, Calendar, DollarSign,
    MessageSquare, History, Star, Edit, Plus, Clock,
    Award, CreditCard, ShieldCheck, FileText, TrendingUp
} from 'lucide-react';
import { db } from "@/db/db.server";
import {
    clients as clientsTable,
    reservation as reservationTable,
    client_interaction as interactionTable,
    client_note as noteTable
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from '@/components/Layout/PageHeader';
import { DashboardCard } from '@/components/Layout/DashboardCard';
import { cn } from '@/lib/utils';

export const loader = async ({ request, params }: { request: Request, params: { id?: string } }) => {
    const { id } = params;
    if (!id) throw new Response("ID não fornecido", { status: 400 });

    const client = await db.query.clients.findFirst({
        where: eq(clientsTable.id, id),
        with: {
            reservations: {
                orderBy: desc(reservationTable.createdAt),
                with: {
                    trip: {
                        with: {
                            route: true
                        }
                    }
                }
            },
            interactions: {
                orderBy: desc(interactionTable.date_time)
            },
            notes: {
                orderBy: desc(noteTable.createdAt)
            }
        }
    });

    if (!client) throw new Response("Cliente não encontrado", { status: 404 });

    return json({ client });
};

export const action = async ({ request, params }: { request: Request, params: { id?: string } }) => {
    const { id } = params;
    if (!id) return null;

    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "add-interaction") {
        const type = formData.get("type") as string;
        const description = formData.get("description") as string;
        await db.insert(interactionTable).values({
            client_id: id,
            type,
            description,
            user_responsible: "Admin" // Mock
        } as any);
        return json({ success: true });
    }

    if (intent === "add-note") {
        const title = formData.get("title") as string;
        const content = formData.get("content") as string;
        const isImportant = formData.get("important") === "true";
        await db.insert(noteTable).values({
            client_id: id,
            title,
            content,
            is_important: isImportant,
            created_by: "Admin" // Mock
        } as any);
        return json({ success: true });
    }

    return null;
};

export default function ClientDetailPage() {
    const { client } = useLoaderData<typeof loader>();
    const fetcher = useFetcher();
    const navigate = useNavigate();

    const [showInteractionInput, setShowInteractionInput] = useState(false);
    const [showNoteInput, setShowNoteInput] = useState(false);

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <PageHeader
                title={client.nome}
                subtitle={`Cliente desde ${new Date(client.data_cadastro).getFullYear()} • ID #${client.id.substring(0, 8)}`}
                backLink="/admin/clients"
                rightElement={
                    <div className="flex gap-3">
                        <Button variant="outline" asChild className="h-14 rounded-xl px-6 font-bold uppercase text-[12px] border-border/50">
                            <Link to={`/admin/clients/edit/${client.id}`}><Edit size={18} className="mr-2" /> Editar Cadastro</Link>
                        </Button>
                        <Button onClick={() => setShowInteractionInput(true)} className="h-14 rounded-xl px-8 bg-primary font-bold uppercase text-[12px] shadow-lg shadow-primary/20">
                            REGISTRAR CONTATO
                        </Button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <DashboardCard title="Viagens Realizadas" value={client.reservations.length} icon={TrendingUp} variant="primary" />
                <DashboardCard title="Saldo Créditos" value={`R$ ${Number(client.saldo_creditos).toFixed(2)}`} icon={CreditCard} variant="blue" />
                <DashboardCard title="Total Gasto" value={`R$ ${Number(client.valor_total_gasto).toFixed(2)}`} icon={DollarSign} variant="emerald" />
                <DashboardCard title="Segmento" value={client.segmento || "NOVO"} icon={Award} variant="blue" />
            </div>

            <Tabs defaultValue="info" className="w-full">
                <Card className="rounded-[40px] border-none shadow-2xl bg-card/40 backdrop-blur-sm overflow-hidden">
                    <div className="px-8 pt-8">
                        <TabsList className="bg-muted/40 p-1.5 rounded-2xl h-14 flex w-fit border border-border/50">
                            <TabsTrigger value="info" className="px-8 rounded-xl font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-background">Perfil</TabsTrigger>
                            <TabsTrigger value="history" className="px-8 rounded-xl font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-background">Histórico</TabsTrigger>
                            <TabsTrigger value="interactions" className="px-8 rounded-xl font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-background">Interações</TabsTrigger>
                            <TabsTrigger value="notes" className="px-8 rounded-xl font-bold uppercase text-[10px] tracking-widest data-[state=active]:bg-background">Notas</TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="p-8">
                        <TabsContent value="info" className="mt-0 space-y-10 animate-in fade-in duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-6">
                                    <h3 className="text-[12px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <User size={16} className="text-primary" /> Dados Pessoais
                                    </h3>
                                    <div className="space-y-4">
                                        {[
                                            { label: 'E-mail', value: client.email },
                                            { label: 'Telefone', value: client.telefone },
                                            { label: 'Documento', value: `${client.documento_tipo}: ${client.documento}` },
                                            { label: 'Data Nascimento', value: client.data_nascimento },
                                        ].map(item => (
                                            <div key={item.label} className="flex justify-between border-b border-border/30 pb-3">
                                                <span className="text-xs font-bold text-muted-foreground uppercase">{item.label}</span>
                                                <span className="text-sm font-black">{item.value || '---'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <h3 className="text-[12px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <MapPin size={16} className="text-primary" /> Localização
                                    </h3>
                                    <div className="p-6 rounded-3xl bg-muted/20 border border-border/30 space-y-2">
                                        <p className="text-sm font-bold">{client.endereco || "Não Informado"}</p>
                                        <p className="text-xs font-bold text-muted-foreground uppercase">{client.cidade} - {client.estado}</p>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="history" className="mt-0 animate-in fade-in duration-500 space-y-4">
                            {client.reservations.map((res: any) => (
                                <div key={res.id} className="p-6 rounded-3xl border border-border/30 bg-muted/10 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black">
                                            {res.seat_number}
                                        </div>
                                        <div>
                                            <p className="font-bold">{res.trip?.route?.name || "Viagem Operacional"}</p>
                                            <p className="text-[10px] font-black uppercase text-muted-foreground">{res.trip?.departure_date} • {res.trip?.departure_time}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-lg">R$ {Number(res.total_price).toFixed(2)}</p>
                                        <Badge variant="outline" className="rounded-lg text-[9px] uppercase font-black">{res.status}</Badge>
                                    </div>
                                </div>
                            ))}
                        </TabsContent>

                        <TabsContent value="interactions" className="mt-0 animate-in fade-in duration-500 space-y-6">
                            {showInteractionInput && (
                                <Card className="p-6 border-primary/20 bg-primary/5 rounded-3xl space-y-4">
                                    <fetcher.Form method="post" onSubmit={() => setShowInteractionInput(false)}>
                                        <input type="hidden" name="intent" value="add-interaction" />
                                        <div className="grid grid-cols-2 gap-4">
                                            <select name="type" className="h-12 px-4 rounded-xl bg-background border-border font-bold text-xs uppercase">
                                                <option value="WHATSAPP">WhatsApp</option>
                                                <option value="PHONE">Telefone</option>
                                                <option value="EMAIL">E-mail</option>
                                            </select>
                                            <input name="description" placeholder="Resumo do contato..." className="h-12 px-4 rounded-xl bg-background border-border font-bold text-xs outline-none" required />
                                        </div>
                                        <div className="flex justify-end gap-2 mt-4">
                                            <Button type="button" variant="ghost" onClick={() => setShowInteractionInput(false)}>Cancelar</Button>
                                            <Button type="submit">Gravar Interação</Button>
                                        </div>
                                    </fetcher.Form>
                                </Card>
                            )}
                            <div className="space-y-4">
                                {client.interactions.map((i: any) => (
                                    <div key={i.id} className="relative pl-8 border-l-2 border-border/50 pb-6 last:pb-0">
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-background" />
                                        <div className="space-y-1">
                                            <p className="text-xs font-black uppercase text-primary tracking-widest">{i.type}</p>
                                            <p className="text-sm font-medium">{i.description}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">{new Date(i.date_time).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="notes" className="mt-0 animate-in fade-in duration-500 space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-[12px] font-black uppercase tracking-widest text-muted-foreground">Notas Estratégicas</h3>
                                <Button onClick={() => setShowNoteInput(true)} variant="outline" className="h-10 rounded-xl px-4 font-bold text-[10px] uppercase tracking-widest"><Plus size={14} className="mr-2" /> Adicionar Nota</Button>
                            </div>

                            {showNoteInput && (
                                <Card className="p-6 border-amber-200 bg-amber-50/10 rounded-3xl">
                                    <fetcher.Form method="post" className="space-y-4" onSubmit={() => setShowNoteInput(false)}>
                                        <input type="hidden" name="intent" value="add-note" />
                                        <input name="title" placeholder="Título da nota..." className="w-full h-12 px-4 rounded-xl bg-background border-border font-bold text-xs outline-none" required />
                                        <textarea name="content" placeholder="Conteúdo..." className="w-full p-4 rounded-xl bg-background border-border font-bold text-xs outline-none min-h-[100px]" required />
                                        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest cursor-pointer">
                                            <input type="checkbox" name="important" value="true" className="rounded" /> Marcar como Importante
                                        </label>
                                        <div className="flex justify-end gap-2 pt-4">
                                            <Button type="button" variant="ghost" onClick={() => setShowNoteInput(false)}>Cancelar</Button>
                                            <Button type="submit">Salvar Nota</Button>
                                        </div>
                                    </fetcher.Form>
                                </Card>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {client.notes.map((n: any) => (
                                    <Card key={n.id} className={cn("p-6 rounded-[2rem] border-none shadow-xl", n.is_important ? "bg-amber-500/10" : "bg-muted/10")}>
                                        <div className="flex justify-between items-start mb-4">
                                            <h4 className="font-black uppercase text-[12px] tracking-tight">{n.title}</h4>
                                            {n.is_important && <Star size={14} className="text-amber-500 fill-amber-500" />}
                                        </div>
                                        <p className="text-sm font-medium opacity-80 mb-6 leading-relaxed">"{n.content}"</p>
                                        <div className="flex items-center justify-between pt-4 border-t border-border/20">
                                            <span className="text-[9px] font-black uppercase opacity-60">Admin</span>
                                            <span className="text-[9px] font-black uppercase opacity-60">{new Date(n.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>
                    </div>
                </Card>
            </Tabs>
        </div>
    );
}
