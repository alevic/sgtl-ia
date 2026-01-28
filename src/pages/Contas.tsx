import React, { useState, useEffect } from 'react';
import {
    Plus, CreditCard, Landmark, Wallet,
    Edit2, CheckCircle2
} from 'lucide-react';
import { PageHeader } from '../components/Layout/PageHeader';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { IBankAccount, Moeda } from '@/types';
import { cn } from '../lib/utils';
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { AlertCircle, CheckCircle2 as CheckIcon } from 'lucide-react';

export const Contas: React.FC = () => {
    const [accounts, setAccounts] = useState<IBankAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingAccount, setEditingAccount] = useState<IBankAccount | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        bank_name: '',
        account_number: '',
        initial_balance: '0',
        currency: Moeda.BRL
    });

    const fetchAccounts = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/finance/accounts`, {
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Falha ao buscar contas');
            const data = await response.json();
            setAccounts(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            const url = editingAccount
                ? `${import.meta.env.VITE_API_URL}/api/finance/accounts/${editingAccount.id}`
                : `${import.meta.env.VITE_API_URL}/api/finance/accounts`;

            const method = editingAccount ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    initial_balance: parseFloat(formData.initial_balance)
                }),
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Erro ao salvar conta');

            setSuccess('Conta salva com sucesso!');
            setIsAdding(false);
            setEditingAccount(null);
            setFormData({ name: '', bank_name: '', account_number: '', initial_balance: '0', currency: Moeda.BRL });
            fetchAccounts();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleEdit = (account: IBankAccount) => {
        setEditingAccount(account);
        setFormData({
            name: account.name,
            bank_name: account.bank_name || '',
            account_number: account.account_number || '',
            initial_balance: account.initial_balance.toString(),
            currency: account.currency
        });
        setIsAdding(true);
    };

    const formatCurrency = (val: number, moeda: Moeda = Moeda.BRL) => {
        return val.toLocaleString('pt-BR', { style: 'currency', currency: moeda });
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500 pb-10">
            <PageHeader
                title="Contas Financeiras"
                subtitle="Gerencie seu caixa e contas bancárias dinamicamente"
                icon={Landmark}
                backLink="/admin/financeiro"
                backLabel="Financeiro"
                rightElement={
                    <Button
                        onClick={() => {
                            setEditingAccount(null);
                            setFormData({ name: '', bank_name: '', account_number: '', initial_balance: '0', currency: Moeda.BRL });
                            setIsAdding(true);
                        }}
                        className="h-14 rounded-sm px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[12px] tracking-widest shadow-lg shadow-primary/20"
                    >
                        <Plus size={18} className="mr-2" />
                        Nova Conta
                    </Button>
                }
            />

            {error && (
                <Alert variant="destructive" className="rounded-sm border-destructive/20 bg-destructive/5">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="font-black uppercase text-[12px] tracking-widest">Erro</AlertTitle>
                    <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
                </Alert>
            )}

            {success && (
                <Alert className="rounded-sm border-emerald-500/20 bg-emerald-500/5">
                    <CheckIcon className="h-4 w-4 text-emerald-500" />
                    <AlertTitle className="font-black uppercase text-[12px] tracking-widest text-emerald-500">Sucesso</AlertTitle>
                    <AlertDescription className="text-xs font-medium text-emerald-600/80">{success}</AlertDescription>
                </Alert>
            )}

            {isAdding && (
                <Card className="rounded-sm border-border/40 shadow-xl animate-in slide-in-from-top-4 duration-300">
                    <CardContent className="p-8 border-l-4 border-primary">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <h3 className="text-[12px] font-black uppercase tracking-widest text-primary mb-4">
                                {editingAccount ? 'Editar Conta' : 'Nova Conta Bancária'}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nome Interno (Apelido) *</label>
                                    <Input
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ex: Itaú Empresa"
                                        className="h-12 rounded-sm border-border/50 font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Banco / Instituição</label>
                                    <Input
                                        value={formData.bank_name}
                                        onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                                        placeholder="Ex: Banco Itaú"
                                        className="h-12 rounded-sm border-border/50 font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Saldo Inicial</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.initial_balance}
                                        onChange={e => setFormData({ ...formData, initial_balance: e.target.value })}
                                        className="h-12 rounded-sm border-border/50 font-black"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Moeda</label>
                                    <select
                                        value={formData.currency}
                                        onChange={e => setFormData({ ...formData, currency: e.target.value as Moeda })}
                                        className="w-full h-12 px-4 rounded-sm bg-muted border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-black uppercase text-[12px] tracking-widest outline-none"
                                    >
                                        <option value={Moeda.BRL}>BRL - Real</option>
                                        <option value={Moeda.USD}>USD - Dólar</option>
                                        <option value={Moeda.PYG}>PYG - Guarani</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="ghost" onClick={() => setIsAdding(false)} className="font-black uppercase text-[10px] tracking-widest">Cancelar</Button>
                                <Button type="submit" className="bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest rounded-sm">Salvar Registro</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="h-48 bg-muted animate-pulse rounded-sm border border-border/40" />
                    ))
                ) : accounts.length === 0 ? (
                    <div className="col-span-full p-20 text-center bg-muted/30 rounded-sm border border-dashed border-border/60">
                        <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
                        <p className="text-muted-foreground font-medium uppercase text-xs tracking-widest">Nenhuma conta cadastrada</p>
                    </div>
                ) : accounts.map((account) => (
                    <Card key={account.id} className="group hover:shadow-xl transition-all duration-300 rounded-sm border-border/40 overflow-hidden relative">
                        <div className={cn(
                            "absolute top-0 left-0 w-1 h-full",
                            account.active ? "bg-primary" : "bg-muted-foreground/30"
                        )} />
                        <CardContent className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-3 bg-primary/10 rounded-sm text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-500">
                                    <CreditCard size={24} />
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(account)} className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Edit2 size={16} />
                                </Button>
                            </div>
                            <div className="space-y-1 mb-8">
                                <h3 className="text-[14px] font-black uppercase tracking-tight text-slate-800 dark:text-white leading-tight">
                                    {account.name}
                                </h3>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    {account.bank_name || 'Caixa Interno'} {account.account_number ? `• ${account.account_number}` : ''}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Saldo Efetivo</p>
                                <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                                    {formatCurrency(Number(account.current_balance), account.currency)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Ficha de Transparência */}
            {!isAdding && (
                <div className="p-10 rounded-sm bg-muted/30 border border-dashed border-border/60 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-white dark:bg-slate-800 rounded-full shadow-sm text-primary">
                            <Wallet size={32} />
                        </div>
                        <div>
                            <h4 className="text-[14px] font-black uppercase tracking-widest text-slate-800 dark:text-white">Conciliação Inteligente</h4>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-tight max-w-md">
                                Os saldos são recalculados em tempo real com base nas transações liquidadas (PAGAS) vinculadas a cada conta operacional.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
