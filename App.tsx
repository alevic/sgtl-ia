import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { Dashboard } from './pages/Dashboard';
import { NovaReserva } from './pages/NovaReserva';
import { Motoristas } from './pages/Motoristas';
import { Encomendas } from './pages/Encomendas';
import { Fretamento } from './pages/Fretamento';
import { Reservas } from './pages/Reservas';
import { CRM } from './pages/CRM';
import { ClienteDetalhes } from './pages/ClienteDetalhes';
import { NovoCliente } from './pages/NovoCliente';
import { Viagens } from './pages/Viagens';
import { NovaViagem } from './pages/NovaViagem';
import { ViagemDetalhes } from './pages/ViagemDetalhes';

import { Frota } from './pages/Frota';
import { NovoVeiculo } from './pages/NovoVeiculo';
import { VeiculoDetalhes } from './pages/VeiculoDetalhes';
import { Manutencao } from './pages/Manutencao';
import { NovaManutencao } from './pages/NovaManutencao';
import { Rotas } from './pages/Rotas';
import { NovaRota } from './pages/NovaRota';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden transition-colors duration-200">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

          {/* Admin Routes */}
          <Route path="/admin/*" element={
            <AdminLayout>
              <Routes>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="viagens" element={<Viagens />} />
                <Route path="viagens/nova" element={<NovaViagem />} />
                <Route path="viagens/:id" element={<ViagemDetalhes />} />

                <Route path="reservas" element={<Reservas />} />
                <Route path="reservas/nova" element={<NovaReserva />} />
                <Route path="motoristas" element={<Motoristas />} />
                <Route path="encomendas" element={<Encomendas />} />
                <Route path="fretamento" element={<Fretamento />} />
                <Route path="clientes" element={<CRM />} />
                <Route path="clientes/novo" element={<NovoCliente />} />
                <Route path="clientes/:id" element={<ClienteDetalhes />} />
                <Route path="frota" element={<Frota />} />
                <Route path="frota/novo" element={<NovoVeiculo />} />
                <Route path="frota/:id" element={<VeiculoDetalhes />} />
                <Route path="manutencao" element={<Manutencao />} />
                <Route path="manutencao/nova" element={<NovaManutencao />} />
                <Route path="rotas" element={<Rotas />} />
                <Route path="rotas/nova" element={<NovaRota />} />
                <Route path="rotas/:id" element={<NovaRota />} />
                <Route path="*" element={<div className="p-10 text-center text-slate-500 dark:text-slate-400">Página em construção...</div>} />
              </Routes>
            </AdminLayout>
          } />

          {/* Portal Cliente Route (Placeholder) */}
          <Route path="/portal/*" element={
            <div className="h-screen flex items-center justify-center bg-blue-50 dark:bg-slate-900">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-blue-900 dark:text-blue-400">Portal do Cliente</h1>
                <p className="mt-2 text-blue-600 dark:text-blue-300">Acesso restrito a clientes.</p>
              </div>
            </div>
          } />

        </Routes>
      </HashRouter>
    </AppProvider>
  );
};

export default App;