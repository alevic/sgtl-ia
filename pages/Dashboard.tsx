import React from 'react';
import { useApp } from '../context/AppContext';
import { EmpresaContexto } from '../types';
import { KpiCard } from '../components/Dashboard/KpiCard';
import { GeminiInsights } from '../components/Gemini/GeminiInsights';
import { 
  DollarSign, 
  Users, 
  Bus, 
  Package, 
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

const MOCK_DATA_TURISMO = [
  { name: 'Seg', receita: 4000, ocupacao: 65 },
  { name: 'Ter', receita: 3000, ocupacao: 55 },
  { name: 'Qua', receita: 5000, ocupacao: 75 },
  { name: 'Qui', receita: 4500, ocupacao: 70 },
  { name: 'Sex', receita: 8000, ocupacao: 95 },
  { name: 'Sab', receita: 9500, ocupacao: 98 },
  { name: 'Dom', receita: 7000, ocupacao: 85 },
];

const MOCK_DATA_EXPRESS = [
  { name: 'Seg', entregas: 120, atrasos: 2 },
  { name: 'Ter', entregas: 150, atrasos: 1 },
  { name: 'Qua', entregas: 180, atrasos: 5 },
  { name: 'Qui', entregas: 140, atrasos: 0 },
  { name: 'Sex', entregas: 200, atrasos: 8 },
  { name: 'Sab', entregas: 90, atrasos: 0 },
  { name: 'Dom', entregas: 30, atrasos: 0 },
];

export const Dashboard: React.FC = () => {
  const { currentContext, theme } = useApp();
  const isTurismo = currentContext === EmpresaContexto.TURISMO;

  // Chart colors based on theme
  const gridColor = theme === 'dark' ? '#334155' : '#f1f5f9';
  const axisTextColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  const tooltipBg = theme === 'dark' ? '#1e293b' : '#ffffff';
  const tooltipText = theme === 'dark' ? '#f8fafc' : '#1e293b';

  // Mock summary for AI
  const summaryData = isTurismo 
    ? "Receita semanal: R$ 41k. Taxa média ocupação: 78%. Sexta e Sábado com ocupação > 95%. 2 Veículos em manutenção."
    : "Entregas semanais: 910. Taxa de pontualidade: 98.2%. Pico de carga na Sexta-feira. 1 Rota com atrasos recorrentes.";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
          Dashboard {isTurismo ? 'Turismo & Fretamento' : 'Logística Express'}
        </h1>
        <p className="text-slate-500 dark:text-slate-400">Visão geral da operação em tempo real.</p>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Receita Mensal" 
          value={isTurismo ? "R$ 145.200" : "R$ 89.400"} 
          trend="+12.5%" 
          isPositive={true}
          icon={DollarSign}
          color="green"
        />
        <KpiCard 
          title={isTurismo ? "Passageiros" : "Entregas"} 
          value={isTurismo ? "2.450" : "1.890"} 
          trend="+5.2%" 
          isPositive={true}
          icon={isTurismo ? Users : Package}
          color="blue"
        />
        <KpiCard 
          title={isTurismo ? "Taxa Ocupação" : "Pontualidade"} 
          value={isTurismo ? "78%" : "98.2%"} 
          trend={isTurismo ? "+2%" : "-0.5%"} 
          isPositive={isTurismo}
          icon={TrendingUp}
          color="purple"
        />
        <KpiCard 
          title={isTurismo ? "Veículos Ativos" : "Frota Ativa"} 
          value="18/20" 
          trend="2 Manut." 
          isPositive={false}
          icon={isTurismo ? Bus : AlertTriangle}
          color="orange"
        />
      </div>

      {/* AI & Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4">
            {isTurismo ? 'Receita x Ocupação (Semana Atual)' : 'Volume de Entregas'}
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {isTurismo ? (
                <BarChart data={MOCK_DATA_TURISMO}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="name" stroke={axisTextColor} />
                  <YAxis yAxisId="left" orientation="left" stroke={axisTextColor} />
                  <YAxis yAxisId="right" orientation="right" stroke={axisTextColor} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: tooltipBg, borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: tooltipText }}
                    itemStyle={{ color: tooltipText }}
                  />
                  <Bar yAxisId="left" dataKey="receita" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Receita (R$)" />
                  <Bar yAxisId="right" dataKey="ocupacao" fill="#a855f7" radius={[4, 4, 0, 0]} name="Ocupação (%)" />
                </BarChart>
              ) : (
                <LineChart data={MOCK_DATA_EXPRESS}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="name" stroke={axisTextColor} />
                  <YAxis stroke={axisTextColor} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: tooltipBg, borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: tooltipText }}
                    itemStyle={{ color: tooltipText }}
                  />
                  <Line type="monotone" dataKey="entregas" stroke="#f97316" strokeWidth={3} dot={{ r: 4 }} name="Entregas" />
                  <Line type="monotone" dataKey="atrasos" stroke="#ef4444" strokeWidth={2} name="Atrasos" />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Sidebar */}
        <div className="space-y-6">
          <GeminiInsights context={currentContext} dataSummary={summaryData} />
          
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-3 text-sm uppercase tracking-wide">Alertas Recentes</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3 pb-3 border-b border-slate-50 dark:border-slate-700 last:border-0">
                <div className="w-2 h-2 mt-2 rounded-full bg-red-500 shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Manutenção Vencida</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Veículo PL-4590 (Ônibus)</p>
                </div>
              </div>
              <div className="flex items-start gap-3 pb-3 border-b border-slate-50 dark:border-slate-700 last:border-0">
                <div className="w-2 h-2 mt-2 rounded-full bg-yellow-500 shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">CNH a vencer</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Motorista João Silva (15 dias)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};