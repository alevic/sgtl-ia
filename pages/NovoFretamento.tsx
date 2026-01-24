import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IClienteCorporativo, IVeiculo, IMotorista, Moeda, VeiculoStatus, IRota, ICliente } from '../types';
import { ArrowLeft, Save, Building2, Bus, MapPin, Calendar, FileText, User, DollarSign, Route, Clock, Mail, Users } from 'lucide-react';
import { SeletorRota } from '../components/Rotas/SeletorRota';
import { SeletorCliente, ClienteFretamento } from '../components/Selectors/SeletorCliente';
import { chartersService } from '../services/chartersService';
import { clientsService } from '../services/clientsService';
import { vehiclesService } from '../services/vehiclesService';
import { driversService } from '../services/driversService';
import { routesService } from '../services/routesService';
import { DatePicker } from '../components/Form/DatePicker';
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { AlertCircle, CheckCircle2, Loader } from 'lucide-react';
import { Button } from '../components/ui/button';
import { CardContent } from '../components/ui/card';
import { PageHeader } from '../components/Layout/PageHeader';
import { FormSection } from '../components/Layout/FormSection';
import { cn } from '../lib/utils';

export const NovoFretamento: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

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
            setError('Erro ao carregar dados iniciais.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
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
        setError(null);
        if (!clienteId) { setError('Selecione um cliente'); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
        if (!rotaSelecionada) { setError('Selecione uma rota de ida'); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
        if (temRotaVolta && !rotaVoltaSelecionada) { setError('Selecione uma rota de volta'); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
        if (!dataInicio) { setError('Informe a data de início'); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
        if (!dataFim) { setError('Informe a data de fim'); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
        if (passageiros <= 0) { setError('Informe a quantidade de passageiros'); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }

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
            setSuccess('Solicitação de fretamento enviada com sucesso!');
            setTimeout(() => navigate('/admin/fretamento'), 2000);
        } catch (error) {
            console.error('Erro ao salvar fretamento:', error);
            setError('Erro ao salvar solicitação.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
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
        <div key="novo-fretamento-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {error && (
                <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2 duration-300 rounded-3xl border-destructive/20 bg-destructive/5 backdrop-blur-sm">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="font-black uppercase text-[12px] tracking-widest">Incidente no Registro</AlertTitle>
                    <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
                </Alert>
            )}
            {success && (
                <Alert className="animate-in fade-in slide-in-from-top-2 duration-300 rounded-3xl border-emerald-500/20 bg-emerald-500/5 backdrop-blur-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <AlertTitle className="font-black uppercase text-[12px] tracking-widest text-emerald-500">Sucesso</AlertTitle>
                    <AlertDescription className="text-xs font-medium text-emerald-600/80">{success}</AlertDescription>
                </Alert>
            )}

            {/* Header Executivo */}
            <PageHeader
                title="Novo Fretamento"
                subtitle="Registre uma nova solicitação de aluguel de frota para cliente corporativo"
                backLink="/admin/fretamento"
                backText="Painel de Fretamento"
                rightElement={
                    <>
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/admin/fretamento')}
                            className="h-14 rounded-xl px-6 font-black uppercase text-[12px] tracking-widest"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSalvar}
                            disabled={saving}
                            className="h-14 rounded-xl px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[12px] tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {saving ? (
                                <Loader className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            {saving ? 'Processando...' : 'Criar Fretamento'}
                        </Button>
                    </>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Coluna Principal */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Cliente Corporativo */}
                    <FormSection
                        title="Cliente Corporativo"
                        icon={Building2}
                    >
                        <div className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Selecionar Cliente</label>
                                <SeletorCliente
                                    clientes={clientes}
                                    clienteSelecionado={clienteSelecionado}
                                    onSelecionarCliente={(cliente) => setClienteId(cliente?.id || '')}
                                />
                            </div>

                            {clienteSelecionado && (
                                <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6 animate-in zoom-in-95 duration-300">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-1">
                                            <p className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">Contato</p>
                                            <p className="font-bold text-foreground">
                                                {'contato_nome' in clienteSelecionado ? clienteSelecionado.contato_nome : clienteSelecionado.nome}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {'contato_email' in clienteSelecionado ? clienteSelecionado.contato_email : clienteSelecionado.email}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">Telefone</p>
                                            <p className="font-bold text-foreground">
                                                {'contato_telefone' in clienteSelecionado ? clienteSelecionado.contato_telefone : clienteSelecionado.telefone || '-'}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">Crédito Disponível</p>
                                            <div className="flex items-center gap-1.5 text-emerald-600">
                                                <DollarSign size={16} strokeWidth={3} />
                                                <p className="text-xl font-black tracking-tighter">
                                                    R$ {('credito_disponivel' in clienteSelecionado ? clienteSelecionado.credito_disponivel : (clienteSelecionado as ICliente).saldo_creditos || 0).toLocaleString('pt-BR')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </FormSection>

                    {/* Rota e Localização */}
                    <FormSection
                        title="Rota e Itinerário"
                        icon={MapPin}
                    >
                        <div className="space-y-8">
                            {/* Sentido da Viagem */}
                            <div className="space-y-3">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Tipo de Trajeto</label>
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => {
                                            setTemRotaVolta(false);
                                            setAbaRotaAtiva('IDA');
                                            setRotaVoltaSelecionada(null);
                                        }}
                                        className={cn(
                                            "flex-1 p-4 rounded-xl border-2 transition-all font-bold text-sm flex items-center justify-center gap-2",
                                            !temRotaVolta ? "border-primary bg-primary/5 text-primary" : "border-border/50 hover:border-border text-muted-foreground"
                                        )}
                                    >
                                        SOMENTE IDA
                                    </button>
                                    <button
                                        onClick={() => setTemRotaVolta(true)}
                                        className={cn(
                                            "flex-1 p-4 rounded-xl border-2 transition-all font-bold text-sm flex items-center justify-center gap-2",
                                            temRotaVolta ? "border-primary bg-primary/5 text-primary" : "border-border/50 hover:border-border text-muted-foreground"
                                        )}
                                    >
                                        IDA E VOLTA
                                    </button>
                                </div>
                            </div>

                            {/* Tabs Simplified */}
                            {temRotaVolta && (
                                <div className="flex p-1 bg-muted/40 rounded-xl border border-border/50">
                                    <button
                                        onClick={() => setAbaRotaAtiva('IDA')}
                                        className={cn(
                                            "flex-1 py-2.5 rounded-xl font-black text-xs transition-all",
                                            abaRotaAtiva === 'IDA' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        ROTA DE IDA
                                    </button>
                                    <button
                                        onClick={() => setAbaRotaAtiva('VOLTA')}
                                        className={cn(
                                            "flex-1 py-2.5 rounded-xl font-black text-xs transition-all",
                                            abaRotaAtiva === 'VOLTA' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        ROTA DE VOLTA
                                    </button>
                                </div>
                            )}

                            <div>
                                {abaRotaAtiva === 'IDA' && (
                                    <div className="animate-in fade-in duration-500">
                                        <SeletorRota
                                            rotas={rotas}
                                            tipoFiltro="IDA"
                                            rotaSelecionada={rotaSelecionada}
                                            onChange={setRotaSelecionada}
                                        />
                                    </div>
                                )}
                                {abaRotaAtiva === 'VOLTA' && temRotaVolta && (
                                    <div className="animate-in fade-in duration-500">
                                        <SeletorRota
                                            rotas={rotas}
                                            tipoFiltro="VOLTA"
                                            rotaSelecionada={rotaVoltaSelecionada}
                                            onChange={setRotaVoltaSelecionada}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Resumo visual estilizado */}
                            {resumoViagem && (
                                <div className="bg-gradient-to-br from-primary/5 to-indigo-500/5 border border-primary/10 rounded-3xl p-8 space-y-6">
                                    <div className="flex items-center gap-2 text-primary">
                                        <Route size={18} strokeWidth={2.5} />
                                        <span className="text-xs font-black uppercase tracking-widest">Resumo Operacional</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                                        <div className="space-y-4">
                                            <div className="relative pl-6 border-l-2 border-dashed border-primary/30 py-1">
                                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary border-4 border-background" />
                                                <p className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">Origem</p>
                                                <p className="font-bold text-lg">{resumoViagem.origem}</p>
                                                <p className="text-xs text-primary font-bold">{formatarDataHora(resumoViagem.dataPartida)}</p>
                                            </div>

                                            <div className="relative pl-6 border-l-2 border-dashed border-transparent py-1">
                                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-4 border-background" />
                                                <p className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">Destino</p>
                                                <p className="font-bold text-lg">{resumoViagem.destino}</p>
                                                <p className="text-xs text-emerald-600 font-bold">{formatarDataHora(resumoViagem.dataChegada)}</p>
                                            </div>
                                        </div>

                                        {resumoViagem.dataRetorno && (
                                            <div className="space-y-4">
                                                <div className="relative pl-6 border-l-2 border-dashed border-orange-500/30 py-1">
                                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-orange-500 border-4 border-background" />
                                                    <p className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">Retorno</p>
                                                    <p className="font-bold text-lg">{resumoViagem.origem}</p>
                                                    <p className="text-xs text-orange-600 font-bold">{formatarDataHora(resumoViagem.dataRetorno)}</p>
                                                </div>

                                                <div className="relative pl-6 border-l-2 border-dashed border-transparent py-1">
                                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-background" />
                                                    <p className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">Chegada Final</p>
                                                    <p className="font-bold text-lg">{resumoViagem.destino}</p>
                                                    <p className="text-xs text-blue-600 font-bold">{formatarDataHora(resumoViagem.horaRetorno)}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </FormSection>
                </div>

                {/* Coluna Lateral (1/3) */}
                <div className="space-y-8">
                    {/* Configurações do Serviço */}
                    <FormSection
                        title="Configurações do Serviço"
                        icon={Bus}
                    >
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Modalidade de Fretamento</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setTipo('PONTUAL')}
                                        className={cn(
                                            "h-14 rounded-xl border-2 transition-all font-black text-[12px] tracking-widest uppercase",
                                            tipo === 'PONTUAL' ? "border-primary bg-primary/5 text-primary" : "border-border/40 text-muted-foreground hover:border-border"
                                        )}
                                    >
                                        PONTUAL
                                    </button>
                                    <button
                                        onClick={() => setTipo('RECORRENTE')}
                                        className={cn(
                                            "h-14 rounded-xl border-2 transition-all font-black text-[12px] tracking-widest uppercase",
                                            tipo === 'RECORRENTE' ? "border-primary bg-primary/5 text-primary" : "border-border/40 text-muted-foreground hover:border-border"
                                        )}
                                    >
                                        RECORRENTE
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Lotação Prevista (Pax)</label>
                                <div className="relative group">
                                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
                                    <input
                                        type="number"
                                        min="1"
                                        value={passageiros}
                                        onChange={(e) => setPassageiros(parseInt(e.target.value) || 0)}
                                        className="w-full h-14 pl-12 pr-4 bg-muted/40 border-border/50 rounded-xl font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        </div>
                    </FormSection>

                    {/* Recursos Operacionais */}
                    <FormSection
                        title="Alocação de Recursos"
                        icon={Users}
                    >
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Veículo Designado</label>
                                <div className="relative">
                                    <select
                                        value={veiculoId}
                                        onChange={(e) => setVeiculoId(e.target.value)}
                                        className="w-full h-14 px-4 bg-muted/40 border-border/50 rounded-xl font-black uppercase text-[12px] tracking-widest outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                                    >
                                        <option value="">AGUARDANDO ATRIBUIÇÃO</option>
                                        {veiculos.map((veiculo) => (
                                            <option key={veiculo.id} value={veiculo.id}>
                                                {veiculo.placa} - {veiculo.modelo}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Condutor Principal</label>
                                <div className="relative">
                                    <select
                                        value={motoristaId}
                                        onChange={(e) => setMotoristaId(e.target.value)}
                                        className="w-full h-14 px-4 bg-muted/40 border-border/50 rounded-xl font-black uppercase text-[12px] tracking-widest outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                                    >
                                        <option value="">AGUARDANDO ATRIBUIÇÃO</option>
                                        {motoristas.map((motorista) => (
                                            <option key={motorista.id} value={motorista.id}>
                                                {motorista.nome.toUpperCase()}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </FormSection>

                    {/* Datas do Evento */}
                    <FormSection
                        title="Cronograma da Operação"
                        icon={Calendar}
                    >
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Início do Serviço</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <DatePicker value={dataInicio} onChange={setDataInicio} />
                                    <input
                                        type="time"
                                        value={horaInicio}
                                        onChange={(e) => setHoraInicio(e.target.value)}
                                        className="h-14 px-4 bg-muted/40 border-border/50 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Término Previsto</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <DatePicker value={dataFim} onChange={setDataFim} />
                                    <input
                                        type="time"
                                        value={horaFim}
                                        onChange={(e) => setHoraFim(e.target.value)}
                                        className="h-14 px-4 bg-muted/40 border-border/50 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>
                        </div>
                    </FormSection>

                    {/* Notas e Observações */}
                    <FormSection
                        title="Detalhamento Adicional"
                        icon={FileText}
                    >
                        <textarea
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                            rows={4}
                            placeholder="Descreva particularidades do serviço, paradas extras ou exigências especiais do cliente..."
                            className="w-full p-4 bg-muted/40 border-border/50 rounded-2xl font-medium text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-all"
                        />
                    </FormSection>
                </div>
            </div>
        </div>
    );
};
