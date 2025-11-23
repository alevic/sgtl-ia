import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { IRota, Moeda, VeiculoStatus, TipoAssento, IAssento, AssentoStatus, TipoDocumento } from '../types';
import {
    ArrowLeft, Bus, Save, DollarSign, Image, Route, Clock, MapPin, Users, X, Plus, Calendar
} from 'lucide-react';
import { SeletorRota } from '../components/Rotas/SeletorRota';
import { SeletorMultiplo } from '../components/Motoristas/SeletorMultiplo';
import { calcularCamposViagem } from '../utils/rotaValidation';

const MOCK_VEICULOS = [
    {
        id: 'V001',
        placa: 'ABC-1234',
        modelo: 'Mercedes-Benz O500',
        tipo: 'ONIBUS' as const,
        status: VeiculoStatus.ATIVO,
        proxima_revisao_km: 150000,
        mapa_assentos: [
            { numero: '1', tipo: TipoAssento.LEITO, status: AssentoStatus.LIVRE },
            { numero: '2', tipo: TipoAssento.LEITO, status: AssentoStatus.LIVRE },
            { numero: '3', tipo: TipoAssento.SEMI_LEITO, status: AssentoStatus.LIVRE },
            { numero: '4', tipo: TipoAssento.SEMI_LEITO, status: AssentoStatus.LIVRE }
        ] as Partial<IAssento>[]
    },
    {
        id: 'V002',
        placa: 'DEF-5678',
        modelo: 'Volvo 9800',
        tipo: 'ONIBUS' as const,
        status: VeiculoStatus.ATIVO,
        proxima_revisao_km: 120000,
        mapa_assentos: [
            { numero: '1', tipo: TipoAssento.CAMA, status: AssentoStatus.LIVRE },
            { numero: '2', tipo: TipoAssento.CAMA, status: AssentoStatus.LIVRE },
            { numero: '3', tipo: TipoAssento.LEITO, status: AssentoStatus.LIVRE },
            { numero: '4', tipo: TipoAssento.LEITO, status: AssentoStatus.LIVRE }
        ] as Partial<IAssento>[]
    }
];

const MOCK_MOTORISTAS = [
    {
        id: 'M001',
        nome: 'Carlos Silva',
        cnh: '12345678900',
        categoria_cnh: 'D',
        validade_cnh: '2026-12-31',
        status: 'DISPONIVEL' as const,
        documento_tipo: TipoDocumento.CPF,
        documento_numero: '123.456.789-00',
        nacionalidade: 'Brasileira'
    },
    {
        id: 'M002',
        nome: 'João Santos',
        cnh: '98765432100',
        categoria_cnh: 'D',
        validade_cnh: '2025-06-30',
        status: 'DISPONIVEL' as const,
        documento_tipo: TipoDocumento.CPF,
        documento_numero: '987.654.321-00',
        nacionalidade: 'Brasileira'
    }
];

