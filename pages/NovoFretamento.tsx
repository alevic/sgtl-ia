import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IClienteCorporativo, IVeiculo, IMotorista, Moeda, VeiculoStatus, IRota, ICliente } from '../types';
import { ArrowLeft, Save, Building2, Bus, MapPin, Calendar, FileText, User, DollarSign, Route, Clock, Mail, Users, Loader } from 'lucide-react';
import { SeletorRota } from '../components/Rotas/SeletorRota';
import { SeletorCliente, ClienteFretamento } from '../components/Selectors/SeletorCliente';
import { chartersService } from '../services/chartersService';
import { clientsService } from '../services/clientsService';
import { vehiclesService } from '../services/vehiclesService';
import { driversService } from '../services/driversService';
import { routesService } from '../services/routesService';
import { DatePicker } from '../components/Form/DatePicker';

export const NovoFretamento: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Data States
    const [clientes, setClientes] = useState<ClienteFretamento[]>([]);
    const [veiculos, setVeiculos] = useState<IVeiculo[]>([]);
    const [motoristas, setMotoristas] = useState<IMotorista[]>([]);
    const [rotas, setRotas] = useState<IRota[]>([]);

    // Form States
    const [clienteId, setClienteId] = useState('');
    const [tipo, setTipo] = useState<'PONTUAL' | 'RECORRENTE'>('PONTUAL');
    const [rotaSelecionada, setRotaSelecionada] = useState<IRota | null>(null);
    const [temRotaVolta, setTemRotaVolta] = useState(false);
    const [rotaVoltaSelecionada, setRotaVoltaSelecionada] = useState<IRota | null>(null);
    const [abaRotaAtiva, setAbaRotaAtiva] = useState<'IDA' | 'VOLTA'>('IDA');
    const [dataInicio, setDataInicio] = useState('');
    const [horaInicio, setHoraInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [horaFim, setHoraFim] = useState('');
    const [veiculoId, setVeiculoId] = useState('');
    const [motoristaId, setMotoristaId] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [passageiros, setPassageiros] = useState(0);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [clientesData, veiculosData, motoristasData, rotasData] = await Promise.all([
                clientsService.getAll(),
                vehiclesService.getAll(),
                driversService.getAll(),
                routesService.getAll()
            ]);

            setClientes(clientesData as unknown as ClienteFretamento[]); // Casting for now as ICliente matches compatible fields
            setVeiculos(veiculosData.filter(v => v.status === VeiculoStatus.ACTIVE));
            setMotoristas(motoristasData.filter(m => m.status === 'AVAILABLE'));
            setRotas(rotasData.filter(r => r.ativa));
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            alert('Erro ao carregar dados iniciais.');
        } finally {
            setLoading(false);
        }
    };

    const clienteSelecionado = clientes.find(c => c.id === clienteId);
    const veiculoSelecionado = veiculos.find(v => v.id === veiculoId);
    const motoristaSelecionado = motoristas.find(m => m.id === motoristaId);

    const formatarDataHora = (isoDate?: string) => {
        if (!isoDate) return '--';
        const data = new Date(isoDate);
        return data.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Campos calculados automaticamente das rotas (Resumo)
    const resumoViagem = useMemo(() => {
        if (temRotaVolta) {
            if (!rotaSelecionada || !rotaVoltaSelecionada) {
                if (rotaSelecionada) {
                    const origem = rotaSelecionada.pontos[0];
                    const destino = rotaSelecionada.pontos[rotaSelecionada.pontos.length - 1];
                    const numParadas = rotaSelecionada.pontos.length - 2;

                    return {
                        origem: origem.nome || '(não definido)',
                        destino: destino.nome || '(não definido)',
                        dataPartida: origem.horario_partida,
                        dataChegada: destino.horario_chegada,
                        dataRetorno: null,
                        horaRetorno: null,
                        numParadas,
                        incompleto: 'Selecione também a rota de volta'
                    };
                }
                return null;
            }

            const origemIda = rotaSelecionada.pontos[0];
            const destinoIda = rotaSelecionada.pontos[rotaSelecionada.pontos.length - 1];
            const destinoVolta = rotaVoltaSelecionada.pontos[rotaVoltaSelecionada.pontos.length - 1];
            const numParadasIda = rotaSelecionada.pontos.length - 2;
            const numParadasVolta = rotaVoltaSelecionada.pontos.length - 2;

            return {
                origem: origemIda.nome || '(não definido)',
                destino: destinoIda.nome || '(não definido)',
                dataPartida: origemIda.horario_partida,
                dataChegada: destinoIda.horario_chegada,
                dataRetorno: rotaVoltaSelecionada.pontos[0].horario_partida,
                horaRetorno: destinoVolta.horario_chegada,
                numParadas: numParadasIda + numParadasVolta,
                numParadasIda,
                numParadasVolta
            };
        }

        if (!rotaSelecionada || rotaSelecionada.pontos.length < 2) {
            return null;
        }

        const origem = rotaSelecionada.pontos[0];
        const destino = rotaSelecionada.pontos[rotaSelecionada.pontos.length - 1];
        const numParadas = rotaSelecionada.pontos.length - 2;

        return {
            origem: origem.nome || '(não definido)',
            destino: destino.nome || '(não definido)',
            dataPartida: origem.horario_partida,
            dataChegada: destino.horario_chegada,
            dataRetorno: null,
            horaRetorno: null,
            numParadas
        };
    }, [rotaSelecionada, rotaVoltaSelecionada, temRotaVolta]);

    const handleSalvar = async () => {
        if (!clienteId) { alert('Selecione um cliente'); return; }
        if (!rotaSelecionada) { alert('Selecione uma rota de ida'); return; }
        if (temRotaVolta && !rotaVoltaSelecionada) { alert('Selecione uma rota de volta'); return; }
        if (!dataInicio) { alert('Informe a data de início'); return; }
        if (!dataFim) { alert('Informe a data de fim'); return; }
        if (passageiros <= 0) { alert('Informe a quantidade de passageiros'); return; }

        try {
            setSaving(true);

            const origem = rotaSelecionada.pontos[0]?.nome || '';
            const destino = rotaSelecionada.pontos[rotaSelecionada.pontos.length - 1]?.nome || '';

            // Parse City/State
            const parseLocation = (loc: string) => {
                const parts = loc.split('-');
                if (parts.length > 1) return { city: parts[0].trim(), state: parts[1].trim() };
                const partsComma = loc.split(',');
                if (partsComma.length > 1) return { city: partsComma[0].trim(), state: partsComma[1].trim() };
                return { city: loc, state: 'UF' };
            };

            const originLoc = parseLocation(origem);
            const destLoc = parseLocation(destino);

            const payload = {
                contact_name: (clienteSelecionado as any).contato_nome || clienteSelecionado?.nome,
                contact_email: (clienteSelecionado as any).contato_email || clienteSelecionado?.email,
                contact_phone: (clienteSelecionado as any).contato_telefone || clienteSelecionado?.telefone,
                company_name: (clienteSelecionado as any).razao_social || null,
                origin_city: originLoc.city,
                origin_state: originLoc.state,
                destination_city: destLoc.city,
                destination_state: destLoc.state,
                departure_date: dataInicio,
                departure_time: horaInicio || null,
                return_date: dataFim,
                return_time: horaFim || null,
                passenger_count: passageiros,
                vehicle_type_requested: 'ONIBUS',
                description: observacoes,
                client_id: clienteId,
                notes: observacoes,
                vehicle_id: veiculoId || null,
                driver_id: motoristaId || null,
                rota_ida_id: rotaSelecionada.id,
                rota_volta_id: temRotaVolta ? rotaVoltaSelecionada?.id : null
            };

            await chartersService.create(payload);
            alert('Solicitação de fretamento enviada com sucesso!');
            navigate('/admin/fretamento');
        } catch (error) {
            console.error('Erro ao salvar fretamento:', error);
            alert('Erro ao salvar solicitação.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/fretamento')}
                    className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Nova Solicitação de Fretamento</h1>
                    <p className="text-slate-500 dark:text-slate-400">Crie uma solicitação de aluguel de frota para cliente corporativo</p>
                </div>
                <button
                    onClick={handleSalvar}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                    {saving ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
                    {saving ? 'Enviando...' : 'Enviar Solicitação'}
                </button>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Cliente Corporativo */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <Building2 size={20} className="text-blue-600" />
                        Cliente Corporativo
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <SeletorCliente
                                clientes={clientes}
                                clienteSelecionado={clienteSelecionado}
                                onSelecionarCliente={(cliente) => setClienteId(cliente?.id || '')}
                            />
                        </div>

                        {clienteSelecionado && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                    <div>
                                        <p className="text-slate-600 dark:text-slate-400 mb-1">Contato</p>
                                        <p className="font-semibold text-slate-800 dark:text-white">
                                            {'contato_nome' in clienteSelecionado ? clienteSelecionado.contato_nome : clienteSelecionado.nome}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {'contato_email' in clienteSelecionado ? clienteSelecionado.contato_email : clienteSelecionado.email}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-slate-600 dark:text-slate-400 mb-1">Telefone</p>
                                        <p className="font-semibold text-slate-800 dark:text-white">
                                            {'contato_telefone' in clienteSelecionado ? clienteSelecionado.contato_telefone : clienteSelecionado.telefone || '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-slate-600 dark:text-slate-400 mb-1">Crédito Disponível</p>
                                        <div className="flex items-center gap-1">
                                            <DollarSign size={16} className="text-green-600" />
                                            <p className="font-bold text-green-600 dark:text-green-400">
                                                R$ {('credito_disponivel' in clienteSelecionado ? clienteSelecionado.credito_disponivel : (clienteSelecionado as ICliente).saldo_creditos || 0).toLocaleString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tipo de Serviço */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <Bus size={20} className="text-orange-600" />
                        Tipo de Serviço
                    </h3>

                    <div className="space-y-3">
                        <label className="flex items-start gap-3 p-4 rounded-lg  border-2 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-700/50"
                            style={{ borderColor: tipo === 'PONTUAL' ? '#3b82f6' : 'transparent' }}
                        >
                            <input
                                type="radio"
                                name="tipo"
                                value="PONTUAL"
                                checked={tipo === 'PONTUAL'}
                                onChange={(e) => setTipo(e.target.value as 'PONTUAL')}
                                className="mt-1"
                            />
                            <div>
                                <p className="font-semibold text-slate-800 dark:text-white">Pontual</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Evento único, data específica. Ideal para eventos corporativos, viagens especiais.
                                </p>
                            </div>
                        </label>

                        <label className="flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-700/50"
                            style={{ borderColor: tipo === 'RECORRENTE' ? '#3b82f6' : 'transparent' }}
                        >
                            <input
                                type="radio"
                                name="tipo"
                                value="RECORRENTE"
                                checked={tipo === 'RECORRENTE'}
                                onChange={(e) => setTipo(e.target.value as 'RECORRENTE')}
                                className="mt-1"
                            />
                            <div>
                                <p className="font-semibold text-slate-800 dark:text-white">Recorrente</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Serviço contínuo. Ideal para transporte diário de funcionários, rotas regulares.
                                </p>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Rota e Localização */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <MapPin size={20} className="text-red-600" />
                        Rota e Localização
                    </h3>

                    {/* Resumo da Viagem (Calculado) */}
                    {resumoViagem && (
                        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800 p-6">
                            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                                <Route size={20} className="text-blue-600" />
                                Resumo da Viagem (calculado das rotas)
                            </h3>

                            {/* Mensagem de incompleto */}
                            {(resumoViagem as any).incompleto && (
                                <div className="mb-4 p-3 bg-amber-100 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg">
                                    <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
                                        ⚠️ {(resumoViagem as any).incompleto}
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Origem</p>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">{resumoViagem.origem}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Destino</p>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">{resumoViagem.destino}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                                        <Calendar size={14} />
                                        Partida (Ida)
                                    </p>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                                        {formatarDataHora(resumoViagem.dataPartida)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                                        <Clock size={14} />
                                        Chegada (Ida)
                                    </p>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                                        {formatarDataHora(resumoViagem.dataChegada)}
                                    </p>
                                </div>

                                {/* Informações de retorno (se houver) */}
                                {resumoViagem.dataRetorno && (
                                    <>
                                        <div>
                                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                                                <Calendar size={14} />
                                                Partida (Volta)
                                            </p>
                                            <p className="font-semibold text-green-700 dark:text-green-400">
                                                {formatarDataHora(resumoViagem.dataRetorno)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                                                <Clock size={14} />
                                                Chegada (Volta)
                                            </p>
                                            <p className="font-semibold text-green-700 dark:text-green-400">
                                                {formatarDataHora(resumoViagem.horaRetorno)}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                                {(resumoViagem as any).numParadasIda !== undefined ? (
                                    // Detalhamento para ida e volta
                                    <div className="space-y-1">
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            <strong>{(resumoViagem as any).numParadasIda}</strong> parada{(resumoViagem as any).numParadasIda !== 1 ? 's' : ''} na ida
                                            {' • '}
                                            <strong>{(resumoViagem as any).numParadasVolta}</strong> parada{(resumoViagem as any).numParadasVolta !== 1 ? 's' : ''} na volta
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-500">
                                            Total: <strong>{resumoViagem.numParadas}</strong> paradas intermediárias
                                        </p>
                                    </div>
                                ) : (
                                    // Simples para ida ou volta apenas
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        <strong>{resumoViagem.numParadas}</strong> parada{resumoViagem.numParadas !== 1 ? 's' : ''} intermediária{resumoViagem.numParadas !== 1 ? 's' : ''}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Seleção de Sentido (Radio Buttons) */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Sentido da Viagem
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="sentido"
                                    checked={!temRotaVolta}
                                    onChange={() => {
                                        setTemRotaVolta(false);
                                        setAbaRotaAtiva('IDA');
                                        setRotaVoltaSelecionada(null);
                                    }}
                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-slate-700 dark:text-slate-300">Somente Ida</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="sentido"
                                    checked={temRotaVolta}
                                    onChange={() => {
                                        setTemRotaVolta(true);
                                    }}
                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-slate-700 dark:text-slate-300">Ida e Volta</span>
                            </label>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 mb-6">
                        <button
                            onClick={() => setAbaRotaAtiva('IDA')}
                            className={`px-4 py-2 font-medium transition-colors border-b-2 ${abaRotaAtiva === 'IDA'
                                ? 'border-green-600 text-green-600 dark:text-green-400'
                                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            Rota de Ida
                        </button>
                        {temRotaVolta && (
                            <button
                                onClick={() => setAbaRotaAtiva('VOLTA')}
                                className={`px-4 py-2 font-medium transition-colors border-b-2 ${abaRotaAtiva === 'VOLTA'
                                    ? 'border-orange-600 text-orange-600 dark:text-orange-400'
                                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                Rota de Volta
                            </button>
                        )}
                    </div>

                    {/* Seletor de Rota (Condicional) */}
                    <div>
                        {abaRotaAtiva === 'IDA' && (
                            <div className="animate-in fade-in duration-300">
                                <SeletorRota
                                    rotas={rotas}
                                    tipoFiltro="IDA"
                                    rotaSelecionada={rotaSelecionada}
                                    onChange={setRotaSelecionada}
                                />
                            </div>
                        )}
                        {abaRotaAtiva === 'VOLTA' && temRotaVolta && (
                            <div className="animate-in fade-in duration-300">
                                <SeletorRota
                                    rotas={rotas}
                                    tipoFiltro="VOLTA"
                                    rotaSelecionada={rotaVoltaSelecionada}
                                    onChange={setRotaVoltaSelecionada}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Veículo e Motorista */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <Bus size={20} className="text-blue-600" />
                        Veículo e Motorista
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Veículo (Opcional)
                            </label>
                            <select
                                value={veiculoId}
                                onChange={(e) => setVeiculoId(e.target.value)}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">-- Selecionar depois --</option>
                                {veiculos.map((veiculo) => (
                                    <option key={veiculo.id} value={veiculo.id}>
                                        {veiculo.modelo} - {veiculo.placa} ({veiculo.capacidade_passageiros} lugares)
                                    </option>
                                ))}
                            </select>
                            {veiculoSelecionado && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    ✓ {veiculoSelecionado.capacidade_passageiros} passageiros
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Motorista (Opcional)
                            </label>
                            <select
                                value={motoristaId}
                                onChange={(e) => setMotoristaId(e.target.value)}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">-- Selecionar depois --</option>
                                {motoristas.map((motorista) => (
                                    <option key={motorista.id} value={motorista.id}>
                                        {motorista.nome} - CNH {motorista.categoria_cnh}
                                    </option>
                                ))}
                            </select>
                            {motoristaSelecionado && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    ✓ CNH categoria {motoristaSelecionado.categoria_cnh}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            💡 <strong>Dica:</strong> Você pode deixar estes campos em branco e atribuir veículo e motorista posteriormente, ou já definir agora se souber.
                        </p>
                    </div>
                </div>

                {/* Período e Passageiros */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <Calendar size={20} className="text-green-600" />
                        Período e Passageiros
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                Início do Serviço *
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                                        Data
                                    </label>
                                    <DatePicker
                                        value={dataInicio}
                                        onChange={setDataInicio}
                                        placeholder="DD/MM/AAAA"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                                        Hora
                                    </label>
                                    <input
                                        type="time"
                                        value={horaInicio}
                                        onChange={(e) => setHoraInicio(e.target.value)}
                                        className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                Fim do Serviço *
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                                        Data
                                    </label>
                                    <DatePicker
                                        value={dataFim}
                                        onChange={setDataFim}
                                        placeholder="DD/MM/AAAA"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                                        Hora
                                    </label>
                                    <input
                                        type="time"
                                        value={horaFim}
                                        onChange={(e) => setHoraFim(e.target.value)}
                                        className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Quantidade de Passageiros *
                            </label>
                            <div className="flex items-center gap-2">
                                <Users size={20} className="text-slate-500" />
                                <input
                                    type="number"
                                    min="1"
                                    value={passageiros}
                                    onChange={(e) => setPassageiros(parseInt(e.target.value) || 0)}
                                    className="w-full md:w-1/3 p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {dataInicio && dataFim && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-sm text-blue-800 dark:text-blue-300">
                                ℹ️ A duração total do serviço será de aproximadamente <strong>{
                                    Math.ceil((new Date(dataFim).getTime() - new Date(dataInicio).getTime()) / (1000 * 60 * 60 * 24))
                                } dias</strong>.
                            </p>
                        </div>
                    )}
                </div>

                {/* Observações */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <FileText size={20} className="text-slate-500" />
                        Observações
                    </h3>
                    <textarea
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                        rows={4}
                        placeholder="Detalhes adicionais sobre o fretamento..."
                        className="w-full p-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>
        </div>
    );
};
