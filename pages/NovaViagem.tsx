import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IRota, IVeiculo, IMotorista, Moeda, IViagem, TripStatus, RouteType } from '../types';
import {
    ArrowLeft, Bus, Save, DollarSign, Image, Route, Clock, MapPin, Users, X, Plus, Calendar, Loader, Trash2
} from 'lucide-react';
import { SeletorRota } from '../components/Rotas/SeletorRota';
import { SeletorMotoristaMultiplo } from '../components/Selectors/SeletorMotoristaMultiplo';
import { calcularCamposViagem } from '../utils/rotaValidation';
import { tripsService } from '../services/tripsService';
import { SeletorTags } from '../components/Selectors/SeletorTags';
import { routesService } from '../services/routesService';
import { vehiclesService } from '../services/vehiclesService';
import { driversService } from '../services/driversService';
import { DatePicker } from '../components/Form/DatePicker';
import { TimePicker } from '../components/Form/TimePicker';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from '../components/ui/button';
import { CardContent } from '../components/ui/card';
import { PageHeader } from '../components/Layout/PageHeader';
import { FormSection } from '../components/Layout/FormSection';
import { cn } from '../lib/utils';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export const NovaViagem: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdicao = Boolean(id);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showGalleryClearConfirm, setShowGalleryClearConfirm] = useState(false);

    // Data Lists
    const [rotas, setRotas] = useState<IRota[]>([]);
    const [veiculos, setVeiculos] = useState<IVeiculo[]>([]);
    const [motoristas, setMotoristas] = useState<IMotorista[]>([]);

    // Form State
    const [titulo, setTitulo] = useState('');
    const [tipoViagem, setTipoViagem] = useState<'IDA_E_VOLTA' | 'IDA' | 'VOLTA'>('IDA');
    const [tags, setTags] = useState<string[]>([]); // New field
    const [internacional, setInternacional] = useState(false);
    const [moeda, setMoeda] = useState<Moeda>(Moeda.BRL);
    const [veiculoId, setVeiculoId] = useState('');
    const [motoristaIds, setMotoristaIds] = useState<string[]>([]);
    const [precosPorTipo, setPrecosPorTipo] = useState<Record<string, number>>({});
    const [imagemCapa, setImagemCapa] = useState<string>('');
    const [galeria, setGaleria] = useState<string[]>([]);
    const [notes, setNotes] = useState('');
    const [limiteBagagem, setLimiteBagagem] = useState(''); // New field
    const [alertas, setAlertas] = useState(''); // New field

    // Dates (Backend expects separate date/time)
    const [dataPartida, setDataPartida] = useState('');
    const [horaPartida, setHoraPartida] = useState('');
    const [dataChegada, setDataChegada] = useState('');
    const [horaChegada, setHoraChegada] = useState('');

    // Route Selection
    const [rotaIdaSelecionada, setRotaIdaSelecionada] = useState<IRota | null>(null);
    const [rotaVoltaSelecionada, setRotaVoltaSelecionada] = useState<IRota | null>(null);
    const [abaRotaAtiva, setAbaRotaAtiva] = useState<'IDA' | 'VOLTA'>('IDA');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [rotasData, veiculosData, motoristasData] = await Promise.all([
                routesService.getAll(),
                vehiclesService.getAll(),
                driversService.getAll()
            ]);
            setRotas(rotasData);
            setVeiculos(veiculosData);
            setMotoristas(motoristasData);

            if (isEdicao && id) {
                const viagem = await tripsService.getById(id);
                if (!viagem) {
                    throw new Error('Viagem não encontrada');
                }
                console.log('Viagem carregada (RAW):', {
                    departure_date: viagem.departure_date,
                    departure_time: viagem.departure_time,
                    arrival_date: viagem.arrival_date,
                    arrival_time: viagem.arrival_time
                });

                // Format dates for input (YYYY-MM-DD)
                const formatDateForInput = (dateString: string | Date | undefined | null) => {
                    if (!dateString) return '';
                    try {
                        // Handle Date object
                        if (dateString instanceof Date) {
                            return dateString.toISOString().split('T')[0];
                        }

                        // Handle string
                        if (typeof dateString === 'string') {
                            // If it's already YYYY-MM-DD
                            if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
                                return dateString;
                            }
                            // If it's ISO string (contains T), split it
                            if (dateString.includes('T')) {
                                return dateString.split('T')[0];
                            }
                            // Try to parse with Date as fallback
                            const date = new Date(dateString);
                            if (!isNaN(date.getTime())) {
                                return date.toISOString().split('T')[0];
                            }
                        }

                        return '';
                    } catch (e) {
                        console.error('Error formatting date:', e);
                        return '';
                    }
                };

                // Format times for input (HH:MM)
                const formatTimeForInput = (timeString: string | undefined | null) => {
                    if (!timeString) return '';
                    return timeString.substring(0, 5);
                };

                // Populate form
                setVeiculoId(viagem.vehicle_id || '');
                setMotoristaIds(viagem.driver_id ? [viagem.driver_id] : []);

                setDataPartida(formatDateForInput(viagem.departure_date));
                setHoraPartida(formatTimeForInput(viagem.departure_time));
                setDataChegada(formatDateForInput(viagem.arrival_date));
                setHoraChegada(formatTimeForInput(viagem.arrival_time));
                setNotes(viagem.notes || '');

                // New fields
                setTitulo(viagem.title || '');
                setTags(viagem.tags || []);
                setImagemCapa(viagem.cover_image || '');
                setGaleria(viagem.gallery || []);
                setLimiteBagagem(viagem.baggage_limit || '');
                setAlertas(viagem.alerts || '');

                // Prices
                const prices: Record<string, number> = {};
                if (viagem.price_conventional !== undefined && viagem.price_conventional !== null) prices['CONVENCIONAL'] = viagem.price_conventional;
                if (viagem.price_executive !== undefined && viagem.price_executive !== null) prices['EXECUTIVO'] = viagem.price_executive;
                if (viagem.price_semi_sleeper !== undefined && viagem.price_semi_sleeper !== null) prices['SEMI_LEITO'] = viagem.price_semi_sleeper;
                if (viagem.price_sleeper !== undefined && viagem.price_sleeper !== null) prices['LEITO'] = viagem.price_sleeper;
                if (viagem.price_bed !== undefined && viagem.price_bed !== null) prices['CAMA'] = viagem.price_bed;
                if (viagem.price_master_bed !== undefined && viagem.price_master_bed !== null) prices['CAMA_MASTER'] = viagem.price_master_bed;
                setPrecosPorTipo(prices);

                // Routes
                const rota = rotasData.find(r => r.id === viagem.route_id);
                if (rota) {
                    setRotaIdaSelecionada(rota);
                }

                // Return route (if exists)
                if (viagem.return_route_id) {
                    const rotaVolta = rotasData.find(r => r.id === viagem.return_route_id);
                    if (rotaVolta) {
                        setRotaVoltaSelecionada(rotaVolta);
                    }
                }
            }
        } catch (error: any) {
            console.error('Erro ao carregar dados:', error);
            setError(`Erro ao carregar dados iniciais: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setLoading(false);
        }
    };

    // Auto-fill dates based on route duration when route changes or start date changes
    useEffect(() => {
        if (rotaIdaSelecionada && dataPartida && horaPartida) {
            // Calculate arrival
            const startDateTime = new Date(`${dataPartida}T${horaPartida}`);

            if (!isNaN(startDateTime.getTime())) {
                const durationMinutes = rotaIdaSelecionada.duracao_estimada_minutos || 0;
                const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

                if (!isNaN(endDateTime.getTime())) {
                    setDataChegada(endDateTime.toISOString().split('T')[0]);
                    setHoraChegada(endDateTime.toTimeString().split(' ')[0].substring(0, 5));
                }
            }
        }
    }, [rotaIdaSelecionada, dataPartida, horaPartida]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagemCapa(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files) as File[];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (typeof reader.result === 'string') {
                        setGaleria(prev => [...prev, reader.result as string]);
                    }
                };
                reader.readAsDataURL(file);
            }
        }
    };

    const veiculoSelecionado = veiculos.find(v => v.id === veiculoId);

    const tiposAssento = useMemo(() => {
        if (!veiculoSelecionado?.mapa_assentos) return [];
        return Array.from(new Set(veiculoSelecionado.mapa_assentos.filter(a => !a.disabled).map(a => a.tipo)))
            .filter(tipo => tipo !== 'BLOQUEADO');
    }, [veiculoSelecionado]);

    const handlePrecoChange = (tipo: string, valor: string) => {
        setPrecosPorTipo(prev => ({
            ...prev,
            [tipo]: parseFloat(valor) || 0
        }));
    };

    const handleSalvar = async () => {
        setError(null);
        // Validate: at least one route must be selected
        if (!rotaIdaSelecionada && !rotaVoltaSelecionada) {
            setError('Selecione pelo menos uma rota (IDA ou VOLTA).');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        if (!dataPartida || !horaPartida) {
            setError('Defina a data e hora de partida.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        try {
            setSaving(true);
            const viagemData: any = {
                route_id: rotaIdaSelecionada?.id || rotaVoltaSelecionada?.id, // Primary route
                return_route_id: rotaVoltaSelecionada?.id || null, // Optional return route
                vehicle_id: veiculoId || null,
                driver_id: motoristaIds[0] || null, // Backend supports single driver currently
                departure_date: dataPartida,
                departure_time: horaPartida,
                arrival_date: dataChegada || null,
                arrival_time: horaChegada || null,
                price_conventional: precosPorTipo['CONVENCIONAL'],
                price_executive: precosPorTipo['EXECUTIVO'],
                price_semi_sleeper: precosPorTipo['SEMI_LEITO'],
                price_sleeper: precosPorTipo['LEITO'],
                price_bed: precosPorTipo['CAMA'],
                price_master_bed: precosPorTipo['CAMA_MASTER'],
                notes: notes,
                status: TripStatus.SCHEDULED,
                seats_available: veiculoSelecionado?.capacidade_passageiros || 40, // Default

                // New fields
                title: titulo,
                tags: tags,
                cover_image: imagemCapa,
                gallery: galeria,
                baggage_limit: limiteBagagem,
                alerts: alertas
            };

            if (isEdicao && id) {
                await tripsService.update(id, viagemData);
            } else {
                await tripsService.create(viagemData);
            }

            setSuccess(`Viagem ${isEdicao ? 'atualizada' : 'criada'} com sucesso!`);
            setTimeout(() => navigate('/admin/viagens'), 2000);
        } catch (error: any) {
            console.error('Erro ao salvar viagem:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Erro desconhecido';
            setError(`Erro ao salvar viagem: ${errorMessage}`);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    return (
        <div key="nova-viagem-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Header Executivo */}
            <PageHeader
                title={`${isEdicao ? 'Editar' : 'Nova'} Viagem`}
                subtitle={isEdicao ? 'Atualize os detalhes da viagem selecionada' : 'Planeje e cadastre uma nova viagem na grade'}
                backLink="/admin/viagens"
                backText="Voltar para Viagens"
                rightElement={
                    <>
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/admin/viagens')}
                            className="h-14 rounded-xl px-6 font-semibold uppercase text-[12px] tracking-widest"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSalvar}
                            disabled={saving}
                            className="h-14 rounded-xl px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold uppercase text-[12px] tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {saving ? (
                                <Loader className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            {saving ? 'Salvando...' : 'Salvar Viagem'}
                        </Button>
                    </>
                }
            />

            {error && (
                <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2 duration-300 rounded-3xl border-destructive/20 bg-destructive/5 backdrop-blur-sm">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="font-semibold uppercase text-[12px] tracking-widest">Erro no Processamento</AlertTitle>
                    <AlertDescription className="text-xs font-medium">
                        {error}
                    </AlertDescription>
                </Alert>
            )}

            {success && (
                <Alert className="animate-in fade-in slide-in-from-top-2 duration-300 rounded-3xl border-emerald-500/20 bg-emerald-500/5 backdrop-blur-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <AlertTitle className="font-semibold uppercase text-[12px] tracking-widest text-emerald-500">Sucesso</AlertTitle>
                    <AlertDescription className="text-xs font-medium text-emerald-600/80">
                        {success}
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Coluna Principal (2/3) */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Informações Básicas */}
                    <FormSection
                        title="Identificação da Viagem"
                        icon={Bus}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Título Público da Viagem</label>
                                <input
                                    type="text"
                                    value={titulo}
                                    onChange={(e) => setTitulo(e.target.value)}
                                    placeholder="Ex: Excursão de Final de Ano - Litoral Norte"
                                    className="w-full h-14 px-4 rounded-xl bg-muted/40 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Tags Operacionais</label>
                                <SeletorTags
                                    selectedTags={tags}
                                    onChange={setTags}
                                />
                            </div>
                        </div>
                    </FormSection>

                    {/* Seleção de Rotas */}
                    <FormSection
                        title="Planejamento do Trajeto"
                        icon={Route}
                    >
                        <div className="space-y-4">
                            <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                Rota de IDA (Obrigatória se não houver Volta)
                            </label>
                            <SeletorRota
                                rotas={rotas}
                                tipoFiltro={RouteType.OUTBOUND}
                                rotaSelecionada={rotaIdaSelecionada}
                                onChange={setRotaIdaSelecionada}
                            />
                        </div>

                        <div className="space-y-4 pt-4 border-t border-border/50">
                            <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                                Rota de VOLTA (Opcional)
                            </label>
                            <SeletorRota
                                rotas={rotas}
                                tipoFiltro={RouteType.INBOUND}
                                rotaSelecionada={rotaVoltaSelecionada}
                                onChange={setRotaVoltaSelecionada}
                            />
                        </div>

                        {!rotaIdaSelecionada && !rotaVoltaSelecionada && (
                            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                                <p className="text-[12px] font-semibold uppercase tracking-widest text-amber-600 text-center">
                                    ⚠️ Selecione pelo menos uma rota para prosseguir
                                </p>
                            </div>
                        )}
                    </FormSection>

                    {/* Cronograma */}
                    <FormSection
                        title="Cronograma de Execução"
                        icon={Calendar}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h4 className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">Partida Oficial</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Data</label>
                                        <DatePicker value={dataPartida} onChange={setDataPartida} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Horário</label>
                                        <TimePicker value={horaPartida} onChange={setHoraPartida} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">Chegada Prevista</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Data</label>
                                        <DatePicker value={dataChegada} onChange={setDataChegada} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Horário</label>
                                        <TimePicker value={horaChegada} onChange={setHoraChegada} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Itinerário Estimado Visual */}
                        {(rotaIdaSelecionada && dataPartida && horaPartida) && (
                            <div className="mt-8 pt-8 border-t border-border/50">
                                <h4 className="text-[12px] font-semibold uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
                                    <Clock size={14} />
                                    Previsão de Passagem pelo Itinerário
                                </h4>
                                <div className="space-y-0">
                                    {(() => {
                                        const startDT = new Date(`${dataPartida}T${horaPartida}`);
                                        const durationMin = rotaIdaSelecionada.duracao_estimada_minutos || 0;
                                        const arrivalDT = new Date(startDT.getTime() + durationMin * 60000);

                                        return (
                                            <div className="relative pl-12 space-y-10 border-l-2 border-dashed border-border/50 ml-4 py-2">
                                                {/* Origem */}
                                                <div className="relative">
                                                    <div className="absolute -left-[3.1rem] top-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[12px] font-semibold shadow-lg shadow-primary/20">
                                                        P
                                                    </div>
                                                    <div>
                                                        <div className="text-[12px] font-semibold uppercase tracking-widest">{rotaIdaSelecionada.cidade_origem}</div>
                                                        <div className="text-xs font-medium text-muted-foreground mt-0.5">Partida em {startDT.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                    </div>
                                                </div>

                                                {/* Destino */}
                                                <div className="relative">
                                                    <div className="absolute -left-[3.1rem] top-0 w-8 h-8 rounded-full bg-destructive flex items-center justify-center text-white text-[12px] font-semibold shadow-lg shadow-destructive/20">
                                                        C
                                                    </div>
                                                    <div>
                                                        <div className="text-[12px] font-semibold uppercase tracking-widest">{rotaIdaSelecionada.cidade_destino}</div>
                                                        <div className="text-xs font-medium text-muted-foreground mt-0.5">Chegada estimada: {arrivalDT.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}
                    </FormSection>

                    {/* Mídia e Detalhes */}
                    <FormSection
                        title="Galeria e Conteúdo Público"
                        icon={Image}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Capa da Viagem</label>
                                <div className="flex flex-col gap-4">
                                    {imagemCapa ? (
                                        <div className="relative aspect-video rounded-xl overflow-hidden border border-border/50 group">
                                            <img src={imagemCapa} alt="Capa" className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => setImagemCapa('')}
                                                className="absolute top-2 right-2 bg-destructive text-white p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="aspect-video rounded-xl bg-muted/40 border border-dashed border-border/50 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                            <Image size={32} strokeWidth={1.5} />
                                            <span className="text-[12px] font-semibold uppercase tracking-widest">Sem Imagem</span>
                                        </div>
                                    )}
                                    <Button
                                        variant="outline"
                                        className="h-14 rounded-xl relative overflow-hidden text-[12px] font-semibold uppercase"
                                    >
                                        Selecionar Capa
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Galeria</label>
                                    {galeria.length > 0 && (
                                        <button
                                            onClick={() => setShowGalleryClearConfirm(true)}
                                            className="text-[12px] font-semibold uppercase text-destructive hover:underline"
                                        >
                                            Limpar Tudo
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {galeria.map((img, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-border/50 group">
                                            <img src={img} alt={`Galeria ${idx}`} className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => setGaleria(prev => prev.filter((_, i) => i !== idx))}
                                                className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>
                                    ))}
                                    <label className="aspect-square rounded-xl border border-dashed border-border/50 bg-muted/20 flex items-center justify-center cursor-pointer hover:bg-muted/40 transition-colors">
                                        <Plus size={16} className="text-muted-foreground" />
                                        <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" />
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-border/50">
                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Limite de Bagagem</label>
                                <input
                                    type="text"
                                    value={limiteBagagem}
                                    onChange={(e) => setLimiteBagagem(e.target.value)}
                                    placeholder="Ex: 1 mala 23kg + 1 mão"
                                    className="w-full h-14 px-4 rounded-xl bg-muted/40 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium text-xs"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Alertas para Passageiros</label>
                                <input
                                    type="text"
                                    value={alertas}
                                    onChange={(e) => setAlertas(e.target.value)}
                                    placeholder="Avisos importantes..."
                                    className="w-full h-14 px-4 rounded-xl bg-muted/40 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium text-xs"
                                />
                            </div>
                        </div>
                    </FormSection>
                </div>

                {/* Coluna Lateral (1/3) */}
                <div className="space-y-8">
                    {/* Alocação de Recursos */}
                    <FormSection
                        title="Alocação de Veículo"
                        icon={Bus}
                    >
                        <div className="space-y-2">
                            <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Veículo Operante</label>
                            <select
                                value={veiculoId}
                                onChange={(e) => setVeiculoId(e.target.value)}
                                className="w-full h-14 px-4 rounded-xl bg-muted/40 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-semibold uppercase text-[12px] tracking-widest outline-none appearance-none"
                            >
                                <option value="">NÃO ATRIBUÍDO</option>
                                {veiculos.map((v) => (
                                    <option key={v.id} value={v.id}>{v.placa} - {v.modelo}</option>
                                ))}
                            </select>
                        </div>

                        {veiculoId && tiposAssento.length > 0 && (
                            <div className="pt-6 border-t border-border/50 space-y-4">
                                <h4 className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <DollarSign size={12} className="text-emerald-500" />
                                    Tarifários da Viagem
                                </h4>
                                <div className="space-y-2">
                                    {tiposAssento.map((tipo) => (
                                        <div key={tipo} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/50">
                                            <span className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">{tipo?.replace('_', ' ')}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[12px] font-semibold text-muted-foreground">{moeda}</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={precosPorTipo[tipo as string] || ''}
                                                    onChange={(e) => handlePrecoChange(tipo as string, e.target.value)}
                                                    className="w-20 bg-transparent border-none text-right font-bold text-sm focus:ring-0 p-0 outline-none"
                                                    placeholder="0,00"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!veiculoId && (
                            <div className="p-4 rounded-xl bg-muted/20 border border-dashed border-border/50">
                                <p className="text-[12px] font-medium text-muted-foreground italic text-center leading-relaxed">
                                    Selecione um veículo para habilitar a definição dos preços por categoria de assento.
                                </p>
                            </div>
                        )}
                    </FormSection>

                    {/* Tripulação */}
                    <FormSection
                        title="Tripulação Responsável"
                        icon={Users}
                    >
                        <SeletorMotoristaMultiplo
                            motoristas={motoristas}
                            selecionados={motoristaIds}
                            onChange={setMotoristaIds}
                            maxHeight="300px"
                        />
                    </FormSection>

                    {/* Notas Internas */}
                    <FormSection
                        title="Observações do Operador"
                        icon={Clock}
                    >
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={4}
                            placeholder="Notas internas para controle operacional..."
                            className="w-full p-4 rounded-xl bg-muted/40 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium text-sm resize-none outline-none"
                        />
                    </FormSection>
                </div>
            </div>
            <AlertDialog open={showGalleryClearConfirm} onOpenChange={setShowGalleryClearConfirm}>
                <AlertDialogContent className="rounded-3xl p-10">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-semibold uppercase tracking-tight">Limpar Galeria</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            Tem certeza que deseja remover todas as fotos da galeria? Esta ação não pode ser desfeita e removerá os links permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-8 gap-3">
                        <AlertDialogCancel className="h-14 rounded-xl px-6 font-semibold uppercase text-[12px] tracking-widest border-border/50">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                setGaleria([]);
                                setShowGalleryClearConfirm(false);
                            }}
                            className="h-14 rounded-xl px-8 bg-destructive hover:bg-destructive/90 text-white font-semibold uppercase text-[12px] tracking-widest"
                        >
                            Remover Todas
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
