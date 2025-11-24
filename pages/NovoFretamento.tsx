import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { IClienteCorporativo, IVeiculo, IMotorista, Moeda, VeiculoStatus, IRota } from '../types';
import { ArrowLeft, Save, Building2, Bus, MapPin, Calendar, FileText, User, DollarSign, Route, Clock } from 'lucide-react';
import { SeletorRota } from '../components/Rotas/SeletorRota';

// Mock data - Em produção, viriam de API
const MOCK_CLIENTES: IClienteCorporativo[] = [
    {
        id: '1',
        razao_social: 'Tech Solutions Ltda',
        cnpj: '12.345.678/0001-90',
        contato_nome: 'Roberto Almeida',
        contato_email: 'roberto@techsolutions.com',
        contato_telefone: '(11) 3333-4444',
        credito_disponivel: 50000,
        dia_vencimento_fatura: 10
    },
    {
        id: '2',
        razao_social: 'Construtora ABC S/A',
        cnpj: '98.765.432/0001-10',
        contato_nome: 'Ana Paula Costa',
        contato_email: 'ana@constru torabc.com',
        contato_telefone: '(11) 4444-5555',
        credito_disponivel: 100000,
        dia_vencimento_fatura: 15
    }
];

const MOCK_VEICULOS: IVeiculo[] = [
    {
        id: 'V001',
        placa: 'ABC-1234',
        modelo: 'Mercedes-Benz O500',
        tipo: 'ONIBUS',
        status: VeiculoStatus.ATIVO,
        proxima_revisao_km: 250000,
        capacidade_passageiros: 46
    },
    {
        id: 'V002',
        placa: 'DEF-5678',
        modelo: 'Scania K380',
        tipo: 'ONIBUS',
        status: VeiculoStatus.ATIVO,
        proxima_revisao_km: 300000,
        capacidade_passageiros: 42
    }
];

const MOCK_MOTORISTAS: IMotorista[] = [
    {
        id: 'M001',
        nome: 'Carlos Silva',
        cnh: '12345678900',
        categoria_cnh: 'D',
        validade_cnh: '2026-12-31',
        status: 'DISPONIVEL'
    },
    {
        id: 'M002',
        nome: 'João Santos',
        cnh: '98765432100',
        categoria_cnh: 'E',
        validade_cnh: '2025-08-20',
        status: 'DISPONIVEL'
    }
];

// Mock de rotas disponíveis
const MOCK_ROTAS: IRota[] = [
    {
        id: 'R001',
        nome: 'São Paulo → Campinas',
        tipo_rota: 'IDA',
        ativa: true,
        pontos: [
            {
                id: 'P1',
                nome: 'São Paulo, SP',
                ordem: 0,
                tipo: 'ORIGEM',
                horario_partida: '2024-01-15T07:00:00',
                permite_embarque: true,
                permite_desembarque: false
            },
            {
                id: 'P2',
                nome: 'Campinas, SP',
                ordem: 1,
                tipo: 'DESTINO',
                horario_chegada: '2024-01-15T09:00:00',
                permite_embarque: false,
                permite_desembarque: true
            }
        ],
        duracao_estimada_minutos: 120,
        distancia_total_km: 100
    },
    {
        id: 'R002',
        nome: 'São Paulo → Santos',
        tipo_rota: 'IDA',
        ativa: true,
        pontos: [
            {
                id: 'P3',
                nome: 'São Paulo, SP',
                ordem: 0,
                tipo: 'ORIGEM',
                horario_partida: '2024-01-15T08:00:00',
                permite_embarque: true,
                permite_desembarque: false
            },
            {
                id: 'P4',
                nome: 'Santos, SP',
                ordem: 1,
                tipo: 'DESTINO',
                horario_chegada: '2024-01-15T09:30:00',
                permite_embarque: false,
                permite_desembarque: true
            }
        ],
        duracao_estimada_minutos: 90,
        distancia_total_km: 75
    },
    {
        id: 'R003',
        nome: 'São Paulo → Rio de Janeiro',
        tipo_rota: 'IDA',
        ativa: true,
        pontos: [
            {
                id: 'P5',
                nome: 'São Paulo, SP',
                ordem: 0,
                tipo: 'ORIGEM',
                horario_partida: '2024-01-15T22:00:00',
                permite_embarque: true,
                permite_desembarque: false
            },
            {
                id: 'P6',
                nome: 'Rio de Janeiro, RJ',
                ordem: 1,
                tipo: 'DESTINO',
                horario_chegada: '2024-01-16T04:00:00',
                permite_embarque: false,
                permite_desembarque: true
            }
        ],
        duracao_estimada_minutos: 360,
        distancia_total_km: 430
    },
    {
        id: 'R004',
        nome: 'Campinas → São Paulo',
        tipo_rota: 'VOLTA',
        ativa: true,
        pontos: [
            {
                id: 'P7',
                nome: 'Campinas, SP',
                ordem: 0,
                tipo: 'ORIGEM',
                horario_partida: '2024-01-15T18:00:00',
                permite_embarque: true,
                permite_desembarque: false
            },
            {
                id: 'P8',
                nome: 'São Paulo, SP',
                ordem: 1,
                tipo: 'DESTINO',
                horario_chegada: '2024-01-15T20:00:00',
                permite_embarque: false,
                permite_desembarque: true
            }
        ],
        duracao_estimada_minutos: 120,
        distancia_total_km: 100
    }
];

