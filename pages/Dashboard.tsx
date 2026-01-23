import React from 'react';
import { useDateFormatter } from '../hooks/useDateFormatter';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { EmpresaContexto } from '../types';
import { GeminiInsights } from '../components/Gemini/GeminiInsights';
import {
  Users, Bus, Package, ArrowUpRight, ArrowDownRight,
  Clock, Calendar, Plus, Activity, AlertCircle,
  Truck, Wallet
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Line, Bar
} from 'recharts';

// --- shadcn/ui COMPONENTS ---
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Separator } from '../components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { cn } from '../lib/utils';

// --- MOCK DATA ---
const DATA_TURISMO = [
  { name: 'Seg', receita: 4200, ocupacao: 68 },
  { name: 'Ter', receita: 3800, ocupacao: 62 },
  { name: 'Qua', receita: 5500, ocupacao: 78 },
  { name: 'Qui', receita: 4900, ocupacao: 72 },
  { name: 'Sex', receita: 8800, ocupacao: 96 },
  { name: 'Sab', receita: 9800, ocupacao: 99 },
  { name: 'Dom', receita: 7500, ocupacao: 88 },
];

const DATA_EXPRESS = [
  { name: 'Seg', volume: 1450, eficiencia: 96 },
  { name: 'Ter', volume: 1320, eficiencia: 98 },
  { name: 'Qua', volume: 1600, eficiencia: 95 },
  { name: 'Qui', volume: 1400, eficiencia: 99 },
  { name: 'Sex', volume: 1900, eficiencia: 92 },
  { name: 'Sab', volume: 900, eficiencia: 99 },
  { name: 'Dom', volume: 400, eficiencia: 100 },
];

const RECENT_ACTIVITY = [
  { id: 1, type: 'success', title: 'Viagem Concluída', desc: 'Rota SP -> RJ finalizada com sucesso', time: '10 min atrás', icon: Bus },
  { id: 2, type: 'warning', title: 'Alerta de Manutenção', desc: 'Veículo 104 precisa de revisão', time: '32 min atrás', icon: AlertCircle },
  { id: 3, type: 'info', title: 'Nova Reserva', desc: 'Grupo de 15 passageiros confirmado', time: '1h atrás', icon: Users },
  { id: 4, type: 'success', title: 'Entrega Realizada', desc: 'Pacote #9921 entregue no prazo', time: '2h atrás', icon: Package },
];

// --- REFACTORED COMPONENTS ---

interface StatCardProps {
  title: string;
  value: string;
  trend: string;
  trendValue: string;
  icon: React.ElementType;
  color: 'emerald' | 'blue' | 'purple' | 'orange';
  isPositive: boolean;
}

const StatCard = ({ title, value, trend, trendValue, icon: Icon, color, isPositive }: StatCardProps) => {
  const colorClasses: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 bg-card/60 backdrop-blur-sm shadow-sm group overflow-hidden">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={cn("p-3 rounded-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm", colorClasses[color])}>
            <Icon size={22} />
          </div>
          <Badge variant={isPositive ? "default" : "destructive"} className={cn(
            "flex items-center gap-1 font-bold px-2 py-0.5 rounded-full border-none",
            isPositive ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-destructive/15 text-destructive"
          )}>
            {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trendValue}
          </Badge>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
          </div>
          <p className="text-[12px] text-muted-foreground/80 font-medium">{trend}</p>
        </div>
      </CardContent>
    </Card>
  );
};

interface QuickActionProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  color: 'blue' | 'purple' | 'orange' | 'emerald';
}

const QuickAction = ({ icon: Icon, label, onClick, color }: QuickActionProps) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
  };

  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="flex flex-col items-center justify-center h-auto p-4 bg-card hover:bg-accent border-border shadow-sm group w-full gap-3"
    >
      <div className={cn("p-3 rounded-full group-hover:scale-110 transition-transform", colorClasses[color])}>
        <Icon size={24} />
      </div>
      <span className="text-sm font-medium">{label}</span>
    </Button>
  );
};

