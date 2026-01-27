import React from 'react';
import { data as json, redirect } from "react-router";
import type { LoaderFunction, ActionFunction } from "react-router";
import { useLoaderData } from "react-router";
import { db } from "@/db/db.server";
import { parcel as parcelTable, trips as tripTable, vehicle as vehicleTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PageHeader } from '@/components/Layout/PageHeader';
import { ParcelForm } from '@/components/Forms/ParcelForm';

export const loader = async ({ request, params }: { request: Request, params: { id?: string } }) => {
    const { id } = params;

    const [parcel, trips, vehicles] = await Promise.all([
        db.query.parcel.findFirst({ where: eq(parcelTable.id, id!) }),
        db.select().from(tripTable).where(eq(tripTable.status, 'SCHEDULED')),
        db.select().from(vehicleTable).where(eq(vehicleTable.status, 'ACTIVE'))
    ]);

    if (!parcel) throw new Response("Encomenda não encontrada", { status: 404 });

    return json({ parcel, trips, vehicles });
};

export const action = async ({ request, params }: { request: Request, params: { id?: string } }) => {
    const { id } = params;
    const formData = await request.formData();

    const payload = {
        type: formData.get("type") as string,
        origin: formData.get("origin") as string,
        destination: formData.get("destination") as string,
        sender_name: formData.get("sender_name") as string,
        recipient_name: formData.get("recipient_name") as string,
        recipient_phone: formData.get("recipient_phone") as string,
        weight_kg: formData.get("weight_kg") as string,
        volume_m3: formData.get("volume_m3") as string,
        declared_value: formData.get("declared_value") as string,
        delivery_estimate: formData.get("delivery_estimate") ? new Date(formData.get("delivery_estimate") as string) : null,
        trip_id: formData.get("trip_id") as string || null,
        vehicle_id: formData.get("vehicle_id") as string || null,
        updatedAt: new Date()
    };

    await db.update(parcelTable).set(payload).where(eq(parcelTable.id, id!));

    return redirect("/admin/parcels");
};

export default function EditParcelPage() {
    const { parcel, trips, vehicles } = useLoaderData<typeof loader>();

    return (
        <div key="edit-parcel-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            <PageHeader
                title="Editar Encomenda"
                subtitle={`Alterando dados da carga ${parcel.code}`}
                backLink="/admin/parcels"
            />
            <ParcelForm intent="edit" defaultValues={parcel} trips={trips} vehicles={vehicles} />
        </div>
    );
}
