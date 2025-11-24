import React, { useState } from 'react';
import { IViagem, IVeiculo, ICliente, IPassageiroReserva, Moeda, TipoAssento, TipoDocumento } from '../types';
import { SeletorViagem } from '../components/Reservas/SeletorViagem';
import { SeletorPassageiro } from '../components/Reservas/SeletorPassageiro';
import { MapaAssentosReserva } from '../components/Reservas/MapaAssentosReserva';
import { MOCK_VIAGENS } from './Viagens';
import { Calendar, MapPin, CreditCard, ArrowRight, ArrowLeft, Check, Users, X } from 'lucide-react';

// Mock data
const MOCK_VEICULOS: IVeiculo[] = [
  {
    id: 'V001',
    placa: 'ABC-1234',
    modelo: 'Mercedes-Benz O500',
    tipo: 'ONIBUS',
    status: 'ATIVO' as any,
    proxima_revisao_km: 150000,
    capacidade_passageiros: 40,
    mapa_configurado: true,
    precos_assentos: {
      [TipoAssento.CONVENCIONAL]: 150.00,
      [TipoAssento.EXECUTIVO]: 220.00,
      [TipoAssento.SEMI_LEITO]: 280.00,
      [TipoAssento.LEITO]: 350.00,
      [TipoAssento.CAMA]: 420.00,
      [TipoAssento.CAMA_MASTER]: 500.00
    },
    mapa_assentos: Array.from({ length: 40 }, (_, i) => ({
      id: `seat-${i + 1}`,
      numero: `${i + 1}`,
      andar: 1 as 1 | 2,
      posicao_x: i % 4,
      posicao_y: Math.floor(i / 4),
      tipo: i < 10 ? TipoAssento.EXECUTIVO : TipoAssento.CONVENCIONAL,
      status: 'LIVRE' as any
    }))
  }
];

const MOCK_CLIENTES: ICliente[] = [
  {
    id: '1',
    nome: 'Maria Oliveira',
    email: 'maria@email.com',
    saldo_creditos: 100,
    historico_viagens: 5,
    documento_tipo: TipoDocumento.CPF,
    documento_numero: '123.456.789-00',
    nacionalidade: 'Brasileira',
    data_cadastro: '2023-01-15',
    pais: 'Brasil',
    segmento: 'REGULAR',
    tags: ['frequente', 'preferencial'],
    valor_total_gasto: 1500.00
  },
  {
    id: '2',
    nome: 'João Santos',
    email: 'joao@email.com',
    saldo_creditos: 50,
    historico_viagens: 2,
    documento_tipo: TipoDocumento.CPF,
    documento_numero: '987.654.321-00',
    nacionalidade: 'Brasileira',
    data_cadastro: '2023-06-20',
    pais: 'Brasil',
    segmento: 'NOVO',
    tags: [],
    valor_total_gasto: 360.00
  },
  {
    id: '3',
    nome: 'Ana Paula',
    email: 'ana@email.com',
    saldo_creditos: 75,
    historico_viagens: 8,
    documento_tipo: TipoDocumento.CPF,
    documento_numero: '456.789.123-00',
    nacionalidade: 'Brasileira',
    data_cadastro: '2022-11-10',
    pais: 'Brasil',
    segmento: 'VIP',
    tags: ['vip', 'executivo'],
    valor_total_gasto: 2400.00
  }
];

type Step = 1 | 2 | 3;

