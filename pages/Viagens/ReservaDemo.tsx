import React, { useState } from 'react';
import { SeatMap } from '../../components/Viagens/SeatMap';
import { AssentoStatus, IAssento, ICliente, TipoDocumento } from '../../types';
import { Calendar, Clock, MapPin, CreditCard, User, Search, Plus, Check } from 'lucide-react';

const MOCK_SEATS: IAssento[] = Array.from({ length: 40 }, (_, i) => ({
  numero: `${i + 1}`,
  status: [2, 5, 6, 15, 16].includes(i + 1) ? AssentoStatus.OCUPADO : AssentoStatus.LIVRE
}));

const MOCK_CLIENTES: ICliente[] = [
  {
    id: '1',
    nome: 'Maria Oliveira',
    email: 'maria@email.com',
    saldo_creditos: 100,
    historico_viagens: 5,
    documento_tipo: TipoDocumento.CPF,
    documento_numero: '123.456.789-00',
    nacionalidade: 'Brasileira'
  },
  {
    id: '2',
    nome: 'João Santos',
    email: 'joao@email.com',
    saldo_creditos: 50,
    historico_viagens: 2,
    documento_tipo: TipoDocumento.CPF,
    documento_numero: '987.654.321-00',
    nacionalidade: 'Brasileira'
  },
  {
    id: '3',
    nome: 'Ana Paula',
    email: 'ana@email.com',
    saldo_creditos: 75,
    historico_viagens: 8,
    documento_tipo: TipoDocumento.CPF,
    documento_numero: '456.789.123-00',
    nacionalidade: 'Brasileira'
  }
];

export const ReservaDemo: React.FC = () => {
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [selectedCliente, setSelectedCliente] = useState<ICliente | null>(null);
  const [modoCliente, setModoCliente] = useState<'SELECIONAR' | 'NOVO'>('SELECIONAR');
  const [buscaCliente, setBuscaCliente] = useState('');
  const [clientesFiltrados, setClientesFiltrados] = useState<ICliente[]>(MOCK_CLIENTES);

  const handleBuscaCliente = (busca: string) => {
    setBuscaCliente(busca);
    if (busca === '') {
      setClientesFiltrados(MOCK_CLIENTES);
    } else {
      const filtered = MOCK_CLIENTES.filter(c =>
        c.nome.toLowerCase().includes(busca.toLowerCase()) ||
        c.email.toLowerCase().includes(busca.toLowerCase()) ||
        c.documento_numero.includes(busca)
      );
      setClientesFiltrados(filtered);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500">
      <div className="flex-1 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Nova Reserva</h1>
          <p className="text-slate-500 dark:text-slate-400">Viagem #8940 • São Paulo (SP) ➝ Florianópolis (SC)</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">Dados da Viagem</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Calendar size={18} className="text-blue-500" />
              <span>15/10/2023</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Clock size={18} className="text-blue-500" />
              <span>22:00</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 col-span-2">
              <MapPin size={18} className="text-blue-500" />
              <span>Plataforma 12 - Rodoviária Tietê</span>
            </div>
          </div>
        </div>

        {/* Seleção de Cliente */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">
            <h3 className="font-bold text-slate-700 dark:text-slate-200">Passageiro</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setModoCliente('SELECIONAR')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${modoCliente === 'SELECIONAR' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
              >
                Selecionar Cliente
              </button>
              <button
                onClick={() => setModoCliente('NOVO')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${modoCliente === 'NOVO' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
              >
                Novo Cliente
              </button>
            </div>
          </div>

          {modoCliente === 'SELECIONAR' ? (
            <div className="space-y-3">
              {/* Busca de Cliente */}
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome, email ou documento..."
                  value={buscaCliente}
                  onChange={(e) => handleBuscaCliente(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Cliente Selecionado */}
              {selectedCliente && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <User size={20} className="text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white">{selectedCliente.nome}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{selectedCliente.email}</p>
                      </div>
                    </div>
                    <Check size={24} className="text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              )}

              {/* Lista de Clientes */}
              <div className="max-h-60 overflow-y-auto space-y-2">
                {clientesFiltrados.map((cliente) => (
                  <button
                    key={cliente.id}
                    onClick={() => setSelectedCliente(cliente)}
                    className={`w-full p-3 rounded-lg border transition-colors text-left ${selectedCliente?.id === cliente.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                        <User size={16} className="text-slate-600 dark:text-slate-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800 dark:text-white">{cliente.nome}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {cliente.documento_numero} • {cliente.historico_viagens} viagens
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Formulário Novo Cliente
            <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Nome Completo</label>
                <input type="text" className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Ex: Maria Oliveira" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">CPF</label>
                <input type="text" className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="000.000.000-00" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Celular</label>
                <input type="text" className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="(00) 00000-0000" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Email</label>
                <input type="email" className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="email@exemplo.com" />
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="lg:w-96 space-y-6">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 text-center">Seleção de Assento</h3>
          <SeatMap
            assentos={MOCK_SEATS}
            onSelect={setSelectedSeat}
            selectedSeat={selectedSeat}
          />
        </div>

        <div className="bg-slate-800 dark:bg-slate-950 text-white p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-300">Valor Assento</span>
            <span className="font-bold">R$ 180,00</span>
          </div>
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-700">
            <span className="text-slate-300">Assento Selecionado</span>
            <span className="font-bold text-blue-400">{selectedSeat || '-'}</span>
          </div>
          {selectedCliente && (
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-700">
              <span className="text-slate-300">Passageiro</span>
              <span className="font-bold text-green-400">{selectedCliente.nome}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-xl font-bold mb-6">
            <span>Total</span>
            <span>R$ {selectedSeat ? '180,00' : '0,00'}</span>
          </div>

          <button
            disabled={!selectedSeat || (!selectedCliente && modoCliente === 'SELECIONAR')}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <CreditCard size={20} />
            Confirmar Reserva
          </button>
        </div>
      </div>
    </div>
  );
};