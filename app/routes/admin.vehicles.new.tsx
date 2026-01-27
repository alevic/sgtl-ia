import React, { useState } from 'react';
import { data as json, redirect } from "react-router";
import type { LoaderFunction, ActionFunction } from "react-router";
import { useLoaderData, useNavigate, Form, useNavigation } from "react-router";
import {
    Bus, Truck, FileText, Gauge, Calendar, Wrench, Plus, Trash2, Image,
    Upload, X, Loader2, Save
} from 'lucide-react';
import { db } from "@/db/db.server";
import { vehicle as vehicleTable, vehicleFeature as featureTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PageHeader } from '@/components/Layout/PageHeader';
import { FormSection } from '@/components/Layout/FormSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { VeiculoStatus, IVeiculoFeature } from '@/types';

export const action = async ({ request, params }: { request: Request, params: any }) => {
    const formData = await request.formData();
    const organization_id = "org_placeholder";

    // Parse features from hidden input
    const featuresRaw = formData.get("features_json") as string;
    const features = featuresRaw ? JSON.parse(featuresRaw) : [];

    await db.transaction(async (tx) => {
        const [newVehicle] = await tx.insert(vehicleTable).values({
            organization_id,
            placa: (formData.get("placa") as string).toUpperCase(),
            modelo: formData.get("modelo") as string,
            tipo: formData.get("tipo") as string,
            status: (formData.get("status") as string) || VeiculoStatus.ACTIVE,
            ano: parseInt(formData.get("ano") as string),
            km_atual: parseInt(formData.get("km_atual") as string),
            proxima_revisao_km: parseInt(formData.get("proxima_revisao_km") as string),
            ultima_revisao: formData.get("ultima_revisao") ? new Date(formData.get("ultima_revisao") as string) : null,
            is_double_deck: formData.get("is_double_deck") === "on",
            capacidade_passageiros: formData.get("tipo") === "ONIBUS" ? parseInt(formData.get("capacidade_passageiros") as string) : null,
            capacidade_carga: formData.get("tipo") === "CAMINHAO" ? parseFloat(formData.get("capacidade_carga") as string) : null,
            observacoes: formData.get("observacoes") as string || null,
            imagem: formData.get("imagem") as string || null,
        } as any).returning();

        if (features && features.length > 0) {
            await tx.insert(featureTable).values(
                features.map((f: any) => ({
                    vehicleId: newVehicle.id,
                    category: f.category,
                    label: f.label,
                    value: f.value
                }))
            );
        }
    });

    return redirect(`/admin/fleet`);

    return redirect(`/admin/fleet`);
};