export const NovaReserva: React.FC = () => {
  const [step, setStep] = useState<Step>(1);
  const [viagemSelecionada, setViagemSelecionada] = useState<IViagem | null>(null);
  const [veiculo, setVeiculo] = useState<IVeiculo | null>(null);
  const [passageiros, setPassageiros] = useState<Omit<IPassageiroReserva, 'id'>[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<ICliente | null>(null);
  const [assentoSelecionado, setAssentoSelecionado] = useState<{ numero: string; tipo: TipoAssento; valor: number } | null>(null);

  // Assentos já reservados (mock - viriam do backend)
  const assentosReservados = ['5', '6', '15', '16'];

  const handleSelecionarViagem = (viagem: IViagem | null) => {
    setViagemSelecionada(viagem);
    if (viagem) {
      // Buscar veículo correspondente (mock)
      const veic = MOCK_VEICULOS.find(v => v.id === viagem.veiculo_id) || MOCK_VEICULOS[0];
      setVeiculo(veic);
    } else {
      setVeiculo(null);
    }
  };

  const handleAdicionarPassageiro = (passageiro: Omit<IPassageiroReserva, 'id'>) => {
    setPassageiros([...passageiros, passageiro]);
    // Adicionar assento aos reservados
    assentosReservados.push(passageiro.assento_numero);
    // Limpar seleções para permitir adicionar outro passageiro
    setClienteSelecionado(null);
    setAssentoSelecionado(null);
  };

  const handleRemoverPassageiro = (index: number) => {
    const novoPassageiros = passageiros.filter((_, i) => i !== index);
    setPassageiros(novoPassageiros);
  };

  const handleSelecionarAssento = (assento: { numero: string; tipo: TipoAssento; valor: number } | null) => {
    setAssentoSelecionado(assento);

    // Se tem cliente e assento selecionados, adicionar automaticamente
    if (clienteSelecionado && assento) {
      handleAdicionarPassageiro({
        cliente_id: clienteSelecionado.id,
        assento_numero: assento.numero,
        tipo_assento: assento.tipo,
        valor: assento.valor
      });
    }
  };

  const valorTotal = passageiros.reduce((sum, p) => sum + p.valor, 0);

  const podeAvancarStep1 = viagemSelecionada !== null;
  const podeAvancarStep2 = passageiros.length > 0;

  const handleConfirmarReserva = () => {
    const reserva = {
      id: `RES-${Date.now()}`,
      codigo: `${Date.now().toString().slice(-6)}`,
      viagem_id: viagemSelecionada!.id,
      responsavel_id: passageiros[0].cliente_id,
      passageiros: passageiros.map((p, i) => ({
        ...p,
        id: `PASS-${i + 1}`
      })),
      data_reserva: new Date().toISOString(),
      status: 'PENDENTE' as const,
      valor_total: valorTotal,
      moeda: viagemSelecionada?.moeda_base || Moeda.BRL,
      forma_pagamento: undefined
    };

    console.log('Reserva criada:', reserva);
    alert(`Reserva confirmada! Código: ${reserva.codigo}\nValor Total: R$ ${valorTotal.toFixed(2)}`);

    // Reset
    setStep(1);
    setViagemSelecionada(null);
    setPassageiros([]);
    setClienteSelecionado(null);
    setAssentoSelecionado(null);
  };

  const getClienteNome = (cliente_id: string): string => {
    const cliente = MOCK_CLIENTES.find(c => c.id === cliente_id);
    return cliente?.nome || 'Cliente não encontrado';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Nova Reserva</h1>
        <p className="text-slate-500 dark:text-slate-400">Crie uma reserva para múltiplos passageiros</p>
      </div>

      {/* Stepper */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
        <div className="flex items-center justify-between">
          {/* Step 1 */}
          <div className="flex items-center gap-3 flex-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 1
              ? 'bg-blue-600 text-white'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
              }`}>
              {step > 1 ? <Check size={20} /> : '1'}
            </div>
            <div>
              <p className={`font-semibold ${step >= 1 ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                Selecionar Viagem
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Escolha a viagem</p>
            </div>
          </div>

          <ArrowRight size={20} className="text-slate-300 dark:text-slate-600" />

          {/* Step 2 */}
          <div className="flex items-center gap-3 flex-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 2
              ? 'bg-blue-600 text-white'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
              }`}>
              {step > 2 ? <Check size={20} /> : '2'}
            </div>
            <div>
              <p className={`font-semibold ${step >= 2 ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                Passageiros & Assentos
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Adicione passageiros</p>
            </div>
          </div>

          <ArrowRight size={20} className="text-slate-300 dark:text-slate-600" />

          {/* Step 3 */}
          <div className="flex items-center gap-3 flex-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 3
              ? 'bg-blue-600 text-white'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
              }`}>
              3
            </div>
            <div>
              <p className={`font-semibold ${step >= 3 ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                Revisão & Pagamento
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Confirme a reserva</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4">Selecione uma viagem</h3>
            <SeletorViagem
              viagens={MOCK_VIAGENS}
              viagemSelecionada={viagemSelecionada}
              onChange={handleSelecionarViagem}
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={!podeAvancarStep1}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              Próximo
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          {/* Seleção de Passageiro e Assento */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Seletor de Passageiro */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
              <SeletorPassageiro
                clientes={MOCK_CLIENTES}
                clienteSelecionado={clienteSelecionado}
                onSelecionarCliente={setClienteSelecionado}
              />
            </div>

            {/* Mapa de Assentos */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-3">Seleção de Assento</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                {clienteSelecionado
                  ? `Selecione um assento para ${clienteSelecionado.nome}`
                  : 'Selecione um passageiro primeiro'}
              </p>
              {veiculo ? (
                <MapaAssentosReserva
                  veiculo={veiculo}
                  assentosReservados={[...assentosReservados, ...passageiros.map(p => p.assento_numero)]}
                  assentoSelecionado={assentoSelecionado}
                  onSelecionarAssento={handleSelecionarAssento}
                />
              ) : (
                <p className="text-slate-500 dark:text-slate-400">Selecione uma viagem primeiro</p>
              )}
            </div>
          </div>

          {/* Passageiros Confirmados */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Users size={20} />
                Passageiros Confirmados ({passageiros.length})
              </h3>
              {passageiros.length > 0 && (
                <div className="text-right">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Valor Total</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    R$ {valorTotal.toFixed(2)}
                  </p>
                </div>
              )}
            </div>

            {passageiros.length === 0 ? (
              <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-8 text-center border border-slate-200 dark:border-slate-700 border-dashed">
                <Users size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                <p className="text-slate-500 dark:text-slate-400 mb-2">
                  Nenhum passageiro confirmado
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Selecione um passageiro e um assento para adicionar
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {passageiros.map((passageiro, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check size={20} className="text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800 dark:text-white">
                          {getClienteNome(passageiro.cliente_id)}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mt-1">
                          <span>
                            <strong>Assento:</strong> {passageiro.assento_numero}
                          </span>
                          <span>
                            <strong>Tipo:</strong> {passageiro.tipo_assento.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                          R$ {passageiro.valor.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoverPassageiro(index)}
                      className="ml-3 p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Remover passageiro"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botões de Navegação */}
          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              Voltar
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!podeAvancarStep2}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              Próximo
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          {/* Resumo da Viagem */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4">Dados da Viagem</h3>
            {viagemSelecionada && (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Título</p>
                  <p className="font-semibold text-slate-800 dark:text-white">{viagemSelecionada.titulo}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Origem</p>
                    <p className="font-semibold text-slate-800 dark:text-white">{viagemSelecionada.origem}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Destino</p>
                    <p className="font-semibold text-slate-800 dark:text-white">{viagemSelecionada.destino}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Data de Partida</p>
                    <p className="font-semibold text-slate-800 dark:text-white">
                      {new Date(viagemSelecionada.data_partida).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Status</p>
                    <p className="font-semibold text-slate-800 dark:text-white">{viagemSelecionada.status}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Lista de Passageiros */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
              <Users size={20} />
              Passageiros ({passageiros.length})
            </h3>
            <div className="space-y-3">
              {passageiros.map((passageiro, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg"
                >
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-white">
                      {getClienteNome(passageiro.cliente_id)}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Assento {passageiro.assento_numero} • {passageiro.tipo_assento.replace('_', ' ')}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    R$ {passageiro.valor.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Total e Pagamento */}
          <div className="bg-slate-800 dark:bg-slate-950 text-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <span className="text-lg text-slate-300">Valor Total</span>
              <span className="text-3xl font-bold">R$ {valorTotal.toFixed(2)}</span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmarReserva}
                className="flex-2 px-8 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <CreditCard size={20} />
                Confirmar Reserva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};