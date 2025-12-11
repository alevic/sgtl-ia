import React, { useState, useEffect } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';

// ... (existing imports)

// ... inside NovaReserva component


import { useNavigate } from 'react-router-dom';
import { IViagem, IVeiculo, ICliente, Moeda, TipoAssento, StatusReservaLabel } from '../types';
import { SeletorViagem } from '../components/Selectors/SeletorViagem';
import { SeletorPassageiro } from '../components/Selectors/SeletorPassageiro';
import { MapaAssentosReserva } from '../components/Veiculos/MapaAssentosReserva';
import { ArrowRight, ArrowLeft, Check, Users, X, Loader, CreditCard, QrCode, Link as LinkIcon, Copy } from 'lucide-react';
import { tripsService } from '../services/tripsService';
import { clientsService } from '../services/clientsService';
import { vehiclesService } from '../services/vehiclesService';
import { reservationsService } from '../services/reservationsService';
import { paymentService, IPaymentResponse } from '../services/paymentService';
import { transactionsService } from '../services/transactionsService';
import { TipoTransacao, StatusTransacao, CategoriaReceita, FormaPagamento } from '../types';

type Step = 1 | 2 | 3;

export const NovaReserva: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'MANUAL' | 'DIGITAL'>('MANUAL');
  const [detailedPaymentMethod, setDetailedPaymentMethod] = useState<FormaPagamento>(FormaPagamento.DINHEIRO);
  const [paymentData, setPaymentData] = useState<IPaymentResponse | null>(null);
  const [generatingPayment, setGeneratingPayment] = useState(false);

  // Partial Payment State
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [entryValue, setEntryValue] = useState(0);

  // Data Lists
  const [viagens, setViagens] = useState<IViagem[]>([]);
  const [clientes, setClientes] = useState<ICliente[]>([]);

  // Selection State
  const [viagemSelecionada, setViagemSelecionada] = useState<IViagem | null>(null);
  const [veiculo, setVeiculo] = useState<IVeiculo | null>(null);

  // New State for Multi-Passenger
  const [passageirosMap, setPassageirosMap] = useState<Record<string, { nome: string; documento: string; cliente_id?: string; email?: string; telefone?: string }>>({});
  const [assentosSelecionados, setAssentosSelecionados] = useState<{ numero: string; tipo: TipoAssento; valor: number }[]>([]);
  const [assentosOcupados, setAssentosOcupados] = useState<string[]>([]);

  // Update entry value when total changes (if not modified)
  const valorTotal = assentosSelecionados.reduce((sum, a) => sum + a.valor, 0);
  useEffect(() => {
    if (!isPartialPayment) {
      setEntryValue(valorTotal);
    }
  }, [valorTotal, isPartialPayment]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [tripsData, clientsData] = await Promise.all([
        tripsService.getAll(),
        clientsService.getAll()
      ]);
      // Filter only scheduled/confirmed trips
      const activeTrips = tripsData.filter(t =>
        t.status === 'SCHEDULED' || t.status === 'CONFIRMED' ||
        t.status === 'AGENDADA' || t.status === 'CONFIRMADA'
      );
      setViagens(activeTrips);
      setClientes(clientsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // When trip is selected, fetch vehicle and existing reservations
  useEffect(() => {
    if (viagemSelecionada) {
      loadTripDetails(viagemSelecionada);
    } else {
      setVeiculo(null);
      setAssentosOcupados([]);
      setAssentosSelecionados([]);
      setPassageirosMap({});
    }
  }, [viagemSelecionada]);

  // ... (loadTripDetails - unchanged) ...

  const loadTripDetails = async (viagem: IViagem) => {
    try {
      setLoading(true);

      // 1. Fetch Vehicle (for seat map)
      if (viagem.vehicle_id) {
        const veiculoData = await vehiclesService.getById(viagem.vehicle_id);

        // Fetch seats if it's a bus
        if (veiculoData.tipo === 'ONIBUS') {
          try {
            const seatsData = await vehiclesService.getSeats(viagem.vehicle_id);
            veiculoData.mapa_assentos = seatsData;
          } catch (err) {
            console.error('Erro ao carregar assentos:', err);
          }
        }

        setVeiculo(veiculoData);
      }

      // 2. Fetch Reservations (for occupied seats)
      const reservations = await reservationsService.getAll({ status: 'CONFIRMED' });
      const tripReservations = reservations.filter((r: any) => r.trip_id === viagem.id && r.status !== 'CANCELLED');
      const occupied = tripReservations.map((r: any) => r.seat_number || r.assento_numero).filter(Boolean);
      setAssentosOcupados(occupied);

    } catch (error) {
      console.error('Erro ao carregar detalhes da viagem:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleSelecionarAssento = (assento: { numero: string; tipo: TipoAssento; valor: number }) => {
    setAssentosSelecionados(prev => {
      const exists = prev.find(a => a.numero === assento.numero);
      if (exists) {
        // Remove
        const newSelection = prev.filter(a => a.numero !== assento.numero);
        // Also remove passenger data
        const newMap = { ...passageirosMap };
        delete newMap[assento.numero];
        setPassageirosMap(newMap);
        return newSelection;
      } else {
        // Add
        return [...prev, assento];
      }
    });
  };

  const handlePassengerChange = (seatNumber: string, field: string, value: string) => {
    setPassageirosMap(prev => ({
      ...prev,
      [seatNumber]: {
        ...prev[seatNumber],
        [field]: value
      }
    }));
  };

  const handleSelectClientForSeat = (seatNumber: string, client: ICliente | null) => {
    if (!client) return;

    setPassageirosMap(prev => ({
      ...prev,
      [seatNumber]: {
        nome: client.nome,
        documento: client.documento_numero,
        cliente_id: client.id,
        email: client.email,
        telefone: client.telefone
      }
    }));
  };

  // const valorTotal ... (Moved Up)
  const podeAvancarStep1 = viagemSelecionada !== null;
  const podeAvancarStep2 = assentosSelecionados.length > 0 && assentosSelecionados.every(a => {
    const p = passageirosMap[a.numero];
    return p && p.nome && p.documento; // Validate required fields
  });

  const handleConfirmarReserva = async () => {
    if (!viagemSelecionada) return;

    try {
      setSaving(true);

      // LOGIC:
      // If paymentMethod is DIGITAL -> Status 'PENDING'
      // If paymentMethod is MANUAL -> Status 'CONFIRMED'
      const status = paymentMethod === 'DIGITAL' ? 'PENDING' : 'CONFIRMED';

      // Create a reservation for each passenger
      const promises = assentosSelecionados.map(async (seat) => {
        const p = passageirosMap[seat.numero];

        // Find seat ID if possible
        // @ts-ignore
        const seatObj = veiculo?.mapa_assentos?.find((s: any) => s.numero === seat.numero);

        // Distribute Entry Value proportionally if partial
        // (Simplification: If partial, we just set 'valor_pago' on the reservation record correctly if we were creating a single group reservation. 
        // Since we are creating individual reservations per seat, we should ideally split the 'entryValue'. 
        // For now, let's assume 'entryValue' is for the whole group, but we are creating individual records.
        // Let's calculate the ratio of this seat's price to the total.
        const ratio = seat.valor / valorTotal;
        const seatPaidValue = isPartialPayment ? (entryValue * ratio) : seat.valor;


        return reservationsService.create({
          trip_id: viagemSelecionada.id,
          seat_id: seatObj?.id,
          seat_number: seat.numero,
          passenger_name: p.nome,
          passenger_document: p.documento,
          passenger_email: p.email,
          passenger_phone: p.telefone,
          price: seat.valor,
          valor_pago: seatPaidValue, // New field usage
          status: status, // PENDING or CONFIRMED
          client_id: p.cliente_id,
          notes: `Reserva ${paymentMethod} - ${isPartialPayment ? 'SINAL/PARCIAL' : 'INTEGRAL'}`
        });
      });

      const createdReservations = await Promise.all(promises);

      // INTEGRATION: Create Financial Transaction if there is a payment
      // Only for MANUAL (Paid now) or if Partial Payment (Sinal) is verified
      if (entryValue > 0 && paymentMethod === 'MANUAL') {
        try {
          console.log('Attempting to create financial transaction...');
          const firstReserva = createdReservations[0];
          const remainingValue = valorTotal - entryValue;

          if (isPartialPayment && remainingValue > 0) {
            // 1. ENTRY (Sinal) - PAID
            const entryPayload = {
              tipo: TipoTransacao.RECEITA,
              descricao: `Reserva (Entrada) - ${passageirosMap[assentosSelecionados[0].numero].nome} - ${assentosSelecionados.length} assentos`,
              valor: entryValue,
              moeda: Moeda.BRL,
              data_emissao: new Date().toISOString(),
              data_vencimento: new Date().toISOString(),
              data_pagamento: new Date().toISOString(),
              status: StatusTransacao.PAGA,
              forma_pagamento: detailedPaymentMethod,
              categoria_receita: CategoriaReceita.VENDA_PASSAGEM,
              reserva_id: firstReserva.id,
              criado_por: 'Sistema'
            };
            console.log('Entry Transaction Payload:', entryPayload);
            await transactionsService.create(entryPayload);

            // 2. REMAINING (Restante) - PENDING
            const remainingPayload = {
              tipo: TipoTransacao.RECEITA,
              descricao: `Reserva (Restante) - ${passageirosMap[assentosSelecionados[0].numero].nome} - ${assentosSelecionados.length} assentos`,
              valor: remainingValue,
              moeda: Moeda.BRL,
              data_emissao: new Date().toISOString(),
              data_vencimento: viagemSelecionada.departure_date ? new Date(viagemSelecionada.departure_date).toISOString() : new Date().toISOString(), // Due on trip date
              status: StatusTransacao.PENDENTE, // Pending
              // No payment date or method yet
              categoria_receita: CategoriaReceita.VENDA_PASSAGEM,
              reserva_id: firstReserva.id,
              criado_por: 'Sistema'
            };
            console.log('Remaining Transaction Payload:', remainingPayload);
            await transactionsService.create(remainingPayload);

            console.log('Transações (Entrada + Restante) criadas com sucesso');

          } else {
            // FULL PAYMENT
            const payload = {
              tipo: TipoTransacao.RECEITA,
              descricao: `Reserva (Integral) - ${passageirosMap[assentosSelecionados[0].numero].nome} - ${assentosSelecionados.length} assentos`,
              valor: entryValue,
              moeda: Moeda.BRL,
              data_emissao: new Date().toISOString(),
              data_vencimento: new Date().toISOString(),
              data_pagamento: new Date().toISOString(),
              status: StatusTransacao.PAGA,
              forma_pagamento: detailedPaymentMethod,
              categoria_receita: CategoriaReceita.VENDA_PASSAGEM,
              reserva_id: firstReserva.id,
              criado_por: 'Sistema'
            };
            console.log('Full Transaction Payload:', payload);
            await transactionsService.create(payload);
            console.log('Transação integral criada com sucesso');
          }

        } catch (finError) {
          console.error('Erro ao criar transação financeira:', finError);
          alert('Atenção: A reserva foi criada, mas houve um erro ao registrar a transação financeira. Verifique o painel financeiro.');
        }
      }

      if (status === 'PENDING') {
        alert(`Reservas criadas como ${StatusReservaLabel.PENDING}. Aguardando confirmação do pagamento via sistema (N8N).`);
      } else {
        alert(`Reservas ${StatusReservaLabel.CONFIRMED} com sucesso!`);
      }
      navigate('/admin/reservas');
    } catch (error) {
      console.error('Erro ao salvar reservas:', error);
      alert('Erro ao salvar reservas. Verifique se os assentos já não foram ocupados.');
    } finally {
      setSaving(false);
    }
  };

  const getClienteNome = (cliente_id: string): string => {
    const cliente = clientes.find(c => c.id === cliente_id);
    return cliente?.nome || 'Cliente não encontrado';
  };

  const handleGeneratePayment = async (type: 'PIX' | 'LINK') => {
    try {
      setGeneratingPayment(true);
      // Pega o primeiro passageiro como "pagador" principal por enquanto
      const firstSeat = assentosSelecionados[0];
      const pagador = passageirosMap[firstSeat.numero];

      // Use 'entryValue' (Sinal) instead of 'valorTotal'
      const response = await paymentService.createPayment({
        amount: entryValue,
        type: type,
        customer: {
          name: pagador.nome,
          cpf: pagador.documento.replace(/\D/g, ''), // Numérico
          email: pagador.email,
          phone: pagador.telefone
        },
        items: [{
          description: `Reserva - Sinal/Entrada (${assentosSelecionados.length} assentos)`,
          amount: entryValue,
          quantity: 1
        }]
      });

      if (response.success) {
        setPaymentData(response);
      } else {
        alert('Erro ao gerar pagamento: ' + response.message);
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao comunicar com o serviço de pagamento.');
    } finally {
      setGeneratingPayment(false);
    }
  };

  if (loading && !viagemSelecionada) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/reservas')}
          className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Nova Reserva</h1>
          <p className="text-slate-500 dark:text-slate-400">Crie uma reserva para múltiplos passageiros</p>
        </div>
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
              viagens={viagens}
              viagemSelecionada={viagemSelecionada}
              onChange={setViagemSelecionada}
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
        <ErrorBoundary>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Mapa de Assentos (Left) */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 h-fit sticky top-6">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-3">Mapa de Assentos</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Selecione os assentos desejados no mapa abaixo.
              </p>
              {veiculo ? (
                loading ? (
                  <div className="flex justify-center p-8"><Loader className="animate-spin" /></div>
                ) : (
                  <MapaAssentosReserva
                    veiculo={veiculo}
                    assentosReservados={assentosOcupados}
                    assentosSelecionados={assentosSelecionados}
                    onSelecionarAssento={handleSelecionarAssento}
                    precos={viagemSelecionada ? {
                      'CONVENCIONAL': Number(viagemSelecionada.price_conventional || 0),
                      'EXECUTIVO': Number(viagemSelecionada.price_executive || 0),
                      'SEMI_LEITO': Number(viagemSelecionada.price_semi_sleeper || 0),
                      'LEITO': Number(viagemSelecionada.price_sleeper || 0),
                      'CAMA': Number(viagemSelecionada.price_bed || 0),
                      'CAMA_MASTER': Number(viagemSelecionada.price_master_bed || 0),
                      ... (viagemSelecionada.precos_por_tipo || {})
                    } : undefined}
                  />
                )
              ) : (
                <p className="text-slate-500 dark:text-slate-400">Selecione uma viagem primeiro</p>
              )}
            </div>

            {/* Lista de Passageiros (Right) */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-3">Dados dos Passageiros</h3>
              {assentosSelecionados.length === 0 ? (
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-8 text-center border border-slate-200 dark:border-slate-700 border-dashed">
                  <Users size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                  <p className="text-slate-500 dark:text-slate-400 mb-2">
                    Nenhum assento selecionado
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Selecione assentos no mapa para preencher os dados dos passageiros.
                  </p>
                </div>
              ) : (
                assentosSelecionados.map((seat) => (
                  <div key={seat.numero} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 animate-in slide-in-from-left-2">
                    <div className="flex justify-between items-start mb-4 border-b border-slate-100 dark:border-slate-700 pb-3">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Assento</span>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{seat.numero}</span>
                          <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300">
                            {seat.tipo.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Valor</span>
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                          R$ {seat.valor.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {/* Search Client */}
                      <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Buscar Cliente Existente</label>
                        <SeletorPassageiro
                          clientes={clientes}
                          clienteSelecionado={null}
                          onSelecionarCliente={(cliente) => handleSelectClientForSeat(seat.numero, cliente)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo *</label>
                          <input
                            type="text"
                            value={passageirosMap[seat.numero]?.nome || ''}
                            onChange={(e) => handlePassengerChange(seat.numero, 'nome', e.target.value)}
                            className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                            placeholder="Nome do passageiro"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Documento (CPF/RG) *</label>
                          <input
                            type="text"
                            value={passageirosMap[seat.numero]?.documento || ''}
                            onChange={(e) => handlePassengerChange(seat.numero, 'documento', e.target.value)}
                            className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                            placeholder="000.000.000-00"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Botões de Navegação */}
            <div className="col-span-1 lg:col-span-12 flex justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <ArrowLeft size={18} />
                Voltar
              </button>
              <div className="flex items-center gap-4">
                <div className="text-right mr-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total Estimado</p>
                  <p className="text-xl font-bold text-slate-800 dark:text-white">R$ {valorTotal.toFixed(2)}</p>
                </div>
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
          </div>
        </ErrorBoundary>
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
                  <p className="font-semibold text-slate-800 dark:text-white">{viagemSelecionada.titulo || viagemSelecionada.route_name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Origem</p>
                    <p className="font-semibold text-slate-800 dark:text-white">{viagemSelecionada.origem || viagemSelecionada.origin_city}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Destino</p>
                    <p className="font-semibold text-slate-800 dark:text-white">{viagemSelecionada.destino || viagemSelecionada.destination_city}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Data de Partida</p>
                    <p className="font-semibold text-slate-800 dark:text-white">
                      {(viagemSelecionada.departure_date || viagemSelecionada.data_partida)
                        ? new Date(viagemSelecionada.departure_date || viagemSelecionada.data_partida!).toLocaleString('pt-BR')
                        : 'Data não definida'}
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
              Passageiros ({assentosSelecionados.length})
            </h3>
            <div className="space-y-3">
              {assentosSelecionados.map((seat, index) => {
                const p = passageirosMap[seat.numero];
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-white">
                        {p?.nome || 'Passageiro sem nome'}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Assento {seat.numero} • {seat.tipo.replace('_', ' ')} • Doc: {p?.documento}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      R$ {seat.valor.toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Total e Pagamento */}
          <div className="bg-slate-800 dark:bg-slate-950 text-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <span className="text-lg text-slate-300">Valor Total</span>
              <span className="text-3xl font-bold">R$ {valorTotal.toFixed(2)}</span>
            </div>

            {/* Payment Method Selector */}
            <div className="mb-6 bg-slate-700/50 p-1 rounded-lg flex">
              <button
                onClick={() => setPaymentMethod('MANUAL')}
                className={`flex-1 py-2 rounded-md transition-all ${paymentMethod === 'MANUAL' ? 'bg-slate-600 shadow-sm font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Manual / Presencial
              </button>
              <button
                onClick={() => setPaymentMethod('DIGITAL')}
                className={`flex-1 py-2 rounded-md transition-all ${paymentMethod === 'DIGITAL' ? 'bg-blue-600 shadow-sm font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Digital (Pix/Link)
              </button>
            </div>

            {/* Manual Payment Detail Selector */}
            {paymentMethod === 'MANUAL' && (
              <div className="mb-6 animate-in fade-in">
                <label className="block text-sm text-slate-400 mb-2">Forma de Pagamento</label>
                <select
                  value={detailedPaymentMethod}
                  onChange={(e) => setDetailedPaymentMethod(e.target.value as FormaPagamento)}
                  className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="DINHEIRO">Dinheiro</option>
                  <option value="PIX">Pix (Presencial)</option>
                  <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                  <option value="CARTAO_DEBITO">Cartão de Débito</option>
                </select>
              </div>
            )}

            {/* Partial Payment Toggle */}
            <div className="mb-6 flex items-center gap-3 bg-slate-700/30 p-3 rounded-lg border border-slate-600/50">
              <input
                type="checkbox"
                id="partialPayment"
                checked={isPartialPayment}
                onChange={(e) => {
                  setIsPartialPayment(e.target.checked);
                  if (e.target.checked) {
                    setEntryValue(valorTotal * 0.20); // Default 20%
                  } else {
                    setEntryValue(valorTotal);
                  }
                }}
                className="w-5 h-5 rounded border-slate-500 bg-slate-800 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="partialPayment" className="flex-1 cursor-pointer select-none">
                <span className="block font-medium text-white">Pagamento Parcial (Sinal)</span>
                <span className="text-xs text-slate-400">Pagar apenas uma entrada agora e o restante no embarque.</span>
              </label>
            </div>

            {isPartialPayment && (
              <div className="mb-6 grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                <div className="bg-slate-700/50 p-3 rounded-lg border border-slate-600">
                  <label className="block text-xs text-slate-400 mb-1">Valor de Entrada (Sinal)</label>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">R$</span>
                    <input
                      type="number"
                      value={entryValue}
                      onChange={(e) => setEntryValue(Number(e.target.value))}
                      className="bg-transparent border-none text-xl font-bold text-white w-full focus:ring-0 p-0"
                      min="0"
                      max={valorTotal}
                    />
                  </div>
                </div>
                <div className="bg-slate-700/50 p-3 rounded-lg border border-slate-600 opacity-70">
                  <label className="block text-xs text-slate-400 mb-1">Restante no Embarque</label>
                  <p className="text-xl font-bold text-slate-300">
                    R$ {(valorTotal - entryValue).toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            {paymentMethod === 'DIGITAL' ? (
              <div className="bg-slate-700/50 rounded-lg p-4 mb-6 animate-in fade-in">
                {!paymentData ? (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-300">
                      Gere uma cobrança digital integrada (Asaas). O cliente receberá o link ou você pode apresentar o QR Code agora.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleGeneratePayment('PIX')}
                        disabled={generatingPayment}
                        className="py-3 bg-teal-600 hover:bg-teal-500 rounded-lg font-semibold flex flex-col items-center justify-center gap-1 transition-colors"
                      >
                        {generatingPayment ? <Loader size={20} className="animate-spin" /> : <QrCode size={24} />}
                        <span className="text-sm">Gerar Pix Agora</span>
                      </button>
                      <button
                        onClick={() => handleGeneratePayment('LINK')}
                        disabled={generatingPayment}
                        className="py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold flex flex-col items-center justify-center gap-1 transition-colors"
                      >
                        {generatingPayment ? <Loader size={20} className="animate-spin" /> : <LinkIcon size={24} />}
                        <span className="text-sm">Link WhatsApp</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-green-400">Cobrança Gerada!</h4>
                      <button onClick={() => setPaymentData(null)} className="text-slate-400 hover:text-white">
                        <X size={18} />
                      </button>
                    </div>

                    {paymentData.qrCode && (
                      <div className="bg-white p-2 rounded-lg w-48 h-48 mx-auto flex items-center justify-center">
                        <img src={paymentData.qrCode} alt="QR Code Pix" className="max-w-full max-h-full" />
                      </div>
                    )}

                    {paymentData.copyPasteCode && (
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Copia e Cola</p>
                        <div className="flex gap-2">
                          <input
                            readOnly
                            value={paymentData.copyPasteCode}
                            className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-slate-300"
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(paymentData.copyPasteCode || '');
                              alert('Copiado!');
                            }}
                            className="p-1 bg-slate-600 rounded hover:bg-slate-500"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </div>
                    )}

                    {paymentData.paymentLink && (
                      <div className="bg-blue-900/40 border border-blue-500/30 rounded-lg p-3">
                        <p className="text-sm text-blue-200 mb-1">Link de Pagamento</p>
                        <a href={paymentData.paymentLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline text-sm break-all">
                          {paymentData.paymentLink}
                        </a>
                        <div className="mt-2">
                          <a
                            href={`https://wa.me/?text=${encodeURIComponent(`Olá! Segue o link para pagamento da sua reserva: ${paymentData.paymentLink}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full text-center py-2 bg-green-600 hover:bg-green-500 rounded text-sm font-semibold transition-colors"
                          >
                            Enviar no WhatsApp
                          </a>
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-slate-400 text-center">
                      Assim que o pagamento for confirmado, clique em "Confirmar Reserva" abaixo.
                    </p>
                  </div>
                )}
              </div>
            ) : null}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmarReserva}
                disabled={saving}
                className="flex-2 px-8 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader size={20} className="animate-spin" /> : <CreditCard size={20} />}
                {saving ? 'Confirmando...' : 'Confirmar Reserva'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};