export default function NewVehiclePage() {
    const navigate = useNavigate();
    const navigation = useNavigation();
    const isSubmitting = navigation.state !== "idle";

    const [tipo, setTipo] = useState<'ONIBUS' | 'CAMINHAO'>('ONIBUS');
    const [features, setFeatures] = useState<IVeiculoFeature[]>([
        { category: 'Mecânica', label: 'Motor Volvo', value: '' },
        { category: 'Comodidades', label: 'Ar Condicionado', value: '' },
    ]);

    const addFeature = () => setFeatures([...features, { category: '', label: '', value: '' }]);
    const removeFeature = (idx: number) => setFeatures(features.filter((_, i) => i !== idx));
    const updateFeature = (idx: number, field: keyof IVeiculoFeature, val: string) => {
        const newFeatures = [...features];
        newFeatures[idx][field] = val;
        setFeatures(newFeatures);
    };

    return (
        <div key="new-vehicle-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            <PageHeader
                title="Novo Veículo"
                subtitle="Integre uma nova unidade à frota operacional"
                backLink="/admin/fleet"
            />

            <Form method="post" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <FormSection title="Especificações Técnicas" icon={Bus}>
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setTipo('ONIBUS')}
                                    className={cn(
                                        "h-16 rounded-2xl border-2 transition-all font-black text-xs tracking-widest uppercase flex items-center justify-center gap-3",
                                        tipo === 'ONIBUS' ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/10" : "border-border/50 text-muted-foreground"
                                    )}
                                >
                                    <Bus size={18} /> ÔNIBUS
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTipo('CAMINHAO')}
                                    className={cn(
                                        "h-16 rounded-2xl border-2 transition-all font-black text-xs tracking-widest uppercase flex items-center justify-center gap-3",
                                        tipo === 'CAMINHAO' ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/10" : "border-border/50 text-muted-foreground"
                                    )}
                                >
                                    <Truck size={18} /> CAMINHÃO
                                </button>
                                <input type="hidden" name="tipo" value={tipo} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-label-caps ml-1">Placa *</label>
                                    <Input name="placa" required placeholder="ABC-1234" maxLength={8} className="h-14 rounded-xl bg-muted/40 uppercase font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-label-caps ml-1">Modelo *</label>
                                    <Input name="modelo" required placeholder="Ex: Marcopolo Paradiso" className="h-14 rounded-xl bg-muted/40" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-label-caps ml-1">Ano *</label>
                                    <Input type="number" name="ano" required placeholder="2023" className="h-14 rounded-xl bg-muted/40" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-label-caps ml-1">{tipo === 'ONIBUS' ? 'Capacidade (Pax)' : 'Capacidade (Ton)'}</label>
                                    <Input
                                        type="number"
                                        name={tipo === 'ONIBUS' ? "capacidade_passageiros" : "capacidade_carga"}
                                        required
                                        placeholder="0"
                                        className="h-14 rounded-xl bg-muted/40"
                                    />
                                </div>
                            </div>
                        </div>
                    </FormSection>

                    <FormSection title="Saúde do Veículo" icon={Wrench}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-label-caps ml-1">KM Atual *</label>
                                <Input type="number" name="km_atual" required placeholder="0" className="h-14 rounded-xl bg-muted/40" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-label-caps ml-1">Próxima Revisão (KM) *</label>
                                <Input type="number" name="proxima_revisao_km" required placeholder="0" className="h-14 rounded-xl bg-muted/40" />
                            </div>
                        </div>
                    </FormSection>

                    <FormSection title="Características" icon={FileText}>
                        <div className="space-y-4">
                            {features.map((f, i) => (
                                <div key={i} className="flex gap-3">
                                    <Input
                                        placeholder="Categoria"
                                        value={f.category}
                                        onChange={(e) => updateFeature(i, 'category', e.target.value)}
                                        className="h-12 bg-muted/20"
                                    />
                                    <Input
                                        placeholder="Características"
                                        value={f.label}
                                        onChange={(e) => updateFeature(i, 'label', e.target.value)}
                                        className="h-12 bg-muted/20 flex-1"
                                    />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeFeature(i)} className="text-destructive"><Trash2 size={18} /></Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" onClick={addFeature} className="w-full h-12 border-dashed rounded-xl gap-2 font-bold text-xs uppercase tracking-widest">
                                <Plus size={14} /> ADICIONAR CARACTERÍSTICA
                            </Button>
                            <input type="hidden" name="features_json" value={JSON.stringify(features)} />
                        </div>
                    </FormSection>
                </div>

                <div className="space-y-8">
                    <FormSection title="Status Inicial">
                        <select name="status" className="w-full h-14 px-4 bg-muted/40 border border-border/50 rounded-xl font-bold outline-none">
                            <option value={VeiculoStatus.ACTIVE}>ATIVO</option>
                            <option value={VeiculoStatus.MAINTENANCE}>MANUTENÇÃO</option>
                            <option value={VeiculoStatus.IN_TRANSIT}>EM TRÂNSITO</option>
                        </select>
                    </FormSection>

                    <FormSection title="Notas">
                        <textarea name="observacoes" rows={6} className="w-full p-4 bg-muted/40 border-none rounded-2xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none" placeholder="Detalhes técnicos adicionais..." />
                    </FormSection>

                    <div className="flex flex-col gap-4">
                        <Button type="submit" disabled={isSubmitting} className="h-16 rounded-[1.25rem] bg-primary text-primary-foreground font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20">
                            {isSubmitting ? <Loader2 className="animate-spin" /> : 'CONFIRMAR INCLUSÃO'}
                        </Button>
                        <Button type="button" variant="ghost" onClick={() => navigate(-1)} className="h-14 rounded-xl font-black uppercase text-[10px] tracking-widest">
                            CANCELAR
                        </Button>
                    </div>
                </div>
            </Form>
        </div>
    );
}
