import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { EmpresaContexto, IEmpresa } from '../types';

type Theme = 'light' | 'dark';

interface AppContextType {
  currentContext: EmpresaContexto;
  switchContext: (context: EmpresaContexto) => void;
  currentEmpresa: IEmpresa;
  user: { name: string; role: string; avatar: string };
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  theme: Theme;
  toggleTheme: () => void;
}

const MOCK_EMPRESAS: Record<EmpresaContexto, IEmpresa> = {
  [EmpresaContexto.TURISMO]: {
    id: 'emp-01',
    nome_fantasia: 'JJê Turismo',
    tipo: EmpresaContexto.TURISMO,
    cor_primaria: 'blue'
  },
  [EmpresaContexto.EXPRESS]: {
    id: 'emp-02',
    nome_fantasia: 'JJê Express',
    tipo: EmpresaContexto.EXPRESS,
    cor_primaria: 'orange'
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentContext, setCurrentContext] = useState<EmpresaContexto>(EmpresaContexto.TURISMO);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<Theme>('light');

  const switchContext = (context: EmpresaContexto) => {
    setCurrentContext(context);
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const user = {
    name: "Admin Operacional",
    role: "Gerente Geral",
    avatar: "https://picsum.photos/100/100"
  };

  return (
    <AppContext.Provider value={{ 
      currentContext, 
      switchContext, 
      currentEmpresa: MOCK_EMPRESAS[currentContext],
      user,
      isSidebarOpen,
      toggleSidebar: () => setIsSidebarOpen(!isSidebarOpen),
      theme,
      toggleTheme
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};