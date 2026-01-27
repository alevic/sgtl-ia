import React, { useState, useMemo } from 'react';
import { data as json } from "react-router";
import type { LoaderFunction } from "react-router";
import { useLoaderData, useNavigate, Link } from "react-router";
import { useApp } from '@/context/AppContext';
import { EmpresaContexto, TipoTransacao } from '@/types';
import {
    ArrowLeft, Download, TrendingUp, TrendingDown, DollarSign, Calendar,
    FileText, PieChart, BarChart as BarChartIcon, Activity, Users, Truck,
    Package, MapPin, AlertTriangle, CheckCircle, Clock, LayoutDashboard,
    List, Search, ChevronLeft, Bus, MoreHorizontal
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart as RechartsPie, Pie, Cell, AreaChart, Area
} from 'recharts';
import { db } from "@/db/db.server";
import { transaction as transactionTable, vehicle as vehicleTable, maintenance as maintenanceTable } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { PageHeader } from '@/components/Layout/PageHeader';
import { DashboardCard } from '@/components/Layout/DashboardCard';
import { ListFilterSection } from '@/components/Layout/ListFilterSection';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export const loader = async ({ request, params }: { request: Request, params: any }) => {
    // Basic aggregation queries for the DRE and Charts
    const incomeSum = await db.select({
        value: sql<number>`sum(${transactionTable.amount})`
    }).from(transactionTable).where(eq(transactionTable.type, 'INCOME'));

    const expenseSum = await db.select({
        value: sql<number>`sum(${transactionTable.amount})`
    }).from(transactionTable).where(eq(transactionTable.type, 'EXPENSE'));

    const vehiclesCount = await db.select({ count: sql<number>`count(*)` }).from(vehicleTable);

    const recentTransactions = await db.select().from(transactionTable).orderBy(desc(transactionTable.createdAt)).limit(10);

    return json({
        stats: {
            totalIncome: Number(incomeSum[0]?.value || 0),
            totalExpense: Number(expenseSum[0]?.value || 0),
            vehicleCount: Number(vehiclesCount[0]?.count || 0)
        },
        recentTransactions
    });
};

export default function ReportsPage() {
    const { stats, recentTransactions } = useLoaderData<typeof loader>();
    const { currentContext } = useApp();
    const [activeTab, setActiveTab] = useState<'gerencial' | 'operacional' | 'financeiro'>('gerencial');
    const [searchTerm, setSearchTerm] = useState('');

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatPercentage = (value: number) => value.toFixed(2) + '%';
    const profit = stats.totalIncome - stats.totalExpense;
    const profitMargin = stats.totalIncome > 0 ? (profit / stats.totalIncome) * 100 : 0;

    return (
        <div key="reports-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            <PageHeader
                title="Relatórios & Análises"
                subtitle="Visão estratégica e operacional de alta performance"
                icon={BarChartIcon}
                rightElement={
                    <Button variant="outline" className="h-14 px-6 rounded-xl font-bold gap-2">
                        <Download size={18} /> EXPORTAR DADOS
                    </Button>
                }
            />

            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
                <TabsList className="bg-muted/40 p-1.5 rounded-2xl border border-border/50 h-14 w-full md:w-fit gap-2">
                    <TabsTrigger value="gerencial" className="rounded-xl px-8 h-11 font-black text-xs">GERENCIAL</TabsTrigger>
                    <TabsTrigger value="operacional" className="rounded-xl px-8 h-11 font-black text-xs">OPERACIONAL</TabsTrigger>
                    <TabsTrigger value="financeiro" className="rounded-xl px-8 h-11 font-black text-xs">FINANCEIRO</TabsTrigger>
                </TabsList>

                <div className="mt-8">
                    <TabsContent value="gerencial" className="space-y-8 animate-in fade-in duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <DashboardCard title="Receita Bruta" value={formatCurrency(stats.totalIncome)} icon={DollarSign} variant="emerald" />
                            <DashboardCard title="Performance" value={formatCurrency(profit)} icon={Activity} variant={profit >= 0 ? "blue" : "rose"} />
                            <DashboardCard title="Frota Total" value={stats.vehicleCount} icon={Bus} variant="amber" />
                            <DashboardCard title="Ocupação Média" value="76%" icon={TrendingUp} variant="primary" />
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            <Card className="border-none shadow-2xl rounded-[2.5rem] bg-card/50 backdrop-blur-sm p-8">
                                <h3 className="text-xl font-black mb-6">Fluxo Financeiro (Mensal)</h3>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={[{ n: 'Sem 1', v: 100 }, { n: 'Sem 2', v: 250 }, { n: 'Sem 3', v: 400 }, { n: 'Sem 4', v: 380 }]}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="n" axisLine={false} tickLine={false} />
                                            <YAxis axisLine={false} tickLine={false} />
                                            <RechartsTooltip />
                                            <Area type="monotone" dataKey="v" stroke="hsl(var(--primary))" fillOpacity={0.1} fill="hsl(var(--primary))" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>

                            <Card className="border-none shadow-2xl rounded-[2.5rem] bg-card/50 backdrop-blur-sm p-8">
                                <h3 className="text-xl font-black mb-6">Status da Frota</h3>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsPie>
                                            <Pie data={[{ n: 'Ativo', v: 70 }, { n: 'Manu', v: 20 }, { n: 'Resv', v: 10 }]} dataKey="v" nameKey="n" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                                                {COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                                            </Pie>
                                            <RechartsTooltip />
                                            <Legend />
                                        </RechartsPie>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="financeiro" className="space-y-8 animate-in fade-in duration-500">
                        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-card/50 backdrop-blur-sm overflow-hidden">
                            <div className="p-8 border-b border-border/40 font-black text-xl uppercase tracking-tighter">Demonstrativo de Resultados (DRE)</div>
                            <div className="p-8 space-y-6">
                                <div className="flex justify-between items-center p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                                    <span className="font-black uppercase text-sm">Receita Bruta</span>
                                    <span className="font-black text-xl text-emerald-600">{formatCurrency(stats.totalIncome)}</span>
                                </div>
                                <div className="flex justify-between items-center p-6 bg-rose-500/5 rounded-2xl border border-rose-500/10">
                                    <span className="font-black uppercase text-sm">Despesas Operacionais</span>
                                    <span className="font-black text-xl text-rose-600">({formatCurrency(stats.totalExpense)})</span>
                                </div>
                                <div className="p-8 bg-primary rounded-[2rem] text-primary-foreground flex justify-between items-center">
                                    <div className="space-y-1">
                                        <p className="text-xs uppercase font-bold opacity-60">Lucro Líquido</p>
                                        <h3 className="text-3xl font-black tracking-tighter">Performance de Fluxo</h3>
                                    </div>
                                    <span className="text-4xl font-black">{formatCurrency(profit)}</span>
                                </div>
                            </div>
                        </Card>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
