import React, { useState, useEffect, useMemo } from 'react';
import { data as json, redirect } from "react-router";
import type { LoaderFunction, ActionFunction } from "react-router";
import { useLoaderData, useNavigate, useParams, useNavigation, useActionData, Form, useFetcher, Link } from "react-router";
import {
    Bus, Save, Route as RouteIcon, Clock, Calendar, Loader, Search,
    AlertCircle, CheckCircle2, Users, DollarSign, X, Plus, ClipboardList,
    MapPin, UserCheck, Upload, Image as ImageIcon, AlertTriangle
} from 'lucide-react';
import { db } from "@/db/db.server";
import {
    trips as tripsTable,
    routes as routesTable,
    vehicle as vehicleTable,
    driver as driverTable,
    seat as seatTable
} from "@/db/schema";
import { eq, or, and, sql } from "drizzle-orm";
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/Layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SeletorTags } from '@/components/Selectors/SeletorTags';
import { DatePicker } from '@/components/Form/DatePicker';
import { TimePicker } from '@/components/Form/TimePicker';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { TripStatus, RouteType, Moeda, IRota, IMotorista } from '@/types';

export const loader = async ({ request, params }: { request: Request, params: { id?: string } }) => {
    const { id } = params;

    const [rotasRaw, veiculosData, motoristas] = await Promise.all([
        db.select().from(routesTable),
        db.select().from(vehicleTable),
        db.select().from(driverTable)
    ]);

    const rotas: IRota[] = rotasRaw.map(r => ({
        ...r,
        nome: r.name,
        tipo_rota: r.type as RouteType,
        pontos: (r.stops as any) || [],
        ativa: !!r.active
    }));

    // Enrich vehicles with seats
    const veiculos = await Promise.all(veiculosData.map(async (v) => {
        const seats = await db.select().from(seatTable).where(eq(seatTable.vehicleId, v.id));
        return { ...v, mapa_assentos: seats };
    }));

    let initialViagem: any = null;
    if (id) {
        initialViagem = await db.query.trips.findFirst({
            where: eq(tripsTable.id, id)
        });
        if (!initialViagem) throw new Response("Viagem não encontrada", { status: 404 });
    }

    return json({ rotas, veiculos, motoristas, initialViagem, isEdicao: !!id });
};

export const action = async ({ request, params }: { request: Request, params: { id?: string } }) => {
    const { id } = params;
    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "save-trip") {
        const payload = JSON.parse(formData.get("payload") as string);

        try {
            await db.transaction(async (tx) => {
                let tripId = id;
                if (id) {
                    await tx.update(tripsTable).set({
                        ...payload,
                        updatedAt: new Date()
                    }).where(eq(tripsTable.id, id));
                } else {
                    const [newTrip] = await tx.insert(tripsTable).values({
                        ...payload,
                        organization_id: "org_default",
                        status: TripStatus.SCHEDULED
                    }).returning();
                    tripId = newTrip.id;
                }
            });
            return redirect("/admin/trips");
        } catch (e) {
            console.error(e);
            return json({ error: "Erro ao salvar viagem operacional" }, { status: 500 });
        }
    }

    return null;
};

