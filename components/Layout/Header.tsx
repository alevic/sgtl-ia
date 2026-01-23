import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { EmpresaContexto } from '../../types';
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
    <header className="h-20 bg-card/60 backdrop-blur-xl border-b border-border/40 flex items-center justify-between px-8 sticky top-0 z-40 transition-all duration-300 shadow-sm shadow-black/5">
      <div className="flex items-center gap-6">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="rounded-xl hover:bg-accent/50 group">
          <Menu size={20} className="group-hover:rotate-180 transition-transform duration-500" />
        </Button>

        {/* Context Switcher - Premium Style */}
        <div className="hidden lg:flex items-center gap-3 px-4 py-1.5 bg-muted/30 rounded-full border border-border/30">
          <span className="text-[12px] uppercase tracking-[0.2em] font-black text-muted-foreground/40">Empresa</span>
          <Separator orientation="vertical" className="h-4 bg-border/40" />
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
            <SelectTrigger className="w-[200px] h-7 bg-transparent border-none shadow-none font-bold text-sm hover:text-primary transition-colors focus:ring-0">
              <SelectValue placeholder="Selecione a empresa" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
              {orgs.map(org => (
                <SelectItem key={org.id} value={org.id} className="rounded-xl font-semibold">
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative hidden xl:block group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors" size={16} />
          <input
            type="text"
            placeholder="Buscar reserva, cliente..."
            className="pl-10 pr-4 py-2 bg-muted/30 border-none rounded-full text-sm w-72 focus:ring-2 focus:ring-primary/10 dark:text-white transition-all placeholder:text-muted-foreground/30 font-medium whitespace-nowrap overflow-hidden"
          />
        </div>

        <Button variant="ghost" size="icon" className="relative group rounded-full hover:bg-primary/5">
          <Bell size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-background rounded-full animate-pulse"></span>
        </Button>

        <div className="flex items-center gap-4 pl-4 border-l border-border/50 h-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 outline-none group">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-black text-foreground group-hover:text-primary transition-colors leading-none">{user.name}</p>
                  <p className="text-[12px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">{user.role}</p>
                </div>
                <div className="relative">
                  <Avatar className="h-10 w-10 border-2 border-background ring-2 ring-primary/5 shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-active:scale-95">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/10 to-blue-600/10 text-primary font-black">
                      {user.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-background rounded-full"></div>
                </div>
                <ChevronDown size={14} className="text-muted-foreground group-hover:text-primary transition-all group-hover:translate-y-0.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-2xl border-none shadow-2xl p-2 mt-2">
              <DropdownMenuLabel className="px-3 py-2">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/40">Sua Conta</p>
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigate(`/admin/usuarios/${user.id}/editar`)} className="rounded-xl h-11 gap-3 font-bold cursor-pointer">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600"><User size={16} /></div>
                Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/admin/configuracoes')} className="rounded-xl h-11 gap-3 font-bold cursor-pointer">
                <div className="p-2 rounded-lg bg-primary/10 text-primary"><Settings size={16} /></div>
                Configurações
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-muted/50 my-2" />

              <DropdownMenuItem onClick={toggleTheme} className="rounded-xl h-11 gap-3 font-bold cursor-pointer">
                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600">
                  {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <span>{theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}</span>
                  <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-muted-foreground/20'}`}>
                    <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-all duration-300 ${theme === 'dark' ? 'translate-x-4' : ''}`}></div>
                  </div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-muted/50 my-2" />

              <DropdownMenuItem
                onClick={async () => {
                  const m = await import('../../lib/auth-client');
                  await m.authClient.signOut();
                  navigate('/login');
                }}
                className="rounded-xl h-11 gap-3 font-bold cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <div className="p-2 rounded-lg bg-destructive/10"><LogOut size={16} /></div>
                Sair do Sistema
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};