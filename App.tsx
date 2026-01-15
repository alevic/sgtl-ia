import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { Footer } from './components/Layout/Footer';
import { Dashboard } from './pages/Dashboard';
import { NovaReserva } from './pages/NovaReserva';
import { Motoristas } from './pages/Motoristas';
import { NovoMotorista } from './pages/NovoMotorista';
import { MotoristaDetalhes } from './pages/MotoristaDetalhes';
import { EditarMotorista } from './pages/EditarMotorista';
import { Encomendas } from './pages/Encomendas';
import { NovaEncomenda } from './pages/NovaEncomenda';
import { Fretamento } from './pages/Fretamento';
import { NovoFretamento } from './pages/NovoFretamento';
import { Reservas } from './pages/Reservas';
import { CRM } from './pages/CRM';
import { ClienteDetalhes } from './pages/ClienteDetalhes';
import { NovoCliente } from './pages/NovoCliente';
import { EditarCliente } from './pages/EditarCliente';
import { Viagens } from './pages/Viagens';
import { NovaViagem } from './pages/NovaViagem';
import { Login } from './pages/Login';

import { Frota } from './pages/Frota';
import { NovoVeiculo } from './pages/NovoVeiculo';
import { VeiculoDetalhes } from './pages/VeiculoDetalhes';
import { EditarVeiculo } from './pages/EditarVeiculo';
import { Manutencao } from './pages/Manutencao';
import { NovaManutencao } from './pages/NovaManutencao';
import { Rotas } from './pages/Rotas';
import { NovaRota } from './pages/NovaRota';
import { Financeiro } from './pages/Financeiro';
import { ContasPagar } from './pages/ContasPagar';
import { ContasReceber } from './pages/ContasReceber';
import { NovaTransacao } from './pages/NovaTransacao';
import { Transacoes } from './pages/Transacoes';
import { Relatorios } from './pages/Relatorios';
import { CentrosCusto } from './pages/CentrosCusto';
import { ConciliacaoBancaria } from './pages/ConciliacaoBancaria';
import { Configuracoes } from './pages/Configuracoes';
import { Documentos } from './pages/Documentos';
import { AtividadesRecentes } from './pages/AtividadesRecentes';
import { Perfil } from './pages/Perfil';
import { Usuarios } from './pages/Usuarios';
import { NovoUsuario } from './pages/NovoUsuario';
import { EditarUsuario } from './pages/EditarUsuario';
import { EsqueciSenha } from './pages/EsqueciSenha';
import { RedefinirSenha } from './pages/RedefinirSenha';
import { Organizacoes } from './pages/Organizacoes';
import { CadastrosAuxiliares } from './pages/CadastrosAuxiliares';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';