export default function NewTripPage() {
    const { rotas, veiculos, motoristas, initialViagem, isEdicao } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const navigate = useNavigate();
    const fetcher = useFetcher();

    const [titulo, setTitulo] = useState(initialViagem?.title || '');
    const [tags, setTags] = useState<string[]>(initialViagem?.tags || []);

    // Route selection
    const [rotaIda, setRotaIda] = useState<IRota | null>(rotas.find((r: IRota) => r.id === initialViagem?.route_id) || null);
    const [rotaVolta, setRotaVolta] = useState<IRota | null>(rotas.find((r: IRota) => r.id === initialViagem?.return_route_id) || null);
    const [buscaRotaIda, setBuscaRotaIda] = useState('');
    const [buscaRotaVolta, setBuscaRotaVolta] = useState('');

    // Vehicle and drivers
    const [veiculoId, setVeiculoId] = useState(initialViagem?.vehicle_id || '');
    const [motoristaIds, setMotoristaIds] = useState<string[]>(initialViagem?.driver_id ? [initialViagem.driver_id] : []);
    const [buscaMotorista, setBuscaMotorista] = useState('');
    const [selecionarTodos, setSelecionarTodos] = useState(false);

    // Dates and times
    const [dataPartida, setDataPartida] = useState(initialViagem?.departure_date || '');
    const [horaPartida, setHoraPartida] = useState(initialViagem?.departure_time || '');
    const [dataChegada, setDataChegada] = useState(initialViagem?.arrival_date || '');
    const [horaChegada, setHoraChegada] = useState(initialViagem?.arrival_time || '');

    // Prices
    const [precos, setPrecos] = useState<Record<string, number>>(isEdicao ? {
        'CONVENCIONAL': Number(initialViagem?.price_conventional) || 0,
        'EXECUTIVO': Number(initialViagem?.price_executive) || 0,
        'SEMI_LEITO': Number(initialViagem?.price_semi_sleeper) || 0,
        'LEITO': Number(initialViagem?.price_sleeper) || 0,
        'CAMA': Number(initialViagem?.price_bed) || 0,
        'CAMA_MASTER': Number(initialViagem?.price_master_bed) || 0,
    } : {});

    // Additional fields
    const [baggageLimit, setBaggageLimit] = useState(initialViagem?.baggage_limit || '');
    const [alerts, setAlerts] = useState(initialViagem?.alerts || '');
    const [observations, setObservations] = useState(initialViagem?.observations || '');
    const [coverImage, setCoverImage] = useState(initialViagem?.cover_image || '');
    const [gallery, setGallery] = useState<string[]>(initialViagem?.gallery || []);

    // UI state
    const [showValidation, setShowValidation] = useState(false);

    const isSaving = navigation.state === "submitting" || fetcher.state === "submitting";

    const veiculoSelecionado = veiculos.find((v: any) => v.id === veiculoId);

    const tiposAssento = useMemo(() => {
        if (!veiculoSelecionado?.mapa_assentos) return [];
        return Array.from(new Set(veiculoSelecionado.mapa_assentos.map((a: any) => a.tipo)));
    }, [veiculoSelecionado]);

    // Filtered routes
    const rotasIdaFiltradas = rotas.filter((r: IRota) =>
        r.tipo_rota === RouteType.OUTBOUND &&
        (r.nome?.toLowerCase().includes(buscaRotaIda.toLowerCase()))
    );

    const rotasVoltaFiltradas = rotas.filter((r: IRota) =>
        r.tipo_rota === RouteType.INBOUND &&
        (r.nome?.toLowerCase().includes(buscaRotaVolta.toLowerCase()))
    );

    // Filtered drivers
    const motoristasFiltrados = motoristas.filter((m: any) =>
        m.nome?.toLowerCase().includes(buscaMotorista.toLowerCase())
    );

    // Toggle driver selection
    const toggleMotorista = (id: string) => {
        setMotoristaIds(prev =>
            prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
        );
    };

    // Select all drivers
    useEffect(() => {
        if (selecionarTodos) {
            setMotoristaIds(motoristasFiltrados.map((m: any) => m.id));
        } else if (motoristaIds.length === motoristasFiltrados.length && motoristasFiltrados.length > 0) {
            setMotoristaIds([]);
        }
    }, [selecionarTodos]);

    const handleSalvar = () => {
        // Validation
        if (!rotaIda && !rotaVolta) {
            setShowValidation(true);
            return;
        }

        const payload = {
            title: titulo,
            route_id: rotaIda?.id,
            return_route_id: rotaVolta?.id,
            vehicle_id: veiculoId,
            driver_id: motoristaIds[0],
            departure_date: dataPartida,
            departure_time: horaPartida,
            arrival_date: dataChegada,
            arrival_time: horaChegada,
            price_conventional: precos['CONVENCIONAL'],
            price_executive: precos['EXECUTIVO'],
            price_semi_sleeper: precos['SEMI_LEITO'],
            price_sleeper: precos['LEITO'],
            price_bed: precos['CAMA'],
            price_master_bed: precos['CAMA_MASTER'],
            tags,
            baggage_limit: baggageLimit,
            alerts: alerts,
            observations: observations,
            cover_image: coverImage,
            gallery: gallery,
            seats_available: veiculoSelecionado?.capacidade_passageiros || 40
        };
        fetcher.submit({ intent: "save-trip", payload: JSON.stringify(payload) }, { method: "post" });
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            <PageHeader
                title={isEdicao ? 'Editar Viagem' : 'Nova Viagem'}
                subtitle="Registre uma nova viagem operacional com rotas e tarifário"
                backLink="/admin/trips"
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT COLUMN - 2/3 width */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Informações Básicas */}
                    <Card className="p-6 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <ClipboardList className="w-5 h-5 text-purple-500" />
                            <h3 className="font-bold text-lg">Informações Básicas</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-label-caps ml-1">Título da Viagem</label>
                                <Input
                                    value={titulo}
                                    onChange={e => setTitulo(e.target.value)}
                                    placeholder="Ex: Excursão para Aparecida do Norte"
                                    className="h-14 rounded-xl bg-muted/40"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-label-caps ml-1">Tags da Viagem</label>
                                <SeletorTags selectedTags={tags} onChange={setTags} />
                            </div>
                        </div>
                    </Card>

                    {/* Seleção de Rotas */}
                    <Card className="p-6 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <RouteIcon className="w-5 h-5 text-orange-500" />
                            <h3 className="font-bold text-lg">Seleção de Rotas</h3>
                        </div>

                        {showValidation && !rotaIda && !rotaVolta && (
                            <Alert className="rounded-xl bg-yellow-50 border-yellow-200 mb-6">
                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                <AlertDescription className="text-yellow-800 text-xs">
                                    ⚠️ Selecione pelo menos uma rota (IDA ou VOLTA)
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Title + Tags - Full Width Row */}
                        <Card className="p-6 rounded-2xl shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-muted-foreground">Título da Viagem</label>
                                    <Input
                                        value={titulo}
                                        onChange={e => setTitulo(e.target.value)}
                                        placeholder="Ex: Excursão para Aparecida do Norte"
                                        className="h-12"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-muted-foreground">Tags da Viagem</label>
                                    <SeletorTags selectedTags={tags} onChange={setTags} />
                                </div>
                            </div>
                        </Card>

                        {/* Two Column Layout: Routes (Left) | Vehicle+Drivers+Dates (Right) */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* LEFT COLUMN - Routes */}
                            <div className="space-y-6">
                                <Card className="p-6 rounded-2xl shadow-sm">
                                    <div className="flex items-center gap-2 mb-6">
                                        <RouteIcon className="w-5 h-5 text-purple-500" />
                                        <h3 className="font-bold text-lg">Seleção de Rotas</h3>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Rota de IDA */}
                                        <div className="space-y-3">
                                            <label className="text-sm font-semibold text-foreground">Rota de IDA (Opcional)</label>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <Input
                                                    value={buscaRotaIda}
                                                    onChange={e => setBuscaRotaIda(e.target.value)}
                                                    placeholder="Buscar por origem, destino ou nome..."
                                                    className="pl-10 h-12"
                                                />
                                            </div>

                                            {rotasIdaFiltradas.length > 0 ? (
                                                <div className="max-h-48 overflow-y-auto space-y-2 border rounded-xl p-3">
                                                    {rotasIdaFiltradas.map((rota: IRota) => (
                                                        <div
                                                            key={rota.id}
                                                            onClick={() => setRotaIda(rota)}
                                                            className={cn(
                                                                "p-3 rounded-lg cursor-pointer transition-colors border",
                                                                rotaIda?.id === rota.id
                                                                    ? "bg-primary/10 border-primary"
                                                                    : "hover:bg-muted border-transparent"
                                                            )}
                                                        >
                                                            <div className="font-semibold text-sm">{rota.nome}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {rota.pontos.length} paradas • {rota.distancia_total_km || 0}km
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                                    <MapPin className="w-12 h-12 text-muted-foreground/40 mb-3" />
                                                    <p className="font-semibold text-muted-foreground">Nenhuma rota de IDA disponível</p>
                                                    <p className="text-xs text-muted-foreground mt-1">Cadastre rotas em "Rotas" no menu lateral</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Rota de VOLTA */}
                                        <div className="space-y-3">
                                            <label className="text-sm font-semibold text-foreground">Rota de VOLTA (Opcional)</label>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <Input
                                                    value={buscaRotaVolta}
                                                    onChange={e => setBuscaRotaVolta(e.target.value)}
                                                    placeholder="Buscar por origem, destino ou nome..."
                                                    className="pl-10 h-12"
                                                />
                                            </div>

                                            {rotasVoltaFiltradas.length > 0 ? (
                                                <div className="max-h-48 overflow-y-auto space-y-2 border rounded-xl p-3">
                                                    {rotasVoltaFiltradas.map((rota: IRota) => (
                                                        <div
                                                            key={rota.id}
                                                            onClick={() => setRotaVolta(rota)}
                                                            className={cn(
                                                                "p-3 rounded-lg cursor-pointer transition-colors border",
                                                                rotaVolta?.id === rota.id
                                                                    ? "bg-primary/10 border-primary"
                                                                    : "hover:bg-muted border-transparent"
                                                            )}
                                                        >
                                                            <div className="font-semibold text-sm">{rota.nome}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {rota.pontos.length} paradas • {rota.distancia_total_km || 0}km
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                                    <MapPin className="w-12 h-12 text-muted-foreground/40 mb-3" />
                                                    <p className="font-semibold text-muted-foreground">Nenhuma rota de VOLTA disponível</p>
                                                    <p className="text-xs text-muted-foreground mt-1">Cadastre rotas em "Rotas" no menu lateral</p>
                                                </div>
                                            )}
                                        </div>

                                        {showValidation && !rotaIda && !rotaVolta && (
                                            <Alert className="rounded-xl bg-yellow-50 border-yellow-200">
                                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                                <AlertDescription className="text-yellow-800 text-xs">
                                                    ⚠️ Selecione pelo menos uma rota (IDA ou VOLTA)
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </div>
                                </Card>
                            </div>

                            {/* RIGHT COLUMN - Vehicle, Drivers, Dates, etc */}
                            <div className="space-y-6">
                                {/* Vehicle Selection */}
                                <Card className="p-6 rounded-2xl shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Bus className="w-5 h-5 text-purple-500" />
                                        <h3 className="font-bold text-lg">Veículo</h3>
                                    </div>
                                    <Select value={veiculoId || ""} onValueChange={setVeiculoId}>
                                        <SelectTrigger className="h-12">
                                            <SelectValue placeholder="-- Selecione --" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {veiculos.map((v: any) => (
                                                <SelectItem key={v.id} value={v.id}>
                                                    {v.modelo} - {v.placa}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground mt-2 italic">
                                        Selecione um veículo para definir os preços por tipo de assento
                                    </p>
                                </Card>

                                {/* Drivers Selection */}
                                <Card className="p-6 rounded-2xl shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <UserCheck className="w-5 h-5 text-orange-500" />
                                        <h3 className="font-bold text-lg">Motoristas</h3>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                value={buscaMotorista}
                                                onChange={e => setBuscaMotorista(e.target.value)}
                                                placeholder="Buscar motorista..."
                                                className="pl-10 h-12"
                                            />
                                        </div>

                                        <div className="flex items-center justify-between py-2">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selecionarTodos}
                                                    onChange={(e) => setSelecionarTodos(e.target.checked)}
                                                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                />
                                                <label className="text-sm font-semibold cursor-pointer">Selecionar todos</label>
                                            </div>
                                            <span className="text-sm text-muted-foreground">
                                                {motoristaIds.length} de {motoristasFiltrados.length}
                                            </span>
                                        </div>

                                        {motoristasFiltrados.length > 0 ? (
                                            <div className="max-h-64 overflow-y-auto space-y-2 border rounded-xl p-3">
                                                {motoristasFiltrados.map((motorista: any) => (
                                                    <div
                                                        key={motorista.id}
                                                        onClick={() => toggleMotorista(motorista.id)}
                                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={motoristaIds.includes(motorista.id)}
                                                            onChange={() => {/* handled by parent div click */ }}
                                                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                        />
                                                        <div className="flex-1">
                                                            <div className="font-semibold text-sm">{motorista.nome}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                CNH: {motorista.cnh} | Categoria: {motorista.categoria_cnh}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                                <Users className="w-12 h-12 text-muted-foreground/40 mb-3" />
                                                <p className="font-semibold text-muted-foreground">Nenhum motorista disponível</p>
                                            </div>
                                        )}
                                    </div>
                                </Card>

                                {/* Dates and Times */}
                                <Card className="p-6 rounded-2xl shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Calendar className="w-5 h-5 text-blue-500" />
                                        <h3 className="font-bold text-lg">Datas e Horários</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-muted-foreground">Data de Partida</label>
                                            <DatePicker value={dataPartida} onChange={setDataPartida} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-muted-foreground">Hora de Partida</label>
                                            <TimePicker value={horaPartida} onChange={setHoraPartida} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-muted-foreground">Data de Chegada</label>
                                            <DatePicker value={dataChegada} onChange={setDataChegada} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-muted-foreground">Hora de Chegada</label>
                                            <TimePicker value={horaChegada} onChange={setHoraChegada} />
                                        </div>
                                    </div>
                                </Card>

                                {/* Images and Details */}
                                <Card className="p-6 rounded-2xl shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <ImageIcon className="w-5 h-5 text-pink-500" />
                                        <h3 className="font-bold text-lg">Imagens e Detalhes</h3>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Cover Image */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-muted-foreground">Foto de Capa</label>
                                            <div className="flex gap-3 items-start">
                                                {coverImage && (
                                                    <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-border flex-shrink-0">
                                                        <img src={coverImage} alt="Capa" className="w-full h-full object-cover" />
                                                    </div>
                                                )}
                                                {!coverImage && (
                                                    <div className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center flex-shrink-0">
                                                        <Upload className="w-6 h-6 text-muted-foreground" />
                                                    </div>
                                                )}
                                                <div className="flex-1 space-y-2">
                                                    <Input
                                                        value={coverImage}
                                                        onChange={e => setCoverImage(e.target.value)}
                                                        placeholder="URL da imagem de capa"
                                                        className="h-10"
                                                    />
                                                    <p className="text-xs text-muted-foreground">Recomendado: 1200×600px (JPG, PNG)</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Baggage Limit */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-muted-foreground">Limite de Bagagem</label>
                                            <Input
                                                value={baggageLimit}
                                                onChange={e => setBaggageLimit(e.target.value)}
                                                placeholder="Ex: 1 mala de 23kg + 1 bagagem de mão"
                                                className="h-10"
                                            />
                                        </div>

                                        {/* Alerts */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-muted-foreground">Alertas Importantes</label>
                                            <Textarea
                                                value={alerts}
                                                onChange={e => setAlerts(e.target.value)}
                                                placeholder="Avisos importantes para os passageiros..."
                                                className="min-h-[80px] resize-none"
                                            />
                                        </div>

                                        {/* Observations */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-muted-foreground">Observações Gerais</label>
                                            <Textarea
                                                value={observations}
                                                onChange={e => setObservations(e.target.value)}
                                                placeholder="Observações internas ou gerais..."
                                                className="min-h-[80px] resize-none"
                                            />
                                        </div>
                                    </div>
                                </Card>

                                {/* Pricing */}
                                {veiculoSelecionado && (
                                    <Card className="p-6 rounded-2xl shadow-sm">
                                        <div className="flex items-center gap-2 mb-4">
                                            <DollarSign className="w-5 h-5 text-emerald-500" />
                                            <h3 className="font-bold text-lg">Tarifário</h3>
                                        </div>
                                        <div className="space-y-3">
                                            {Object.entries(precos).map(([tipo, valor]) => (
                                                <div key={tipo} className="space-y-1">
                                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{tipo}</label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={valor}
                                                        onChange={e => setPrecos(prev => ({ ...prev, [tipo]: parseFloat(e.target.value) || 0 }))}
                                                        placeholder="0.00"
                                                        className="h-10"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                )}
                            </div>
                        </div>
                </div>
            </div>
            );
}
