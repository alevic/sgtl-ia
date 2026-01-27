import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { EmpresaContexto } from '../../../types';
import {
  LayoutDashboard, Users, Settings,
  Bus, Ticket, Truck, Package, MapPin,
  TrendingUp, Wrench, CreditCard, Database,
  Building2, FileText, ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { authClient } from '../../lib/auth-client';

const SidebarItem: React.FC<{ icon: React.ElementType; label: string; to: string; activeColor: string }> = ({ icon: Icon, label, to, activeColor }) => {
  const location = useLocation();
  const active = location.pathname === to;

  // Swiss Logistics: Sharp, High Contrast, Left Indicator
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 px-4 py-2 mx-2 rounded-sm cursor-pointer transition-all duration-200 group relative mb-0.5",
        active
          ? "bg-secondary text-primary font-bold"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {/* Sharp Left Active Indicator */}
      {active && (
        <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
      )}

      <Icon
        size={18}
        className={cn(
          "transition-all duration-200",
          active ? "text-primary stroke-[2.5px]" : "group-hover:text-foreground"
        )}
      />
      <span className="text-sm tracking-tight uppercase">
        {label}
      </span>
    </Link>
  );
};

export const Sidebar: React.FC = () => {
  const { currentContext, isSidebarOpen, systemSettings } = useApp();
  const { data: session } = authClient.useSession();
  const userRole = session?.user?.role || 'user';

  const themeColor = currentContext === EmpresaContexto.TURISMO ? 'blue' : 'orange';

  if (!isSidebarOpen) return null;

  const canAccess = (roles: string[]) => roles.includes(userRole);

  return (
    // SOLID BACKGROUND - NO BLUR - SHARP BORDER
    <div className="w-64 h-screen bg-card border-r border-border flex flex-col sticky top-0 left-0 shrink-0 z-50">

      {/* LOGO AREA - INDUSTRIAL HEADER */}
      <div className="h-16 flex items-center px-6 border-b border-border bg-muted">
        <div className={cn(
          "w-8 h-8 flex items-center justify-center text-primary-foreground font-black mr-3 rounded-none shadow-none",
          "bg-primary" // Solid Signal Color
        )}>
          <Bus size={18} strokeWidth={3} />
        </div>
        <div className="flex flex-col justify-center">
          <span className="font-black text-foreground text-base leading-none tracking-widest uppercase">
            {systemSettings.system_name || 'SGTL'}
          </span>
          <span className="text-[10px] font-bold text-muted-foreground tracking-[0.2em] uppercase mt-0.5">
            LOGISTICS v2.2
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-0.5">
        <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/admin/dashboard" activeColor={themeColor} />

        <div className="mt-4 mb-2 px-6 text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em]">
          Operação {currentContext === EmpresaContexto.TURISMO ? 'Turismo' : 'Express'}
        </div>

        {/* Context: JJê Turismo */}
        {currentContext === EmpresaContexto.TURISMO && (
          <>
            <SidebarItem icon={Bus} label="Viagens" to="/admin/viagens" activeColor={themeColor} />
            <SidebarItem icon={Ticket} label="Reservas" to="/admin/reservas" activeColor={themeColor} />
            <SidebarItem icon={Users} label="Fretamento" to="/admin/fretamento" activeColor={themeColor} />
            <SidebarItem icon={MapPin} label="Rotas" to="/admin/rotas" activeColor={themeColor} />
          </>
        )}

        {/* Context: JJê Express */}
        {currentContext === EmpresaContexto.EXPRESS && (
          <>
            <SidebarItem icon={Truck} label="Rotas Express" to="/admin/rotas" activeColor={themeColor} />
            <SidebarItem icon={Package} label="Encomendas" to="/admin/encomendas" activeColor={themeColor} />
          </>
        )}

        <div className="my-4 mx-6 border-t border-border"></div>
        <div className="mb-2 px-6 text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em]">
          Gerenciamento
        </div>

        <SidebarItem icon={Users} label="Clientes" to="/admin/clientes" activeColor={themeColor} />
        <SidebarItem icon={currentContext === EmpresaContexto.TURISMO ? Bus : Truck} label="Frota" to="/admin/frota" activeColor={themeColor} />
        <SidebarItem icon={Users} label="Motoristas" to="/admin/motoristas" activeColor={themeColor} />
        <SidebarItem icon={Wrench} label="Manutenção" to="/admin/manutencao" activeColor={themeColor} />

        <div className="my-4 mx-6 border-t border-border"></div>
        <div className="mb-2 px-6 text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em]">
          Admin
        </div>

        {canAccess(['admin', 'financeiro']) && (
          <SidebarItem icon={CreditCard} label="Financeiro" to="/admin/financeiro" activeColor={themeColor} />
        )}

        <SidebarItem icon={TrendingUp} label="Relatórios" to="/admin/relatorios" activeColor={themeColor} />
        <SidebarItem icon={FileText} label="Documentos" to="/admin/documentos" activeColor={themeColor} />

        {canAccess(['admin']) && (
          <>
            <SidebarItem icon={Users} label="Usuários" to="/admin/usuarios" activeColor={themeColor} />
            <SidebarItem icon={Building2} label="Organizações" to="/admin/organizacoes" activeColor={themeColor} />
            <SidebarItem icon={Database} label="Cadastros" to="/admin/cadastros-auxiliares" activeColor={themeColor} />
            <SidebarItem icon={Settings} label="Configurações" to="/admin/configuracoes" activeColor={themeColor} />
          </>
        )}

      </div>
    </div>
  );
};