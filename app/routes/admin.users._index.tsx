import React, { useState } from 'react';
import { data as json } from "react-router";
import type { LoaderFunction, ActionFunction } from "react-router";
import { useLoaderData, useNavigate, Link, useFetcher } from "react-router";
import { User, Plus, Search, Trash2, Shield, Mail, Calendar, Edit, Key, X, Loader2 } from 'lucide-react';
import { UserRole } from '@/types';
import { PageHeader } from '@/components/Layout/PageHeader';
import { ListFilterSection } from '@/components/Layout/ListFilterSection';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
export const loader = async ({ request, params }: { request: Request, params: any }) => {
    const apiUrl = process.env.VITE_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/users`, {
        headers: {
            Cookie: request.headers.get("Cookie") || ""
        }
    });

    if (!response.ok) {
        throw new Response("Falha ao carregar usuários", { status: response.status });
    }

    const users = await response.json();
    return json({ users });
};

export const action = async ({ request, params }: { request: Request, params: any }) => {
    const formData = await request.formData();
    const intent = formData.get("intent");
    const id = formData.get("id") as string;
    const apiUrl = process.env.VITE_API_URL || 'http://localhost:3001';

    if (intent === "delete") {
        const response = await fetch(`${apiUrl}/api/users/${id}`, {
            method: "DELETE",
            headers: {
                Cookie: request.headers.get("Cookie") || ""
            }
        });

        if (!response.ok) {
            return json({ success: false, message: "Erro ao excluir usuário" }, { status: response.status });
        }

        return json({ success: true, message: "Usuário excluído" });
    }

    return null;
};

const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
    const config: any = {
        [UserRole.ADMIN]: { label: 'ADMINISTRADOR', color: 'purple' },
        [UserRole.FINANCEIRO]: { label: 'FINANCEIRO', color: 'green' },
        [UserRole.OPERACIONAL]: { label: 'OPERACIONAL', color: 'orange' },
        [UserRole.USER]: { label: 'USUÁRIO', color: 'blue' },
    };

    const { label, color } = config[role] || config[UserRole.USER];

    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[9px] font-black tracking-widest border-none",
            color === 'purple' ? "bg-purple-100 text-purple-700" :
                color === 'green' ? "bg-emerald-100 text-emerald-700" :
                    color === 'orange' ? "bg-amber-100 text-amber-700" :
                        "bg-blue-100 text-blue-700"
        )}>
            <Shield size={10} strokeWidth={3} />
            {label}
        </span>
    );
};

export default function UsersPage() {
    const { users: initialUsers } = useLoaderData<typeof loader>();
    const fetcher = useFetcher();
    const navigate = useNavigate();
    const [busca, setBusca] = useState('');
    const [resetPasswordUser, setResetPasswordUser] = useState<any>(null);
    const [newPassword, setNewPassword] = useState('');

    const users = initialUsers as any[];

    const usersFiltrados = users.filter(user =>
        (user.name || '').toLowerCase().includes(busca.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(busca.toLowerCase())
    );

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500 pb-10">
            <PageHeader
                title="Gestão de Usuários"
                subtitle="Segurança e controle de permissões"
                icon={User}
                rightElement={
                    <Button asChild className="h-14 px-8 rounded-xl font-black uppercase text-[12px] shadow-lg shadow-primary/20">
                        <Link to="/admin/users/new">
                            <Plus size={20} className="mr-2" strokeWidth={3} /> NOVO USUÁRIO
                        </Link>
                    </Button>
                }
            />

            <ListFilterSection>
                <div className="relative flex-1 group">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary" />
                    <Input
                        placeholder="Buscar por nome ou email..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        className="pl-12 h-14 bg-muted/40 border-input rounded-xl font-bold"
                    />
                </div>
            </ListFilterSection>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {usersFiltrados.length === 0 ? (
                    <div className="col-span-full py-20 text-center opacity-40"><User size={48} className="mx-auto mb-4" /><p className="font-bold">Nenhum usuário encontrado</p></div>
                ) : (
                    usersFiltrados.map((user) => (
                        <Card key={user.id} className="shadow-sm p-6 hover:shadow-xl transition-all border-border/40 rounded-3xl group">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl">{user.name?.charAt(0) || '?'}</div>
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-black tracking-tighter leading-none">{user.name}</h3>
                                        <RoleBadge role={user.role} />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3 mb-8 text-sm text-muted-foreground font-medium">
                                <div className="flex items-center gap-2"><Mail size={16} /> <span className="truncate">{user.email}</span></div>
                                <div className="flex items-center gap-2"><Calendar size={16} /> <span>Membro desde {new Date(user.createdAt).toLocaleDateString()}</span></div>
                            </div>
                            <div className="flex gap-2 pt-4 border-t border-border/50">
                                <Button asChild variant="ghost" className="flex-1 h-11 bg-muted/20 hover:bg-primary/10 hover:text-primary rounded-xl font-bold transition-all"><Link to={`/admin/users/${user.id}/edit`}><Edit size={16} className="mr-2" /> EDITAR</Link></Button>
                                <Button onClick={() => setResetPasswordUser(user)} variant="ghost" className="w-11 h-11 p-0 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 rounded-xl transition-all"><Key size={16} /></Button>
                                <Button onClick={() => fetcher.submit({ intent: "delete", id: user.id }, { method: "post" })} variant="ghost" className="w-11 h-11 p-0 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-xl transition-all"><Trash2 size={16} /></Button>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
