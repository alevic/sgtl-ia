import React, { useState } from 'react';
import { data as json, redirect } from "react-router";
import type { ActionFunction } from "react-router";
import { Form, useActionData, useNavigation, useNavigate } from "react-router";
import { ArrowLeft, Save, User, FileText, Globe, AlertTriangle, Phone, MapPin, Calendar, Briefcase, CheckCircle2, Loader, AlertCircle } from 'lucide-react';
import { DatePicker } from '@/components/Form/DatePicker';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/Layout/PageHeader';
import { FormSection } from '@/components/Layout/FormSection';
import { db } from "@/db/db.server";
import { driver as driverTable } from "@/db/schema";
import { DriverStatus } from '@/types';

export const action = async ({ request, params }: { request: Request, params: any }) => {
    const formData = await request.formData();
    const nome = formData.get("nome") as string;
    const cnh = formData.get("cnh") as string;
    const categoria_cnh = formData.get("categoria_cnh") as string;
    const validade_cnh = formData.get("validade_cnh") as string;
    const status = formData.get("status") as string;

    if (!nome || !cnh || !validade_cnh) {
        return json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
    }

    try {
        await db.insert(driverTable).values({
            nome,
            cnh,
            categoria_cnh,
            validade_cnh,
            data_contratacao: new Date().toISOString().split('T')[0],
            organization_id: "org_default" // Mock or get from session
        } as any);
        return redirect("/admin/drivers");
    } catch (e) {
        return json({ error: "Erro ao salvar motorista no banco" }, { status: 500 });
    }
};

export default function NewDriverPage() {
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const navigate = useNavigate();
    const isSubmitting = navigation.state === "submitting";

    const [validadeCnh, setValidadeCnh] = useState('');

    return (
        <div key="novo-motorista-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            <PageHeader
                title="Novo Motorista"
                subtitle="Cadastre um novo motorista no sistema de frota"
                backLink="/admin/drivers"
                rightElement={
                    <>
                        <Button variant="ghost" onClick={() => navigate('/admin/drivers')} className="h-14 rounded-xl px-6 font-black uppercase text-[12px]">Cancelar</Button>
                        <Button type="submit" form="driver-form" disabled={isSubmitting} className="h-14 rounded-xl px-8 bg-primary font-black uppercase text-[12px] shadow-lg shadow-primary/20">
                            {isSubmitting ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Salvar Motorista
                        </Button>
                    </>
                }
            />

            {actionData?.error && (
                <Alert variant="destructive" className="rounded-3xl border-destructive/20 bg-destructive/5 backdrop-blur-sm">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="font-black uppercase text-[12px]">Erro no Cadastro</AlertTitle>
                    <AlertDescription className="text-xs font-medium">{actionData.error}</AlertDescription>
                </Alert>
            )}

            <Form id="driver-form" method="post" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <FormSection title="Dados Pessoais" icon={User}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Nome Completo *</label>
                                <input name="nome" type="text" required placeholder="Ex: Carlos Alberto SILVA" className="w-full h-14 px-4 rounded-xl bg-muted/40 border-none font-medium outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Status Operacional</label>
                                <select name="status" className="w-full h-14 px-4 rounded-xl bg-muted/40 border-none font-black uppercase text-[12px] appearance-none">
                                    <option value={DriverStatus.AVAILABLE}>Disponível</option>
                                    <option value={DriverStatus.IN_TRANSIT}>Em Viagem</option>
                                    <option value={DriverStatus.ON_LEAVE}>Férias</option>
                                </select>
                            </div>
                        </div>
                    </FormSection>

                    <FormSection title="CNH - Carteira Nacional de Habilitação" icon={FileText}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Número da CNH *</label>
                                <input name="cnh" type="text" required maxLength={11} className="w-full h-14 px-4 rounded-xl bg-muted/40 border-none font-medium outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Categoria *</label>
                                <select name="categoria_cnh" className="w-full h-14 px-4 rounded-xl bg-muted/40 border-none font-black uppercase text-[12px] appearance-none">
                                    <option value="D">D - Ônibus e Van</option>
                                    <option value="E">E - Articulados</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Validade *</label>
                                <input type="hidden" name="validade_cnh" value={validadeCnh} />
                                <DatePicker value={validadeCnh} onChange={setValidadeCnh} />
                            </div>
                        </div>
                    </FormSection>
                </div>

                <div className="space-y-8">
                    <FormSection title="Contato" icon={Phone}>
                        <div className="space-y-4">
                            <input name="telefone" type="tel" placeholder="Telefone" className="w-full h-14 px-4 rounded-xl bg-muted/40 border-none font-medium outline-none" />
                            <input name="email" type="email" placeholder="E-mail" className="w-full h-14 px-4 rounded-xl bg-muted/40 border-none font-medium outline-none" />
                        </div>
                    </FormSection>
                </div>
            </Form>
        </div>
    );
}
