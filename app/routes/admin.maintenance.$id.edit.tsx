import React from 'react';
import { data as json, redirect } from "react-router";
import type { LoaderFunction, ActionFunction } from "react-router";
import { useLoaderData } from "react-router";
import { db } from "@/db/db.server";
import { maintenance as maintenanceTable, vehicle as vehicleTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PageHeader } from '@/components/Layout/PageHeader';
import { MaintenanceForm } from '@/components/Forms/MaintenanceForm';
import { StatusManutencao } from '@/types';

export const loader = async ({ request, params }: { request: Request, params: { id?: string } }) => {
    const { id } = params;

    if (!id) throw new Response("ID não fornecido", { status: 400 });

    const [maintenance, vehicles] = await Promise.all([
        db.query.maintenance.findFirst({ where: eq(maintenanceTable.id, id) }),
        db.select().from(vehicleTable).where(eq(vehicleTable.status, 'ACTIVE'))
    ]);

    if (!maintenance) throw new Response("Manutenção não encontrada", { status: 404 });

    return json({ maintenance, vehicles });
};

export const action = async ({ request, params }: { request: Request, params: { id?: string } }) => {
    const { id } = params;
    const formData = await request.formData();

    const vehicle_id = formData.get("vehicle_id") as string;
    const status = formData.get("status") as string;
    const custo_pecas = formData.get("custo_pecas") as string;
    const custo_mao_de_obra = formData.get("custo_mao_de_obra") as string;

    const payload = {
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
        updatedAt: new Date()
    };

    await db.update(maintenanceTable).set(payload).where(eq(maintenanceTable.id, id!));

    // If maintenance starts, update vehicle status to MAINTENANCE
    if (status === StatusManutencao.IN_PROGRESS) {
        await db.update(vehicleTable).set({ status: 'MAINTENANCE' } as any).where(eq(vehicleTable.id, vehicle_id));
    }

    return redirect("/admin/maintenance");
};

export default function EditMaintenancePage() {
    const { maintenance, vehicles } = useLoaderData<typeof loader>();

    return (
        <div key="edit-maintenance-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            <PageHeader
                title="Editar Manutenção"
                subtitle={`Ordem de Serviço #${maintenance.id.substring(0, 8)}`}
                backLink="/admin/maintenance"
            />
            <MaintenanceForm intent="edit" defaultValues={maintenance} vehicles={vehicles} />
        </div>
    );
}
