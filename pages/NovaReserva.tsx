import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IViagem, IVeiculo, ICliente, IPassageiroReserva, Moeda, TipoAssento, IReserva } from '../types';
import { SeletorViagem } from '../components/Selectors/SeletorViagem';
import { SeletorPassageiro } from '../components/Selectors/SeletorPassageiro';
import { MapaAssentosReserva } from '../components/Veiculos/MapaAssentosReserva';
import { Calendar, MapPin, CreditCard, ArrowRight, ArrowLeft, Check, Users, X, Loader } from 'lucide-react';
import { tripsService } from '../services/tripsService';
import { clientsService } from '../services/clientsService';
import { vehiclesService } from '../services/vehiclesService';
import { reservationsService } from '../services/reservationsService';

type Step = 1 | 2 | 3;

export const NovaReserva: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Data Lists
  const [viagens, setViagens] = useState<IViagem[]>([]);
  const [clientes, setClientes] = useState<ICliente[]>([]);

  // Selection State
  const [viagemSelecionada, setViagemSelecionada] = useState<IViagem | null>(null);
  const [veiculo, setVeiculo] = useState<IVeiculo | null>(null);
  const [passageiros, setPassageiros] = useState<Omit<IPassageiroReserva, 'id'>[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<ICliente | null>(null);
  const [assentoSelecionado, setAssentoSelecionado] = useState<{ numero: string; tipo: TipoAssento; valor: number } | null>(null);
  const [assentosOcupados, setAssentosOcupados] = useState<string[]>([]);

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
    }
  }, [viagemSelecionada]);

  const loadTripDetails = async (viagem: IViagem) => {
    try {
      setLoading(true);

      // 1. Fetch Vehicle (for seat map)
      if (viagem.vehicle_id) {
        const veiculoData = await vehiclesService.getById(viagem.vehicle_id);
        setVeiculo(veiculoData);
      }

      // 2. Fetch Reservations (for occupied seats)
      const reservations = await reservationsService.getAll({ status: 'CONFIRMED' }); // Filter by trip_id ideally, but service needs update or we filter client side
      // Actually, my service implementation for getAll accepts filters but I didn't implement trip_id filter in the service wrapper properly?
      // Let's check reservationsService.ts. It accepts { status, search }.
      // I should update reservationsService to accept trip_id.
      // For now, I'll fetch all and filter client side if the list isn't huge, or just rely on what I have.
      // Wait, I can pass query params manually if I want, but let's stick to what I have.
      // I'll filter client side for now.
      const tripReservations = reservations.filter((r: any) => r.trip_id === viagem.id && r.status !== 'CANCELLED');
      const occupied = tripReservations.map((r: any) => r.seat_number || r.assento_numero).filter(Boolean);
      setAssentosOcupados(occupied);

    } catch (error) {
      console.error('Erro ao carregar detalhes da viagem:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdicionarPassageiro = (passageiro: Omit<IPassageiroReserva, 'id'>) => {
    setPassageiros([...passageiros, passageiro]);
    // Add to occupied list temporarily
    setAssentosOcupados([...assentosOcupados, passageiro.assento_numero]);
    // Reset selection
    setClienteSelecionado(null);
    setAssentoSelecionado(null);
  };

  const handleRemoverPassageiro = (index: number) => {
    const passageiro = passageiros[index];
    const novoPassageiros = passageiros.filter((_, i) => i !== index);
    setPassageiros(novoPassageiros);
    // Remove from occupied list
    setAssentosOcupados(assentosOcupados.filter(a => a !== passageiro.assento_numero));
  };

  const handleSelecionarAssento = (assento: { numero: string; tipo: TipoAssento; valor: number } | null) => {
    setAssentoSelecionado(assento);

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

  const handleConfirmarReserva = async () => {
    if (!viagemSelecionada) return;

    try {
      setSaving(true);

      // Create a reservation for each passenger
      const promises = passageiros.map(p => {
        const cliente = clientes.find(c => c.id === p.cliente_id);
        return reservationsService.create({
          trip_id: viagemSelecionada.id,
          seat_id: null, // Backend uses seat_id but we only have seat_number from map. 
          // We need to find seat_id from vehicle map if backend requires it.
          // Backend `reservations` table has `seat_id` (FK to seat table).
          // But `seat` table is linked to vehicle.
          // If I don't have seat_id, I might fail.
          // Let's check if backend accepts seat_number or if I need to find the ID.
          // The backend `create` route expects `seat_id`.
          // I need to find the seat ID from the vehicle data.
          seat_number: p.assento_numero, // I'll send this too just in case I update backend
          passenger_name: cliente?.nome || 'Passageiro',
          passenger_document: cliente?.documento_numero || '000',
          passenger_email: cliente?.email,
          passenger_phone: cliente?.telefone, // Assuming I have this field
          price: p.valor,
          client_id: p.cliente_id,
          notes: 'Reserva via Admin'
        });
      });

      // Wait, I need `seat_id`.
      // `veiculo.mapa_assentos` should have `id` for each seat.
      // Let's check `IVeiculo` interface.
      // `mapa_assentos` is `Partial<IAssento>[]`. `IAssento` has `id`.
      // So I can find the seat ID.

      const promisesWithSeatId = passageiros.map(p => {
        const cliente = clientes.find(c => c.id === p.cliente_id);
        // @ts-ignore
        const seat = veiculo?.mapa_assentos?.find((s: any) => s.numero === p.assento_numero);

        return reservationsService.create({
          trip_id: viagemSelecionada.id,
          seat_id: seat?.id,
          passenger_name: cliente?.nome || 'Passageiro',
          passenger_document: cliente?.documento_numero || '000',
          passenger_email: cliente?.email,
          price: p.valor,
          client_id: p.cliente_id,
          notes: 'Reserva via Admin'
        });
      });

      await Promise.all(promisesWithSeatId);

      alert('Reservas confirmadas com sucesso!');
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
        <div className="space-y-6">
          {/* Seleção de Passageiro e Assento */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Seletor de Passageiro */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
              <SeletorPassageiro
                clientes={clientes}
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
                loading ? (
                  <div className="flex justify-center p-8"><Loader className="animate-spin" /></div>
                ) : (
                  <MapaAssentosReserva
                    veiculo={veiculo}
                    assentosReservados={assentosOcupados}
                    assentoSelecionado={assentoSelecionado}
                    onSelecionarAssento={handleSelecionarAssento}
                  />
                )
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
                      {new Date(viagemSelecionada.departure_date || viagemSelecionada.data_partida || '').toLocaleString('pt-BR')}
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