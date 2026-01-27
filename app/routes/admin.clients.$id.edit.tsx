import React from 'react';
import { data as json, redirect } from "react-router";
import type { LoaderFunction, ActionFunction } from "react-router";
import { useLoaderData } from "react-router";
import { db } from "@/db/db.server";
import { clients as clientTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PageHeader } from '@/components/Layout/PageHeader';
import { ClientForm } from '@/components/Forms/ClientForm';

export const loader = async ({ request, params }: { request: Request, params: { id?: string } }) => {
    const { id } = params;

    if (!id) throw new Response("ID não fornecido", { status: 400 });

    const client = await db.query.clients.findFirst({
        where: eq(clientTable.id, id)
    });

    if (!client) throw new Response("Cliente não encontrado", { status: 404 });

    return json({ client });
};

export const action = async ({ request, params }: { request: Request, params: { id?: string } }) => {
    const { id } = params;
    const formData = await request.formData();

    const payload = {
        nome: formData.get("nome") as string,
        email: formData.get("email") as string,
        telefone: formData.get("telefone") as string,
        tipo_cliente: formData.get("tipo_cliente") as string,
        documento_tipo: formData.get("documento_tipo") as string,
        documento: formData.get("documento") as string,
        razao_social: formData.get("razao_social") as string || null,
        nome_fantasia: formData.get("nome_fantasia") as string || null,
        cnpj: formData.get("cnpj") as string || null,
        data_nascimento: formData.get("data_nascimento") ? formData.get("data_nascimento") as string : null,
        nacionalidade: formData.get("nacionalidade") as string || 'Brasileira',
        endereco: formData.get("endereco") as string,
        cidade: formData.get("cidade") as string,
        estado: formData.get("estado") as string,
        pais: formData.get("pais") as string || 'Brasil',
        segmento: formData.get("segmento") as string || 'NOVO',
        observacoes: formData.get("observacoes") as string,
        updatedAt: new Date()
    };

    await db.update(clientTable).set(payload).where(eq(clientTable.id, id!));

    return redirect("/admin/clients");
};

export default function EditClientPage() {
    const { client } = useLoaderData<typeof loader>();

    return (
        <div key="edit-client-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            <PageHeader
                title="Editar Cliente"
                subtitle={`Alterando perfil de ${client.nome}`}
                backLink="/admin/clients"
            />
            <ClientForm intent="edit" defaultValues={client} />
        </div>
    );
}
