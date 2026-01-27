import React, { useState, useEffect } from 'react';
import { data as json, redirect } from "react-router";
import type { LoaderFunction, ActionFunction } from "react-router";
import { useLoaderData, useNavigate, useParams, useNavigation, useActionData, Form, useFetcher } from "react-router";
import { ArrowLeft, Save, Route, Loader, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { db } from "@/db/db.server";
import { routes as routesTable, state as stateTable, city as cityTable, neighborhood as neighborhoodTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/Layout/PageHeader';
import { FormSection } from '@/components/Layout/FormSection';
import { RouteForm } from '@/components/Forms/RouteForm';
import { criarRotaVazia } from '@/utils/rotaValidation';

export const loader = async () => {
    const initialRota: any = criarRotaVazia('IDA');
    return json({ initialRota, isEdicao: false });
};

export const action = async ({ request }: { request: Request }) => {
    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "save-route") {
        const payload = JSON.parse(formData.get("payload") as string);

        try {
            await db.insert(routesTable).values({
                name: payload.name,
                origin_city: payload.origin_city,
                origin_state: payload.origin_state,
                destination_city: payload.destination_city,
                destination_state: payload.destination_state,
                distance_km: payload.distance_km,
                duration_minutes: payload.duration_minutes,
                stops: JSON.stringify(payload.stops),
                active: payload.active,
                type: payload.type,
                organization_id: "org_default"
            } as any);
            return redirect("/admin/routes");
        } catch (e) {
            console.error(e);
            return json({ error: "Erro ao salvar rota" }, { status: 500 });
        }
    }

    return null;
};

export default function NewRoutePage() {
    const { initialRota, isEdicao } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();

    return (
        <RouteForm
            initialRota={initialRota}
            isEdicao={isEdicao}
            error={actionData?.error}
        />
    );
}
