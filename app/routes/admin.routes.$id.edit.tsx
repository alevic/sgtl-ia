import React from 'react';
import { data as json, redirect } from "react-router";
import type { LoaderFunction, ActionFunction } from "react-router";
import { useLoaderData, useActionData } from "react-router";
import { db } from "@/db/db.server";
import { routes as routesTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { RouteForm } from '@/components/Forms/RouteForm';

export const loader = async ({ request, params }: { request: Request, params: { id?: string } }) => {
    const { id } = params;

    if (!id) throw new Response("ID não fornecido", { status: 400 });

    const rota = await db.query.routes.findFirst({
        where: eq(routesTable.id, id)
    });

    if (!rota) throw new Response("Rota não encontrada", { status: 404 });

    const initialRota = {
        ...rota,
        pontos: typeof rota.stops === 'string' ? JSON.parse(rota.stops) : rota.stops
    };

    return json({ initialRota, isEdicao: true });
};

export const action = async ({ request, params }: { request: Request, params: { id?: string } }) => {
    const { id } = params;
    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "save-route") {
        const payload = JSON.parse(formData.get("payload") as string);

        try {
            await db.update(routesTable).set({
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
                updatedAt: new Date()
            } as any).where(eq(routesTable.id, id!));

            return redirect("/admin/routes");
        } catch (e) {
            console.error(e);
            return json({ error: "Erro ao salvar rota" }, { status: 500 });
        }
    }

    return null;
};

export default function EditRoutePage() {
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
