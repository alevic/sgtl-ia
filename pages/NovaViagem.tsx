import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IRota, IVeiculo, IMotorista, Moeda, IViagem } from '../types';
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

export const NovaViagem: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdicao = Boolean(id);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

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
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            console.error('Error details:', {
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined
            });
            alert(`Erro ao carregar dados iniciais: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
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
        return Array.from(new Set(veiculoSelecionado.mapa_assentos.map(a => a.tipo)));
    }, [veiculoSelecionado]);

    const handlePrecoChange = (tipo: string, valor: string) => {
        setPrecosPorTipo(prev => ({
            ...prev,
            [tipo]: parseFloat(valor) || 0
        }));
    };

    const handleSalvar = async () => {
        // Validate: at least one route must be selected
        if (!rotaIdaSelecionada && !rotaVoltaSelecionada) {
            alert('Selecione pelo menos uma rota (IDA ou VOLTA).');
            return;
        }
        if (!dataPartida || !horaPartida) {
            alert('Defina a data e hora de partida.');
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
                status: 'SCHEDULED',
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

            navigate('/admin/viagens');
        } catch (error: any) {
            console.error('Erro ao salvar viagem:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Erro desconhecido';
            alert(`Erro ao salvar viagem: ${errorMessage}`);
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
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                        {isEdicao ? 'Editar Viagem' : 'Nova Viagem'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Selecione as rotas e detalhes da viagem</p>
                </div>
                <button
                    onClick={handleSalvar}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    {saving ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
                    {saving ? 'Salvando...' : 'Salvar Viagem'}
                </button>
            </div>

            {/* Informações Básicas */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Título da Viagem
                        </label>
                        <input
                            type="text"
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                            placeholder="Ex: Excursão para Aparecida do Norte"
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Tags da Viagem
                        </label>
                        <SeletorTags
                            selectedTags={tags}
                            onChange={setTags}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coluna Principal */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Seleção de Rotas */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <Route size={20} className="text-purple-600" />
                            Seleção de Rotas
                        </h3>

                        {/* Rota de IDA */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Rota de IDA (Opcional)
                            </label>
                            <SeletorRota
                                rotas={rotas}
                                tipoFiltro="IDA"
                                rotaSelecionada={rotaIdaSelecionada}
                                onChange={setRotaIdaSelecionada}
                            />
                        </div>

                        {/* Rota de VOLTA */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Rota de VOLTA (Opcional)
                            </label>
                            <SeletorRota
                                rotas={rotas}
                                tipoFiltro="VOLTA"
                                rotaSelecionada={rotaVoltaSelecionada}
                                onChange={setRotaVoltaSelecionada}
                            />
                        </div>

                        {!rotaIdaSelecionada && !rotaVoltaSelecionada && (
                            <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
                                ⚠️ Selecione pelo menos uma rota (IDA ou VOLTA)
                            </p>
                        )}
                    </div>

                    {/* Datas e Horários */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <Calendar size={20} className="text-blue-600" />
                            Datas e Horários
                        </h3>
                        {/* ... Existing Date Inputs ... */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Data de Partida
                                </label>
                                <input
                                    type="date"
                                    value={dataPartida}
                                    onChange={(e) => setDataPartida(e.target.value)}
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Hora de Partida
                                </label>
                                <input
                                    type="time"
                                    value={horaPartida}
                                    onChange={(e) => setHoraPartida(e.target.value)}
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Data de Chegada (Prevista)
                                </label>
                                <input
                                    type="date"
                                    value={dataChegada}
                                    onChange={(e) => setDataChegada(e.target.value)}
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Hora de Chegada (Prevista)
                                </label>
                                <input
                                    type="time"
                                    value={horaChegada}
                                    onChange={(e) => setHoraChegada(e.target.value)}
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg"
                                />
                            </div>
                        </div>

                        {/* Itinerário Estimado */}
                        {(rotaIdaSelecionada && dataPartida && horaPartida) && (
                            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                                <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                                    <MapPin size={18} className="text-orange-500" />
                                    Itinerário Estimado
                                </h4>
                                <div className="space-y-4">
                                    {/* Exibir Paradas Calculadas */}
                                    {(() => {
                                        // Simular objeto viagem para calcular paradas
                                        const mockViagem: any = {
                                            usa_sistema_rotas: true,
                                            tipo_viagem: 'IDA',
                                            rota_ida: rotaIdaSelecionada,
                                            departure_date: dataPartida,
                                            departure_time: horaPartida
                                        };
                                        const viagemCalculada = calcularCamposViagem(mockViagem);

                                        return (
                                            <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 pl-6 space-y-6">
                                                {/* Origem */}
                                                <div className="relative">
                                                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white dark:border-slate-800" />
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-slate-800 dark:text-slate-200">{viagemCalculada.origem}</span>
                                                        <span className="text-sm text-slate-500">Partida: {new Date(`${dataPartida}T${horaPartida}`).toLocaleString()}</span>
                                                    </div>
                                                </div>

                                                {/* Paradas Intermediárias */}
                                                {viagemCalculada.paradas?.map((parada, idx) => (
                                                    <div key={idx} className="relative">
                                                        <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-blue-500 border-2 border-white dark:border-slate-800" />
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-slate-800 dark:text-slate-200">{parada.nome}</span>
                                                            <div className="flex gap-4 text-xs text-slate-500 mt-1">
                                                                <span className="flex items-center gap-1">
                                                                    <Clock size={12} />
                                                                    Chegada: {parada.horario_chegada ? new Date(parada.horario_chegada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Clock size={12} />
                                                                    Partida: {parada.horario_partida ? new Date(parada.horario_partida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Destino */}
                                                <div className="relative">
                                                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-red-500 border-2 border-white dark:border-slate-800" />
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-slate-800 dark:text-slate-200">{viagemCalculada.destino}</span>
                                                        <span className="text-sm text-slate-500">
                                                            Chegada Prevista: {dataChegada && horaChegada ? new Date(`${dataChegada}T${horaChegada}`).toLocaleString() : '--'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Imagens e Detalhes */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <Image size={20} className="text-pink-600" />
                            Imagens e Detalhes
                        </h3>

                        <div className="space-y-4">
                            {/* Capa */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Foto de Capa
                                </label>
                                <div className="flex items-center gap-4">
                                    {imagemCapa ? (
                                        <div className="relative group">
                                            <img src={imagemCapa} alt="Capa" className="w-24 h-24 object-cover rounded-lg" />
                                            <button
                                                onClick={() => setImagemCapa('')}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                                title="Remover capa"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400">
                                            <Image size={24} />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        />
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            Recomendado: 1200x600px (JPG, PNG)
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Galeria */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Galeria de Fotos
                                    </label>
                                    {galeria.length > 0 && (
                                        <button
                                            onClick={() => {
                                                if (confirm('Tem certeza que deseja remover todas as fotos da galeria?')) {
                                                    setGaleria([]);
                                                }
                                            }}
                                            className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                                        >
                                            <Trash2 size={12} />
                                            Remover todas
                                        </button>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-3 mb-4">
                                    {galeria.map((img, idx) => (
                                        <div key={idx} className="relative group">
                                            <img src={img} alt={`Galeria ${idx}`} className="w-20 h-20 object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
                                            <button
                                                onClick={() => setGaleria(prev => prev.filter((_, i) => i !== idx))}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                                title="Remover foto"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    {galeria.length === 0 && (
                                        <div className="w-full py-4 text-center text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                                            Nenhuma foto na galeria
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleGalleryUpload}
                                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                                />
                            </div>

                            {/* Limite de Bagagem */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Limite de Bagagem
                                </label>
                                <input
                                    type="text"
                                    value={limiteBagagem}
                                    onChange={(e) => setLimiteBagagem(e.target.value)}
                                    placeholder="Ex: 1 mala de 23kg + 1 bagagem de mão"
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg"
                                />
                            </div>

                            {/* Alertas */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Alertas Importantes
                                </label>
                                <textarea
                                    value={alertas}
                                    onChange={(e) => setAlertas(e.target.value)}
                                    rows={3}
                                    placeholder="Avisos importantes para os passageiros..."
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg"
                                />
                            </div>

                            {/* Observações */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Observações Gerais
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                    placeholder="Observações internas ou gerais..."
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg"
                                />
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
                            {veiculos.map((veiculo) => (
                                <option key={veiculo.id} value={veiculo.id}>
                                    {veiculo.placa} - {veiculo.modelo}
                                </option>
                            ))}
                        </select>

                        {/* Preços - Only show after vehicle selection */}
                        {veiculoId && (
                            <div className="mt-6 space-y-4">
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

                        {!veiculoId && (
                            <p className="mt-6 text-sm text-slate-500 dark:text-slate-400 italic">
                                Selecione um veículo para definir os preços por tipo de assento
                            </p>
                        )}
                    </div>

                    {/* Motoristas */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <Users size={20} className="text-orange-600" />
                            Motoristas
                        </h3>

                        <SeletorMotoristaMultiplo
                            motoristas={motoristas}
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
