import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IRota, IVeiculo, IMotorista, Moeda, IViagem } from '../types';
import {
    ArrowLeft, Bus, Save, DollarSign, Image, Route, Clock, MapPin, Users, X, Plus, Calendar, Loader
} from 'lucide-react';
import { SeletorRota } from '../components/Rotas/SeletorRota';
import { SeletorMotoristaMultiplo } from '../components/Selectors/SeletorMotoristaMultiplo';
import { calcularCamposViagem } from '../utils/rotaValidation';
import { tripsService } from '../services/tripsService';
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
    const [titulo, setTitulo] = useState(''); // Deprecated/Derived
    const [tipoViagem, setTipoViagem] = useState<'IDA_E_VOLTA' | 'IDA' | 'VOLTA'>('IDA'); // Simplified to IDA for MVP or keep logic
    const [internacional, setInternacional] = useState(false);
    const [moeda, setMoeda] = useState<Moeda>(Moeda.BRL);
    const [veiculoId, setVeiculoId] = useState('');
    const [motoristaIds, setMotoristaIds] = useState<string[]>([]);
    const [precosPorTipo, setPrecosPorTipo] = useState<Record<string, number>>({});
    const [imagemCapa, setImagemCapa] = useState<string>('');
    const [galeria, setGaleria] = useState<string[]>([]);
    const [notes, setNotes] = useState('');

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
                routesService.getAll(true),
                vehiclesService.getAll(true),
                driversService.getAll(true)
            ]);
            setRotas(rotasData);
            setVeiculos(veiculosData);
            setMotoristas(motoristasData);

            if (isEdicao && id) {
                const viagem = await tripsService.getById(id);
                // Populate form
                setVeiculoId(viagem.vehicle_id || '');
                setMotoristaIds(viagem.driver_id ? [viagem.driver_id] : []); // Handle single driver for now
                setDataPartida(viagem.departure_date);
                setHoraPartida(viagem.departure_time);
                setDataChegada(viagem.arrival_date || '');
                setHoraChegada(viagem.arrival_time || '');
                setNotes(viagem.notes || '');

                // Prices
                const prices: Record<string, number> = {};
                if (viagem.price_conventional) prices['CONVENCIONAL'] = viagem.price_conventional;
                if (viagem.price_executive) prices['EXECUTIVO'] = viagem.price_executive;
                if (viagem.price_semi_sleeper) prices['SEMI_LEITO'] = viagem.price_semi_sleeper;
                if (viagem.price_sleeper) prices['LEITO'] = viagem.price_sleeper;
                setPrecosPorTipo(prices);

                // Route
                const rota = rotasData.find(r => r.id === viagem.route_id);
                if (rota) {
                    setRotaIdaSelecionada(rota);
                }
            }
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            alert('Erro ao carregar dados iniciais.');
        } finally {
            setLoading(false);
        }
    };

    // Auto-fill dates based on route duration when route changes or start date changes
    useEffect(() => {
        if (rotaIdaSelecionada && dataPartida && horaPartida) {
            // Calculate arrival
            const startDateTime = new Date(`${dataPartida}T${horaPartida}`);
            const durationMinutes = rotaIdaSelecionada.duracao_estimada_minutos || 0;
            const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

            setDataChegada(endDateTime.toISOString().split('T')[0]);
            setHoraChegada(endDateTime.toTimeString().split(' ')[0].substring(0, 5));
        }
    }, [rotaIdaSelecionada, dataPartida, horaPartida]);

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

    const veiculoSelecionado = veiculos.find(v => v.id === veiculoId);
    // @ts-ignore
    const tiposAssento = veiculoSelecionado?.mapa_assentos
        // @ts-ignore
        ? Array.from(new Set(veiculoSelecionado.mapa_assentos.map(a => a.tipo)))
        : ['CONVENCIONAL', 'EXECUTIVO', 'SEMI_LEITO', 'LEITO']; // Fallback

    const handlePrecoChange = (tipo: string, valor: string) => {
        setPrecosPorTipo(prev => ({
            ...prev,
            [tipo]: parseFloat(valor) || 0
        }));
    };

    const handleSalvar = async () => {
        if (!rotaIdaSelecionada) {
            alert('Selecione uma rota.');
            return;
        }
        if (!dataPartida || !horaPartida) {
            alert('Defina a data e hora de partida.');
            return;
        }

        try {
            setSaving(true);
            const viagemData: any = {
                route_id: rotaIdaSelecionada.id,
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
                notes: notes,
                status: 'SCHEDULED',
                seats_available: veiculoSelecionado?.capacidade_passageiros || 40 // Default
            };

            if (isEdicao && id) {
                await tripsService.update(id, viagemData);
            } else {
                await tripsService.create(viagemData);
            }

            navigate('/admin/viagens');
        } catch (error) {
            console.error('Erro ao salvar viagem:', error);
            alert('Erro ao salvar viagem.');
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coluna Principal */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Seleção de Rotas */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <Route size={20} className="text-purple-600" />
                            Seleção de Rota
                        </h3>
                        <SeletorRota
                            rotas={rotas}
                            tipoFiltro="IDA"
                            rotaSelecionada={rotaIdaSelecionada}
                            onChange={setRotaIdaSelecionada}
                        />
                    </div>

                    {/* Datas e Horários */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <Calendar size={20} className="text-blue-600" />
                            Datas e Horários
                        </h3>
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

                        {/* Preços */}
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
