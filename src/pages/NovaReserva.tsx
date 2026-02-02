import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { PageHeader } from '../components/Layout/PageHeader';
import { FormSection } from '../components/Layout/FormSection';
import { IViagem, IVeiculo, ICliente, Moeda, TipoAssento, ReservationStatus, ReservationStatusLabel, TripStatus, TripStatusLabel } from '@/types';
import { SeletorViagem } from '../components/Selectors/SeletorViagem';
import { SeletorPassageiro } from '../components/Selectors/SeletorPassageiro';
import { ModalNovoCliente } from '../components/Selectors/ModalNovoCliente';
import { MapaAssentosReserva } from '../components/Veiculos/MapaAssentosReserva';
import { ArrowRight, ArrowLeft, Check, Users, X, Loader, CreditCard, QrCode, Link as LinkIcon, Copy, Wallet, RefreshCw } from 'lucide-react';
import { tripsService } from '../services/tripsService';
import { clientsService } from '../services/clientsService';
import { vehiclesService } from '../services/vehiclesService';
import { reservationsService } from '../services/reservationsService';
import { paymentService, IPaymentResponse } from '../services/paymentService';
import { transactionsService } from '../services/transactionsService';
import { TipoTransacao, StatusTransacao, CategoriaReceita, FormaPagamento } from '@/types';

const TRIP_STATUS_LABELS: Record<string, string> = {
  [TripStatus.SCHEDULED]: TripStatusLabel[TripStatus.SCHEDULED],
  [TripStatus.BOARDING]: TripStatusLabel[TripStatus.BOARDING],
  [TripStatus.IN_TRANSIT]: TripStatusLabel[TripStatus.IN_TRANSIT],
  [TripStatus.COMPLETED]: TripStatusLabel[TripStatus.COMPLETED],
  [TripStatus.CANCELLED]: TripStatusLabel[TripStatus.CANCELLED],
  [TripStatus.DELAYED]: TripStatusLabel[TripStatus.DELAYED],
  // Legacy
  AGENDADA: TripStatusLabel[TripStatus.SCHEDULED],
  CONFIRMED: TripStatusLabel[TripStatus.SCHEDULED],
  CONFIRMADA: TripStatusLabel[TripStatus.SCHEDULED],
  EM_CURSO: TripStatusLabel[TripStatus.IN_TRANSIT],
  FINALIZADA: TripStatusLabel[TripStatus.COMPLETED],
  CANCELADA: TripStatusLabel[TripStatus.CANCELLED],
};

type Step = 1 | 2 | 3;

