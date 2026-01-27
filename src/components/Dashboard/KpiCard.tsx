import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface KpiProps {
  title: string;
  value: string;
  trend: string;
  isPositive: boolean;
  icon: React.ElementType;
  color: 'blue' | 'orange' | 'green' | 'purple';
}

export const KpiCard: React.FC<KpiProps> = ({ title, value, trend, isPositive, icon: Icon, color }) => {
  const colorMap = {
    blue: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400',
    orange: 'text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400',
    green: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400',
    purple: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400'
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-sm border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-sm ${colorMap[color]}`}>
          <Icon size={24} />
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${isPositive ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-red-700 bg-red-50 dark:bg-red-900/30 dark:text-red-400'}`}>
          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend}
        </div>
      </div>
      <div>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{value}</h3>
      </div>
    </div>
  );
};