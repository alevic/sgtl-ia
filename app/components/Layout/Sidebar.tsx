import React from 'react';
import { Link, useLocation } from 'react-router';
import { useApp } from '@/context/AppContext';
import { EmpresaContexto } from '@/types';
import {
  LayoutDashboard, Users, UserPlus, Settings, LogOut, Menu, X, Bus,
  Calendar, DollarSign, FileText, User, ChevronRight, Building2,
  Ticket, Truck, Package, MapPin, TrendingUp, Wrench, CreditCard, Database
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { authClient } from '@/lib/auth-client';

const SidebarItem: React.FC<{ icon: React.ElementType; label: string; to: string; activeColor: string }> = ({ icon: Icon, label, to, activeColor }) => {
  const location = useLocation();
  const active = location.pathname === to || location.pathname.startsWith(`${to}/`);

  const colorStyles: Record<string, string> = {
    blue: "text-primary bg-primary/10 shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)] hover:bg-primary/20",
    orange: "text-orange-600 bg-orange-500/10 shadow-[0_0_15px_-3px_rgba(234,88,12,0.3)] hover:bg-orange-500/20"
  };

  const activeClass = colorStyles[activeColor] || "bg-accent text-accent-foreground";

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 mx-3 rounded-xl cursor-pointer transition-all duration-300 group mb-1 relative overflow-hidden",
        active
          ? activeClass
          : "text-muted-foreground/70 hover:bg-accent/40 hover:text-foreground hover:translate-x-1"
      )}
    >
      {active && (
        <span className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full",
          activeColor === 'blue' ? "bg-primary" : "bg-orange-600"
        )} />
      )}
      <Icon
        size={18}
        className={cn(
          "transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
          active ? "stroke-[2.5px]" : "opacity-70 group-hover:opacity-100"
        )}
      />
      <span className={cn(
        "text-sm font-bold tracking-tight transition-colors",
        active ? "font-black" : "font-semibold"
      )}>
        {label}
      </span>
      {!active && <ChevronRight size={14} className="ml-auto opacity-0 -translate-x-2 group-hover:opacity-40 group-hover:translate-x-0 transition-all duration-300" />}
    </Link>
  );
};

export const Sidebar: React.FC = () => {
  const { currentContext, isSidebarOpen, systemSettings, user } = useApp();
  const userRole = user.role;

  // Dynamic color based on context (Blue for Turismo, Orange for Express)
  const themeColor = currentContext === EmpresaContexto.TURISMO ? 'blue' : 'orange';

  if (!isSidebarOpen) return null;

  const canAccess = (roles: string[]) => roles.includes(userRole);

  return (
    <div className="w-64 h-screen bg-card/95 backdrop-blur-xl border-r border-border/50 flex flex-col sticky top-0 left-0 shrink-0 transition-all duration-300 z-50 shadow-2xl shadow-black/5">
      <div className="h-20 flex items-center px-6 mb-6">
        <div className={cn(
          "w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black mr-3 shadow-2xl transition-all duration-500 hover:scale-110 hover:rotate-6 active:scale-95 group",
          currentContext === EmpresaContexto.TURISMO
            ? 'bg-gradient-to-br from-primary to-blue-700 shadow-primary/40'
            : 'bg-gradient-to-br from-orange-500 to-orange-700 shadow-orange-600/40'
        )}>
          <Bus size={24} strokeWidth={2.5} className="group-hover:animate-bounce" />
        </div>
        <div className="flex flex-col">
          <span className="font-black text-foreground text-lg leading-tight uppercase tracking-tighter">
            {systemSettings.system_name || 'SGTL'}
          </span>
          <span className="text-[12px] font-bold text-muted-foreground/60 tracking-[0.2em] -mt-1 uppercase">
            {systemSettings.system_display_version || 'v2.2'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-1">
        <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/admin/dashboard" activeColor={themeColor} />
        <div className="mt-2 px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
          Principal
        </div>

        {/* Context: JJê Turismo */}
        {currentContext === EmpresaContexto.TURISMO && (
          <>
            <SidebarItem icon={Bus} label="Viagens" to="/admin/trips" activeColor={themeColor} />
            <SidebarItem icon={Ticket} label="Reservas" to="/admin/reservations" activeColor={themeColor} />
            <SidebarItem icon={Users} label="Fretamento B2B" to="/admin/charter" activeColor={themeColor} />
            <SidebarItem icon={MapPin} label="Rotas" to="/admin/routes" activeColor={themeColor} />
          </>
        )}

        {/* Context: JJê Express */}
        {currentContext === EmpresaContexto.EXPRESS && (
          <>
            <SidebarItem icon={Truck} label="Rotas Express" to="/admin/routes" activeColor={themeColor} />
            <SidebarItem icon={Package} label="Encomendas" to="/admin/parcels" activeColor={themeColor} />
          </>
        )}


        <div className="my-4 mx-6 border-t border-slate-100 dark:border-slate-700"></div>
        <div className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
          Operacional
        </div>
        <SidebarItem icon={Users} label="Clientes (CRM)" to="/admin/clients" activeColor={themeColor} />
        <SidebarItem icon={currentContext === EmpresaContexto.TURISMO ? Bus : Truck} label="Frota" to="/admin/fleet" activeColor={themeColor} />
        <SidebarItem icon={Users} label="Motoristas" to="/admin/drivers" activeColor={themeColor} />
        <SidebarItem icon={Wrench} label="Manutenção" to="/admin/maintenance" activeColor={themeColor} />

        <div className="my-4 mx-6 border-t border-slate-100 dark:border-slate-700"></div>
        <div className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
          Gestão
        </div>

        {canAccess(['admin', 'financeiro']) && (
          <SidebarItem icon={CreditCard} label="Financeiro" to="/admin/finance" activeColor={themeColor} />
        )}

        <SidebarItem icon={TrendingUp} label="Relatórios" to="/admin/reports" activeColor={themeColor} />
        <SidebarItem icon={FileText} label="Documentos" to="/admin/documents" activeColor={themeColor} />

        {canAccess(['admin']) && (
          <>
            <SidebarItem icon={Users} label="Usuários" to="/admin/users" activeColor={themeColor} />
            <SidebarItem icon={Building2} label="Organizações" to="/admin/organizations" activeColor={themeColor} />
            <SidebarItem icon={Database} label="Cadastros Auxiliares" to="/admin/auxiliary-data" activeColor={themeColor} />
            <SidebarItem icon={Settings} label="Configurações" to="/admin/settings" activeColor={themeColor} />
          </>
        )}

      </div>
    </div>
  );
};