// Public Portal
import { PublicLayout } from './layouts/PublicLayout';
import { ViagensPublico } from './pages/public/ViagensPublico';
import { ViagemDetalhesPublico } from './pages/public/ViagemDetalhesPublico';
import { LoginCliente } from './pages/public/LoginCliente';
import { DashboardCliente } from './pages/public/DashboardCliente';
import { SignupCliente } from './pages/public/SignupCliente';
import { CheckoutReserva } from './pages/public/CheckoutReserva';
import { ReservaDetalhesCliente } from './pages/public/ReservaDetalhesCliente';
import { EncomendaDetalhesCliente } from './pages/public/EncomendaDetalhesCliente';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden transition-colors duration-200">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto flex flex-col">
          <div className="max-w-7xl mx-auto w-full p-6 flex-1">
            {children}
          </div>
          <Footer />
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
          <Route path="/login" element={<Login />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />

          {/* Protected Admin Routes */}
          <Route path="/admin/*" element={
            <ProtectedRoute>
              <AdminLayout>
                <Routes>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="viagens" element={<Viagens />} />
                  <Route path="viagens/nova" element={<NovaViagem />} />
                  <Route path="viagens/editar/:id" element={<NovaViagem />} />

                  <Route path="reservas" element={<Reservas />} />
                  <Route path="reservas/nova" element={<NovaReserva />} />
                  <Route path="motoristas" element={<Motoristas />} />
                  <Route path="motoristas/novo" element={<NovoMotorista />} />
                  <Route path="motoristas/:id" element={<MotoristaDetalhes />} />
                  <Route path="motoristas/:id/editar" element={<EditarMotorista />} />
                  <Route path="encomendas" element={<Encomendas />} />
                  <Route path="encomendas/nova" element={<NovaEncomenda />} />
                  <Route path="fretamento" element={<Fretamento />} />
                  <Route path="fretamento/novo" element={<NovoFretamento />} />
                  <Route path="clientes" element={<CRM />} />
                  <Route path="clientes/novo" element={<NovoCliente />} />
                  <Route path="clientes/:id" element={<ClienteDetalhes />} />
                  <Route path="clientes/:id/editar" element={<EditarCliente />} />
                  <Route path="frota" element={<Frota />} />
                  <Route path="frota/novo" element={<NovoVeiculo />} />
                  <Route path="frota/:id" element={<VeiculoDetalhes />} />
                  <Route path="frota/:id/editar" element={<EditarVeiculo />} />
                  <Route path="manutencao" element={<Manutencao />} />
                  <Route path="manutencao/nova" element={<NovaManutencao />} />
                  <Route path="manutencao/:id/editar" element={<NovaManutencao />} />
                  <Route path="rotas" element={<Rotas />} />
                  <Route path="rotas/nova" element={<NovaRota />} />
                  <Route path="rotas/:id" element={<NovaRota />} />
                  {/* Financeiro - Admin & Financeiro */}
                  <Route path="financeiro/*" element={
                    <ProtectedRoute allowedRoles={['admin', 'financeiro']}>
                      <Routes>
                        <Route path="/" element={<Financeiro />} />
                        <Route path="contas-pagar" element={<ContasPagar />} />
                        <Route path="contas-receber" element={<ContasReceber />} />
                        <Route path="transacoes/nova" element={<NovaTransacao />} />
                        <Route path="transacoes" element={<Transacoes />} />
                        <Route path="centros-custo" element={<CentrosCusto />} />
                        <Route path="conciliacao" element={<ConciliacaoBancaria />} />
                      </Routes>
                    </ProtectedRoute>
                  } />
                  <Route path="relatorios" element={<Relatorios />} />
                  <Route path="documentos" element={<Documentos />} />
                  <Route path="atividades" element={<AtividadesRecentes />} />
                  <Route path="perfil" element={<Perfil />} />

                  {/* Admin Only */}
                  <Route path="configuracoes" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <Configuracoes />
                    </ProtectedRoute>
                  } />
                  <Route path="cadastros-auxiliares" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <CadastrosAuxiliares />
                    </ProtectedRoute>
                  } />
                  <Route path="usuarios/*" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <Routes>
                        <Route path="/" element={<Usuarios />} />
                        <Route path="novo" element={<NovoUsuario />} />
                        <Route path=":id" element={<EditarUsuario />} />
                      </Routes>
                    </ProtectedRoute>
                  } />
                  <Route path="organizacoes" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <Organizacoes />
                    </ProtectedRoute>
                  } />
                  <Route path="*" element={<div className="p-10 text-center text-slate-500 dark:text-slate-400">Página em construção...</div>} />
                </Routes>
              </AdminLayout>
            </ProtectedRoute>
          } />

          {/* Public Hotsite Routes (no auth required) */}
          <Route path="/viagens" element={<PublicLayout />}>
            <Route index element={<ViagensPublico />} />
            <Route path=":id" element={<ViagemDetalhesPublico />} />
            <Route path=":id/checkout" element={<CheckoutReserva />} />
          </Route>

          {/* Client Portal */}
          <Route path="/cliente/login" element={<LoginCliente />} />
          <Route path="/cliente/signup" element={<SignupCliente />} />
          <Route path="/cliente/dashboard" element={<DashboardCliente />} />
          <Route path="/cliente/reservas/:id" element={<ReservaDetalhesCliente />} />
          <Route path="/cliente/encomendas/:id" element={<EncomendaDetalhesCliente />} />




        </Routes>
      </HashRouter>
    </AppProvider>
  );
};

export default App;