import React from 'react';
import { data as json, redirect } from "react-router";
import type { LoaderFunction, ActionFunction } from "react-router";
import { useLoaderData } from "react-router";
import { db } from "@/db/db.server";
import { charter as charterTable, clients as clientTable, vehicle as vehicleTable, driver as driverTable, routes as routesTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PageHeader } from '@/components/Layout/PageHeader';
import { CharterForm } from '@/components/Forms/CharterForm';

export const loader = async ({ request, params }: { request: Request, params: { id?: string } }) => {
    const { id } = params;

    if (!id) throw new Response("ID não fornecido", { status: 400 });

    const [charter, clients, vehicles, drivers, routes] = await Promise.all([
        db.query.charter.findFirst({ where: eq(charterTable.id, id) }),
        db.select().from(clientTable),
        db.select().from(vehicleTable).where(eq(vehicleTable.status, 'ACTIVE')),
        db.select().from(driverTable).where(eq(driverTable.status, 'AVAILABLE')),
        db.select().from(routesTable).where(eq(routesTable.active, true))
    ]);

    if (!charter) throw new Response("Fretamento não encontrado", { status: 404 });

    return json({ charter, clients, vehicles, drivers, routes });
};

export const action = async ({ request, params }: { request: Request, params: { id?: string } }) => {
    const { id } = params;
    const formData = await request.formData();

    const payload = {
        client_id: formData.get("client_id") as string,
        vehicle_id: (formData.get("vehicle_id") as string) || null,
        driver_id: (formData.get("driver_id") as string) || null,
        origin: formData.get("origin") as string,
        destination: formData.get("destination") as string,
        start_date: new Date(formData.get("start_date") as string),
        end_date: new Date(formData.get("end_date") as string),
        type: (formData.get("type") as string) || 'PONTUAL',
        route_id: (formData.get("route_id") as string) || null,
        total_value: formData.get("total_value") as string,
        notes: formData.get("notes") as string,
        updatedAt: new Date()
    };

    await db.update(charterTable).set(payload).where(eq(charterTable.id, id!));

    return redirect("/admin/charter");
};

export default function EditCharterPage() {
    const { charter, clients, vehicles, drivers, routes } = useLoaderData<typeof loader>();

    return (
        <div key="edit-charter-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            <PageHeader
                title="Editar Fretamento"
                subtitle={`Alterando solicitação #${charter.id.substring(0, 8)}`}
                backLink="/admin/charter"
            />
            <CharterForm
                intent="edit"
                defaultValues={charter}
                clients={clients}
                vehicles={vehicles}
                drivers={drivers}
                routes={routes}
            />
        </div>
    );
}
