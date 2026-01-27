import React, { useState } from 'react';
import { useNavigation, useNavigate, Form } from "react-router";
import {
    User, Building2, MapPin, FileText, Briefcase, Loader2
} from 'lucide-react';
import { FormSection } from '@/components/Layout/FormSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { TipoCliente, TipoDocumento } from '@/types';

interface ClientFormProps {
    intent: 'create' | 'edit';
    defaultValues?: any;
    states?: any[]; // Keep optional if not strictly needed for rendering, though logic uses input
}

export function ClientForm({ intent, defaultValues = {}, states }: ClientFormProps) {
    const navigate = useNavigate();
    const navigation = useNavigation();
    const isSubmitting = navigation.state !== "idle";
    const isEdit = intent === 'edit';

    const [tipoCliente, setTipoCliente] = useState<string>(defaultValues.tipo_cliente || TipoCliente.PESSOA_FISICA);
    const [cep, setCep] = useState(defaultValues.endereco ? '' : ''); // CEP extraction from address string is hard, better leave empty or split address logic
    const [isSearchingCep, setIsSearchingCep] = useState(false);

    // Address state management
    const [addressData, setAddressData] = useState({
        street: defaultValues.endereco || '',
        city: defaultValues.cidade || '',
        state: defaultValues.estado || ''
    });

    const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        setCep(value);
        if (value.length === 8) {
            setIsSearchingCep(true);
            try {
                const res = await fetch(`https://viacep.com.br/ws/${value}/json/`);
                const data = await res.json();
                if (!data.erro) {
                    setAddressData({
                        street: data.logradouro || '',
                        city: data.localidade || '',
                        state: data.uf || ''
                    });
                }
            } catch (err) {
                console.error("CEP error", err);
            } finally {
                setIsSearchingCep(false);
            }
        }
    };

    return (
        <Form method="post" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <FormSection title="Tipo de Perfil" icon={Building2}>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setTipoCliente(TipoCliente.PESSOA_FISICA)}
                            className={cn(
                                "h-16 rounded-2xl border-2 transition-all font-black text-xs tracking-widest uppercase flex items-center justify-center gap-3",
                                tipoCliente === TipoCliente.PESSOA_FISICA ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/10" : "border-border/50 text-muted-foreground"
                            )}
                        >
                            <User size={18} /> PESSOA FÍSICA
                        </button>
                        <button
                            type="button"
                            onClick={() => setTipoCliente(TipoCliente.PESSOA_JURIDICA)}
                            className={cn(
                                "h-16 rounded-2xl border-2 transition-all font-black text-xs tracking-widest uppercase flex items-center justify-center gap-3",
                                tipoCliente === TipoCliente.PESSOA_JURIDICA ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/10" : "border-border/50 text-muted-foreground"
                            )}
                        >
                            <Building2 size={18} /> PESSOA JURÍDICA
                        </button>
                        <input type="hidden" name="tipo_cliente" value={tipoCliente} />
                    </div>
                </FormSection>

                <FormSection title="Identificação" icon={User}>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-label-caps ml-1">{tipoCliente === TipoCliente.PESSOA_FISICA ? 'Nome Completo' : 'Nome do Representante'}</label>
                            <Input name="nome" defaultValue={defaultValues.nome} required placeholder="Ex: João da Silva" className="h-14 rounded-xl bg-muted/40" />
                        </div>

                        {tipoCliente === TipoCliente.PESSOA_JURIDICA && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-500">
                                <div className="space-y-2">
                                    <label className="text-label-caps ml-1">Razão Social</label>
                                    <Input name="razao_social" defaultValue={defaultValues.razao_social} required className="h-14 rounded-xl bg-muted/40" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-label-caps ml-1">CNPJ</label>
                                    <Input name="cnpj" defaultValue={defaultValues.cnpj} required placeholder="00.000.000/0000-00" className="h-14 rounded-xl bg-muted/40" />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-label-caps ml-1">E-mail</label>
                                <Input type="email" name="email" defaultValue={defaultValues.email} required placeholder="email@exemplo.com" className="h-14 rounded-xl bg-muted/40" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-label-caps ml-1">Telefone</label>
                                <Input name="telefone" defaultValue={defaultValues.telefone} required placeholder="(00) 00000-0000" className="h-14 rounded-xl bg-muted/40" />
                            </div>
                        </div>
                    </div>
                </FormSection>

                <FormSection title="Localização" icon={MapPin}>
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-label-caps ml-1">CEP</label>
                                <div className="relative">
                                    <Input value={cep} onChange={handleCepChange} placeholder="00000-000" className="h-14 rounded-xl bg-muted/40" />
                                    {isSearchingCep && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-primary" size={18} />}
                                </div>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-label-caps ml-1">Endereço</label>
                                <Input name="endereco" defaultValue={addressData.street} required placeholder="Rua, número, complemento" className="h-14 rounded-xl bg-muted/40" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-label-caps ml-1">Cidade</label>
                                <Input name="cidade" defaultValue={addressData.city} required className="h-14 rounded-xl bg-muted/40" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-label-caps ml-1">Estado (UF)</label>
                                <Input
                                    name="estado"
                                    defaultValue={addressData.state}
                                    required
                                    maxLength={2}
                                    className="h-14 rounded-xl bg-muted/40 uppercase font-black"
                                    onChange={(e) => setAddressData({ ...addressData, state: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </FormSection>
            </div>

            <div className="space-y-8">
                <FormSection title="Documentação" icon={FileText}>
                    <div className="space-y-4">
                        <label className="text-label-caps ml-1">Tipo de Documento</label>
                        <select name="documento_tipo" defaultValue={defaultValues.documento_tipo} className="w-full h-14 px-4 bg-muted/40 border border-border/50 rounded-xl font-bold outline-none">
                            <option value={TipoDocumento.CPF}>CPF</option>
                            <option value={TipoDocumento.RG}>RG</option>
                            <option value={TipoDocumento.CNPJ}>CNPJ</option>
                            <option value={TipoDocumento.PASSAPORTE}>PASSAPORTE</option>
                        </select>
                        <Input name="documento" defaultValue={defaultValues.documento} required placeholder="Número do documento" className="h-14 rounded-xl bg-muted/40" />
                    </div>
                </FormSection>

                <FormSection title="Classificação" icon={Briefcase}>
                    <div className="space-y-4">
                        <label className="text-label-caps ml-1">Segmento</label>
                        <select name="segmento" defaultValue={defaultValues.segmento || "NOVO"} className="w-full h-14 px-4 bg-muted/40 border border-border/50 rounded-xl font-bold outline-none">
                            <option value="NOVO">NOVO CLIENTE</option>
                            <option value="REGULAR">CLIENTE REGULAR</option>
                            <option value="VIP">CLIENTE VIP</option>
                            <option value="INATIVO">INATIVO</option>
                        </select>
                    </div>
                </FormSection>

                <FormSection title="Notas" icon={FileText}>
                    <textarea
                        name="observacoes"
                        defaultValue={defaultValues.observacoes}
                        rows={4}
                        className="w-full p-4 bg-muted/40 border-none rounded-2xl font-bold text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                        placeholder="Observações adicionais..."
                    />
                </FormSection>

                <div className="flex flex-col gap-4">
                    <Button type="submit" disabled={isSubmitting} className="h-16 rounded-[1.25rem] bg-primary text-primary-foreground font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20">
                        {isSubmitting ? <Loader2 className="animate-spin" /> : (isEdit ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR CLIENTE')}
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => navigate(-1)} className="h-14 rounded-xl font-black uppercase text-[10px] tracking-widest">
                        CANCELAR
                    </Button>
                </div>
            </div>
        </Form>
    );
}
