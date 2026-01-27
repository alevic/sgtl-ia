import React, { useState } from 'react';
import { redirect } from "react-router";
import type { ActionFunction } from "react-router";
import { useNavigate, Form, useNavigation } from "react-router";
import {
    User, Lock, Shield, ArrowLeft, Building2, Loader2
} from 'lucide-react';
import { pool } from "@/lib/auth.server";
import { PageHeader } from '@/components/Layout/PageHeader';
import { FormSection } from '@/components/Layout/FormSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import bcrypt from "bcryptjs";
import { UserForm } from '@/components/Forms/UserForm';

export const action = async ({ request, params }: { request: Request, params: any }) => {
    const formData = await request.formData();

    const name = formData.get("name") as string;
    const username = formData.get("username") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const roles = formData.getAll("roles") as string[];

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user directly via SQL (Better Auth compatible)
    const result = await pool.query(
        `INSERT INTO "user" (id, name, email, username, role, "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
         RETURNING id`,
        [name, email, username, roles.join(',') || 'user']
    );

    const userId = result.rows[0].id;

    // Create account for credential login
    await pool.query(
        `INSERT INTO account (id, "userId", "accountId", "providerId", password, "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, 'credential', $3, NOW(), NOW())`,
        [userId, username, hashedPassword]
    );

    return redirect("/admin/users");
};

export default function NewUserPage() {
    const navigate = useNavigate();
    const navigation = useNavigation();
    const isSubmitting = navigation.state !== "idle";

    const [selectedRoles, setSelectedRoles] = useState<string[]>(['user']);

    const toggleRole = (role: string) => {
        setSelectedRoles(prev =>
            prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
        );
    };

    return (
        <div key="new-user-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            <PageHeader
                title="Novo Operador"
                subtitle="Cadastre um novo usuário e defina as permissões de acesso"
                backLink="/admin/users"
            />

            <UserForm intent="create" />
        </div>
    );
}
