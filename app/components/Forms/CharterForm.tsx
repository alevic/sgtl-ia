import React from 'react';
import { useNavigation, useNavigate, Form } from "react-router";
import {
    Building2, MapPin, Calendar, DollarSign, FileText, Loader2
} from 'lucide-react';
import { FormSection } from '@/components/Layout/FormSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CharterFormProps {
    intent: 'create' | 'edit';
    defaultValues?: any;
    clients: any[];
    vehicles: any[];
    drivers: any[];
    routes: any[];
}

export function CharterForm({ intent, defaultValues = {}, clients, vehicles, drivers, routes }: CharterFormProps) {
    const navigate = useNavigate();
    const navigation = useNavigation();
    const isSubmitting = navigation.state !== "idle";
    const isEdit = intent === 'edit';

    return (
        <Form method="post" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <FormSection title="Cliente Corporativo" icon={Building2}>
                    <div className="space-y-4">
                        <label className="text-label-caps ml-1">Selecionar Cliente</label>
                        <select name="client_id" defaultValue={defaultValues.client_id} required className="w-full h-14 px-4 bg-muted/40 border border-border/50 rounded-xl font-bold outline-none">
                            <option value="">Selecione um cliente...</option>
                            {clients.map((c: any) => (
                                <option key={c.id} value={c.id}>{c.nome} {c.cnpj ? `(${c.cnpj})` : ''}</option>
                            ))}
                        </select>
                    </div>
                </FormSection>

                <FormSection title="Rota e Localização" icon={MapPin}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-label-caps ml-1">Cidade de Origem</label>
                            <Input name="origin" defaultValue={defaultValues.origin} required placeholder="Ex: São Paulo, SP" className="h-14 rounded-xl bg-muted/40" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-label-caps ml-1">Cidade de Destino</label>
                            <Input name="destination" defaultValue={defaultValues.destination} required placeholder="Ex: Rio de Janeiro, RJ" className="h-14 rounded-xl bg-muted/40" />
                        </div>
                        <div className="lg:col-span-2 space-y-2">
                            <label className="text-label-caps ml-1">Vincular Rota (Opcional)</label>
                            <select name="route_id" defaultValue={defaultValues.route_id || ""} className="w-full h-14 px-4 bg-muted/40 border border-border/50 rounded-xl font-bold outline-none">
                                <option value="">Nenhuma rota específica...</option>
                                {routes.map((r: any) => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </FormSection>

                <FormSection title="Datas do Evento" icon={Calendar}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-label-caps ml-1">Início</label>
                            <Input
                                type="datetime-local"
                                name="start_date"
                                defaultValue={defaultValues.start_date ? new Date(defaultValues.start_date).toISOString().slice(0, 16) : ''}
                                required
                                className="h-14 rounded-xl bg-muted/40"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-label-caps ml-1">Término</label>
                            <Input
                                type="datetime-local"
                                name="end_date"
                                defaultValue={defaultValues.end_date ? new Date(defaultValues.end_date).toISOString().slice(0, 16) : ''}
                                required
                                className="h-14 rounded-xl bg-muted/40"
                            />
                        </div>
                    </div>
                </FormSection>
            </div>

            <div className="space-y-8">
                <FormSection title="Recursos e Valores" icon={DollarSign}>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-label-caps ml-1">Veículo</label>
                            <select name="vehicle_id" defaultValue={defaultValues.vehicle_id || ""} className="w-full h-14 px-4 bg-muted/40 border border-border/50 rounded-xl font-bold outline-none">
                                <option value="">Aguardando atribuição...</option>
                                {vehicles.map((v: any) => (
                                    <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-label-caps ml-1">Motorista</label>
                            <select name="driver_id" defaultValue={defaultValues.driver_id || ""} className="w-full h-14 px-4 bg-muted/40 border border-border/50 rounded-xl font-bold outline-none">
                                <option value="">Aguardando atribuição...</option>
                                {drivers.map((d: any) => (
                                    <option key={d.id} value={d.id}>{d.nome}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-label-caps ml-1">Valor do Contrato (R$)</label>
                            <Input type="number" step="0.01" name="total_value" defaultValue={defaultValues.total_value} required placeholder="0,00" className="h-14 rounded-xl bg-muted/40 text-xl font-black text-emerald-600" />
                        </div>
                    </div>
                </FormSection>

                <FormSection title="Notas" icon={FileText}>
                    <textarea
                        name="notes"
                        defaultValue={defaultValues.notes}
                        rows={4}
                        className="w-full p-4 bg-muted/40 border-none rounded-2xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                        placeholder="Observações adicionais..."
                    />
                </FormSection>

                <div className="flex flex-col gap-4">
                    <Button type="submit" disabled={isSubmitting} className="h-16 rounded-[1.25rem] bg-primary text-primary-foreground font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20">
                        {isSubmitting ? <Loader2 className="animate-spin" /> : (isEdit ? 'SALVAR ALTERAÇÕES' : 'CONFIRMAR FRETAMENTO')}
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => navigate(-1)} className="h-14 rounded-xl font-black uppercase text-[10px] tracking-widest">
                        CANCELAR
                    </Button>
                </div>
            </div>
        </Form>
    );
}
