import React, { useState, useEffect } from 'react';
import { useFetcher, useNavigation, useNavigate } from "react-router";
import { ArrowLeft, Save, Route, Loader, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/Layout/PageHeader';
import { FormSection } from '@/components/Layout/FormSection';
import { EditorRota } from '@/components/Rotas/EditorRota';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface RouteFormProps {
    initialRota: any;
    isEdicao: boolean;
    error?: string;
}

export function RouteForm({ initialRota, isEdicao, error }: RouteFormProps) {
    const navigate = useNavigate();
    const fetcher = useFetcher();

    // State
    const [rota, setRota] = useState(initialRota);
    const [nomeRota, setNomeRota] = useState(initialRota.name || '');
    const [tipoRota, setTipoRota] = useState(initialRota.type || 'IDA');
    const [distanciaTotal, setDistanciaTotal] = useState(initialRota.distance_km || '');
    const [rotaAtiva, setRotaAtiva] = useState(initialRota.active ?? true);

    const isSaving = fetcher.state === "submitting";

    const handleSalvar = () => {
        const payload = {
            name: nomeRota,
            type: tipoRota,
            distance_km: Number(distanciaTotal),
            active: rotaAtiva,
            stops: rota.pontos,
            origin_city: rota.pontos[0].nome.split(',')[0],
            origin_state: rota.pontos[0].nome.split('-')[1]?.trim() || 'UF',
            destination_city: rota.pontos[rota.pontos.length - 1].nome.split(',')[0],
            destination_state: rota.pontos[rota.pontos.length - 1].nome.split('-')[1]?.trim() || 'UF',
            duration_minutes: rota.duracao_estimada_minutos
        };
        fetcher.submit({ intent: "save-route", payload: JSON.stringify(payload) }, { method: "post" });
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            <PageHeader
                title={isEdicao ? 'Editar Rota' : 'Nova Rota'}
                subtitle="Configuração de trajetos e pontos operacionais"
                backLink="/admin/routes"
                rightElement={
                    <div className="flex gap-3">
                        <Button variant="ghost" type="button" onClick={() => navigate('/admin/routes')} className="h-14 rounded-xl px-6 font-bold uppercase text-[12px]">Cancelar</Button>
                        <Button type="button" onClick={handleSalvar} disabled={isSaving} className="h-14 rounded-xl px-8 bg-primary font-bold uppercase text-[12px] shadow-lg shadow-primary/20">
                            {isSaving ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            {isEdicao ? 'Atualizar Rota' : 'Salvar Rota'}
                        </Button>
                    </div>
                }
            />

            {error && (
                <Alert variant="destructive" className="rounded-3xl border-destructive/20 bg-destructive/5">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="font-bold uppercase text-[12px]">Erro no Processamento</AlertTitle>
                    <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-1 space-y-8">
                    <FormSection title="Estrutura da Rota" icon={Route}>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase text-muted-foreground ml-1">Nome / Código</label>
                                <input value={nomeRota} onChange={e => setNomeRota(e.target.value)} className="w-full h-14 px-4 rounded-xl bg-muted/40 border-none font-bold text-[12px] uppercase outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase text-muted-foreground ml-1">Sentido Operacional</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button variant={tipoRota === 'IDA' ? 'default' : 'outline'} onClick={() => setTipoRota('IDA')} className="h-14 rounded-xl font-bold">IDA</Button>
                                    <Button variant={tipoRota === 'VOLTA' ? 'default' : 'outline'} onClick={() => setTipoRota('VOLTA')} className="h-14 rounded-xl font-bold">VOLTA</Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase text-muted-foreground ml-1">Distância (KM)</label>
                                <input type="number" value={distanciaTotal} onChange={e => setDistanciaTotal(e.target.value)} className="w-full h-14 px-4 rounded-xl bg-muted/40 border-none font-bold text-sm outline-none" />
                            </div>
                            <div className="flex items-center gap-3 pt-4 border-t">
                                <button onClick={() => setRotaAtiva(!rotaAtiva)} className={cn("w-10 h-6 rounded-full p-1 transition-all", rotaAtiva ? "bg-primary" : "bg-muted")}>
                                    <div className={cn("w-4 h-4 bg-white rounded-full transition-all", rotaAtiva ? "translate-x-4" : "translate-x-0")} />
                                </button>
                                <span className="text-[12px] font-semibold uppercase text-muted-foreground">Rota Ativa</span>
                            </div>
                        </div>
                    </FormSection>
                </div>
                <div className="lg:col-span-3">
                    <FormSection title="Paradas e Itinerário" icon={Route}>
                        <EditorRota rota={rota} onChange={setRota} />
                    </FormSection>
                </div>
            </div>
        </div>
    );
}