export const Dashboard: React.FC = () => {
  const { currentContext, user } = useApp();
  const { formatDate } = useDateFormatter();
  const navigate = useNavigate();
  const isTurismo = currentContext === EmpresaContexto.TURISMO;

  const summaryData = isTurismo
    ? "Receita semanal: R$ 41k. Taxa média ocupação: 78%. Sexta e Sábado com ocupação > 95%. 2 Veículos em manutenção."
    : "Entregas semanais: 910. Taxa de pontualidade: 98.2%. Pico de carga na Sexta-feira. 1 Rota com atrasos recorrentes.";

  return (
    <div key="dashboard-main" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <Avatar className="h-16 w-16 border-4 border-background shadow-lg ring-1 ring-primary/10 transition-transform hover:scale-105">
            <AvatarFallback className="bg-primary/5 text-primary text-2xl font-black">
              {user.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tight">
              Olá, <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">{user.name.split(' ')[0]}</span> 👋
            </h1>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-muted/50 text-muted-foreground border-none font-medium text-[12px] uppercase tracking-widest">
                Admin Panel
              </Badge>
              <Separator orientation="vertical" className="h-3 shadow-none" />
              <p className="text-muted-foreground font-medium flex items-center gap-2 text-sm italic">
                <Clock size={14} className="text-primary/70" />
                {formatDate(new Date(), 'PPPP')}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={cn(
            "h-14 px-5 flex items-center gap-3 text-sm font-bold bg-card/40 backdrop-blur-md shadow-sm border-primary/10 rounded-xl",
            isTurismo ? 'text-blue-600 border-blue-100' : 'text-orange-600 border-orange-100'
          )}>
            <div className={cn("w-2.5 h-2.5 rounded-full animate-pulse", isTurismo ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]')}></div>
            {isTurismo ? 'Operação Turística' : 'Logística Express'}
          </Badge>
        </div>
      </div>

      <Separator className="bg-gradient-to-r from-transparent via-border to-transparent shadow-none" />

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Receita Total"
          value={isTurismo ? "R$ 145.200" : "R$ 89.400"}
          trend="vs. mês anterior"
          trendValue="+12.5%"
          isPositive={true}
          icon={Wallet}
          color="emerald"
        />
        <StatCard
          title={isTurismo ? "Passageiros" : "Entregas"}
          value={isTurismo ? "2.450" : "1.890"}
          trend="vs. mês anterior"
          trendValue="+5.2%"
          isPositive={true}
          icon={isTurismo ? Users : Package}
          color="blue"
        />
        <StatCard
          title={isTurismo ? "Taxa de Ocupação" : "Pontualidade"}
          value={isTurismo ? "78%" : "98.2%"}
          trend="vs. meta mensal"
          trendValue={isTurismo ? "+2.0%" : "-0.5%"}
          isPositive={isTurismo}
          icon={Activity}
          color="purple"
        />
        <StatCard
          title="Frota Ativa"
          value="18/20"
          trend="2 em manutenção"
          trendValue="-10%"
          isPositive={false}
          icon={Bus}
          color="orange"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* Left Column: Charts */}
        <div className="xl:col-span-2 space-y-8">
          {/* Main Chart Card */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-6">
              <div>
                <CardTitle>{isTurismo ? 'Desempenho Semanal' : 'Volume de Operações'}</CardTitle>
                <CardDescription>
                  {isTurismo ? 'Receita vs Ocupação' : 'Entregas vs Eficiência'}
                </CardDescription>
              </div>
              <Select defaultValue="week">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Esta Semana</SelectItem>
                  <SelectItem value="month">Mês Atual</SelectItem>
                  <SelectItem value="30days">Últimos 30 dias</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {isTurismo ? (
                    <AreaChart data={DATA_TURISMO}>
                      <defs>
                        <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorOcupacao" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} dy={10} />
                      <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                        itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                      />
                      <Area type="monotone" yAxisId="left" dataKey="receita" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorReceita)" name="Receita (R$)" />
                      <Area type="monotone" yAxisId="right" dataKey="ocupacao" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorOcupacao)" name="Ocupação (%)" />
                    </AreaChart>
                  ) : (
                    <ComposedChart data={DATA_EXPRESS}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} dy={10} />
                      <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                      <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))' }}
                      />
                      <Bar yAxisId="left" dataKey="volume" fill="#f97316" radius={[6, 6, 0, 0]} barSize={40} name="Volume" />
                      <Line type="monotone" yAxisId="right" dataKey="eficiencia" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} name="Eficiência (%)" />
                    </ComposedChart>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div>
            <h3 className="text-lg font-bold mb-4">Ações Rápidas</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <QuickAction icon={Plus} label="Nova Viagem" color="blue" onClick={() => navigate('/admin/viagens/nova')} />
              <QuickAction icon={Users} label="Cadastrar Cliente" color="purple" onClick={() => navigate('/admin/clientes/novo')} />
              <QuickAction icon={Truck} label="Nova Manutenção" color="orange" onClick={() => navigate('/admin/manutencao/nova')} />
              <QuickAction icon={Wallet} label="Lançar Despesa" color="emerald" onClick={() => navigate('/admin/financeiro/transacoes/nova')} />
            </div>
          </div>
        </div>

        {/* Right Column: AI & Feed */}
        <div className="space-y-8">
          <GeminiInsights context={currentContext} dataSummary={summaryData} />

          {/* Activity Feed */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-6">
              <div className="flex items-center gap-2">
                <Activity size={20} className="text-primary" />
                <CardTitle className="text-lg">Atividade Recente</CardTitle>
              </div>
              <Button
                variant="link"
                onClick={() => navigate('/admin/atividades')}
                className="h-auto p-0 text-xs font-medium"
              >
                Ver tudo
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {RECENT_ACTIVITY.map((item, index) => (
                  <div key={item.id} className="flex gap-4 relative">
                    {/* Timeline Line */}
                    {index !== RECENT_ACTIVITY.length - 1 && (
                      <div className="absolute left-[19px] top-10 bottom-[-24px] w-px bg-border"></div>
                    )}

                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10",
                      item.type === 'success' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        item.type === 'warning' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                          'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    )}>
                      <item.icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold truncate">{item.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.desc}</p>
                      <span className="text-[12px] font-medium text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock size={10} /> {item.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};