import React from 'react';
import { useNavigation, useNavigate, Form } from "react-router";
import {
    Package, User, MapPin, Truck, DollarSign, Loader2
} from 'lucide-react';
import { FormSection } from '@/components/Layout/FormSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ParcelFormProps {
    intent: 'create' | 'edit';
    defaultValues?: any;
    trips: any[];
    vehicles: any[];
}

export function ParcelForm({ intent, defaultValues = {}, trips, vehicles }: ParcelFormProps) {
    const navigate = useNavigate();
    const navigation = useNavigation();
    const isSubmitting = navigation.state !== "idle";
    const isEdit = intent === 'edit';

    return (
        <Form method="post" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormSection title="Remetente" icon={User}>
                        <div className="space-y-4">
                            <label className="text-label-caps ml-1">Nome Completo</label>
                            <Input name="sender_name" defaultValue={defaultValues.sender_name} required placeholder="Nome do remetente" className="h-14 rounded-xl bg-muted/40" />
                        </div>
                    </FormSection>
                    <FormSection title="Destinatário" icon={User}>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-label-caps ml-1">Nome Completo</label>
                                <Input name="recipient_name" defaultValue={defaultValues.recipient_name} required placeholder="Nome do destinatário" className="h-14 rounded-xl bg-muted/40" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-label-caps ml-1">Telefone</label>
                                <Input name="recipient_phone" defaultValue={defaultValues.recipient_phone} placeholder="(00) 00000-0000" className="h-14 rounded-xl bg-muted/40" />
                            </div>
                        </div>
                    </FormSection>
                </div>

                <FormSection title="Logística e Rota" icon={MapPin}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-label-caps ml-1">Origem</label>
                            <Input name="origin" defaultValue={defaultValues.origin} required placeholder="Cidade de Coleta" className="h-14 rounded-xl bg-muted/40" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-label-caps ml-1">Destino</label>
                            <Input name="destination" defaultValue={defaultValues.destination} required placeholder="Cidade de Entrega" className="h-14 rounded-xl bg-muted/40" />
                        </div>
                        <div className="lg:col-span-2 space-y-2">
                            <label className="text-label-caps ml-1">Previsão de Entrega</label>
                            <Input
                                type="date"
                                name="delivery_estimate"
                                defaultValue={defaultValues.delivery_estimate ? new Date(defaultValues.delivery_estimate).toISOString().split('T')[0] : ''}
                                className="h-14 rounded-xl bg-muted/40"
                            />
                        </div>
                    </div>
                </FormSection>

                <FormSection title="Detalhes da Carga" icon={Package}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-label-caps ml-1">Peso (kg)</label>
                            <Input type="number" step="0.1" name="weight_kg" defaultValue={defaultValues.weight_kg} placeholder="0.0" className="h-14 rounded-xl bg-muted/40" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-label-caps ml-1">Volume (m³)</label>
                            <Input type="number" step="0.01" name="volume_m3" defaultValue={defaultValues.volume_m3} placeholder="0.00" className="h-14 rounded-xl bg-muted/40" />
                        </div>
                    </div>
                </FormSection>
            </div>

            <div className="space-y-8">
                <FormSection title="Modalidade e Valor" icon={DollarSign}>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-label-caps ml-1">Tipo de Frete</label>
                            <select name="type" defaultValue={defaultValues.type} required className="w-full h-14 px-4 bg-muted/40 border border-border/50 rounded-xl font-bold outline-none">
                                <option value="BUS_CARGO">ÔNIBUS (Carga Fracionada)</option>
                                <option value="TRUCK_FREIGHT">CAMINHÃO (Frete Direto)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-label-caps ml-1">Valor Declarado (R$)</label>
                            <Input type="number" step="0.01" name="declared_value" defaultValue={defaultValues.declared_value} required placeholder="0,00" className="h-14 rounded-xl bg-muted/40 text-xl font-black text-emerald-600" />
                        </div>
                    </div>
                </FormSection>

                <FormSection title="Embarque" icon={Truck}>
                    <div className="space-y-2">
                        <label className="text-label-caps ml-1">Vincular a Viagem/Veículo</label>
                        <select name="trip_id" defaultValue={defaultValues.trip_id || ""} className="w-full h-14 px-4 bg-muted/40 border border-border/50 rounded-xl font-bold outline-none mb-4">
                            <option value="">Não vincular a viagem...</option>
                            {trips.map((t: any) => (
                                <option key={t.id} value={t.id}>{t.id.substring(0, 8)} - {t.departure_date}</option>
                            ))}
                        </select>
                        <select name="vehicle_id" defaultValue={defaultValues.vehicle_id || ""} className="w-full h-14 px-4 bg-muted/40 border border-border/50 rounded-xl font-bold outline-none">
                            <option value="">Não vincular a veículo...</option>
                            {vehicles.map((v: any) => (
                                <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>
                            ))}
                        </select>
                    </div>
                </FormSection>

                <div className="flex flex-col gap-4">
                    <Button type="submit" disabled={isSubmitting} className="h-16 rounded-[1.25rem] bg-primary text-primary-foreground font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20">
                        {isSubmitting ? <Loader2 className="animate-spin" /> : (isEdit ? 'SALVAR ALTERAÇÕES' : 'REGISTRAR CARGA')}
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => navigate(-1)} className="h-14 rounded-xl font-black uppercase text-[10px] tracking-widest">
                        CANCELAR
                    </Button>
                </div>
            </div>
        </Form>
    );
}
