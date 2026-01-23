import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDateFormatter } from '../hooks/useDateFormatter';
import { Package, User, MapPin, Truck, Save, ArrowLeft, Loader, AlertCircle, CheckCircle2, DollarSign, ListFilter } from 'lucide-react';
import { parcelsService } from '../services/parcelsService';
import { tripsService } from '../services/tripsService';
import { IViagem, TripStatus } from '../types';
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { cn } from '../lib/utils';

export const NovaEncomenda: React.FC = () => {
    const navigate = useNavigate();
    const { formatDate } = useDateFormatter();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [trips, setTrips] = useState<IViagem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        sender_name: '',
        sender_document: '',
        sender_phone: '',
        recipient_name: '',
        recipient_document: '',
        recipient_phone: '',
        origin_city: '',
        origin_state: '',
        destination_city: '',
        destination_state: '',
        description: '',
        weight: 0,
        dimensions: '',
        price: 0,
        trip_id: '',
        notes: ''
    });

    useEffect(() => {
        loadTrips();
    }, []);

    const loadTrips = async () => {
        try {
            const data = await tripsService.getAll();
            // Filter active trips
            const activeTrips = data.filter(t =>
                t.status === TripStatus.SCHEDULED || (t.status as string) === 'CONFIRMED' ||
                (t.status as string) === 'AGENDADA' || (t.status as string) === 'CONFIRMADA'
            );
            setTrips(activeTrips);
        } catch (error) {
            console.error('Erro ao carregar viagens:', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            setSaving(true);
            await parcelsService.create({
                ...formData,
                trip_id: formData.trip_id || null
            });
            setSuccess('Encomenda criada com sucesso!');
            setTimeout(() => navigate('/admin/encomendas'), 2000);
        } catch (error) {
            console.error('Erro ao criar encomenda:', error);
            setError('Erro ao criar encomenda.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Header Executivo */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <button
                        onClick={() => navigate('/admin/encomendas')}
                        className="group flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                        <span className="text-[12px] font-semibold uppercase tracking-widest">Voltar para Encomendas</span>
                    </button>
                    <div>
                        <h1 className="text-4xl font-semibold text-foreground tracking-tight">
                            NOVA <span className="text-primary italic">CARGA</span>
                        </h1>
                        <p className="text-muted-foreground font-medium mt-1">
                            Registre uma nova encomenda ou carga no sistema
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/admin/encomendas')}
                        className="h-14 rounded-2xl px-6 font-semibold uppercase text-[12px] tracking-widest"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="h-14 rounded-2xl px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold uppercase text-[12px] tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {saving ? (
                            <Loader className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        {saving ? 'Salvando...' : 'Salvar Carga'}
                    </Button>
                </div>
            </div>

            {error && (
                <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2 duration-300 rounded-[2rem] border-destructive/20 bg-destructive/5 backdrop-blur-sm">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="font-semibold uppercase text-[12px] tracking-widest">Erro no Cadastro</AlertTitle>
                    <AlertDescription className="text-xs font-medium">
                        {error}
                    </AlertDescription>
                </Alert>
            )}

            {success && (
                <Alert className="animate-in fade-in slide-in-from-top-2 duration-300 rounded-[2rem] border-emerald-500/20 bg-emerald-500/5 backdrop-blur-sm">
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
                    {/* Partes Envolvidas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Remetente */}
                        <Card className="shadow-xl shadow-muted/20 bg-card/50 backdrop-blur-sm border border-border/40 rounded-[2.5rem] overflow-hidden">
                            <div className="p-8 border-b border-border/50 bg-muted/20">
                                <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                    <User size={14} className="text-primary" />
                                    Remetente
                                </h3>
                            </div>
                            <CardContent className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Nome Completo</label>
                                    <input
                                        type="text"
                                        name="sender_name"
                                        required
                                        value={formData.sender_name}
                                        onChange={handleChange}
                                        placeholder="Nome do remetente"
                                        className="w-full h-14 px-4 rounded-2xl bg-muted/40 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">CPF/CNPJ</label>
                                    <input
                                        type="text"
                                        name="sender_document"
                                        value={formData.sender_document}
                                        onChange={handleChange}
                                        placeholder="000.000.000-00"
                                        className="w-full h-14 px-4 rounded-2xl bg-muted/40 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium text-xs"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Telefone</label>
                                    <input
                                        type="text"
                                        name="sender_phone"
                                        value={formData.sender_phone}
                                        onChange={handleChange}
                                        placeholder="(00) 00000-0000"
                                        className="w-full h-14 px-4 rounded-2xl bg-muted/40 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium text-xs"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Destinatário */}
                        <Card className="shadow-xl shadow-muted/20 bg-card/50 backdrop-blur-sm border border-border/40 rounded-[2.5rem] overflow-hidden">
                            <div className="p-8 border-b border-border/50 bg-muted/20">
                                <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                    <User size={14} className="text-primary" />
                                    Destinatário
                                </h3>
                            </div>
                            <CardContent className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Nome Completo</label>
                                    <input
                                        type="text"
                                        name="recipient_name"
                                        required
                                        value={formData.recipient_name}
                                        onChange={handleChange}
                                        placeholder="Nome do destinatário"
                                        className="w-full h-14 px-4 rounded-2xl bg-muted/40 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">CPF/CNPJ</label>
                                    <input
                                        type="text"
                                        name="recipient_document"
                                        value={formData.recipient_document}
                                        onChange={handleChange}
                                        placeholder="000.000.000-00"
                                        className="w-full h-14 px-4 rounded-2xl bg-muted/40 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium text-xs"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Telefone</label>
                                    <input
                                        type="text"
                                        name="recipient_phone"
                                        value={formData.recipient_phone}
                                        onChange={handleChange}
                                        placeholder="(00) 00000-0000"
                                        className="w-full h-14 px-4 rounded-2xl bg-muted/40 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium text-xs"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Detalhes da Carga */}
                    <Card className="shadow-xl shadow-muted/20 bg-card/50 backdrop-blur-sm border border-border/40 rounded-[2.5rem] overflow-hidden">
                        <div className="p-8 border-b border-border/50 bg-muted/20">
                            <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                <Package size={14} className="text-primary" />
                                Conteúdo e Dimensões
                            </h3>
                        </div>
                        <CardContent className="p-8 space-y-8">
                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Descrição do Conteúdo</label>
                                <input
                                    type="text"
                                    name="description"
                                    required
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Ex: Caixa com eletrônicos diversos"
                                    className="w-full h-14 px-4 rounded-2xl bg-muted/40 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Peso Estimado (kg)</label>
                                    <input
                                        type="number"
                                        name="weight"
                                        step="0.1"
                                        min="0"
                                        value={formData.weight}
                                        onChange={handleChange}
                                        className="w-full h-14 px-4 rounded-2xl bg-muted/40 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Dimensões (CxLxA em cm)</label>
                                    <input
                                        type="text"
                                        name="dimensions"
                                        placeholder="Ex: 30x20x10"
                                        value={formData.dimensions}
                                        onChange={handleChange}
                                        className="w-full h-14 px-4 rounded-2xl bg-muted/40 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Rota */}
                    <Card className="shadow-xl shadow-muted/20 bg-card/50 backdrop-blur-sm border border-border/40 rounded-[2.5rem] overflow-hidden">
                        <div className="p-8 border-b border-border/50 bg-muted/20">
                            <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                <MapPin size={14} className="text-primary" />
                                Itinerário da Carga
                            </h3>
                        </div>
                        <CardContent className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-primary" />
                                        <h4 className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">Origem</h4>
                                    </div>
                                    <div className="grid grid-cols-4 gap-4">
                                        <div className="col-span-3 space-y-2">
                                            <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Cidade</label>
                                            <input
                                                type="text"
                                                name="origin_city"
                                                required
                                                value={formData.origin_city}
                                                onChange={handleChange}
                                                className="w-full h-14 px-4 rounded-2xl bg-muted/40 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium text-xs"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">UF</label>
                                            <input
                                                type="text"
                                                name="origin_state"
                                                required
                                                maxLength={2}
                                                value={formData.origin_state}
                                                onChange={handleChange}
                                                className="w-full h-14 px-4 rounded-2xl bg-muted/40 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-semibold uppercase text-[12px] text-center"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-destructive" />
                                        <h4 className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">Destino</h4>
                                    </div>
                                    <div className="grid grid-cols-4 gap-4">
                                        <div className="col-span-3 space-y-2">
                                            <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Cidade</label>
                                            <input
                                                type="text"
                                                name="destination_city"
                                                required
                                                value={formData.destination_city}
                                                onChange={handleChange}
                                                className="w-full h-14 px-4 rounded-2xl bg-muted/40 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium text-xs"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">UF</label>
                                            <input
                                                type="text"
                                                name="destination_state"
                                                required
                                                maxLength={2}
                                                value={formData.destination_state}
                                                onChange={handleChange}
                                                className="w-full h-14 px-4 rounded-2xl bg-muted/40 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-semibold uppercase text-[12px] text-center"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Coluna Lateral (1/3) */}
                <div className="space-y-8">
                    {/* Financeiro */}
                    <Card className="shadow-xl shadow-muted/20 bg-card/50 backdrop-blur-sm border border-border/40 rounded-[2.5rem] overflow-hidden">
                        <div className="p-8 border-b border-border/50 bg-muted/20">
                            <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                <DollarSign size={14} className="text-primary" />
                                Valor do Frete
                            </h3>
                        </div>
                        <CardContent className="p-8">
                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Valor Unitário (R$)</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-[12px]">R$</div>
                                    <input
                                        type="number"
                                        name="price"
                                        step="0.01"
                                        min="0"
                                        required
                                        value={formData.price}
                                        onChange={handleChange}
                                        className="w-full h-14 pl-12 pr-4 rounded-2xl bg-muted/40 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-bold text-xl"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Vínculo de Viagem */}
                    <Card className="shadow-xl shadow-muted/20 bg-card/50 backdrop-blur-sm border border-border/40 rounded-[2.5rem] overflow-hidden">
                        <div className="p-8 border-b border-border/50 bg-muted/20">
                            <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                <Truck size={14} className="text-primary" />
                                Embarque Imediato
                            </h3>
                        </div>
                        <CardContent className="p-8 space-y-4">
                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Vincular à Viagem</label>
                                <select
                                    name="trip_id"
                                    value={formData.trip_id}
                                    onChange={handleChange}
                                    className="w-full h-14 px-4 rounded-2xl bg-muted/40 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-semibold uppercase text-[12px] tracking-widest"
                                >
                                    <option value="">NÃO VINCULAR</option>
                                    {trips.map(trip => (
                                        <option key={trip.id} value={trip.id}>
                                            {trip.route_name} - {formatDate(trip.departure_date || '')}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                                <p className="text-[12px] font-medium text-primary leading-relaxed">
                                    Selecione uma viagem ativa para que a carga seja embarcada e processada imediatamente.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Observações */}
                    <Card className="shadow-xl shadow-muted/20 bg-card/50 backdrop-blur-sm border border-border/40 rounded-[2.5rem] overflow-hidden">
                        <div className="p-8 border-b border-border/50 bg-muted/20">
                            <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                <ListFilter size={14} className="text-primary" />
                                Observações
                            </h3>
                        </div>
                        <CardContent className="p-8">
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="Notas internas sobre a carga..."
                                rows={4}
                                className="w-full p-4 rounded-2xl bg-muted/40 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium text-sm resize-none"
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};