// Mock de rotas pré-cadastradas
const MOCK_ROTAS: IRota[] = [
    {
        id: 'R001',
        nome: 'SP → RJ Expressa',
        tipo_rota: 'IDA',
        ativa: true,
        pontos: [
            {
                id: 'P1',
                nome: 'São Paulo, SP',
                ordem: 0,
                tipo: 'ORIGEM',
                horario_partida: '2024-01-20T08:00:00',
                permite_embarque: true,
                permite_desembarque: false
            },
            {
                id: 'P2',
                nome: 'Rio de Janeiro, RJ',
                ordem: 1,
                tipo: 'DESTINO',
                horario_chegada: '2024-01-20T14:00:00',
                permite_embarque: false,
                permite_desembarque: true
            }
        ],
        duracao_estimada_minutos: 360,
        distancia_total_km: 430
    },
    {
        id: 'R002',
        nome: 'SP → RJ via Curitiba',
        tipo_rota: 'IDA',
        ativa: true,
        pontos: [
            {
                id: 'P3',
                nome: 'São Paulo, SP',
                ordem: 0,
                tipo: 'ORIGEM',
                horario_partida: '2024-01-20T20:00:00',
                permite_embarque: true,
                permite_desembarque: false
            },
            {
                id: 'P4',
                nome: 'Curitiba, PR',
                ordem: 1,
                tipo: 'PARADA_INTERMEDIARIA',
                horario_chegada: '2024-01-21T02:00:00',
                horario_partida: '2024-01-21T02:30:00',
                permite_embarque: true,
                permite_desembarque: true
            },
            {
                id: 'P5',
                nome: 'Rio de Janeiro, RJ',
                ordem: 2,
                tipo: 'DESTINO',
                horario_chegada: '2024-01-21T08:00:00',
                permite_embarque: false,
                permite_desembarque: true
            }
        ],
        duracao_estimada_minutos: 720,
        distancia_total_km: 550
    },
    {
        id: 'R003',
        nome: 'SP → Florianópolis (via Curitiba)',
        tipo_rota: 'IDA',
        ativa: true,
        pontos: [
            {
                id: 'P6',
                nome: 'São Paulo, SP',
                ordem: 0,
                tipo: 'ORIGEM',
                horario_partida: '2024-01-20T22:00:00',
                permite_embarque: true,
                permite_desembarque: false
            },
            {
                id: 'P7',
                nome: 'Curitiba, PR',
                ordem: 1,
                tipo: 'PARADA_INTERMEDIARIA',
                horario_chegada: '2024-01-21T04:00:00',
                horario_partida: '2024-01-21T04:30:00',
                permite_embarque: true,
                permite_desembarque: true
            },
            {
                id: 'P8',
                nome: 'Florianópolis, SC',
                ordem: 2,
                tipo: 'DESTINO',
                horario_chegada: '2024-01-21T09:00:00',
                permite_embarque: false,
                permite_desembarque: true
            }
        ],
        duracao_estimada_minutos: 660,
        distancia_total_km: 700
    },
    {
        id: 'R004',
        nome: 'RJ → SP Noturna',
        tipo_rota: 'VOLTA',
        ativa: true,
        pontos: [
            {
                id: 'P9',
                nome: 'Rio de Janeiro, RJ',
                ordem: 0,
                tipo: 'ORIGEM',
                horario_partida: '2024-01-21T22:00:00',
                permite_embarque: true,
                permite_desembarque: false
            },
            {
                id: 'P10',
                nome: 'São Paulo, SP',
                ordem: 1,
                tipo: 'DESTINO',
                horario_chegada: '2024-01-22T06:00:00',
                permite_embarque: false,
                permite_desembarque: true
            }
        ],
        duracao_estimada_minutos: 480,
        distancia_total_km: 430
    },
    {
        id: 'R005',
        nome: 'Florianópolis → SP (via Curitiba)',
        tipo_rota: 'VOLTA',
        ativa: true,
        pontos: [
            {
                id: 'P11',
                nome: 'Florianópolis, SC',
                ordem: 0,
                tipo: 'ORIGEM',
                horario_partida: '2024-01-22T20:00:00',
                permite_embarque: true,
                permite_desembarque: false
            },
            {
                id: 'P12',
                nome: 'Curitiba, PR',
                ordem: 1,
                tipo: 'PARADA_INTERMEDIARIA',
                horario_chegada: '2024-01-23T01:00:00',
                horario_partida: '2024-01-23T01:30:00',
                permite_embarque: true,
                permite_desembarque: true
            },
            {
                id: 'P13',
                nome: 'São Paulo, SP',
                ordem: 2,
                tipo: 'DESTINO',
                horario_chegada: '2024-01-23T07:00:00',
                permite_embarque: false,
                permite_desembarque: true
            }
        ],
        duracao_estimada_minutos: 660,
        distancia_total_km: 700
    }
];

