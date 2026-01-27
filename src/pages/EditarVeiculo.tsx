import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VeiculoStatus } from '@/types';
import {
    ArrowLeft, Save, Bus, Truck, FileText, Gauge,
    Calendar, Wrench, Plus, Trash2, Image, Upload,
    X, Loader, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { IVeiculoFeature } from '@/types';
import { SwissDatePicker } from '../components/Form/SwissDatePicker';
import { authClient } from '../lib/auth-client';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/Layout/PageHeader';
import { FormSection } from '../components/Layout/FormSection';
import { cn } from '../lib/utils';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';


export const EditarVeiculo: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [placa, setPlaca] = useState('');
    const [modelo, setModelo] = useState('');
    const [tipo, setTipo] = useState<'ONIBUS' | 'CAMINHAO'>('ONIBUS');
    const [status, setStatus] = useState<VeiculoStatus>(VeiculoStatus.ACTIVE);
    const [ano, setAno] = useState('');
    const [kmAtual, setKmAtual] = useState('');
    const [proximaRevisaoKm, setProximaRevisaoKm] = useState('');
    const [ultimaRevisao, setUltimaRevisao] = useState('');
    const [capacidadePassageiros, setCapacidadePassageiros] = useState('');
    const [capacidadeCarga, setCapacidadeCarga] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [isDoubleDeck, setIsDoubleDeck] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [features, setFeatures] = useState<IVeiculoFeature[]>([]);

    // Image states
    const [imagem, setImagem] = useState<string>('');
    const [galeria, setGaleria] = useState<string[]>([]);

    const addFeature = () => {
        setFeatures([...features, { category: '', label: '', value: '' }]);
    };

    const removeFeature = (index: number) => {
        setFeatures(features.filter((_, i) => i !== index));
    };

    const updateFeature = (index: number, field: keyof IVeiculoFeature, value: string) => {
        const newFeatures = [...features];
        newFeatures[index][field] = value;
        setFeatures(newFeatures);
    };

    // Image handlers
    const handleImagemUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagem(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGaleriaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            (Array.from(files) as File[]).forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setGaleria(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const removeGaleriaImage = (index: number) => {
        setGaleria(galeria.filter((_, i) => i !== index));
    };

    useEffect(() => {
        const fetchVehicle = async () => {
            if (!id) return;

            setIsFetching(true);
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/fleet/vehicles/${id}`, {
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch vehicle');
                }

                const data = await response.json();

                // Pre-populate form
                setPlaca(data.placa || '');
                setModelo(data.modelo || '');
                setTipo(data.tipo || 'ONIBUS');
                setStatus(data.status || VeiculoStatus.ACTIVE);
                setAno(data.ano?.toString() || '');
                setKmAtual(data.km_atual?.toString() || '');
                setProximaRevisaoKm(data.proxima_revisao_km?.toString() || '');
                setUltimaRevisao(data.ultima_revisao ? data.ultima_revisao.split('T')[0] : '');
                setIsDoubleDeck(data.is_double_deck || false);
                setCapacidadePassageiros(data.capacidade_passageiros?.toString() || '');
                setCapacidadeCarga(data.capacidade_carga?.toString() || '');
                setObservacoes(data.observacoes || '');
                setFeatures(data.features || []);
                setImagem(data.imagem || '');
                setGaleria(data.galeria || []);
            } catch (error: any) {
                console.error("Erro ao buscar veículo:", error);
                setError(error.message || 'Erro ao carregar veículo.');
                setTimeout(() => navigate('/admin/frota'), 3000);
            } finally {
                setIsFetching(false);
            }
        };

        fetchVehicle();
    }, [id, navigate]);

    const handleSalvar = async () => {
        setError(null);
        if (!placa || !modelo || !ano || !kmAtual || !proximaRevisaoKm) {
            setError('Por favor, preencha todos os campos obrigatórios (*)');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setIsLoading(true);
        try {
            const vehicleData = {
                placa: placa.trim(),
                modelo: modelo.trim(),
                tipo,
                status,
                ano: parseInt(ano) || 0,
                km_atual: parseInt(kmAtual) || 0,
                proxima_revisao_km: parseInt(proximaRevisaoKm) || 0,
                ultima_revisao: ultimaRevisao || null,
                is_double_deck: isDoubleDeck,
                capacidade_passageiros: tipo === 'ONIBUS' ? (parseInt(capacidadePassageiros) || 0) : null,
                capacidade_carga: tipo === 'CAMINHAO' ? (parseFloat(capacidadeCarga) || 0) : null,
                observacoes: observacoes?.trim() || null,
                features: features.filter(f => f.label.trim() !== '' || f.category?.trim() !== '').map(f => ({ ...f, value: '' })),
                imagem: imagem || null,
                galeria: galeria.length > 0 ? galeria : null
            };

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/fleet/vehicles/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(vehicleData)
            });

            if (!response.ok) {
                throw new Error('Failed to update vehicle');
            }

            navigate(`/admin/frota/${id}`);
        } catch (error: any) {
            console.error("Erro ao atualizar veículo:", error);
            setError(error.message || 'Erro ao atualizar veículo. Por favor, tente novamente.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsLoading(false);
        }
    };



    if (isFetching) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="relative">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <Bus className="absolute inset-0 m-auto w-5 h-5 text-primary animate-pulse" />
                </div>
                <p className="text-[12px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">
                    Sincronizando Frota...
                </p>
            </div>
        );
    }

    return (
        <div key="editar-veiculo-main" className="p-8 space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-20 max-w-7xl mx-auto">
            {/* Feedback de Sistema */}
            {(error || (isLoading && !isFetching)) && (
                <div className="fixed top-8 right-8 z-50 w-full max-w-md animate-in slide-in-from-right-8 duration-500">
                    {error ? (
                        <Alert variant="destructive" className="shadow-2xl border-destructive/50 bg-destructive/10  ">
                            <AlertTriangle className="h-5 w-5" />
                            <AlertTitle className="font-black uppercase tracking-widest text-[12px]">Erro de Validação</AlertTitle>
                            <AlertDescription className="font-medium">{error}</AlertDescription>
                        </Alert>
                    ) : (
                        <Alert className="shadow-2xl border-primary/50 bg-primary/10  ">
                            <Loader className="h-5 w-5 animate-spin text-primary" />
                            <AlertTitle className="font-black uppercase tracking-widest text-[12px]">Processando</AlertTitle>
                            <AlertDescription className="font-medium text-primary">Sincronizando alterações com o servidor...</AlertDescription>
                        </Alert>
                    )}
                </div>
            )}

            {/* Header Module */}
            <PageHeader
                title="Editar Registro"
                subtitle={`Atualizando especificações de: ${modelo || placa}`}
                suffix="FROTA"
                icon={Bus}
                backLink={`/admin/frota/${id}`}
                backLabel="Painel do Veículo"
                rightElement={
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => navigate(`/admin/frota/${id}`)}
                            className="h-14 rounded-sm px-6 font-black uppercase text-[12px] tracking-widest"
                        >
                            Descartar
                        </Button>
                        <Button
                            onClick={handleSalvar}
                            disabled={isLoading}
                            className="h-14 rounded-sm px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[12px] tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {isLoading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            {isLoading ? 'Sincronizando...' : 'Salvar Alterações'}
                        </Button>
                    </div>
                }
            />

            <div className="mx-auto space-y-8 pb-12">
                {/* Informações Básicas */}
                <FormSection
                    title="Informações Básicas"
                    icon={FileText}
                    description="Dados fundamentais do registro"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                                Placa do Veículo
                            </label>
                            <input
                                type="text"
                                value={placa}
                                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                                placeholder="ABC-1234"
                                maxLength={8}
                                className="w-full h-14 px-4 bg-background border-2 border-border/50 rounded-sm focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-bold text-foreground placeholder:text-muted-foreground/30 uppercase"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                                Modelo do Veículo
                            </label>
                            <input
                                type="text"
                                value={modelo}
                                onChange={(e) => setModelo(e.target.value)}
                                placeholder="Ex: Mercedes-Benz O500"
                                className="w-full h-14 px-4 bg-background border-2 border-border/50 rounded-sm focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-bold text-foreground placeholder:text-muted-foreground/30"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                                Tipo de Frota
                            </label>
                            <select
                                value={tipo}
                                onChange={(e) => setTipo(e.target.value as 'ONIBUS' | 'CAMINHAO')}
                                className="w-full h-14 px-4 bg-background border-2 border-border/50 rounded-sm focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-bold text-foreground appearance-none cursor-pointer text-sm"
                            >
                                <option value="ONIBUS">🚌 Ônibus Executivo</option>
                                <option value="CAMINHAO">🚛 Caminhão de Carga</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                                Ano de Fabricação
                            </label>
                            <input
                                type="number"
                                value={ano}
                                onChange={(e) => setAno(e.target.value)}
                                placeholder="2024"
                                min="1990"
                                max={new Date().getFullYear() + 1}
                                className="w-full h-14 px-4 bg-background border-2 border-border/50 rounded-sm focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-bold text-foreground placeholder:text-muted-foreground/30"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                                Status Operacional
                            </label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as VeiculoStatus)}
                                className="w-full h-14 px-4 bg-background border-2 border-border/50 rounded-sm focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-bold text-foreground appearance-none cursor-pointer text-sm"
                            >
                                <option value={VeiculoStatus.ACTIVE}>✅ Ativo e Disponível</option>
                                <option value={VeiculoStatus.MAINTENANCE}>🔧 Em Manutenção</option>
                                <option value={VeiculoStatus.IN_TRANSIT}>🚀 Em Operação</option>
                            </select>
                        </div>

                        {tipo === 'ONIBUS' ? (
                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 flex items-center gap-2">
                                    <Bus size={12} className="text-primary" />
                                    Lotação de Passageiros
                                </label>
                                <input
                                    type="number"
                                    value={capacidadePassageiros}
                                    onChange={(e) => setCapacidadePassageiros(e.target.value)}
                                    placeholder="46"
                                    min="1"
                                    className="w-full h-14 px-4 bg-background border-2 border-border/50 rounded-sm focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-bold text-foreground placeholder:text-muted-foreground/30"
                                />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 flex items-center gap-2">
                                    <Truck size={12} className="text-primary" />
                                    Capacidade de Carga (Ton)
                                </label>
                                <input
                                    type="number"
                                    value={capacidadeCarga}
                                    onChange={(e) => setCapacidadeCarga(e.target.value)}
                                    placeholder="25.5"
                                    step="0.1"
                                    min="0"
                                    className="w-full h-14 px-4 bg-background border-2 border-border/50 rounded-sm focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-bold text-foreground placeholder:text-muted-foreground/30"
                                />
                            </div>
                        )}

                        {tipo === 'ONIBUS' && (
                            <div className="flex items-center h-[56px] pt-6 ml-1">
                                <label className="relative inline-flex items-center cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={isDoubleDeck}
                                        onChange={(e) => setIsDoubleDeck(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                                    <span className="ml-3 text-[12px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors cursor-pointer">
                                        Double Deck
                                    </span>
                                </label>
                            </div>
                        )}
                    </div>
                </FormSection>

                {/* Quilometragem e Manutenção */}
                <FormSection
                    title="Quilometragem e Manutenção"
                    icon={Wrench}
                    description="Controle de odômetro e revisões"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 flex items-center gap-2">
                                <Gauge size={12} className="text-primary" />
                                KM Atual
                            </label>
                            <input
                                type="number"
                                value={kmAtual}
                                onChange={(e) => setKmAtual(e.target.value)}
                                placeholder="87500"
                                min="0"
                                className="w-full h-14 px-4 bg-background border-2 border-border/50 rounded-sm focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-bold text-foreground placeholder:text-muted-foreground/30"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 flex items-center gap-2">
                                <Wrench size={12} className="text-orange-500" />
                                Próxima Revisão (KM)
                            </label>
                            <input
                                type="number"
                                value={proximaRevisaoKm}
                                onChange={(e) => setProximaRevisaoKm(e.target.value)}
                                placeholder="95000"
                                min="0"
                                className="w-full h-14 px-4 bg-background border-2 border-border/50 rounded-sm focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-bold text-foreground placeholder:text-muted-foreground/30"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 flex items-center gap-2">
                                <Calendar size={12} className="text-purple-500" />
                                Última Revisão
                            </label>
                            <SwissDatePicker
                                value={ultimaRevisao}
                                onChange={setUltimaRevisao}
                                placeholder="DD/MM/AAAA"
                            />
                        </div>
                    </div>
                </FormSection>

                {/* Características do Veículo */}
                {/* Características do Veículo */}
                <FormSection
                    title="Características"
                    icon={Bus}
                    description="Equipamentos e diferenciais"
                    footer={
                        <Button
                            type="button"
                            variant="outline"
                            onClick={addFeature}
                            className="h-10 rounded-sm px-4 font-black uppercase text-[10px] tracking-widest border-2"
                        >
                            <Plus size={14} className="mr-2" />
                            Adicionar Característica
                        </Button>
                    }
                >
                    <div className="space-y-4">
                        {features.map((feature, index) => (
                            <div key={index} className="flex gap-4 items-center animate-in slide-in-from-left-4 duration-300">
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        value={feature.category}
                                        onChange={(e) => updateFeature(index, 'category', e.target.value)}
                                        placeholder="Categoria (Ex: Segurança)"
                                        className="w-full h-12 px-4 bg-background border-2 border-border/50 rounded-sm focus:border-primary/50 transition-all font-bold text-[13px] text-foreground placeholder:text-muted-foreground/30"
                                    />
                                    <input
                                        type="text"
                                        value={feature.label}
                                        onChange={(e) => updateFeature(index, 'label', e.target.value)}
                                        placeholder="Item (Ex: Freios ABS)"
                                        className="w-full h-12 px-4 bg-background border-2 border-border/50 rounded-sm focus:border-primary/50 transition-all font-bold text-[13px] text-foreground placeholder:text-muted-foreground/30"
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeFeature(index)}
                                    className="h-12 w-12 rounded-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                >
                                    <Trash2 size={18} />
                                </Button>
                            </div>
                        ))}
                        {features.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 px-4 rounded-sm border-2 border-dashed border-border/50 bg-muted">
                                <Plus size={32} className="text-muted-foreground/30 mb-2" />
                                <p className="text-[12px] font-black uppercase tracking-widest text-muted-foreground/50">
                                    Nenhuma característica personalizada
                                </p>
                            </div>
                        )}
                    </div>
                </FormSection>

                {/* Observações */}
                <FormSection
                    title="Resumo e Notas"
                    icon={FileText}
                    description="Observações internas e detalhes operacionais"
                >
                    <div className="space-y-4">
                        <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                            Notas Internas
                        </label>
                        <textarea
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                            placeholder="Descreva aqui considerações importantes sobre este veículo..."
                            rows={4}
                            className="w-full p-4 bg-background border-2 border-border/50 rounded-sm focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-medium text-foreground placeholder:text-muted-foreground/30 min-h-[160px]"
                        />
                    </div>
                </FormSection>

                {/* Imagens do Veículo */}
                <FormSection
                    title="Acervo Visual"
                    icon={Image}
                    description="Fotos de capa e galeria detalhada"
                >
                    <div className="space-y-10">
                        {/* Foto de Capa */}
                        <div className="space-y-4">
                            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                                Identidade Visual (Capa)
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                {imagem ? (
                                    <div className="relative group rounded-sm overflow-hidden border-2 border-border/50 shadow-lg aspect-video bg-muted">
                                        <img
                                            src={imagem}
                                            alt="Capa do veículo"
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                onClick={() => setImagem('')}
                                                className="h-12 w-12 rounded-sm shadow-2xl"
                                            >
                                                <Trash2 size={20} />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center aspect-video border-2 border-dashed border-border/50 rounded-[2.5rem] cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group overflow-hidden bg-muted">
                                        <div className="w-16 h-16 rounded-sm bg-primary/10 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                                            <Upload size={24} className="text-primary" />
                                        </div>
                                        <span className="text-[12px] font-black uppercase tracking-widest text-muted-foreground">Upload Capa</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImagemUpload}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                                <div className="p-6 rounded-[2.5rem] bg-primary/5 border border-primary/10 flex items-start gap-4">
                                    <AlertTriangle size={20} className="text-primary mt-1 shrink-0" />
                                    <p className="text-[13px] font-medium text-primary leading-relaxed italic">
                                        "A foto de capa é recomendada para exibição em painéis e buscas de frota. Utilize imagens em alta resolução para melhor apresentação."
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Galeria */}
                        <div className="space-y-4">
                            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                                Galeria Complementar
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {galeria.map((img, idx) => (
                                    <div key={idx} className="relative group aspect-square rounded-sm overflow-hidden border-2 border-border/50 bg-muted">
                                        <img
                                            src={img}
                                            alt={`Galeria ${idx + 1}`}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => removeGaleriaImage(idx)}
                                                className="h-8 w-8 rounded-sm"
                                            >
                                                <X size={14} />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-border/50 rounded-sm cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group bg-muted">
                                    <Plus size={24} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2">Add Foto</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleGaleriaUpload}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                </FormSection>
            </div>
        </div>
    );
};
