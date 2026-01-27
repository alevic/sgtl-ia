import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { EmpresaContexto, IEmpresa } from '../../types';
import { authClient } from '../lib/auth-client';

type Theme = 'light' | 'dark';

interface AppContextType {
  currentContext: EmpresaContexto;
  switchContext: (context: EmpresaContexto) => void;
  currentEmpresa: IEmpresa;
  user: { id: string; name: string; role: string; avatar: string; email: string };
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  theme: Theme;
  toggleTheme: () => void;
  systemSettings: Record<string, string>;
  refreshSettings: () => Promise<void>;
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
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'light';
  });
  const [systemSettings, setSystemSettings] = useState<Record<string, string>>({});
  const { data: session } = authClient.useSession();

  const refreshSettings = async () => {
    try {
      // Get current session to find active org
      const { data: sessionData } = await authClient.getSession();
      const orgId = sessionData?.session.activeOrganizationId;

      // 1. First try to get public settings (available even before login)
      const publicUrl = orgId
        ? `${import.meta.env.VITE_API_URL}/api/public/parameters?organizationId=${orgId}`
        : `${import.meta.env.VITE_API_URL}/api/public/parameters`;

      const publicResponse = await fetch(publicUrl);
      let combinedSettings: Record<string, string> = {};

      if (publicResponse.ok) {
        const publicData = await publicResponse.json();
        publicData.forEach((p: { key: string; value: string }) => {
          combinedSettings[p.key] = p.value;
        });
      }

      // 2. If user is logged in and has an active organization, fetch private settings too
      if (orgId) {
        const orgResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/api/organization/${orgId}/parameters`,
          { credentials: 'include' }
        );

        if (orgResponse.ok) {
          const orgData = await orgResponse.json();
          orgData.forEach((p: { key: string; value: string }) => {
            combinedSettings[p.key] = p.value;
          });
        }
      }

      setSystemSettings(combinedSettings);
    } catch (err) {
      console.error('Failed to fetch system settings:', err);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, [session?.session.activeOrganizationId]);

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
    localStorage.setItem('theme', theme);
  }, [theme]);


  // Sync active organization and context
  useEffect(() => {
    if (session) {
      if (session.session.activeOrganizationId) {
        // Sync context with active org
        authClient.organization.list().then(({ data }) => {
          const activeOrg = data?.find(o => o.id === session.session.activeOrganizationId);
          if (activeOrg) {

            // DYNAMIC THEME INJECTION (Swiss Logistics Strategy)
            const root = document.documentElement;

            if (activeOrg.slug.toLowerCase().includes('express')) {
              setCurrentContext(EmpresaContexto.EXPRESS);
              // Electric Green / Cyber Yellow for Express Logistics
              root.style.setProperty('--primary', '85 100% 50%');
              root.style.setProperty('--ring', '85 100% 50%');
            } else {
              setCurrentContext(EmpresaContexto.TURISMO);
              // International Orange for Turismo (Adventure/Motion)
              root.style.setProperty('--primary', '25 100% 50%');
              root.style.setProperty('--ring', '25 100% 50%');
            }
          }
        });
      } else {
        // No active org, set default
        authClient.organization.list().then(({ data }) => {
          if (data && data.length > 0) {
            const defaultOrg = data.find(o => o.slug.toLowerCase().includes('turismo')) || data[0];
            authClient.organization.setActive({ organizationId: defaultOrg.id });
          }
        });
      }
    }
  }, [session]);

  const user = {
    id: session?.user?.id || "",
    name: session?.user?.name || "Usuário",
    role: session?.user?.role || "user", // Use actual role from session
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
      toggleTheme,
      systemSettings,
      refreshSettings
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};