import React from 'react';
import { Form, useNavigation, useNavigate } from "react-router";
import { User, Lock, Shield, Building2, UserPlus, Loader2, Calendar } from 'lucide-react';
import { FormSection } from '@/components/Layout/FormSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from "../ui/switch";
import { cn } from '@/lib/utils';

// Types
interface UserFormProps {
    intent: 'create' | 'edit';
    defaultValues?: any;
}

export function UserForm({ intent, defaultValues = {} }: UserFormProps) {
    const navigate = useNavigate();
    const navigation = useNavigation();
    const isSubmitting = navigation.state !== "idle";
    const isEdit = intent === 'edit';

    // Roles Logic
    const initialRoles = defaultValues.role ? defaultValues.role.split(',') : ['user'];
    const [selectedRoles, setSelectedRoles] = React.useState<string[]>(initialRoles);

    const toggleRole = (role: string) => {
        setSelectedRoles(prev =>
            prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
        );
    };

    return (
        <Form method="post" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <FormSection title="Identidade" icon={User}>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-label-caps ml-1">Nome Completo</label>
                            <Input name="name" defaultValue={defaultValues.name} required placeholder="Ex: Alexandre de Moraes" className="h-14 rounded-xl bg-muted/40" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-label-caps ml-1">Username (Identificador)</label>
                                <div className="relative">
                                    <Input
                                        name="username"
                                        key={defaultValues.username}
                                        defaultValue={defaultValues.username}
                                        required
                                        readOnly={isEdit}
                                        placeholder="ex: alexandre.m"
                                        className={cn("h-14 rounded-xl bg-muted/40 lowercase", isEdit && "opacity-60 cursor-not-allowed")}
                                        id="username-input"
                                    />
                                    {!isEdit && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const nameInput = document.querySelector('input[name="name"]') as HTMLInputElement;
                                                const usernameInput = document.getElementById('username-input') as HTMLInputElement;
                                                if (nameInput && nameInput.value) {
                                                    const suggestion = nameInput.value.toLowerCase().split(' ')[0] + '.' + Math.floor(Math.random() * 1000);
                                                    usernameInput.value = suggestion;
                                                }
                                            }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
                                        >
                                            SUGERIR
                                        </button>
                                    )}
                                </div>
                            </div>

                            {isEdit ? (
                                <div className="space-y-2">
                                    <label className="text-label-caps ml-1">Status da Conta</label>
                                    <div className="flex items-center gap-4 h-14 px-4 bg-muted/40 rounded-xl border border-input">
                                        <Switch name="isActive" defaultChecked={defaultValues.isActive} />
                                        <span className="text-sm font-bold">{defaultValues.isActive ? "ATIVO" : "INATIVO"}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-label-caps ml-1">Email Corporativo</label>
                                    <Input type="email" name="email" defaultValue={defaultValues.email} required placeholder="email@sgtl.com.br" className="h-14 rounded-xl bg-muted/40" />
                                </div>
                            )}
                        </div>

                        {isEdit && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-label-caps ml-1">Email</label>
                                        <Input type="email" name="email" defaultValue={defaultValues.email} className="h-14 rounded-xl bg-muted/40" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-label-caps ml-1">Telefone</label>
                                        <Input name="phone" defaultValue={defaultValues.phone} placeholder="(00) 00000-0000" className="h-14 rounded-xl bg-muted/40" />
                                    </div>
                                </div>

                                <FormSection title="Segurança da Conta" icon={Lock}>
                                    <div className="p-4 border border-dashed border-border rounded-xl space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-label-caps ml-1">Nova Senha (Opcional)</label>
                                                <Input type="password" name="newPassword" placeholder="Deixe em branco para manter" className="h-14 rounded-xl bg-muted/40" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-label-caps ml-1">Confirmar Senha</label>
                                                <Input type="password" name="confirmPassword" placeholder="Repita a nova senha" className="h-14 rounded-xl bg-muted/40" />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest px-1">
                                            Preencha apenas se desejar alterar a senha do usuário manualmente.
                                        </p>
                                    </div>
                                </FormSection>
                            </>
                        )}

                        <div className="space-y-2">
                            <label className="text-label-caps ml-1">Documento</label>
                            <div className="flex gap-2">
                                <select
                                    name="documento_tipo"
                                    defaultValue={defaultValues.documento_tipo || 'CPF'}
                                    className="w-24 h-14 px-2 bg-muted/40 border-none rounded-xl font-bold bg-transparent outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="CPF">CPF</option>
                                    <option value="RG">RG</option>
                                    <option value="CNPJ">CNPJ</option>
                                    <option value="PASSAPORTE">PASSP</option>
                                </select>
                                <Input name="documento" defaultValue={defaultValues.documento || defaultValues.cpf} className="h-14 rounded-xl bg-muted/40" placeholder="Número do documento" />
                            </div>
                        </div>
                    </div>
                </FormSection>

                {!isEdit && (
                    <FormSection title="Segurança" icon={Lock}>
                        <div className="space-y-2">
                            <label className="text-label-caps ml-1">Senha Inicial</label>
                            <Input type="password" name="password" required placeholder="Mínimo 8 caracteres" className="h-14 rounded-xl bg-muted/40" />
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-2 px-1">
                                O usuário deverá alterar a senha no primeiro acesso.
                            </p>
                        </div>
                    </FormSection>
                )}

                <FormSection title="Níveis de Acesso" icon={Shield}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                            { id: 'admin', label: 'ADMINISTRADOR', desc: 'Acesso total ao sistema' },
                            { id: 'operacional', label: 'OPERACIONAL', desc: 'Gestão de viagens e frotas' },
                            { id: 'financeiro', label: 'FINANCEIRO', desc: 'Controle de caixa e relatórios' },
                            { id: 'user', label: 'USUÁRIO PADRÃO', desc: 'Acesso básico e consultas' },
                        ].map((role) => (
                            <button
                                key={role.id}
                                type="button"
                                onClick={() => toggleRole(role.id)}
                                className={cn(
                                    "p-4 rounded-2xl border-2 transition-all text-left flex flex-col gap-1",
                                    selectedRoles.includes(role.id) ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/5" : "border-border/50 text-muted-foreground hover:border-border"
                                )}
                            >
                                <span className="font-black text-xs tracking-widest">{role.label}</span>
                                <span className="text-[10px] font-bold opacity-60 uppercase leading-none">{role.desc}</span>
                                {selectedRoles.includes(role.id) && <input type="hidden" name="roles" value={role.id} />}
                            </button>
                        ))}
                    </div>
                </FormSection>
            </div>

            <div className="space-y-8">
                <FormSection title="Organização" icon={Building2}>
                    <div className="p-6 bg-primary/5 border border-primary/10 rounded-3xl space-y-3">
                        <div className="flex items-center gap-2">
                            <Building2 size={16} className="text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Unidade Principal</span>
                        </div>
                        <p className="text-[11px] font-bold text-muted-foreground leading-relaxed uppercase">
                            J JÊ TURISMO E EXPRESS LTDA
                        </p>
                    </div>
                </FormSection>

                {isEdit && defaultValues.createdAt && (
                    <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-3xl space-y-3">
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-amber-600" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">Metadados</span>
                        </div>
                        <div className="space-y-1 text-xs text-amber-800/80 font-medium">
                            <p>Criado em: {new Date(defaultValues.createdAt).toLocaleDateString()}</p>
                            <p>ID: <span className="font-mono text-[10px]">{defaultValues.id}</span></p>
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-4">
                    <Button type="submit" disabled={isSubmitting} className="h-16 rounded-[1.25rem] bg-primary text-primary-foreground font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20">
                        {isSubmitting ? <Loader2 className="animate-spin" /> : (isEdit ? 'SALVAR ALTERAÇÕES' : 'CRIAR OPERADOR')}
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => navigate(-1)} className="h-14 rounded-xl font-black uppercase text-[10px] tracking-widest">
                        CANCELAR
                    </Button>
                </div>
            </div>
        </Form>
    );
}
