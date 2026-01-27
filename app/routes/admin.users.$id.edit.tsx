import React, { useState } from 'react';
import { redirect, data as jsonData } from "react-router";
import type { LoaderFunction, ActionFunction } from "react-router";
import { useLoaderData, useNavigate, Form, useNavigation } from "react-router";
import {
    User, Shield, Building2, Loader2, ArrowLeft, Mail, Phone, Calendar
} from 'lucide-react';
import { PageHeader } from '@/components/Layout/PageHeader';
import { UserForm } from '@/components/Forms/UserForm';


export const loader = async ({ request, params }: { request: Request, params: { id?: string } }) => {
    const { id } = params;
    const apiUrl = process.env.VITE_API_URL || 'http://localhost:3001';

    // Fetch User
    const response = await fetch(`${apiUrl}/api/users/${id}`, {
        headers: { Cookie: request.headers.get("Cookie") || "" }
    });

    if (!response.ok) {
        throw new Response("Usuário não encontrado", { status: 404 });
    }

    const user = await response.json();
    return jsonData({ user });
};

export const action = async ({ request, params }: { request: Request, params: { id?: string } }) => {
    const { id } = params;
    const formData = await request.formData();
    const apiUrl = process.env.VITE_API_URL || 'http://localhost:3001';

    const roles = formData.getAll("roles") as string[];
    const isActive = formData.get("isActive") === "on";

    const body = {
        name: formData.get("name"),
        username: formData.get("username"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        documento: formData.get("documento"),
        documento_tipo: formData.get("documento_tipo"),
        role: roles.join(','),
        isActive: isActive,
        newPassword: formData.get("newPassword"),
    };

    const response = await fetch(`${apiUrl}/api/users/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Cookie: request.headers.get("Cookie") || ""
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const error = await response.json();
        return jsonData({ error: error.error || "Erro ao atualizar usuário" }, { status: response.status });
    }

    return redirect("/admin/users");
};

export default function EditUserPage() {
    const { user } = useLoaderData<typeof loader>();
    const navigate = useNavigate();
    const navigation = useNavigation();
    const isSubmitting = navigation.state !== "idle";



    return (
        <div key="edit-user-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            <PageHeader
                title="Editar Operador"
                subtitle={`Atualizando dados de ${user.name}`}
                backLink="/admin/users"
            />

            <UserForm intent="edit" defaultValues={user} />
        </div>
    );
}
