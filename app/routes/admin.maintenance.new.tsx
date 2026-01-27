import React, { useState } from 'react';
import { data as json, redirect } from "react-router";
import type { LoaderFunction, ActionFunction } from "react-router";
import { useLoaderData, useNavigate, Form, useNavigation } from "react-router";
import {
    Wrench, Calendar, DollarSign, FileText, AlertTriangle,
    CheckCircle2, Loader2, Save, Bus, Truck, Gauge
} from 'lucide-react';
import { db } from "@/db/db.server";
import { maintenance as maintenanceTable, vehicle as vehicleTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PageHeader } from '@/components/Layout/PageHeader';
import { FormSection } from '@/components/Layout/FormSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { TipoManutencao, StatusManutencao } from '@/types';
import { MaintenanceForm } from '@/components/Forms/MaintenanceForm';

export const loader = async ({ request, params }: { request: Request, params: any }) => {
    const vehicles = await db.select().from(vehicleTable).where(eq(vehicleTable.status, 'ACTIVE'));
    return json({ vehicles });
};

export const action = async ({ request, params }: { request: Request, params: any }) => {
    const formData = await request.formData();
    const organization_id = "org_placeholder";

    const vehicle_id = formData.get("vehicle_id") as string;
    const status = formData.get("status") as string;
    const custo_pecas = formData.get("custo_pecas") as string;
    const custo_mao_de_obra = formData.get("custo_mao_de_obra") as string;

    const [newMaintenance] = await db.insert(maintenanceTable).values({
        organization_id,
        vehicle_id,
        tipo: formData.get("tipo") as string,
        status,
        descricao: formData.get("descricao") as string,
        oficina: formData.get("oficina") as string,
        responsavel: formData.get("responsavel") as string,
        custo_pecas,
        custo_mao_de_obra,
        data_agendada: new Date(formData.get("data_agendada") as string),
        data_inicio: formData.get("data_inicio") ? new Date(formData.get("data_inicio") as string) : null,
        data_conclusao: formData.get("data_conclusao") ? new Date(formData.get("data_conclusao") as string) : null,
        km_veiculo: parseInt(formData.get("km_veiculo") as string),
    } as any).returning();

    // If maintenance starts, update vehicle status to MAINTENANCE
    if (status === StatusManutencao.IN_PROGRESS) {
        await db.update(vehicleTable).set({ status: 'MAINTENANCE' } as any).where(eq(vehicleTable.id, vehicle_id));
    }

    // Logistic simplified: just redirect to maintenance index
    return redirect("/admin/maintenance");
};

export default function NewMaintenancePage() {
    const { vehicles } = useLoaderData<typeof loader>();
    const navigate = useNavigate();
    const navigation = useNavigation();
    const isSubmitting = navigation.state !== "idle";

    const [pecas, setPecas] = useState(0);
    const [maoDeObra, setMaoDeObra] = useState(0);

    return (
        <div key="new-maintenance-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            <PageHeader
                title="Nova Manutenção"
                subtitle="Agende ou registre ordens de serviço para a frota"
                backLink="/admin/maintenance"
            />

            <MaintenanceForm intent="create" vehicles={vehicles} />
        </div>
    );
}
