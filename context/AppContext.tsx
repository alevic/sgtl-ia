import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { EmpresaContexto, IEmpresa } from '../types';
import { authClient } from '../lib/auth-client';

type Theme = 'light' | 'dark';

interface AppContextType {
  currentContext: EmpresaContexto;
  switchContext: (context: EmpresaContexto) => void;
  currentEmpresa: IEmpresa;
  user: { name: string; role: string; avatar: string; email: string };
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

  const { data: session } = authClient.useSession();

  // Sync active organization if missing
  useEffect(() => {
    if (session && !session.session.activeOrganizationId) {
      authClient.organization.list().then(({ data }) => {
        if (data && data.length > 0) {
          // Default to Turismo if available, otherwise first one
          const defaultOrg = data.find(o => o.slug.toLowerCase().includes('turismo')) || data[0];
          console.log("Setting default active organization:", defaultOrg.name);
          authClient.organization.setActive({ organizationId: defaultOrg.id });
        }
      });
    }
  }, [session]);

  const user = {
    name: session?.user?.name || "Usuário",
    role: "Administrador", // Role management can be added later
    avatar: session?.user?.image || "",
    email: session?.user?.email || ""
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