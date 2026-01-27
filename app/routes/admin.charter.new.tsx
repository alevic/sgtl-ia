import React from 'react';
import { data as json, redirect } from "react-router";
import type { LoaderFunction, ActionFunction } from "react-router";
import { useLoaderData, useNavigate, Form, useNavigation } from "react-router";
import {
    ArrowLeft, Save, Building2, Bus, MapPin, Calendar, FileText, User,
    DollarSign, Route, Clock, Users, Loader2
} from 'lucide-react';
import { db } from "@/db/db.server";
import { charter as charterTable, clients as clientTable, vehicle as vehicleTable, driver as driverTable, routes as routesTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PageHeader } from '@/components/Layout/PageHeader';
import { FormSection } from '@/components/Layout/FormSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { CharterForm } from '@/components/Forms/CharterForm';

export const loader = async ({ request, params }: { request: Request, params: any }) => {
    const [clients, vehicles, drivers, routes] = await Promise.all([
        db.select().from(clientTable),
        db.select().from(vehicleTable).where(eq(vehicleTable.status, 'ACTIVE')),
        db.select().from(driverTable).where(eq(driverTable.status, 'AVAILABLE')),
        db.select().from(routesTable).where(eq(routesTable.active, true))
    ]);

    return json({ clients, vehicles, drivers, routes });
};

export const action = async ({ request, params }: { request: Request, params: any }) => {
    const formData = await request.formData();

    // organization_id should come from auth, but using a placeholder for now
    const organization_id = "org_placeholder";

    const payload = {
        organization_id,
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
    };

    await db.insert(charterTable).values(payload);

    return redirect("/admin/charter");
};

export default function NewCharterPage() {
    const { clients, vehicles, drivers, routes } = useLoaderData<typeof loader>();
    const navigate = useNavigate();
    const navigation = useNavigation();
    const isSubmitting = navigation.state !== "idle";

    return (
        <div key="new-charter-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            <PageHeader
                title="Novo Fretamento"
                subtitle="Registre uma nova solicitação de aluguel de frota corporativa"
                backLink="/admin/charter"
            />

            <CharterForm
                intent="create"
                clients={clients}
                vehicles={vehicles}
                drivers={drivers}
                routes={routes}
            />
        </div>
    );
}