export const NovaReserva: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'MANUAL' | 'DIGITAL'>('MANUAL');
  const [detailedPaymentMethod, setDetailedPaymentMethod] = useState<FormaPagamento>(FormaPagamento.CASH);
  const [paymentData, setPaymentData] = useState<IPaymentResponse | null>(null);
  const [generatingPayment, setGeneratingPayment] = useState(false);

  // Partial Payment State
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [entryValue, setEntryValue] = useState(0);

  // Credit Usage State
  const [payerClient, setPayerClient] = useState<ICliente | null>(null);
  const [useCredits, setUseCredits] = useState(false);
  const [creditsToUse, setCreditsToUse] = useState(0);

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

  // Modal State
  const [isModalNovoClienteOpen, setIsModalNovoClienteOpen] = useState(false);
  const [targetSeatForNewClient, setTargetSeatForNewClient] = useState<string | null>(null);

  const handleClientCreated = (newClient: ICliente) => {
    setClientes(prev => [...prev, newClient]);
    if (targetSeatForNewClient) {
      handleSelectClientForSeat(targetSeatForNewClient, newClient);
    }
    setTargetSeatForNewClient(null);
  };

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
        t.status === TripStatus.SCHEDULED || t.status === TripStatus.BOARDING ||
        (t.status as any) === 'AGENDADA' || (t.status as any) === 'CONFIRMADA'
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

  // Credit Logic Effect (Moved from conditional render)
  useEffect(() => {
    if (step === 3) {
      const firstSeat = assentosSelecionados[0];
      // Safety check if seats exist
      if (firstSeat) {
        const p = passageirosMap[firstSeat.numero];
        if (p?.cliente_id && (!payerClient || payerClient.id !== p.cliente_id)) {
          clientsService.getById(p.cliente_id).then(c => setPayerClient(c));
        }
      }
    }
  }, [step, assentosSelecionados, passageirosMap, payerClient]);

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
      // We want ALL active reservations (CONFIRMED, PENDING, etc) to block seats
      const reservations = await reservationsService.getAll({ status: 'TODOS' });
      const tripReservations = reservations.filter((r: any) => r.trip_id === viagem.id && r.status !== ReservationStatus.CANCELLED && r.status !== 'CANCELADA');
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
        documento: client.documento,
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
    return p && p.nome && p.documento && p.boarding_point && p.dropoff_point; // Validate required fields including points
  });

  const handleConfirmarReserva = async () => {
    if (!viagemSelecionada) return;

    try {
      setSaving(true);

      // LOGIC:
      // If paymentMethod is DIGITAL -> Status 'PENDING'
      // If paymentMethod is MANUAL -> Status 'CONFIRMED'
      const status = paymentMethod === 'DIGITAL' ? ReservationStatus.PENDING : ReservationStatus.CONFIRMED;

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
          valor_pago: paymentMethod === 'DIGITAL' ? 0 : seatPaidValue, // Force 0 for Digital
          status: status, // PENDING or CONFIRMED
          forma_pagamento: paymentMethod === 'DIGITAL' ? 'DIGITAL' : detailedPaymentMethod, // Send payment method
          client_id: p.cliente_id,
          notes: `Reserva ${paymentMethod} - ${isPartialPayment ? 'SINAL/PARCIAL' : 'INTEGRAL'}`,
          boarding_point: p.boarding_point,
          dropoff_point: p.dropoff_point,
          // Add credit usage info to first reservation (or distribute? Simple: first)
          credits_used: (seat.numero === assentosSelecionados[0].numero) ? creditsToUse : 0,
          external_payment_id: paymentMethod === 'DIGITAL' ? paymentData?.paymentId : null // Send Payment ID
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
              tipo: TipoTransacao.INCOME,
              descricao: `Reserva (Entrada) - ${passageirosMap[assentosSelecionados[0].numero].nome} - ${assentosSelecionados.length} assentos`,
              valor: entryValue,
              moeda: Moeda.BRL,
              data_emissao: new Date().toISOString(),
              data_vencimento: new Date().toISOString(),
              data_pagamento: new Date().toISOString(),
              status: StatusTransacao.PAID,
              forma_pagamento: detailedPaymentMethod,
              categoria_receita: CategoriaReceita.VENDA_PASSAGEM,
              reserva_id: firstReserva.id,
              criado_por: 'Sistema'
            };
            console.log('Entry Transaction Payload:', entryPayload);

            // Only create transaction if there is a remaining value after credits
            const realMoneyEntry = entryValue - creditsToUse;
            if (realMoneyEntry > 0) {
              entryPayload.valor = realMoneyEntry;
              await transactionsService.create(entryPayload);
            } else if (creditsToUse > 0 && realMoneyEntry <= 0) {
              console.log('Entrada totalmente coberta por créditos. Nenhuma transação financeira gerada.');
            } else {
              // Fallback
              await transactionsService.create(entryPayload);
            }

            // 2. REMAINING (Restante) - PENDING
            const remainingPayload = {
              tipo: TipoTransacao.INCOME,
              descricao: `Reserva (Restante) - ${passageirosMap[assentosSelecionados[0].numero].nome} - ${assentosSelecionados.length} assentos`,
              valor: remainingValue,
              moeda: Moeda.BRL,
              data_emissao: new Date().toISOString(),
              data_vencimento: viagemSelecionada.departure_date ? new Date(viagemSelecionada.departure_date).toISOString() : new Date().toISOString(), // Due on trip date
              status: StatusTransacao.PENDING, // Pending
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
              tipo: TipoTransacao.INCOME,
              descricao: `Reserva (Integral) - ${passageirosMap[assentosSelecionados[0].numero].nome} - ${assentosSelecionados.length} assentos`,
              valor: entryValue,
              moeda: Moeda.BRL,
              data_emissao: new Date().toISOString(),
              data_vencimento: new Date().toISOString(),
              data_pagamento: new Date().toISOString(),
              status: StatusTransacao.PAID,
              forma_pagamento: detailedPaymentMethod,
              categoria_receita: CategoriaReceita.VENDA_PASSAGEM,
              reserva_id: firstReserva.id,
              criado_por: 'Sistema'
            };
            console.log('Full Transaction Payload:', payload);

            // Adjust payload for credits
            const realMoneyFull = entryValue - creditsToUse;
            if (realMoneyFull > 0) {
              payload.valor = realMoneyFull;
              await transactionsService.create(payload);
              console.log('Transação integral criada com sucesso');
            } else {
              console.log('Valor integral coberto por créditos via backend. Nenhuma transação financeira necessária.');
            }
          }

        } catch (finError) {
          console.error('Erro ao criar transação financeira:', finError);
          alert('Atenção: A reserva foi criada, mas houve um erro ao registrar a transação financeira. Verifique o painel financeiro.');
        }
      }

      if (status === ReservationStatus.PENDING) {
        alert(`Reservas criadas como ${ReservationStatusLabel[ReservationStatus.PENDING]}. Aguardando confirmação do pagamento via sistema (N8N).`);
      } else {
        alert(`Reservas ${ReservationStatusLabel[ReservationStatus.CONFIRMED]} com sucesso!`);
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
    <div key="nova-reserva-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      {/* Header Executivo */}
      <PageHeader
        title="Nova Reserva"
        subtitle="Gerencie a alocação de passageiros e pagamentos no padrão de excelência"
        backLink="/admin/reservas"
        backText="Painel de Reservas"
      />

      {/* Stepper Executivo */}
      <Card className="shadow-xl shadow-muted/20 bg-card   border border-border/40 rounded-sm overflow-hidden">
        <div className="p-8 flex items-center justify-between">
          {/* Step 1 */}
          <div className="flex items-center gap-4 flex-1">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black ${step >= 1
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
              : 'bg-muted text-muted-foreground'
              }`}>
              {step > 1 ? <Check size={20} /> : '1'}
            </div>
            <div>
              <p className={`text-[12px] font-black uppercase tracking-widest ${step >= 1 ? 'text-foreground' : 'text-muted-foreground'}`}>
                Identificação
              </p>
              <p className="text-xs font-medium text-muted-foreground">Viagem Selecionada</p>
            </div>
          </div>

          <div className="px-4">
            <ArrowRight size={20} className="text-muted-foreground/30" />
          </div>

          {/* Step 2 */}
          <div className="flex items-center gap-4 flex-1">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black ${step >= 2
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
              : 'bg-muted text-muted-foreground'
              }`}>
              {step > 2 ? <Check size={20} /> : '2'}
            </div>
            <div>
              <p className={`text-[12px] font-black uppercase tracking-widest ${step >= 2 ? 'text-foreground' : 'text-muted-foreground'}`}>
                Passageiros
              </p>
              <p className="text-xs font-medium text-muted-foreground">Assentos & Dados</p>
            </div>
          </div>

          <div className="px-4">
            <ArrowRight size={20} className="text-muted-foreground/30" />
          </div>

          {/* Step 3 */}
          <div className="flex items-center gap-4 flex-1">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black ${step >= 3
              ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
              : 'bg-muted text-muted-foreground'
              }`}>
              3
            </div>
            <div>
              <p className={`text-[12px] font-black uppercase tracking-widest ${step >= 3 ? 'text-foreground' : 'text-muted-foreground'}`}>
                Finalização
              </p>
              <p className="text-xs font-medium text-muted-foreground">Revisão & Checkout</p>
            </div>
          </div>
        </div>
      </Card>

      {step === 1 && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <FormSection
            title="Seletor de Grade Operacional"
            icon={RefreshCw}
          >
            <SeletorViagem
              viagens={viagens}
              viagemSelecionada={viagemSelecionada}
              onChange={setViagemSelecionada}
            />
          </FormSection>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/admin/reservas')}
              className="h-14 rounded-sm px-6 font-black uppercase text-[12px] tracking-widest"
            >
              Voltar
            </Button>

            {viagemSelecionada && (
              <button
                onClick={() => setViagemSelecionada(null)}
                className="text-primary hover:text-primary/80 font-black uppercase text-[11px] tracking-widest flex items-center gap-2 transition-colors ml-4"
              >
                <RefreshCw size={14} />
                Alterar Seleção
              </button>
            )}
          </div>

          <Button
            onClick={() => setStep(2)}
            disabled={!podeAvancarStep1}
            className="h-14 rounded-sm px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[12px] tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
          >
            Próxima Etapa
            <ArrowRight size={18} className="ml-2" />
          </Button>
        </div>
      )}
      {step === 2 && (
        <ErrorBoundary>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Mapa de Assentos (Left) */}
            <FormSection
              title="Mapeamento de Assentos"
              description="Selecione as poltronas vinculadas a esta operação"
              className="lg:col-span-5 h-fit sticky top-6"
            >
              {veiculo ? (
                loading ? (
                  <div className="flex justify-center p-8"><Loader className="animate-spin text-primary" /></div>
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
                <p className="text-muted-foreground italic text-center py-8">Aguardando definição da viagem...</p>
              )}
            </FormSection>

            {/* Lista de Passageiros (Right) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                  Dados dos Passageiros
                </h3>
                <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-widest">
                  {assentosSelecionados.length} Selecionados
                </span>
              </div>
              {assentosSelecionados.length === 0 ? (
                <Card className="shadow-xl shadow-muted/20 bg-card   border border-border/40 rounded-sm p-12 text-center border-dashed">
                  <Users size={48} className="mx-auto mb-6 text-muted-foreground/30" />
                  <p className="text-[14px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                    Nenhuma poltrona selecionada
                  </p>
                  <p className="text-xs font-medium text-muted-foreground/60 max-w-[200px] mx-auto">
                    Interaja com o mapa ao lado para iniciar o cadastro
                  </p>
                </Card>
              ) : (
                assentosSelecionados.map((seat) => (
                  <div key={seat.numero} className="bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm p-4 animate-in slide-in-from-left-2">
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
                          onNovoCliente={() => {
                            setTargetSeatForNewClient(seat.numero);
                            setIsModalNovoClienteOpen(true);
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo *</label>
                          <input
                            type="text"
                            value={passageirosMap[seat.numero]?.nome || ''}
                            onChange={(e) => handlePassengerChange(seat.numero, 'nome', e.target.value)}
                            className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                            placeholder="Nome do passageiro"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Documento (CPF/RG) *</label>
                          <input
                            type="text"
                            value={passageirosMap[seat.numero]?.documento || ''}
                            onChange={(e) => handlePassengerChange(seat.numero, 'documento', e.target.value)}
                            className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                            placeholder="000.000.000-00"
                          />
                        </div>
                      </div>

                      {/* Boarding and Dropoff Points - UI */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                            Ponto de Embarque *
                          </label>
                          <select
                            value={passageirosMap[seat.numero]?.boarding_point || ''}
                            onChange={(e) => handlePassengerChange(seat.numero, 'boarding_point', e.target.value)}
                            className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                          >
                            <option value="">Selecione...</option>
                            {(() => {
                              const stops = viagemSelecionada?.route_stops && (typeof viagemSelecionada.route_stops === 'string' ? JSON.parse(viagemSelecionada.route_stops) : viagemSelecionada.route_stops);
                              if (Array.isArray(stops)) {
                                return stops.filter((s: any) => s.permite_embarque !== false).map((stop: any, idx: number) => (
                                  <option key={idx} value={stop.nome}>{stop.nome}</option>
                                ));
                              }
                              return null;
                            })()}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                            Ponto de Desembarque *
                          </label>
                          <select
                            value={passageirosMap[seat.numero]?.dropoff_point || ''}
                            onChange={(e) => handlePassengerChange(seat.numero, 'dropoff_point', e.target.value)}
                            className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                          >
                            <option value="">Selecione...</option>
                            {(() => {
                              // Alighting points come from Return Route as requested
                              const stops = viagemSelecionada?.return_route_stops && (typeof viagemSelecionada.return_route_stops === 'string' ? JSON.parse(viagemSelecionada.return_route_stops) : viagemSelecionada.return_route_stops);
                              if (Array.isArray(stops)) {
                                return stops.filter((s: any) => s.permite_desembarque !== false).map((stop: any, idx: number) => (
                                  <option key={idx} value={stop.nome}>{stop.nome}</option>
                                ));
                              }
                              return null;
                            })()}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Botões de Navegação - Fora do Grid para visibilidade constante */}
          <div className="flex justify-between items-center pt-8 border-t border-border/50 mt-8">
            <Button
              variant="ghost"
              onClick={() => setStep(1)}
              className="h-14 rounded-sm px-6 font-black uppercase text-[12px] tracking-widest"
            >
              <ArrowLeft size={16} className="mr-2" />
              Voltar
            </Button>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Subtotal da Carga</p>
                <p className="text-2xl font-black tracking-tight text-primary">R$ {valorTotal.toFixed(2)}</p>
              </div>
              <Button
                onClick={() => setStep(3)}
                disabled={!podeAvancarStep2}
                className="h-14 rounded-sm px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[12px] tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
              >
                Revisão Final
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </div>
          </div>
        </ErrorBoundary>
      )}

      {step === 3 && (
        <ErrorBoundary>
          <div className="space-y-8 animate-in slide-in-from-bottom-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Resumo da Viagem */}
              <FormSection
                title="Resumo Operacional"
                className="lg:col-span-1"
              >
                {viagemSelecionada && (
                  <>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center text-primary">
                          <Check size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Viagem Selecionada</p>
                          <p className="font-black text-foreground">{viagemSelecionada.titulo || viagemSelecionada.route_name}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8 ml-13">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Origem</p>
                          <p className="font-bold text-foreground">{viagemSelecionada.origem || viagemSelecionada.origin_city}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Destino</p>
                          <p className="font-bold text-foreground">{viagemSelecionada.destino || viagemSelecionada.destination_city}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Data Partida</p>
                          <p className="font-bold text-foreground">
                            {(viagemSelecionada.departure_date || viagemSelecionada.data_partida)
                              ? new Date(viagemSelecionada.departure_date || viagemSelecionada.data_partida!).toLocaleDateString('pt-BR')
                              : 'Definir'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Horário</p>
                          <p className="font-bold text-foreground">
                            {(viagemSelecionada.departure_date || viagemSelecionada.data_partida)
                              ? new Date(viagemSelecionada.departure_date || viagemSelecionada.data_partida!).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                              : '00:00'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-border/50">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Passageiros Selecionados</h4>
                        <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-1 rounded-full uppercase tracking-widest border border-primary/20">
                          {assentosSelecionados.length} Assentos
                        </span>
                      </div>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {assentosSelecionados.map((seat, index) => {
                          const p = passageirosMap[seat.numero];
                          return (
                            <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-sm border border-border/30 group hover:border-primary/30 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-sm bg-background border border-border flex items-center justify-center text-[12px] font-black text-primary group-hover:scale-110 transition-transform">
                                  {seat.numero}
                                </div>
                                <div>
                                  <p className="text-[12px] font-bold text-foreground truncate max-w-[150px]">{p?.nome || 'Pendente'}</p>
                                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{seat.tipo.replace('_', ' ')}</p>
                                </div>
                              </div>
                              <span className="text-[12px] font-black text-primary">R$ {seat.valor.toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </FormSection>

              {/* Pagamento e Finalização */}
              <div className="space-y-8">
                <Card className="shadow-2xl shadow-primary/10 bg-slate-900 border-none rounded-sm overflow-hidden relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <div className="p-8 relative">
                    <div className="flex justify-between items-center mb-8">
                      <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 mb-1">Checkout Executivo</h3>
                        <p className="text-2xl font-black text-white tracking-tight">PAGAMENTO</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Investimento Total</p>
                        <p className="text-4xl font-black text-white tracking-tighter italic">R$ {valorTotal.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Payment Method Selector */}
                    <div className="flex p-1 bg-slate-800/80   rounded-sm mb-8 border border-slate-700/50">
                      <button
                        onClick={() => setPaymentMethod('MANUAL')}
                        className={`flex-1 flex flex-col items-center py-4 rounded-sm transition-all gap-2 ${paymentMethod === 'MANUAL'
                          ? 'bg-slate-700 text-white shadow-xl shadow-black/20 ring-1 ring-white/10'
                          : 'text-slate-500 hover:text-slate-300'
                          }`}
                      >
                        <Wallet size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Presencial</span>
                      </button>
                      <button
                        onClick={() => setPaymentMethod('DIGITAL')}
                        className={`flex-1 flex flex-col items-center py-4 rounded-sm transition-all gap-2 ${paymentMethod === 'DIGITAL'
                          ? 'bg-primary text-primary-foreground shadow-xl shadow-primary/30 ring-1 ring-white/10'
                          : 'text-slate-500 hover:text-slate-300'
                          }`}
                      >
                        <QrCode size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Link / Pix</span>
                      </button>
                    </div>

                    {/* Sub-opções Manual */}
                    {paymentMethod === 'MANUAL' && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Modalidade de Recebimento</label>
                        <select
                          value={detailedPaymentMethod}
                          onChange={(e) => setDetailedPaymentMethod(e.target.value as FormaPagamento)}
                          className="w-full h-14 px-4 bg-slate-800/50 border border-slate-700 rounded-sm text-white font-black uppercase text-[12px] tracking-widest focus:ring-2 focus:ring-primary/50 transition-all outline-none appearance-none"
                        >
                          <option value="DINHEIRO">Espécie (Dinheiro)</option>
                          <option value="PIX">Pix Transferência</option>
                          <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                          <option value="CARTAO_DEBITO">Cartão de Débito</option>
                        </select>
                      </div>
                    )}

                    {/* Gestão de Créditos */}
                    {payerClient && payerClient.saldo_creditos > 0 && (
                      <div className="mt-8 p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-sm animate-in fade-in">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 rounded-sm bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <Wallet size={24} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 italic">FIDELIDADE & CRÉDITOS</p>
                            <p className="text-lg font-black text-white">R$ {Number(payerClient.saldo_creditos || 0).toFixed(2)} disponível</p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            const isChecked = !useCredits;
                            setUseCredits(isChecked);
                            let newCredits = 0;
                            if (isChecked) {
                              newCredits = Math.min(Number(payerClient.saldo_creditos || 0), valorTotal);
                            }
                            setCreditsToUse(newCredits);
                            if (isPartialPayment) {
                              const effectiveTotal = Math.max(0, valorTotal - newCredits);
                              setEntryValue(effectiveTotal * 0.20);
                            }
                          }}
                          className={`w-full py-4 rounded-sm border-2 transition-all font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2 ${useCredits
                            ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/30'
                            : 'border-white/10 text-white/40 hover:border-indigo-500/50 hover:text-white'
                            }`}
                        >
                          {useCredits ? <Check size={16} /> : null}
                          {useCredits ? 'Créditos Aplicados' : 'Abater Saldo de Créditos'}
                        </button>
                      </div>
                    )}

                    {/* SINAL/PARCIAL */}
                    <div className="mt-8 pt-8 border-t border-slate-700/50">
                      <div
                        onClick={() => {
                          const val = !isPartialPayment;
                          setIsPartialPayment(val);
                          if (val) {
                            const effectiveTotal = Math.max(0, valorTotal - creditsToUse);
                            setEntryValue(effectiveTotal * 0.20);
                          } else {
                            setEntryValue(valorTotal);
                          }
                        }}
                        className={`flex items-center gap-4 p-4 rounded-sm cursor-pointer transition-all border ${isPartialPayment
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                          : 'border-transparent text-slate-500 hover:bg-white/5'
                          }`}
                      >
                        <div className={`w-6 h-6 rounded-sm border-2 flex items-center justify-center transition-all ${isPartialPayment ? 'bg-blue-500 border-blue-400' : 'border-slate-600'}`}>
                          {isPartialPayment && <Check size={14} className="text-white" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-black uppercase tracking-widest">Habilitar Pagamento de Sinal</p>
                          <p className="text-[11px] font-medium opacity-60">Pague agora apenas a entrada operacional</p>
                        </div>
                      </div>

                      {isPartialPayment && (
                        <div className="mt-4 grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                          <div className="bg-slate-800/80 p-4 rounded-sm border border-slate-700">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-2">Entrada (Agora)</label>
                            <div className="flex items-center gap-2 border-b border-primary/30 pb-1">
                              <span className="text-primary font-black">R$</span>
                              <input
                                type="number"
                                value={entryValue}
                                onChange={(e) => setEntryValue(Number(e.target.value))}
                                className="bg-transparent border-none text-xl font-black text-white w-full focus:ring-0 p-0 outline-none"
                              />
                            </div>
                          </div>
                          <div className="bg-slate-800/80 p-4 rounded-sm border border-slate-700 flex flex-col justify-between">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-2">Saldo (Embarque)</label>
                            <p className="text-xl font-black text-slate-400 italic">
                              R$ {Math.max(0, (valorTotal - creditsToUse) - entryValue).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Botões de Ação Finais */}
                    <div className="mt-10 flex gap-4">
                      <Button
                        variant="outline"
                        onClick={() => setStep(2)}
                        className="h-16 flex-1 bg-transparent border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white rounded-sm font-black uppercase text-[12px] tracking-widest"
                      >
                        Corrigir Dados
                      </Button>
                      <Button
                        onClick={handleConfirmarReserva}
                        disabled={saving}
                        className="h-16 flex-[2] bg-primary hover:bg-primary/90 text-primary-foreground rounded-sm font-black uppercase text-[12px] tracking-widest shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                      >
                        {saving ? <Loader size={20} className="animate-spin" /> : <CreditCard size={20} />}
                        {saving ? 'PROCESSANDO...' : 'FINALIZAR RESERVA'}
                      </Button>
                    </div>

                    {/* Rodapé Interno */}
                    <p className="mt-6 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
                      Sistema de Gestão Operacional de Transporte • SGTL
                    </p>
                  </div>
                </Card>

                {/* Info Digital (Show only if DIGITAL) */}
                {paymentMethod === 'DIGITAL' && (
                  <Card className="shadow-xl bg-blue-600 rounded-sm overflow-hidden border-none text-white animate-in zoom-in-95">
                    <CardContent className="p-8">
                      {!paymentData ? (
                        <div className="flex flex-col items-center text-center space-y-6">
                          <QrCode size={48} className="text-blue-200 opacity-50" />
                          <div>
                            <h4 className="text-xl font-black tracking-tight mb-2 uppercase italic">Gateway Digital</h4>
                            <p className="text-sm font-medium text-blue-100 opacity-80 leading-relaxed">
                              Inicie a transação integrada para gerar o QR Code dinâmico ou link de pagamento via WhatsApp.
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-4 w-full">
                            <Button onClick={() => handleGeneratePayment('PIX')} disabled={generatingPayment} className="h-14 bg-white/10 hover:bg-white/20 border-white/20 text-white rounded-sm font-black uppercase text-[11px] tracking-widest gap-2">
                              {generatingPayment ? <Loader size={16} className="animate-spin" /> : <QrCode size={18} />}
                              Pix Imediato
                            </Button>
                            <Button onClick={() => handleGeneratePayment('LINK')} disabled={generatingPayment} className="h-14 bg-white/10 hover:bg-white/20 border-white/20 text-white rounded-sm font-black uppercase text-[11px] tracking-widest gap-2">
                              {generatingPayment ? <Loader size={16} className="animate-spin" /> : <LinkIcon size={18} />}
                              Link Pagamento
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="flex justify-between items-start">
                            <h4 className="text-2xl font-black tracking-tight uppercase italic inset-shadow-sm text-blue-100">Checkout Ativo</h4>
                            <button onClick={() => setPaymentData(null)} className="p-2 bg-black/10 hover:bg-black/20 rounded-sm transition-colors">
                              <X size={18} />
                            </button>
                          </div>

                          <div className="flex flex-col md:flex-row gap-8">
                            {paymentData.qrCode && (
                              <div className="bg-white p-4 rounded-sm shadow-2xl flex-shrink-0 animate-in flip-in-y">
                                <img src={paymentData.qrCode} alt="QR Code Pix" className="w-40 h-40" />
                                <p className="text-[10px] font-black text-slate-800 text-center mt-3 uppercase tracking-widest">Escaneie o QR Code</p>
                              </div>
                            )}

                            <div className="flex-1 space-y-4 flex flex-col justify-center">
                              {paymentData.copyPasteCode && (
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-blue-200">Pix Copia e Cola</label>
                                  <div className="flex gap-2">
                                    <input readOnly value={paymentData.copyPasteCode} className="flex-1 bg-white/10 border border-white/20 rounded-sm px-4 py-2 text-xs font-mono text-white outline-none" />
                                    <Button onClick={() => { navigator.clipboard.writeText(paymentData.copyPasteCode || ''); alert('Copiado!'); }} className="bg-white text-blue-600 hover:bg-blue-50 px-3 rounded-sm h-10">
                                      <Copy size={16} />
                                    </Button>
                                  </div>
                                </div>
                              )}
                              {paymentData.paymentLink && (
                                <Button
                                  onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Olá! Segue o link para pagamento da sua reserva: ${paymentData.paymentLink}`)}`, '_blank')}
                                  className="h-14 bg-green-500 hover:bg-green-400 text-white rounded-sm font-black uppercase text-[12px] tracking-widest shadow-xl shadow-green-900/40"
                                >
                                  Enviar WhatsApp <ArrowRight size={18} className="ml-2" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </ErrorBoundary>
      )}

      {/* Inline Client Creation Modal */}
      <ModalNovoCliente
        isOpen={isModalNovoClienteOpen}
        onClose={() => {
          setIsModalNovoClienteOpen(false);
          setTargetSeatForNewClient(null);
        }}
        onClientCreated={handleClientCreated}
      />
    </div>
  );
};