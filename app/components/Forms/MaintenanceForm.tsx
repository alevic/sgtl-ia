import React, { useState } from 'react';
import { useNavigation, useNavigate, Form } from "react-router";
import {
    Wrench, Calendar, DollarSign, AlertTriangle, Loader2
} from 'lucide-react';
import { FormSection } from '@/components/Layout/FormSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TipoManutencao, StatusManutencao } from '@/types';

interface MaintenanceFormProps {
    intent: 'create' | 'edit';
    defaultValues?: any;
    vehicles: any[];
}

export function MaintenanceForm({ intent, defaultValues = {}, vehicles }: MaintenanceFormProps) {
    const navigate = useNavigate();
    const navigation = useNavigation();
    const isSubmitting = navigation.state !== "idle";
    const isEdit = intent === 'edit';

    const [pecas, setPecas] = useState(parseFloat(defaultValues.custo_pecas) || 0);
    const [maoDeObra, setMaoDeObra] = useState(parseFloat(defaultValues.custo_mao_de_obra) || 0);

    return (
        <Form method="post" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <FormSection title="Dados da Ordem" icon={Wrench}>
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-label-caps ml-1">Veículo *</label>
                                <select name="vehicle_id" defaultValue={defaultValues.vehicle_id} required className="w-full h-14 px-4 bg-muted/40 border border-border/50 rounded-xl font-bold outline-none">
                                    <option value="">Selecione um veículo...</option>
                                    {vehicles.map((v: any) => (
                                        <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-label-caps ml-1">Tipo de Serviço</label>
                                <select name="tipo" defaultValue={defaultValues.tipo} required className="w-full h-14 px-4 bg-muted/40 border border-border/50 rounded-xl font-bold outline-none">
                                    <option value={TipoManutencao.PREVENTIVE}>PREVENTIVA</option>
                                    <option value={TipoManutencao.CORRECTIVE}>CORRETIVA</option>
                                    <option value={TipoManutencao.PREDICTIVE}>PREDITIVA</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-label-caps ml-1">Descrição do Problema/Serviço</label>
                            <textarea
                                name="descricao"
                                defaultValue={defaultValues.descricao}
                                required
                                rows={3}
                                className="w-full p-4 bg-muted/40 border-none rounded-2xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                                placeholder="Relato técnico..."
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-label-caps ml-1">Vincular Oficina</label>
                                <Input name="oficina" defaultValue={defaultValues.oficina} placeholder="Nome da oficina ou fornecedor" className="h-14 rounded-xl bg-muted/40" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-label-caps ml-1">KM do Veículo na Entrada</label>
                                <Input type="number" name="km_veiculo" defaultValue={defaultValues.km_veiculo} required placeholder="Ex: 125400" className="h-14 rounded-xl bg-muted/40" />
                            </div>
                        </div>
                    </div>
                </FormSection>

                <FormSection title="Custos e Peças" icon={DollarSign}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-label-caps ml-1">Custo Peças (R$)</label>
                            <Input type="number" step="0.01" name="custo_pecas" value={pecas} onChange={(e) => setPecas(Number(e.target.value))} className="h-14 rounded-xl bg-muted/40" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-label-caps ml-1">Mão de Obra (R$)</label>
                            <Input type="number" step="0.01" name="custo_mao_de_obra" value={maoDeObra} onChange={(e) => setMaoDeObra(Number(e.target.value))} className="h-14 rounded-xl bg-muted/40" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-label-caps ml-1">Investimento Total</label>
                            <div className="h-14 flex items-center px-4 bg-muted/20 border-2 border-primary/20 rounded-xl text-primary font-black text-xl">
                                R$ {(pecas + maoDeObra).toFixed(2)}
                            </div>
                        </div>
                    </div>
                </FormSection>
            </div>

            <div className="space-y-8">
                <FormSection title="Cronograma" icon={Calendar}>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-label-caps ml-1">Data Agendada</label>
                            <Input
                                type="date"
                                name="data_agendada"
                                required
                                defaultValue={defaultValues.data_agendada ? new Date(defaultValues.data_agendada).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                                className="h-14 rounded-xl bg-muted/40"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-label-caps ml-1">Status Inicial</label>
                            <select name="status" defaultValue={defaultValues.status} className="w-full h-14 px-4 bg-muted/40 border border-border/50 rounded-xl font-bold outline-none">
                                <option value={StatusManutencao.SCHEDULED}>AGENDADO</option>
                                <option value={StatusManutencao.IN_PROGRESS}>EM EXECUÇÃO</option>
                                <option value={StatusManutencao.COMPLETED}>CONCLUÍDO</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-label-caps ml-1">Responsável Interno</label>
                            <Input name="responsavel" defaultValue={defaultValues.responsavel} placeholder="Quem autorizou ou acompanha" className="h-14 rounded-xl bg-muted/40" />
                        </div>
                    </div>
                </FormSection>

                <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-3xl space-y-3">
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={16} className="text-amber-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Atenção Crítica</span>
                    </div>
                    <p className="text-[11px] font-bold text-muted-foreground leading-relaxed uppercase">
                        VEÍCULOS EM MANUTENÇÃO SÃO BLOQUEADOS PARA NOVAS VIAGENS ATÉ A CONCLUSÃO.
                    </p>
                </div>

                <div className="flex flex-col gap-4">
                    <Button type="submit" disabled={isSubmitting} className="h-16 rounded-[1.25rem] bg-primary text-primary-foreground font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20">
                        {isSubmitting ? <Loader2 className="animate-spin" /> : (isEdit ? 'SALVAR ALTERAÇÕES' : 'ABRIR ORDEM DE SERVIÇO')}
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => navigate(-1)} className="h-14 rounded-xl font-black uppercase text-[10px] tracking-widest">
                        CANCELAR
                    </Button>
                </div>
            </div>
        </Form>
    );
}
