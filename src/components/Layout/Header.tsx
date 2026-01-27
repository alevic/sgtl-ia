import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { EmpresaContexto } from '../../../types';
import { Menu, Bell, ChevronDown, Search, Moon, Sun, LogOut, User, Settings } from 'lucide-react';
import { authClient } from '../../lib/auth-client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { cn } from "../../lib/utils";

export const Header: React.FC = () => {
  const { currentContext, switchContext, currentEmpresa, user, toggleSidebar, theme, toggleTheme } = useApp();
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState<any[]>([]);

  React.useEffect(() => {
    authClient.organization.list().then(({ data }) => {
      if (data) setOrgs(data);
    });
  }, []);

  return (
    // SWISS LOGISTICS - SOLID HEADER, SHARP BORDERS
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-40">

      <div className="flex items-center gap-6">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="rounded-sm hover:bg-muted">
          <Menu size={20} />
        </Button>

        {/* Industrial Context Switcher */}
        <div className="hidden lg:flex items-center gap-0 border border-border rounded-sm overflow-hidden h-9">
          <div className="bg-muted px-3 h-full flex items-center border-r border-border">
            <span className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">ORG</span>
          </div>
          <Select
            value={orgs.find(o => o.slug.includes(currentContext === EmpresaContexto.TURISMO ? 'turismo' : 'express'))?.id || ''}
            onValueChange={async (orgId) => {
              const org = orgs.find(o => o.id === orgId);
              if (org) {
                await authClient.organization.setActive({ organizationId: org.id });
                if (org.slug.toLowerCase().includes('turismo')) {
                  switchContext(EmpresaContexto.TURISMO);
                } else {
                  switchContext(EmpresaContexto.EXPRESS);
                }
                window.location.reload();
              }
            }}
          >
            <SelectTrigger className="w-[200px] h-full bg-card border-none shadow-none font-bold text-sm rounded-none focus:ring-0">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent className="rounded-sm border border-border shadow-lg p-0">
              {orgs.map(org => (
                <SelectItem key={org.id} value={org.id} className="rounded-none font-medium cursor-pointer focus:bg-primary focus:text-primary-foreground">
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden xl:block group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-foreground transition-colors" size={16} />
          <input
            type="text"
            placeholder="COMMAND SEARCH..."
            className="pl-10 pr-4 py-1.5 bg-muted border border-transparent focus:border-primary rounded-sm text-sm w-72 focus:outline-none transition-all placeholder:text-muted-foreground/40 font-mono uppercase text-xs"
          />
        </div>

        <Button variant="ghost" size="icon" className="relative rounded-sm hover:bg-muted">
          <Bell size={18} className="text-muted-foreground" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-destructive rounded-full"></span>
        </Button>

        <div className="h-6 w-px bg-border mx-2"></div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 outline-none group">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-foreground leading-none">{user.name}</p>
                <p className="text-[10px] font-mono text-muted-foreground uppercase mt-1">{user.role}</p>
              </div>
              <div className="relative">
                <Avatar className="h-9 w-9 border border-border rounded-sm">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-black rounded-sm">
                    {user.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-emerald-500 border-2 border-card rounded-full"></div>
              </div>
              <ChevronDown size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-sm border border-border shadow-xl p-0 mt-2 bg-card">
            <DropdownMenuLabel className="px-3 py-2 border-b border-border bg-muted">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Conta</p>
            </DropdownMenuLabel>

            <DropdownMenuItem onClick={() => navigate(`/admin/usuarios/${user.id}/editar`)} className="rounded-none h-10 gap-3 text-sm cursor-pointer focus:bg-muted">
              <User size={14} /> Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/admin/configuracoes')} className="rounded-none h-10 gap-3 text-sm cursor-pointer focus:bg-muted">
              <Settings size={14} /> Configurações
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-border my-0" />

            <DropdownMenuItem onClick={toggleTheme} className="rounded-none h-10 gap-3 text-sm cursor-pointer focus:bg-muted">
              {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
              {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-border my-0" />

            <DropdownMenuItem
              onClick={async () => {
                const m = await import('../../lib/auth-client');
                await m.authClient.signOut();
                navigate('/login');
              }}
              className="rounded-none h-10 gap-3 text-sm cursor-pointer text-destructive focus:bg-destructive focus:text-destructive-foreground"
            >
              <LogOut size={14} /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};