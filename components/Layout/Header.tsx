import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EmpresaContexto } from '../../types';
import { Menu, Bell, ChevronDown, Search, Moon, Sun, LogOut, User, Settings } from 'lucide-react';

export const Header: React.FC = () => {
  const { currentContext, switchContext, currentEmpresa, user, toggleSidebar, theme, toggleTheme } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 sticky top-0 z-20 transition-colors">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
          <Menu size={20} />
        </button>
        
        {/* Context Switcher */}
        <div className="hidden md:flex items-center gap-2">
          <span className="text-sm text-slate-500 dark:text-slate-400">Empresa:</span>
          <select 
            className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
            value={currentContext}
            onChange={(e) => switchContext(e.target.value as EmpresaContexto)}
          >
            <option value={EmpresaContexto.TURISMO}>JJê Turismo (B2C/Fretamento)</option>
            <option value={EmpresaContexto.EXPRESS}>JJê Express (Logística)</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Buscar reserva, cliente..." 
            className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border-none rounded-full text-sm w-64 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 dark:text-white transition-all placeholder-slate-400"
          />
        </div>

        <button className="relative p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="relative border-l border-slate-200 dark:border-slate-700 pl-6">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 p-2 rounded-lg transition-colors"
          >
            <div className="text-right hidden md:block">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{user.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user.role}</p>
            </div>
            <img 
              src={user.avatar} 
              alt="User" 
              className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-slate-600 shadow-sm"
            />
            <ChevronDown size={16} className="text-slate-400" />
          </button>

          {/* User Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 py-2 animate-in fade-in slide-in-from-top-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700 mb-2 md:hidden">
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{user.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user.role}</p>
              </div>
              
              <button className="w-full px-4 py-2 text-left text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                <User size={16} /> Perfil
              </button>
              <button className="w-full px-4 py-2 text-left text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                <Settings size={16} /> Configurações
              </button>
              
              <div className="my-2 border-t border-slate-100 dark:border-slate-700"></div>
              
              <button 
                onClick={toggleTheme}
                className="w-full px-4 py-2 text-left text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                  {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
                </div>
                <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${theme === 'dark' ? 'bg-blue-600' : 'bg-slate-300'}`}>
                  <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${theme === 'dark' ? 'translate-x-4' : ''}`}></div>
                </div>
              </button>

              <div className="my-2 border-t border-slate-100 dark:border-slate-700"></div>

              <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                <LogOut size={16} /> Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};