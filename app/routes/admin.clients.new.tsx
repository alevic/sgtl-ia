import React, { useState, useEffect } from 'react';
import { data as json, redirect } from "react-router";
import type { LoaderFunction, ActionFunction } from "react-router";
import { useLoaderData, useNavigate, Form, useNavigation, useFetcher } from "react-router";
import {
    User, Mail, Phone, MapPin, FileText, Calendar, Globe, Briefcase,
    Loader2, Save, ArrowLeft, Building2
} from 'lucide-react';
import { db } from "@/db/db.server";
import { clients as clientTable, state as stateTable, city as cityTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PageHeader } from '@/components/Layout/PageHeader';
import { FormSection } from '@/components/Layout/FormSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TipoCliente, TipoDocumento } from '@/types';
import { ClientForm } from '@/components/Forms/ClientForm';

export const loader = async ({ request, params }: { request: Request, params: any }) => {
    const states = await db.select().from(stateTable).orderBy(stateTable.name);
    return json({ states });
};

export const action = async ({ request, params }: { request: Request, params: any }) => {
    const formData = await request.formData();
    const organization_id = "org_placeholder";

    const payload = {
        organization_id,
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
    };

    await db.insert(clientTable).values(payload);

    return redirect("/admin/clients");
};

export default function NewClientPage() {
    const { states } = useLoaderData<typeof loader>();
    const navigate = useNavigate();
    const navigation = useNavigation();
    const fetcher = useFetcher();
    const isSubmitting = navigation.state !== "idle";

    return (
        <div>
            <ClientForm intent="create" states={states} />
        </div>
    );
}
