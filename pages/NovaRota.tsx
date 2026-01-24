import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IRota } from '../types';
import { EditorRota } from '../components/Rotas/EditorRota';
import { criarRotaVazia } from '../utils/rotaValidation';
import { routesService } from '../services/routesService';
import { ArrowLeft, Save, Route, Loader, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { cn } from '../lib/utils';

export const NovaRota: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdicao = Boolean(id);

    const [rota, setRota] = useState<IRota>(criarRotaVazia('IDA'));
    const [loading, setLoading] = useState(isEdicao);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form states
    const [nomeRota, setNomeRota] = useState('');
    const [tipoRota, setTipoRota] = useState<'IDA' | 'VOLTA'>('IDA');
    const [distanciaTotal, setDistanciaTotal] = useState<number | ''>('');
    const [rotaAtiva, setRotaAtiva] = useState(true);

    useEffect(() => {
        if (isEdicao && id) {
            loadRota(id);
        }
    }, [id, isEdicao]);

    const loadRota = async (rotaId: string) => {
        try {
            setLoading(true);
            const data = await routesService.getById(rotaId);
            setRota(data);

            // Populate form fields
            setNomeRota(data.nome);
            setTipoRota(data.tipo_rota);
            setDistanciaTotal(data.distancia_total_km || '');
            setRotaAtiva(data.ativa);
        } catch (error) {
            console.error('Erro ao carregar rota:', error);
            setError('Erro ao carregar detalhes da rota.');
            setTimeout(() => navigate('/admin/rotas'), 2000);
        } finally {
            setLoading(false);
        }
    };

    const handleTipoChange = (novoTipo: 'IDA' | 'VOLTA') => {
        setTipoRota(novoTipo);
        setRota({ ...rota, tipo_rota: novoTipo });
    };

    const handleSalvar = async () => {
        setError(null);
        if (!nomeRota) {
            setError('Por favor, informe um nome para a rota.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        if (rota.pontos.length < 2) {
            setError('A rota deve ter pelo menos origem e destino.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        try {
            setSaving(true);

            // Parse origin and destination
            const origemPonto = rota.pontos[0];
            const destinoPonto = rota.pontos[rota.pontos.length - 1];

            const parseLocation = (location: string) => {
                const parts = location.split(/[,-]/).map(s => s.trim());
                if (parts.length >= 2) {
                    return { city: parts[0], state: parts[1].substring(0, 2).toUpperCase() };
                }
                return { city: location, state: 'UF' };
            };

            const origem = parseLocation(origemPonto.nome);
            const destino = parseLocation(destinoPonto.nome);

            const payload: any = {
                name: nomeRota,
                origin_city: origem.city,
                origin_state: origem.state,
                destination_city: destino.city,
                destination_state: destino.state,
                distance_km: distanciaTotal ? Number(distanciaTotal) : 0,
                duration_minutes: rota.duracao_estimada_minutos || 0,
                stops: rota.pontos,
                active: rotaAtiva,
                type: tipoRota
            };

            if (isEdicao && id) {
                await routesService.update(id, payload);
            } else {
                await routesService.create(payload);
            }

            setSuccess('Rota salva com sucesso!');
            setTimeout(() => navigate('/admin/rotas'), 2000);
        } catch (error) {
            console.error('Erro ao salvar rota:', error);
            setError('Erro ao salvar rota. Verifique os dados e tente novamente.');
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
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Header Executivo */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <button
                        onClick={() => navigate('/admin/rotas')}
                        className="group flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                        <span className="text-[12px] font-black uppercase tracking-widest">Painel de Rotas</span>
                    </button>
                    <div>
                        <h1 className="text-4xl font-black text-foreground tracking-tight">
                            {isEdicao ? 'EDITAR' : 'NOVA'} <span className="text-primary italic">ROTA</span>
                        </h1>
                        <p className="text-muted-foreground font-medium mt-1">
                            {isEdicao ? 'Atualize as paradas e horários da rota selecionada' : 'A Rota é a espinha dorsal de suas viagens operacionais'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/admin/rotas')}
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
                        {saving ? 'Gravando...' : 'Salvar Rota'}
                    </Button>
                </div>
            </div>

            {error && (
                <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2 duration-300 rounded-3xl border-destructive/20 bg-destructive/5 backdrop-blur-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="font-black uppercase text-[12px] tracking-widest">Incidente no Processamento</AlertTitle>
                    <AlertDescription className="text-xs font-medium">
                        {error}
                    </AlertDescription>
                </Alert>
            )}

            {success && (
                <Alert className="animate-in fade-in slide-in-from-top-2 duration-300 rounded-3xl border-emerald-500/20 bg-emerald-500/5 backdrop-blur-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <AlertTitle className="font-black uppercase text-[12px] tracking-widest text-emerald-500">Sucesso</AlertTitle>
                    <AlertDescription className="text-xs font-medium text-emerald-600/80">
                        {success}
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Configurações Estruturais (1/4) */}
                <div className="lg:col-span-1 space-y-8">
                    <Card className="shadow-xl shadow-muted/20 bg-card/50 backdrop-blur-sm border border-border/40 rounded-3xl overflow-hidden">
                        <div className="p-8 border-b border-border/50 bg-muted/20">
                            <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                <Route size={14} className="text-primary" />
                                Estrutura da Rota
                            </h3>
                        </div>
                        <CardContent className="p-8 space-y-8">
                            {/* Nome da Rota */}
                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Codificação / Nome</label>
                                <input
                                    type="text"
                                    value={nomeRota}
                                    onChange={(e) => setNomeRota(e.target.value)}
                                    placeholder="Ex: SP-RJ EXPRESS"
                                    className="w-full h-14 px-4 rounded-xl bg-muted/40 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-black uppercase text-[12px] tracking-widest"
                                />
                            </div>

                            {/* Tipo de Rota */}
                            <div className="space-y-3">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Sentido Operacional</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => handleTipoChange('IDA')}
                                        className={cn(
                                            "h-14 rounded-xl border-2 transition-all font-black text-[12px] tracking-widest uppercase",
                                            tipoRota === 'IDA' ? "border-primary bg-primary/5 text-primary" : "border-border/40 text-muted-foreground hover:border-border"
                                        )}
                                    >
                                        IDA
                                    </button>
                                    <button
                                        onClick={() => handleTipoChange('VOLTA')}
                                        className={cn(
                                            "h-14 rounded-xl border-2 transition-all font-black text-[12px] tracking-widest uppercase",
                                            tipoRota === 'VOLTA' ? "border-primary bg-primary/5 text-primary" : "border-border/40 text-muted-foreground hover:border-border"
                                        )}
                                    >
                                        VOLTA
                                    </button>
                                </div>
                            </div>

                            {/* Distância */}
                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Extensão (KM)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={distanciaTotal}
                                        onChange={(e) => setDistanciaTotal(e.target.value === '' ? '' : Number(e.target.value))}
                                        placeholder="0"
                                        className="w-full h-14 px-4 rounded-xl bg-muted/40 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-bold text-sm"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-black text-muted-foreground uppercase">quilômetros</span>
                                </div>
                            </div>

                            {/* Duração Estimada */}
                            {rota.duracao_estimada_minutos && rota.duracao_estimada_minutos > 0 && (
                                <div className="p-6 rounded-3xl bg-primary/5 border border-primary/20 space-y-2">
                                    <p className="text-[12px] font-black uppercase tracking-widest text-primary/60">Tempo de Percurso</p>
                                    <p className="text-3xl font-black tracking-tighter text-primary">
                                        {Math.floor(rota.duracao_estimada_minutos / 60)}h{' '}
                                        <span className="text-xl">{rota.duracao_estimada_minutos % 60}m</span>
                                    </p>
                                </div>
                            )}

                            {/* Status */}
                            <div className="pt-4 border-t border-border/50">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={cn(
                                        "w-10 h-6 rounded-full p-1 transition-all duration-300",
                                        rotaAtiva ? "bg-primary" : "bg-muted"
                                    )}>
                                        <div className={cn(
                                            "w-4 h-4 bg-white rounded-full transition-all duration-300",
                                            rotaAtiva ? "translate-x-4" : "translate-x-0"
                                        )} />
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={rotaAtiva}
                                        onChange={(e) => setRotaAtiva(e.target.checked)}
                                        className="sr-only"
                                    />
                                    <span className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
                                        Rota Ativa
                                    </span>
                                </label>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Editor de Rota (3/4) */}
                <div className="lg:col-span-3">
                    <Card className="shadow-xl shadow-muted/20 bg-card/50 backdrop-blur-sm border border-border/40 rounded-3xl overflow-hidden">
                        <div className="p-8 border-b border-border/50 bg-muted/20 flex items-center justify-between">
                            <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                <Route size={14} className="text-primary" />
                                Mapeamento de Pontos e Paradas
                            </h3>
                            <div className="px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[12px] font-black text-primary uppercase tracking-widest">
                                {rota.pontos.length} PONTOS CONFIGURADOS
                            </div>
                        </div>
                        <CardContent className="p-8">
                            <EditorRota rota={rota} onChange={setRota} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};
