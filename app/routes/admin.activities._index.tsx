import React, { useState } from 'react';
import { data as json } from "react-router";
import type { LoaderFunction } from "react-router";
import { useLoaderData, useNavigate } from "react-router";
import {
    Activity, Search, Filter, ArrowLeft,
    Bus, AlertCircle, Users, Package, CheckCircle, Info, AlertTriangle, Clock
} from 'lucide-react';
import { PageHeader } from '@/components/Layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// --- MOCK DATA FOR FEED ---
const ALL_ACTIVITIES = [
    { id: 1, type: 'success', title: 'Viagem Concluída', desc: 'Rota SP -> RJ finalizada com sucesso', time: '10 min atrás', date: 'Hoje', icon: Bus },
    { id: 2, type: 'warning', title: 'Alerta de Manutenção', desc: 'Veículo 104 precisa de revisão', time: '32 min atrás', date: 'Hoje', icon: AlertCircle },
    { id: 3, type: 'info', title: 'Nova Reserva', desc: 'Grupo de 15 passageiros confirmado', time: '1h atrás', date: 'Hoje', icon: Users },
    { id: 4, type: 'success', title: 'Entrega Realizada', desc: 'Pacote #9921 entregue no prazo', time: '2h atrás', date: 'Hoje', icon: Package },
    { id: 5, type: 'info', title: 'Novo Motorista', desc: 'Cadastro de Roberto Santos aprovado', time: '4h atrás', date: 'Hoje', icon: Users },
    { id: 6, type: 'warning', title: 'Atraso na Rota', desc: 'Trânsito intenso na saída de SP', time: 'Ontem', date: 'Ontem', icon: AlertTriangle },
    { id: 7, type: 'success', title: 'Manutenção Concluída', desc: 'Veículo 102 liberado da oficina', time: 'Ontem', date: 'Ontem', icon: CheckCircle },
    { id: 8, type: 'info', title: 'Pagamento Recebido', desc: 'Fatura #4590 quitada', time: 'Ontem', date: 'Ontem', icon: Info },
];

export const loader = async ({ request, params }: { request: Request, params: any }) => {
    return json({ activities: ALL_ACTIVITIES });
};

export default function ActivitiesPage() {
    const { activities } = useLoaderData<typeof loader>();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    const filteredActivities = activities.filter((activity: any) => {
        const matchesSearch = activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            activity.desc.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || activity.type === filterType;
        return matchesSearch && matchesType;
    });

    return (
        <div key="atividades-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            <PageHeader
                title="Log de Atividades"
                subtitle="Histórico completo de eventos e auditoria do sistema"
                icon={Activity}
                backLink="/admin/dashboard"
            />

            <div className="flex flex-col md:flex-row gap-6 justify-between items-end">
                <div className="flex bg-muted/40 p-1.5 rounded-2xl border border-border/50 h-14 w-full md:w-fit gap-2">
                    {['all', 'success', 'warning', 'info'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={cn(
                                "flex-1 md:flex-none px-6 h-full text-[10px] font-black uppercase tracking-widest transition-all rounded-xl",
                                filterType === type ? 'bg-background text-primary shadow-lg' : 'text-muted-foreground hover:bg-muted/30'
                            )}
                        >
                            {type === 'all' ? 'TODAS' : type === 'success' ? 'SUCESSO' : type === 'warning' ? 'ALERTAS' : 'INFO'}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-96 group">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input
                        placeholder="Buscar log..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-14 pl-12 bg-card/60 border-none rounded-xl font-bold shadow-sm"
                    />
                </div>
            </div>

            <Card className="shadow-2xl shadow-muted/20 bg-card/50 backdrop-blur-sm border-none rounded-[2.5rem] overflow-hidden">
                <div className="divide-y divide-border/30">
                    {filteredActivities.length > 0 ? (
                        filteredActivities.map((item: any, index: number) => {
                            const Icon = { Bus, AlertCircle, Users, Package, CheckCircle, Info, AlertTriangle }[item.icon] || Info;
                            return (
                                <div key={item.id} className="p-8 hover:bg-muted/30 transition-all flex gap-6 items-start group">
                                    <div className={cn(
                                        "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                                        item.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 shadow-lg shadow-emerald-500/5' :
                                            item.type === 'warning' ? 'bg-amber-500/10 text-amber-600 shadow-lg shadow-amber-500/5' :
                                                'bg-blue-500/10 text-blue-600 shadow-lg shadow-blue-500/5'
                                    )}>
                                        <Icon size={24} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-lg font-black tracking-tight text-foreground truncate">
                                                {item.title}
                                            </h4>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 bg-muted/50 px-3 py-1 rounded-full flex items-center gap-1.5">
                                                <Clock size={12} /> {item.time}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                                            {item.desc}
                                        </p>
                                        <div className="pt-2 flex items-center gap-4">
                                            <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest">{item.date}</span>
                                            <span className="w-1 h-1 rounded-full bg-border" />
                                            <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">Auditoria #00{item.id}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="p-24 text-center">
                            <Activity size={64} className="mx-auto mb-6 text-muted-foreground/20" />
                            <p className="font-black text-muted-foreground uppercase tracking-widest text-sm">Nenhum evento registrado</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
