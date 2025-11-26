import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { EmpresaContexto } from '../types';
import { GeminiInsights } from '../components/Gemini/GeminiInsights';
import {
  TrendingUp, Users, Bus, Package, ArrowUpRight, ArrowDownRight,
  Clock, Calendar, ChevronRight, Plus, Activity, AlertCircle,
  MapPin, Truck, Wallet, Bell
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Line, Bar, Cell
} from 'recharts';

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

// --- COMPONENTS ---

const StatCard = ({ title, value, trend, trendValue, icon: Icon, color, isPositive }: any) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 group">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl bg-${color}-50 dark:bg-${color}-900/20 text-${color}-600 dark:text-${color}-400 group-hover:scale-110 transition-transform`}>
        <Icon size={24} />
      </div>
      <div className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${isPositive
        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
        : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
        {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {trendValue}
      </div>
    </div>
    <div>
      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">{value}</h3>
      <p className="text-xs text-slate-400 mt-1">{trend}</p>
    </div>
  </div>
);

const QuickAction = ({ icon: Icon, label, onClick, color }: any) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all group w-full"
  >
    <div className={`p-3 rounded-full bg-${color}-50 dark:bg-${color}-900/20 text-${color}-600 dark:text-${color}-400 mb-3 group-hover:scale-110 transition-transform`}>
      <Icon size={24} />
    </div>
    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
  </button>
);

export const Dashboard: React.FC = () => {
  const { currentContext } = useApp();
  const navigate = useNavigate();
  const isTurismo = currentContext === EmpresaContexto.TURISMO;

  const summaryData = isTurismo
    ? "Receita semanal: R$ 41k. Taxa média ocupação: 78%. Sexta e Sábado com ocupação > 95%. 2 Veículos em manutenção."
    : "Entregas semanais: 910. Taxa de pontualidade: 98.2%. Pico de carga na Sexta-feira. 1 Rota com atrasos recorrentes.";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
            Olá, <span className="text-blue-600 dark:text-blue-400">João</span> 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <Calendar size={16} />
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
          </button>
          <div className="h-10 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 shadow-sm">
            <div className={`w-2 h-2 rounded-full ${isTurismo ? 'bg-blue-500' : 'bg-orange-500'}`}></div>
            {isTurismo ? 'Turismo B2C' : 'Logística Express'}
          </div>
        </div>
      </div>

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
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  {isTurismo ? 'Desempenho Semanal' : 'Volume de Operações'}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {isTurismo ? 'Receita vs Ocupação' : 'Entregas vs Eficiência'}
                </p>
              </div>
              <select className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500">
                <option>Esta Semana</option>
                <option>Mês Atual</option>
                <option>Últimos 30 dias</option>
              </select>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {isTurismo ? (
                  <AreaChart data={DATA_TURISMO}>
                    <defs>
                      <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorOcupacao" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                    />
                    <Area type="monotone" yAxisId="left" dataKey="receita" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorReceita)" name="Receita (R$)" />
                    <Area type="monotone" yAxisId="right" dataKey="ocupacao" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorOcupacao)" name="Ocupação (%)" />
                  </AreaChart>
                ) : (
                  <ComposedChart data={DATA_EXPRESS}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Bar yAxisId="left" dataKey="volume" fill="#f97316" radius={[6, 6, 0, 0]} barSize={40} name="Volume" />
                    <Line type="monotone" yAxisId="right" dataKey="eficiencia" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} name="Eficiência (%)" />
                  </ComposedChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Ações Rápidas</h3>
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
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Activity size={20} className="text-blue-500" />
                Atividade Recente
              </h3>
              <button
                onClick={() => navigate('/admin/atividades')}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Ver tudo
              </button>
            </div>
            <div className="space-y-6">
              {RECENT_ACTIVITY.map((item) => (
                <div key={item.id} className="flex gap-4 relative">
                  {/* Timeline Line */}
                  <div className="absolute left-[19px] top-8 bottom-[-24px] w-0.5 bg-slate-100 dark:bg-slate-700 last:hidden"></div>

                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ${item.type === 'success' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                    item.type === 'warning' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                    <item.icon size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-white">{item.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                    <span className="text-[10px] font-medium text-slate-400 mt-1 block flex items-center gap-1">
                      <Clock size={10} /> {item.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mini Fleet Status */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            <div className="relative z-10">
              <h3 className="font-bold text-lg mb-1">Status da Frota</h3>
              <p className="text-slate-400 text-sm mb-6">Visão geral da disponibilidade</p>

              <div className="flex items-end gap-2 mb-2">
                <span className="text-4xl font-bold">18</span>
                <span className="text-slate-400 text-sm mb-1">/ 20 veículos</span>
              </div>

              <div className="w-full bg-slate-700/50 h-2 rounded-full mb-4 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '90%' }}></div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-slate-300">Em Operação</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-slate-300">Manutenção</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};