export const NovaViagem: React.FC = () => {
    const navigate = useNavigate();

    const [titulo, setTitulo] = useState('');
    const [tipoViagem, setTipoViagem] = useState<'IDA_E_VOLTA' | 'IDA' | 'VOLTA'>('IDA_E_VOLTA');
    const [internacional, setInternacional] = useState(false);
    const [moeda, setMoeda] = useState<Moeda>(Moeda.BRL);
    const [veiculoId, setVeiculoId] = useState('');
    const [motoristaIds, setMotoristaIds] = useState<string[]>([]);
    const [precosPorTipo, setPrecosPorTipo] = useState<Record<string, number>>({});
    const [imagemCapa, setImagemCapa] = useState<string>('');
    const [galeria, setGaleria] = useState<string[]>([]);

    // Seleção de rotas (no lugar de criação inline)
    const [rotaIdaSelecionada, setRotaIdaSelecionada] = useState<IRota | null>(null);
    const [rotaVoltaSelecionada, setRotaVoltaSelecionada] = useState<IRota | null>(null);
    const [abaRotaAtiva, setAbaRotaAtiva] = useState<'IDA' | 'VOLTA'>('IDA');

    // Campos calculados automaticamente das rotas
    const resumoViagem = useMemo(() => {
        // Para IDA_E_VOLTA, precisamos de ambas as rotas
        if (tipoViagem === 'IDA_E_VOLTA') {
            if (!rotaIdaSelecionada || !rotaVoltaSelecionada) {
                // Se ainda não selecionou ambas, mostra parcial
                if (rotaIdaSelecionada) {
                    const origem = rotaIdaSelecionada.pontos[0];
                    const destino = rotaIdaSelecionada.pontos[rotaIdaSelecionada.pontos.length - 1];
                    const numParadas = rotaIdaSelecionada.pontos.length - 2;

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
            const origemIda = rotaIdaSelecionada.pontos[0];
            const destinoIda = rotaIdaSelecionada.pontos[rotaIdaSelecionada.pontos.length - 1];
            const destinoVolta = rotaVoltaSelecionada.pontos[rotaVoltaSelecionada.pontos.length - 1];
            const numParadasIda = rotaIdaSelecionada.pontos.length - 2;
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

        // Para IDA ou VOLTA simples
        const rotaPrincipal = tipoViagem === 'VOLTA' ? rotaVoltaSelecionada : rotaIdaSelecionada;

        if (!rotaPrincipal || rotaPrincipal.pontos.length < 2) {
            return null;
        }

        const origem = rotaPrincipal.pontos[0];
        const destino = rotaPrincipal.pontos[rotaPrincipal.pontos.length - 1];
        const numParadas = rotaPrincipal.pontos.length - 2;

        return {
            origem: origem.nome || '(não definido)',
            destino: destino.nome || '(não definido)',
            dataPartida: origem.horario_partida,
            dataChegada: destino.horario_chegada,
            dataRetorno: null,
            horaRetorno: null,
            numParadas
        };
    }, [rotaIdaSelecionada, rotaVoltaSelecionada, tipoViagem]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isGallery: boolean = false) => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (isGallery) {
                    setGaleria(prev => [...prev, reader.result as string]);
                } else {
                    setImagemCapa(reader.result as string);
                }
            };
            reader.readAsDataURL(file as Blob);
        });
    };

    const veiculoSelecionado = MOCK_VEICULOS.find(v => v.id === veiculoId);
    const tiposAssento = veiculoSelecionado?.mapa_assentos
        ? Array.from(new Set(veiculoSelecionado.mapa_assentos.map(a => a.tipo)))
        : [];

    const handlePrecoChange = (tipo: string, valor: string) => {
        setPrecosPorTipo(prev => ({
            ...prev,
            [tipo]: parseFloat(valor) || 0
        }));
    };

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

    const handleSalvar = () => {
        const viagemData: any = {
            titulo,
            tipo_viagem: tipoViagem,
            rota_ida_id: rotaIdaSelecionada?.id,
            rota_volta_id: rotaVoltaSelecionada?.id,
            rota_ida: rotaIdaSelecionada,
            rota_volta: rotaVoltaSelecionada,
            usa_sistema_rotas: true,
            internacional,
            moeda_base: moeda,
            veiculo_id: veiculoId,
            motorista_ids: motoristaIds,
            precos_por_tipo: precosPorTipo,
            imagem_capa: imagemCapa,
            galeria,
            ocupacao_percent: 0,
            status: 'AGENDADA'
        };

        // Calcular campos derivados (origem, destino, datas, paradas)
        const viagemCompleta = calcularCamposViagem(viagemData as any);

        console.log('Salvando viagem:', viagemCompleta);
        navigate('/admin/viagens');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/viagens')}
                    className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl bold text-slate-800 dark:text-white">Nova Viagem</h1>
                    <p className="text-slate-500 dark:text-slate-400">Selecione as rotas e detalhes da viagem</p>
                </div>
                <button
                    onClick={handleSalvar}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                    <Save size={18} />
                    Salvar Viagem
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coluna Principal */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Informações Básicas */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <Bus size={20} className="text-blue-600" />
                            Informações Básicas
                        </h3>

                        <div className="space-y-4">
                            {/* Tipo de Viagem */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Tipo de Viagem
                                </label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="tipoViagem"
                                            value="IDA_E_VOLTA"
                                            checked={tipoViagem === 'IDA_E_VOLTA'}
                                            onChange={(e) => setTipoViagem(e.target.value as any)}
                                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-slate-700 dark:text-slate-300">Ida e Volta</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="tipoViagem"
                                            value="IDA"
                                            checked={tipoViagem === 'IDA'}
                                            onChange={(e) => setTipoViagem(e.target.value as any)}
                                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-slate-700 dark:text-slate-300">Ida</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="tipoViagem"
                                            value="VOLTA"
                                            checked={tipoViagem === 'VOLTA'}
                                            onChange={(e) => setTipoViagem(e.target.value as any)}
                                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-slate-700 dark:text-slate-300">Volta</span>
                                    </label>
                                </div>
                            </div>

                            {/* Título */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Título da Viagem
                                </label>
                                <input
                                    type="text"
                                    value={titulo}
                                    onChange={(e) => setTitulo(e.target.value)}
                                    placeholder="Ex: São Paulo → Rio de Janeiro"
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Internacional e Moeda */}
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={internacional}
                                        onChange={(e) => setInternacional(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Viagem Internacional
                                    </span>
                                </label>

                                {internacional && (
                                    <select
                                        value={moeda}
                                        onChange={(e) => setMoeda(e.target.value as Moeda)}
                                        className="p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value={Moeda.BRL}>BRL</option>
                                        <option value={Moeda.USD}>USD</option>
                                        <option value={Moeda.EUR}>EUR</option>
                                        <option value={Moeda.ARS}>ARS</option>
                                        <option value={Moeda.PYG}>PYG</option>
                                    </select>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Resumo da Viagem (Calculado) */}
                    {resumoViagem && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800 p-6">
                            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                                <MapPin size={20} className="text-blue-600" />
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

                    {/* Seleção de Rotas */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <Route size={20} className="text-purple-600" />
                            Seleção de Rotas
                        </h3>

                        {/* Tabs */}
                        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 mb-6">
                            {(tipoViagem === 'IDA' || tipoViagem === 'IDA_E_VOLTA') && (
                                <button
                                    onClick={() => setAbaRotaAtiva('IDA')}
                                    className={`px-4 py-2 font-medium transition-colors border-b-2 ${abaRotaAtiva === 'IDA'
                                        ? 'border-green-600 text-green-600 dark:text-green-400'
                                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                >
                                    Rota de Ida
                                </button>
                            )}
                            {(tipoViagem === 'VOLTA' || tipoViagem === 'IDA_E_VOLTA') && (
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

                        {/* Seletor de Rota */}
                        <div>
                            {abaRotaAtiva === 'IDA' && (tipoViagem === 'IDA' || tipoViagem === 'IDA_E_VOLTA') && (
                                <SeletorRota
                                    rotas={MOCK_ROTAS}
                                    tipoFiltro="IDA"
                                    rotaSelecionada={rotaIdaSelecionada}
                                    onChange={setRotaIdaSelecionada}
                                />
                            )}
                            {abaRotaAtiva === 'VOLTA' && (tipoViagem === 'VOLTA' || tipoViagem === 'IDA_E_VOLTA') && (
                                <SeletorRota
                                    rotas={MOCK_ROTAS}
                                    tipoFiltro="VOLTA"
                                    rotaSelecionada={rotaVoltaSelecionada}
                                    onChange={setRotaVoltaSelecionada}
                                />
                            )}
                        </div>
                    </div>

                    {/* Imagens */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <Image size={20} className="text-purple-600" />
                            Imagens da Viagem
                        </h3>

                        <div className="space-y-6">
                            {/* Capa */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Imagem de Capa
                                </label>
                                <div className="flex items-center gap-4">
                                    {imagemCapa ? (
                                        <div className="relative w-32 h-20 rounded-lg overflow-hidden group">
                                            <img src={imagemCapa} alt="Capa" className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => setImagemCapa('')}
                                                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="w-32 h-20 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
                                            <Plus size={24} className="text-slate-400" />
                                            <span className="text-xs text-slate-500">Adicionar</span>
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e)} />
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Galeria */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Galeria de Fotos
                                </label>
                                <div className="grid grid-cols-4 gap-4">
                                    {galeria.map((img, idx) => (
                                        <div key={idx} className="relative w-full h-20 rounded-lg overflow-hidden group">
                                            <img src={img} alt={`Galeria ${idx}`} className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => setGaleria(prev => prev.filter((_, i) => i !== idx))}
                                                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                    ))}
                                    <label className="w-full h-20 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
                                        <Plus size={24} className="text-slate-400" />
                                        <span className="text-xs text-slate-500">Adicionar</span>
                                        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImageUpload(e, true)} />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Coluna Lateral */}
                <div className="space-y-6">
                    {/* Veículo */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <Bus size={20} className="text-purple-600" />
                            Veículo
                        </h3>

                        <select
                            value={veiculoId}
                            onChange={(e) => setVeiculoId(e.target.value)}
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">-- Selecione --</option>
                            {MOCK_VEICULOS.map((veiculo) => (
                                <option key={veiculo.id} value={veiculo.id}>
                                    {veiculo.placa} - {veiculo.modelo}
                                </option>
                            ))}
                        </select>

                        {/* Preços */}
                        {veiculoId && tiposAssento.length > 0 && (
                            <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-2">
                                <h4 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 text-sm">
                                    <DollarSign size={16} className="text-green-600" />
                                    Preços por Tipo de Assento
                                </h4>
                                <div className="grid gap-3">
                                    {tiposAssento.map((tipo) => (
                                        <div key={tipo} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                {tipo?.replace('_', ' ')}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                    {moeda}
                                                </span>
                                                <input
                                                    type="number"
                                                    placeholder="0.00"
                                                    step="0.01"
                                                    min="0"
                                                    value={precosPorTipo[tipo as string] || ''}
                                                    onChange={(e) => handlePrecoChange(tipo as string, e.target.value)}
                                                    className="w-24 p-1 text-right border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Motoristas */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <Users size={20} className="text-orange-600" />
                            Motoristas
                        </h3>

                        <SeletorMultiplo
                            motoristas={MOCK_MOTORISTAS}
                            selecionados={motoristaIds}
                            onChange={setMotoristaIds}
                            maxHeight="300px"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
