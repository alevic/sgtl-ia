import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VeiculoStatus } from '../types';
import { ArrowLeft, Save, Bus, Truck, FileText, Gauge, Calendar, Wrench, Plus, Trash2, Image, Upload, X, Loader } from 'lucide-react';
import { IVeiculoFeature } from '../types';
import { DatePicker } from '../components/Form/DatePicker';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { CardContent } from '../components/ui/card';
import { PageHeader } from '../components/Layout/PageHeader';
import { FormSection } from '../components/Layout/FormSection';
import { cn } from '../lib/utils';
import { AlertCircle } from 'lucide-react';


export const NovoVeiculo: React.FC = () => {
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
    const [error, setError] = useState<string | null>(null);
    const [features, setFeatures] = useState<IVeiculoFeature[]>([
        { category: 'Mecânica', label: 'Carroceria Comil DD Invictus', value: '' },
        { category: 'Mecânica', label: 'Motor Volvo 420cv', value: '' },
        { category: 'Mecânica', label: 'Câmbio automático I-Schift', value: '' },
        { category: 'Segurança', label: 'Sistema ESP', value: '' },
        { category: 'Segurança', label: 'Freios ABS e EBS à disco', value: '' },
        { category: 'Comodidades', label: 'Ar condicionado – Calefação', value: '' },
        { category: 'Comodidades', label: 'Banheiro', value: '' }
    ]);

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

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/fleet/vehicles`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(vehicleData)
            });

            if (!response.ok) {
                throw new Error('Failed to create vehicle');
            }

            const createdVehicle = await response.json();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            navigate(`/admin/frota/${createdVehicle.id}`);
        } catch (error: any) {
            console.error("Erro ao salvar veículo:", error);
            setError(error.message || 'Erro ao salvar veículo. Por favor, tente novamente.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsLoading(false);
        }
    };



    return (
        <div key="novo-veiculo-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Header Executivo */}
            <PageHeader
                title="Novo Veículo"
                subtitle="Cadastre um novo veículo na frota do sistema"
                backLink="/admin/frota"
                backText="Voltar para Frota"
                rightElement={
                    <>
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/admin/frota')}
                            className="h-14 rounded-sm px-6 font-black uppercase text-[12px] tracking-widest"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSalvar}
                            disabled={isLoading}
                            className="h-14 rounded-sm px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[12px] tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <Loader className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            {isLoading ? 'Salvando...' : 'Salvar Veículo'}
                        </Button>
                    </>
                }
            />

            {error && (
                <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2 duration-300 rounded-sm border-destructive/20 bg-destructive/5  ">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="font-black uppercase text-[12px] tracking-widest">Erro no Cadastro</AlertTitle>
                    <AlertDescription className="text-xs font-medium">
                        {error}
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Coluna Principal (2/3) */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Informações Básicas */}
                    <FormSection
                        title="Informações Básicas"
                        icon={FileText}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">
                                    Placa *
                                </label>
                                <input
                                    type="text"
                                    value={placa}
                                    onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                                    placeholder="ABC-1234"
                                    maxLength={8}
                                    className="w-full h-14 px-4 rounded-sm bg-muted border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">
                                    Modelo *
                                </label>
                                <input
                                    type="text"
                                    value={modelo}
                                    onChange={(e) => setModelo(e.target.value)}
                                    placeholder="Ex: Mercedes-Benz O500"
                                    className="w-full h-14 px-4 rounded-sm bg-muted border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">
                                    Ano de Fabricação *
                                </label>
                                <input
                                    type="number"
                                    value={ano}
                                    onChange={(e) => setAno(e.target.value)}
                                    placeholder="2023"
                                    min="1990"
                                    max={new Date().getFullYear() + 1}
                                    className="w-full h-14 px-4 rounded-sm bg-muted border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium outline-none"
                                />
                            </div>

                            {tipo === 'ONIBUS' ? (
                                <div className="space-y-2">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                        <Bus size={10} className="text-primary" />
                                        Capacidade de Passageiros
                                    </label>
                                    <input
                                        type="number"
                                        value={capacidadePassageiros}
                                        onChange={(e) => setCapacidadePassageiros(e.target.value)}
                                        placeholder="46"
                                        min="1"
                                        className="w-full h-14 px-4 rounded-sm bg-muted border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium outline-none"
                                    />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                        <Truck size={10} className="text-primary" />
                                        Capacidade de Carga (ton)
                                    </label>
                                    <input
                                        type="number"
                                        value={capacidadeCarga}
                                        onChange={(e) => setCapacidadeCarga(e.target.value)}
                                        placeholder="25.5"
                                        step="0.1"
                                        min="0"
                                        className="w-full h-14 px-4 rounded-sm bg-muted border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium outline-none"
                                    />
                                </div>
                            )}

                            {tipo === 'ONIBUS' && (
                                <div className="md:col-span-2 flex items-center h-full">
                                    <label className="relative inline-flex items-center cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={isDoubleDeck}
                                            onChange={(e) => setIsDoubleDeck(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                        <span className="ml-3 text-[12px] font-semibold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
                                            Possui dois andares (Double Deck)?
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
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                    <Gauge size={10} className="text-primary" />
                                    Quilometragem Atual (km) *
                                </label>
                                <input
                                    type="number"
                                    value={kmAtual}
                                    onChange={(e) => setKmAtual(e.target.value)}
                                    placeholder="87500"
                                    min="0"
                                    className="w-full h-14 px-4 rounded-sm bg-muted border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                    <Wrench size={10} className="text-primary" />
                                    Próxima Revisão (km) *
                                </label>
                                <input
                                    type="number"
                                    value={proximaRevisaoKm}
                                    onChange={(e) => setProximaRevisaoKm(e.target.value)}
                                    placeholder="95000"
                                    min="0"
                                    className="w-full h-14 px-4 rounded-sm bg-muted border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                    <Calendar size={10} className="text-primary" />
                                    Data da Última Revisão
                                </label>
                                <DatePicker
                                    value={ultimaRevisao}
                                    onChange={setUltimaRevisao}
                                    placeholder="DD/MM/AAAA"
                                />
                            </div>
                        </div>
                    </FormSection>

                    {/* Características do Veículo */}
                    <FormSection
                        title="Características do Veículo"
                        icon={Bus}
                        rightElement={
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addFeature}
                                className="h-8 rounded-sm px-4 font-black uppercase text-[9px] tracking-widest border-primary/20 text-primary hover:bg-primary/5"
                            >
                                <Plus size={12} className="mr-1" />
                                Adicionar
                            </Button>
                        }
                    >
                        <div className="space-y-4">
                            {features.map((feature, index) => (
                                <div key={index} className="flex gap-4 items-start animate-in slide-in-from-left-2 duration-200">
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input
                                            type="text"
                                            value={feature.category}
                                            onChange={(e) => updateFeature(index, 'category', e.target.value)}
                                            placeholder="Categoria (Ex: Segurança)"
                                            className="w-full h-14 px-4 rounded-sm bg-muted border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium text-sm outline-none"
                                        />
                                        <input
                                            type="text"
                                            value={feature.label}
                                            onChange={(e) => updateFeature(index, 'label', e.target.value)}
                                            placeholder="Item (Ex: Freios ABS e EBS à disco)"
                                            className="w-full h-14 px-4 rounded-sm bg-muted border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium text-sm outline-none"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeFeature(index)}
                                        className="h-14 w-12 rounded-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </Button>
                                </div>
                            ))}
                            {features.length === 0 && (
                                <div className="text-center py-10 bg-muted rounded-sm border border-dashed border-border/50">
                                    <p className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">
                                        Nenhuma característica personalizada adicionada
                                    </p>
                                </div>
                            )}
                        </div>
                    </FormSection>

                    {/* Galeria de Fotos */}
                    <FormSection
                        title="Galeria de Fotos"
                        icon={Image}
                    >
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {galeria.map((img, idx) => (
                                <div key={idx} className="relative group aspect-square">
                                    <img
                                        src={img}
                                        alt={`Foto ${idx + 1}`}
                                        className="w-full h-full object-cover rounded-sm border border-border/50 shadow-sm transition-transform group-hover:scale-[1.02]"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeGaleriaImage(idx)}
                                        className="absolute -top-2 -right-2 p-1.5 bg-destructive text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                            <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-border/50 rounded-sm cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group">
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                    <Plus size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                                <span className="mt-2 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Adicionar</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleGaleriaUpload}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </FormSection>
                </div>

                {/* Coluna Lateral (1/3) */}
                <div className="space-y-8">
                    {/* Status e Tipo */}
                    <FormSection
                        title="Configurações Operacionais"
                    >
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">
                                    Tipo de Veículo
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setTipo('ONIBUS')}
                                        className={cn(
                                            "flex flex-col items-center justify-center gap-2 p-4 rounded-sm border transition-all",
                                            tipo === 'ONIBUS'
                                                ? "bg-primary/10 border-primary text-primary shadow-sm"
                                                : "bg-muted border-border/50 text-muted-foreground hover:bg-muted"
                                        )}
                                    >
                                        <Bus size={20} />
                                        <span className="text-[12px] font-black uppercase tracking-widest">Ônibus</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTipo('CAMINHAO')}
                                        className={cn(
                                            "flex flex-col items-center justify-center gap-2 p-4 rounded-sm border transition-all",
                                            tipo === 'CAMINHAO'
                                                ? "bg-primary/10 border-primary text-primary shadow-sm"
                                                : "bg-muted border-border/50 text-muted-foreground hover:bg-muted"
                                        )}
                                    >
                                        <Truck size={20} />
                                        <span className="text-[12px] font-black uppercase tracking-widest">Caminhão</span>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">
                                    Status Atual
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as VeiculoStatus)}
                                    className="w-full h-14 px-4 rounded-sm bg-muted border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-black uppercase text-[12px] tracking-widest outline-none appearance-none"
                                >
                                    <option value={VeiculoStatus.ACTIVE}>Ativo</option>
                                    <option value={VeiculoStatus.MAINTENANCE}>Em Manutenção</option>
                                    <option value={VeiculoStatus.IN_TRANSIT}>Em Viagem</option>
                                </select>
                            </div>
                        </div>
                    </FormSection>

                    {/* Foto de Capa */}
                    <FormSection
                        title="Foto Principal"
                        icon={Upload}
                    >
                        {imagem ? (
                            <div className="relative group">
                                <img
                                    src={imagem}
                                    alt="Capa do veículo"
                                    className="w-full aspect-video object-cover rounded-sm border border-border/50 shadow-md"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-sm flex items-center justify-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setImagem('')}
                                        className="p-2 bg-destructive text-white rounded-sm hover:scale-110 transition-transform"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-border/50 rounded-sm cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group">
                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                    <Upload size={24} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                                <span className="mt-3 text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">Upload da Foto</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImagemUpload}
                                    className="hidden"
                                />
                            </label>
                        )}
                    </FormSection>

                    {/* Observações */}
                    <FormSection
                        title="Observações Internas"
                        icon={FileText}
                    >
                        <textarea
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                            placeholder="Informações adicionais sobre o veículo..."
                            rows={4}
                            className="w-full p-4 rounded-sm bg-muted border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium text-sm resize-none outline-none"
                        />
                    </FormSection>

                    {/* Info Box */}
                    <div className="bg-primary/5 border border-primary/10 rounded-sm p-6 space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                {tipo === 'ONIBUS' ? (
                                    <Bus size={14} className="text-primary" />
                                ) : (
                                    <Truck size={14} className="text-primary" />
                                )}
                            </div>
                            <span className="text-[12px] font-black uppercase tracking-widest text-primary">Dica do Sistema</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                            {tipo === 'ONIBUS'
                                ? 'Este veículo ficará disponível para alocação em viagens de turismo. Certifique-se de preencher a capacidade de passageiros corretamente.'
                                : 'Este veículo ficará disponível para transporte de cargas expressas. Especifique a capacidade de carga em toneladas.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