export const NovoFretamento: React.FC = () => {
    const navigate = useNavigate();

    // Estados do formulário
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

    const clienteSelecionado = MOCK_CLIENTES.find(c => c.id === clienteId);
    const veiculoSelecionado = MOCK_VEICULOS.find(v => v.id === veiculoId);
    const motoristaSelecionado = MOCK_MOTORISTAS.find(m => m.id === motoristaId);

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
        // Se tem rota de volta, precisamos de ambas
        if (temRotaVolta) {
            if (!rotaSelecionada || !rotaVoltaSelecionada) {
                // Se ainda não selecionou ambas, mostra parcial se tiver ida
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

            // Ambas selecionadas: combinar informações
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

        // Apenas Ida
        if (!rotaSelecionada || rotaSelecionada.pontos.length < 2) {
            return null;
        }

        const origem = rotaSelecionada.pontos[0];
        const destino = rotaSelecionada.pontos[rotaSelecionada.pontos.length - 1];
    }, [rotaSelecionada, rotaVoltaSelecionada, temRotaVolta]);

    const calcularDuracao = () => {
        if (!dataInicio || !dataFim) return '';

        const inicio = new Date(dataInicio);
        const fim = new Date(dataFim);
        const dias = Math.floor((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        if (dias === 1) return '1 dia';
        if (dias < 30) return `${dias} dias`;

        const meses = Math.floor(dias / 30);
        return `${meses} ${meses === 1 ? 'mês' : 'meses'}`;
    };

    const handleSalvar = () => {
        // Validações
        if (!clienteId) {
            alert('Selecione um cliente corporativo');
            return;
        }
        if (!rotaSelecionada) {
            alert('Selecione uma rota de ida');
            return;
        }
        if (temRotaVolta && !rotaVoltaSelecionada) {
            alert('Selecione uma rota de volta');
            return;
        }
        if (!dataInicio) {
            alert('Informe a data de início');
            return;
        }
        if (!dataFim) {
            alert('Informe a data de fim');
            return;
        }
        if (new Date(dataFim) < new Date(dataInicio)) {
            alert('A data de fim deve ser igual ou posterior à data de início');
            return;
        }

        const origem = rotaSelecionada.pontos[0]?.nome || '';
        const destino = rotaSelecionada.pontos[rotaSelecionada.pontos.length - 1]?.nome || '';

        const fretamento = {
            id: `FRET-${Date.now()}`,
            cliente_corporativo_id: clienteId,
            veiculo_id: veiculoId || undefined,
            motorista_id: motoristaId || undefined,
            origem,
            destino,
            rota_ida_id: rotaSelecionada.id,
            rota_volta_id: temRotaVolta ? rotaVoltaSelecionada?.id : undefined,
            data_inicio: dataInicio + (horaInicio ? `T${horaInicio}:00` : 'T00:00:00'),
            data_fim: dataFim + (horaFim ? `T${horaFim}:00` : 'T23:59:59'),
            tipo,
            status: 'SOLICITACAO' as const,
            valor_total: 0, // Será preenchido no orçamento
            moeda: Moeda.BRL,
            observacoes: observacoes || undefined
        };

        console.log('Solicitação de fretamento criada:', fretamento);
        alert('Solicitação de fretamento enviada com sucesso!');
        navigate('/admin/fretamento');
    };

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
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                    <Save size={18} />
                    Enviar Solicitação
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
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Selecione o Cliente *
                            </label>
                            <select
                                value={clienteId}
                                onChange={(e) => setClienteId(e.target.value)}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">-- Selecione um cliente --</option>
                                {MOCK_CLIENTES.map((cliente) => (
                                    <option key={cliente.id} value={cliente.id}>
                                        {cliente.razao_social} - CNPJ: {cliente.cnpj}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {clienteSelecionado && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                    <div>
                                        <p className="text-slate-600 dark:text-slate-400 mb-1">Contato</p>
                                        <p className="font-semibold text-slate-800 dark:text-white">{clienteSelecionado.contato_nome}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{clienteSelecionado.contato_email}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-600 dark:text-slate-400 mb-1">Telefone</p>
                                        <p className="font-semibold text-slate-800 dark:text-white">{clienteSelecionado.contato_telefone}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-600 dark:text-slate-400 mb-1">Crédito Disponível</p>
                                        <div className="flex items-center gap-1">
                                            <DollarSign size={16} className="text-green-600" />
                                            <p className="font-bold text-green-600 dark:text-green-400">
                                                R$ {clienteSelecionado.credito_disponivel.toLocaleString('pt-BR')}
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
                            < input
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
                                    rotas={MOCK_ROTAS}
                                    tipoFiltro="IDA"
                                    rotaSelecionada={rotaSelecionada}
                                    onChange={setRotaSelecionada}
                                />
                            </div>
                        )}
                        {abaRotaAtiva === 'VOLTA' && temRotaVolta && (
                            <div className="animate-in fade-in duration-300">
                                <SeletorRota
                                    rotas={MOCK_ROTAS}
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
                                {MOCK_VEICULOS.filter(v => v.status === 'ATIVO').map((veiculo) => (
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
                                {MOCK_MOTORISTAS.filter(m => m.status === 'DISPONIVEL').map((motorista) => (
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

                {/* Período */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <Calendar size={20} className="text-green-600" />
                        Período
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
                                    <input
                                        type="date"
                                        value={dataInicio}
                                        onChange={(e) => setDataInicio(e.target.value)}
                                        className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
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
                                    <input
                                        type="date"
                                        value={dataFim}
                                        onChange={(e) => setDataFim(e.target.value)}
                                        min={dataInicio}
                                        className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    </div>

                    {dataInicio && dataFim && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                📅 <strong>Duração:</strong> {calcularDuracao()}
                            </p>
                        </div>
                    )}
                </div>

                {/* Detalhes e Observações */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <FileText size={20} className="text-slate-600" />
                        Detalhes e Observações
                    </h3>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Observações e Requisitos Especiais
                        </label>
                        <textarea
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                            placeholder="Ex: Transporte diário de funcionários, Segunda a Sexta, horários: 7h e 18h. Necessário ar condicionado e Wi-Fi."
                            rows={5}
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Inclua informações sobre horários, frequência, requisitos especiais do veículo, número estimado de passageiros, etc.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
