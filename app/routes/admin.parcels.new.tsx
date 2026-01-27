import React from 'react';
import { data as json, redirect } from "react-router";
import type { LoaderFunction, ActionFunction } from "react-router";
import { useLoaderData, useNavigate, Form, useNavigation } from "react-router";
import {
    Package, User, MapPin, Truck, Save, ArrowLeft, Loader2,
    AlertCircle, CheckCircle2, DollarSign, ListFilter, Bus
} from 'lucide-react';
import { db } from "@/db/db.server";
import { parcel as parcelTable, trips as tripTable, vehicle as vehicleTable } from "@/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import { PageHeader } from '@/components/Layout/PageHeader';
import { FormSection } from '@/components/Layout/FormSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ParcelForm } from '@/components/Forms/ParcelForm';

export const loader = async ({ request, params }: { request: Request, params: any }) => {
    const [trips, vehicles] = await Promise.all([
        db.select().from(tripTable).where(eq(tripTable.status, 'SCHEDULED')),
        db.select().from(vehicleTable).where(eq(vehicleTable.status, 'ACTIVE'))
    ]);
    return json({ trips, vehicles });
};

export const action = async ({ request, params }: { request: Request, params: any }) => {
    const formData = await request.formData();
    const organization_id = "org_placeholder";

    const payload = {
        organization_id,
        code: `ENC${Math.floor(100000 + Math.random() * 900000)}`,
        type: formData.get("type") as string,
        status: 'AWAITING',
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
        history: [],
    };

    await db.insert(parcelTable).values(payload);

    return redirect("/admin/parcels");
};

export default function NewParcelPage() {
    const { trips, vehicles } = useLoaderData<typeof loader>();
    const navigate = useNavigate();
    const navigation = useNavigation();
    const isSubmitting = navigation.state !== "idle";

    return (
        <div key="new-parcel-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            <PageHeader
                title="Nova Encomenda"
                subtitle="Registre uma nova carga no sistema logístico"
                backLink="/admin/parcels"
            />

            <ParcelForm intent="create" trips={trips} vehicles={vehicles} />
        </div>
    );
}
