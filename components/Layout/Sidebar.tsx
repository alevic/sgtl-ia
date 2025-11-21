import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { EmpresaContexto } from '../../types';
import {
  LayoutDashboard,
  Bus,
  Ticket,
  Users,
  Truck,
  Package,
  Settings,
  FileText,
  MapPin,
  TrendingUp,
  Wrench,
  CreditCard
} from 'lucide-react';

const SidebarItem: React.FC<{ icon: React.ElementType; label: string; to: string; colorClass: string }> = ({ icon: Icon, label, to, colorClass }) => {
  const location = useLocation();
  const active = location.pathname === to;

  return (
    <Link to={to} className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg cursor-pointer transition-colors ${active ? `bg-${colorClass}-50 dark:bg-${colorClass}-900/20 text-${colorClass}-700 dark:text-${colorClass}-300` : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
      <Icon size={20} className={active ? `text-${colorClass}-600 dark:text-${colorClass}-400` : 'text-slate-500 dark:text-slate-500'} />
      <span className={`font-medium ${active ? `text-${colorClass}-700 dark:text-${colorClass}-300` : ''}`}>{label}</span>
    </Link>
  );
};

export const Sidebar: React.FC = () => {
  const { currentContext, isSidebarOpen } = useApp();

  // Dynamic color based on context (Blue for Turismo, Orange for Express)
  const themeColor = currentContext === EmpresaContexto.TURISMO ? 'blue' : 'orange';

  if (!isSidebarOpen) return null;

  return (
    <div className="w-64 h-screen bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col sticky top-0 left-0 shrink-0 transition-colors">
      <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-700">
        <div className={`w-8 h-8 rounded bg-${themeColor}-600 flex items-center justify-center text-white font-bold mr-3`}>
          JJ
        </div>
        <span className="font-bold text-slate-800 dark:text-white text-lg">SGTL v2.1</span>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-1">
        <div className="px-6 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Principal
        </div>
        <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/admin/dashboard" colorClass={themeColor} />

        {/* Context: JJê Turismo */}
        {currentContext === EmpresaContexto.TURISMO && (
          <>
            <SidebarItem icon={Bus} label="Viagens" to="/admin/viagens" colorClass={themeColor} />
            <SidebarItem icon={Ticket} label="Reservas" to="/admin/reservas" colorClass={themeColor} />
            <SidebarItem icon={Users} label="Fretamento B2B" to="/admin/fretamento" colorClass={themeColor} />
            <SidebarItem icon={MapPin} label="Paradas Intermediárias" to="/admin/paradas" colorClass={themeColor} />
          </>
        )}

        {/* Context: JJê Express */}
        {currentContext === EmpresaContexto.EXPRESS && (
          <>
            <SidebarItem icon={Truck} label="Rotas Express" to="/admin/rotas" colorClass={themeColor} />
            <SidebarItem icon={Package} label="Encomendas" to="/admin/encomendas" colorClass={themeColor} />
          </>
        )}

        <div className="mt-6 px-6 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Operacional
        </div>
        <SidebarItem icon={Users} label="Clientes (CRM)" to="/admin/clientes" colorClass={themeColor} />
        <SidebarItem icon={currentContext === EmpresaContexto.TURISMO ? Bus : Truck} label="Frota" to="/admin/frota" colorClass={themeColor} />
        <SidebarItem icon={Users} label="Motoristas" to="/admin/motoristas" colorClass={themeColor} />
        <SidebarItem icon={Wrench} label="Manutenção" to="/admin/manutencao" colorClass={themeColor} />

        <div className="mt-6 px-6 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Gestão
        </div>
        <SidebarItem icon={CreditCard} label="Financeiro" to="/admin/financeiro" colorClass={themeColor} />
        <SidebarItem icon={TrendingUp} label="Relatórios" to="/admin/relatorios" colorClass={themeColor} />
        <SidebarItem icon={FileText} label="Documentos" to="/admin/documentos" colorClass={themeColor} />
        <SidebarItem icon={Settings} label="Configurações" to="/admin/configuracoes" colorClass={themeColor} />
      </div>

      <div className="p-4 border-t border-slate-100 dark:border-slate-700">
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Módulo Ativo</p>
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold bg-${themeColor}-100 dark:bg-${themeColor}-900/30 text-${themeColor}-700 dark:text-${themeColor}-300`}>
            {currentContext === EmpresaContexto.TURISMO ? 'TURISMO B2C' : 'LOGÍSTICA EXPRESS'}
          </span>
        </div>
      </div>
    </div>
  );
};