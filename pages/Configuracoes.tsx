import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { EmpresaContexto } from '../types';
import {
    Save, Bell, Shield, Monitor, RefreshCw, Database,
    Settings2, Plus, Trash2, AlertCircle, Loader2,
    Globe, CalendarClock, Wallet, Truck, Users, CreditCard,
    Search, X, ChevronRight, Check, AlertTriangle, CheckCircle2, ArrowLeft
} from 'lucide-react';
import { authClient } from '../lib/auth-client';
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { PageHeader } from '../components/Layout/PageHeader';
import { cn } from '../lib/utils';
import { Input } from '../components/ui/input';
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

interface IParameter {
    id: string;
    key: string;
    value: string;
    description: string;
    group_name?: string;
    updated_at: string;
}

interface ISettingFieldProps {
    label: string;
    description?: string;
    k: string;
    type?: 'text' | 'number' | 'textarea' | 'select' | 'checkbox';
    placeholder?: string;
    options?: { label: string, value: string }[];
    allSettings: Record<string, string>;
    setAllSettings: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    themeColor: string;
}

const SettingField: React.FC<ISettingFieldProps> = ({
    label, description, k, type = 'text', placeholder = '', options = [], allSettings, setAllSettings, themeColor
}) => {
    const value = allSettings[k] || '';

    const handleChange = (newVal: string) => {
        setAllSettings(prev => ({ ...prev, [k]: newVal }));
    };

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-baseline">
                <label className="text-label-caps ml-1">{label}</label>
                <code className="text-section-description bg-primary/5 px-2 py-0.5 rounded-lg border border-primary/10">
                    {k}
                </code>
            </div>
            {description && <p className="text-[11px] font-medium text-muted-foreground/80 leading-relaxed mb-2 px-1">{description}</p>}

            {type === 'textarea' ? (
                <textarea
                    value={value}
                    onChange={(e) => handleChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full p-4 bg-muted/40 border border-border/50 rounded-xl font-medium text-sm transition-all focus:ring-2 focus:ring-primary/20 outline-none resize-none h-28"
                />
            ) : type === 'select' ? (
                <div className="relative group">
                    <select
                        value={value}
                        onChange={(e) => handleChange(e.target.value)}
                        className="w-full h-14 px-4 bg-muted/40 border border-border/50 rounded-xl font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer text-sm"
                    >
                        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                    <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-muted-foreground pointer-events-none group-hover:text-primary transition-colors" />
                </div>
            ) : type === 'checkbox' ? (
                <div className="flex items-center gap-3 bg-muted/20 p-4 rounded-xl border border-border/40">
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={value === 'true'}
                            onChange={(e) => handleChange(e.target.checked ? 'true' : 'false')}
                        />
                        <div className={cn(
                            "w-11 h-6 bg-muted-foreground/20 rounded-full peer transition-all",
                            "after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all",
                            "peer-checked:after:translate-x-full peer-checked:bg-emerald-500 shadow-inner"
                        )} />
                    </label>
                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
                        {value === 'true' ? 'ATIVADO' : 'DESATIVADO'}
                    </span>
                </div>
            ) : (
                <Input
                    type={type}
                    value={value}
                    onChange={(e) => handleChange(e.target.value)}
                    placeholder={placeholder}
                    className="h-14 bg-muted/40 border-input rounded-xl font-bold transition-all focus-visible:ring-2 focus-visible:ring-primary/20"
                />
            )}
        </div>
    );
};


interface IParameterMetadata {
    label: string;
    group: string;
    type: 'text' | 'number' | 'select' | 'checkbox' | 'textarea';
    description: string;
    options?: { label: string, value: string }[];
    contexts?: EmpresaContexto[]; // Optional: show only in these contexts
}

const PARAM_METADATA: Record<string, IParameterMetadata> = {
    // Sistema
    'system_name': { label: 'Nome do Sistema', group: 'Sistema', type: 'text', description: 'Nome do dashboard administrativo.' },
    'system_slogan': { label: 'Slogan/Subtítulo', group: 'Sistema', type: 'text', description: 'Slogan ou subtítulo do sistema.' },
    'system_display_version': { label: 'Versão Exibida', group: 'Sistema', type: 'text', description: 'Sobrescrever manualmente a versão visível.' },
    'system_footer_text': { label: 'Rodapé do Sistema', group: 'Sistema', type: 'text', description: 'Texto global de rodapé do dashboard.' },
    'system_support_email': { label: 'Email de Suporte', group: 'Sistema', type: 'text', description: 'Email para suporte técnico.' },
    'system_support_phone': { label: 'Telefone de Suporte', group: 'Sistema', type: 'text', description: 'Telefone para suporte técnico.' },
    'system_timezone': { label: 'Fuso Horário', group: 'Sistema', type: 'text', description: 'Fuso horário padrão para datas e horários.' },
    'system_language': { label: 'Idioma', group: 'Sistema', type: 'select', description: 'Idioma principal da interface.', options: [{ label: 'Português (Brasil)', value: 'pt-BR' }, { label: 'English (US)', value: 'en-US' }] },
    'system_date_format': { label: 'Formato de Data', group: 'Sistema', type: 'text', description: 'Formato de exibição de datas.' },

    // Viagens
    'trip_auto_complete_safety_margin_hours': { label: 'Margem de conclusão (horas)', group: 'Viagens', type: 'number', description: 'Horas após a partida para marcar viagem como concluída (fallback).', contexts: [EmpresaContexto.TURISMO] },
    'auto_start_trips': { label: 'Automação de Status', group: 'Viagens', type: 'checkbox', description: 'Mudar para \'Em Trânsito\' automaticamente no horário de partida.', contexts: [EmpresaContexto.TURISMO] },
    'crm_enable_reward_points': { label: 'Ativar Pontos de Fidelidade', group: 'Viagens', type: 'checkbox', description: 'Habilitar sistema de pontos por viagem.', contexts: [EmpresaContexto.TURISMO] },
    'crm_points_per_trip': { label: 'Pontos por Real (R$ 1.00)', group: 'Viagens', type: 'number', description: 'Pontos ganhos por cada real gasto.', contexts: [EmpresaContexto.TURISMO] },

    // Reservas
    'booking_deadline_hours': { label: 'Prazo limite de reserva (horas)', group: 'Reservas', type: 'number', description: 'Horas antes da partida para bloquear vendas online.', contexts: [EmpresaContexto.TURISMO] },
    'reservation_expiration_minutes': { label: 'Expiração de pendência (minutos)', group: 'Reservas', type: 'number', description: 'Minutos para cancelar reservas pendentes automaticamente.', contexts: [EmpresaContexto.TURISMO] },

    // Clientes
    'crm_vip_threshold_trips': { label: 'Limite para VIP (Viagens)', group: 'Clientes', type: 'number', description: 'Número de viagens para tornar cliente VIP.', contexts: [EmpresaContexto.TURISMO] },

    // Frota
    'fleet_default_vehicle_type': {
        label: 'Tipo de Veículo Padrão', group: 'Frota', type: 'select', description: 'Tipo de veículo padrão para novas viagens.', options: [
            { label: 'Ônibus (Convencional)', value: 'BUS_CONV' }, { label: 'Ônibus (Executivo)', value: 'BUS_EXEC' }, { label: 'Micro-ônibus', value: 'MICRO' }, { label: 'Van', value: 'VAN' }
        ],
        contexts: [EmpresaContexto.TURISMO]
    },

    // Manutenção
    'fleet_maintenance_km_threshold': { label: 'Alerta de Manutenção (KM)', group: 'Manutenção', type: 'number', description: 'Quilometragem padrão para alerta de revisão.', contexts: [EmpresaContexto.TURISMO, EmpresaContexto.EXPRESS] },
    'fleet_maintenance_days_threshold': { label: 'Alerta de Manutenção (Dias)', group: 'Manutenção', type: 'number', description: 'Dias padrão para alerta de revisão por tempo.', contexts: [EmpresaContexto.TURISMO, EmpresaContexto.EXPRESS] },

    // Financeiro
    'system_currency': { label: 'Moeda', group: 'Financeiro', type: 'text', description: 'Símbolo monetário (ex: R$, $).' },
    'finance_convenience_fee_percent': { label: 'Taxa de Conveniência (%)', group: 'Financeiro', type: 'number', description: 'Taxa de conveniência aplicada em vendas web.', contexts: [EmpresaContexto.TURISMO, EmpresaContexto.EXPRESS] },
    'finance_default_payment_method': {
        label: 'Método Padrão', group: 'Financeiro', type: 'select', description: 'Método de pagamento sugerido no checkout.', options: [
            { label: 'Cartão de Crédito', value: 'CREDIT_CARD' }, { label: 'PIX', value: 'PIX' }, { label: 'Boleto', value: 'BOLETO' }, { label: 'Dinheiro', value: 'CASH' }
        ],
        contexts: [EmpresaContexto.TURISMO, EmpresaContexto.EXPRESS]
    },
    'finance_auto_generate_invoice': { label: 'Faturamento Automático', group: 'Financeiro', type: 'checkbox', description: 'Gerar contas a receber ao confirmar reserva.', contexts: [EmpresaContexto.TURISMO, EmpresaContexto.EXPRESS] },

    // Portal Público
    'portal_logo_text': { label: 'Nome do Logotipo', group: 'Portal Público', type: 'text', description: 'Texto do logotipo no portal público.' },
    'portal_header_slogan': { label: 'Slogan do Header', group: 'Portal Público', type: 'text', description: 'Slogan abaixo do logo no portal.' },
    'portal_hero_title': { label: 'Título do Banner', group: 'Portal Público', type: 'text', description: 'Título principal da página inicial do portal.' },
    'portal_hero_subtitle': { label: 'Subtítulo do Banner', group: 'Portal Público', type: 'textarea', description: 'Subtítulo do banner na página inicial.' },
    'portal_contact_phone': { label: 'Telefone de Contato', group: 'Portal Público', type: 'text', description: 'Telefone de contato no portal.' },
    'portal_contact_email': { label: 'Email de Contato', group: 'Portal Público', type: 'text', description: 'Email de contato no portal.' },
    'portal_contact_address': { label: 'Endereço', group: 'Portal Público', type: 'text', description: 'Localização/Endereço no rodapé.' },
    'portal_social_instagram': { label: 'Instagram', group: 'Portal Público', type: 'text', description: 'Usuário do Instagram (@usuario).' },
    'portal_social_facebook': { label: 'Facebook', group: 'Portal Público', type: 'text', description: 'Link da página do Facebook.' },
    'portal_footer_description': { label: 'Descrição do Rodapé', group: 'Portal Público', type: 'textarea', description: 'Breve descrição sobre a empresa no rodapé.' },
    'portal_copyright': { label: 'Copyright Portal', group: 'Portal Público', type: 'text', description: 'Texto de copyright no final do rodapé do portal.' },
};

export const Configuracoes: React.FC = () => {
    const navigate = useNavigate();
    const { currentContext, refreshSettings } = useApp();
    const [selectedGroup, setSelectedGroup] = useState<string>('Sistema');
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Parameters State
    const [parameters, setParameters] = React.useState<IParameter[]>([]);
    const [isLoadingParams, setIsLoadingParams] = React.useState(false);
    const [error, setError] = React.useState('');
    const [success, setSuccess] = React.useState('');

    // New/Edit Parameter State
    const [isSaving, setIsSaving] = React.useState(false);
    const [newParam, setNewParam] = React.useState({ key: '', value: '', description: '', group_name: 'Avançado' });
    const [allSettings, setAllSettings] = React.useState<Record<string, string>>({});
    const [paramToDelete, setParamToDelete] = useState<string | null>(null);

    const fetchParameters = async () => {
        setIsLoadingParams(true);
        setError('');
        try {
            const { data: session } = await authClient.getSession();
            if (!session?.session.activeOrganizationId) return;

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/organization/${session.session.activeOrganizationId}/parameters`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                setParameters(data);

                // Initialize settings dictionary
                const settingsDict: Record<string, string> = {};
                data.forEach((p: IParameter) => {
                    settingsDict[p.key] = p.value;
                });
                setAllSettings(settingsDict);
            } else {
                setError('Falha ao carregar parâmetros.');
            }
        } catch (err) {
            setError('Erro de conexão ao buscar parâmetros.');
        } finally {
            setIsLoadingParams(false);
        }
    };

    const handleSaveParameter = async (e: React.FormEvent) => {
        if (e) e.preventDefault();
        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            const { data: session } = await authClient.getSession();
            if (!session?.session.activeOrganizationId) return;

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/organization/${session.session.activeOrganizationId}/parameters`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newParam)
            });

            if (response.ok) {
                setSuccess('Parâmetro salvo com sucesso!');
                setNewParam({ key: '', value: '', description: '', group_name: 'Avançado' });
                fetchParameters();
                refreshSettings();
            } else {
                const data = await response.json();
                setError(data.error || 'Falha ao salvar parâmetro.');
            }
        } catch (err) {
            setError('Erro ao salvar parâmetro.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveBatch = async (keys: { key: string, description: string }[]) => {
        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            const { data: session } = await authClient.getSession();
            if (!session?.session.activeOrganizationId) return;

            const batchParams = keys.map(k => ({
                key: k.key,
                value: allSettings[k.key] || '',
                description: k.description,
                group_name: parameters.find(p => p.key === k.key)?.group_name || PARAM_METADATA[k.key]?.group || 'Avançado'
            }));

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/organization/${session.session.activeOrganizationId}/parameters/batch`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ parameters: batchParams })
            });

            if (response.ok) {
                setSuccess('Configurações salvas com sucesso!');
                fetchParameters();
                refreshSettings();
            } else {
                const data = await response.json();
                setError(data.error || 'Falha ao salvar configurações.');
            }
        } catch (err) {
            setError('Erro ao salvar configurações.');
        } finally {
            setIsSaving(false);
        }
    };


    const handleDeleteParameter = async (paramId: string) => {
        setParamToDelete(paramId);
    };

    const confirmDelete = async () => {
        if (!paramToDelete) return;
        const idToDelete = paramToDelete;
        setParamToDelete(null);

        try {
            const { data: session } = await authClient.getSession();
            if (!session?.session.activeOrganizationId) return;

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/organization/${session.session.activeOrganizationId}/parameters/${idToDelete}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                setSuccess('Parâmetro excluído.');
                fetchParameters();
                refreshSettings();
            } else {
                setError('Falha ao excluir.');
            }
        } catch (err) {
            setError('Erro ao excluir.');
        }
    };

    const { data: session } = authClient.useSession();

    React.useEffect(() => {
        setError('');
        setSuccess('');
        fetchParameters();
    }, [selectedGroup, session?.session.activeOrganizationId]);

    const GROUP_CONTEXTS: Record<string, EmpresaContexto[]> = {
        'Dashboard': [EmpresaContexto.TURISMO, EmpresaContexto.EXPRESS],
        'Viagens': [EmpresaContexto.TURISMO],
        'Reservas': [EmpresaContexto.TURISMO],
        'Fretamento B2B': [EmpresaContexto.TURISMO],
        'Rotas': [EmpresaContexto.TURISMO],
        'Rotas Express': [EmpresaContexto.EXPRESS],
        'Encomendas': [EmpresaContexto.EXPRESS],
        'Clientes': [EmpresaContexto.TURISMO, EmpresaContexto.EXPRESS],
        'Frota': [EmpresaContexto.TURISMO, EmpresaContexto.EXPRESS],
        'Motoristas': [EmpresaContexto.TURISMO, EmpresaContexto.EXPRESS],
        'Manutenção': [EmpresaContexto.TURISMO, EmpresaContexto.EXPRESS],
        'Financeiro': [EmpresaContexto.TURISMO, EmpresaContexto.EXPRESS],
        'Relatórios': [EmpresaContexto.TURISMO, EmpresaContexto.EXPRESS],
        'Documentos': [EmpresaContexto.TURISMO, EmpresaContexto.EXPRESS],
        'Usuários': [EmpresaContexto.TURISMO, EmpresaContexto.EXPRESS],
        'Organizações': [EmpresaContexto.TURISMO, EmpresaContexto.EXPRESS],
        'Cadastros Auxiliares': [EmpresaContexto.TURISMO, EmpresaContexto.EXPRESS],
        'Portal Público': [EmpresaContexto.TURISMO, EmpresaContexto.EXPRESS],
        'Sistema': [EmpresaContexto.TURISMO, EmpresaContexto.EXPRESS],
        'Avançado': [EmpresaContexto.TURISMO, EmpresaContexto.EXPRESS]
    };

    const groups = Object.keys(GROUP_CONTEXTS).filter(g =>
        GROUP_CONTEXTS[g].includes(currentContext)
    );

    // If switching context makes current selected group disappear, fallback to Sistema
    React.useEffect(() => {
        if (!groups.includes(selectedGroup)) {
            setSelectedGroup('Sistema');
        }
    }, [currentContext]);

    const themeColor = currentContext === EmpresaContexto.TURISMO ? 'blue' : 'orange';

    const filteredParameters = parameters.filter(p => {
        const meta = PARAM_METADATA[p.key];
        const currentGroup = p.group_name || meta?.group || 'Avançado';

        const matchesSearch =
            p.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (meta?.label.toLowerCase().includes(searchQuery.toLowerCase() || '')) ||
            (p.description?.toLowerCase().includes(searchQuery.toLowerCase() || '')) ||
            (meta?.description.toLowerCase().includes(searchQuery.toLowerCase() || ''));

        if (searchQuery) return matchesSearch;

        // Context filtering: Only show parameters relevant to the current business context
        if (meta?.contexts && !meta.contexts.includes(currentContext)) {
            return false;
        }

        if (selectedGroup === 'Avançado') {
            return currentGroup === 'Avançado';
        }

        return currentGroup === selectedGroup;
    });

    return (
        <div key="configuracoes-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10 flex flex-col group">
            <AlertDialog open={!!paramToDelete} onOpenChange={(open) => !open && setParamToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Parâmetro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir este parâmetro? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Header Module */}
            <PageHeader
                title="Configurações do Sistema"
                subtitle="Ajustes globais, políticas de segurança e integração de infraestrutura técnica"
                icon={Settings2}
                backLink="/admin"
                backLabel="Painel Administrativo"
                rightElement={
                    <div className="flex items-center gap-3">
                        <div className="relative group flex-1 md:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
                            <Input
                                placeholder="Localizar parâmetro..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-14 pl-12 bg-card/50 backdrop-blur-sm border-input rounded-xl font-bold transition-all focus-visible:ring-2 focus-visible:ring-primary/20 text-[12px] tracking-tight"
                            />
                        </div>
                        <Button
                            onClick={() => setIsModalOpen(true)}
                            className="h-14 rounded-xl px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[12px] tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Plus size={16} className="mr-2" strokeWidth={3} />
                            Novo Parâmetro
                        </Button>
                    </div>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 overflow-hidden">
                {/* Sidebar Premium */}
                <div className="lg:col-span-1 space-y-4 overflow-hidden flex flex-col">
                    <Card className="flex-1 shadow-2xl shadow-muted/20 bg-card/50 backdrop-blur-sm border border-border/40 rounded-[2.5rem] overflow-hidden p-3 flex flex-col">
                        <div className="p-4 border-b border-border/50 mb-2">
                            <span className="text-section-header">Arquitetura de Dados</span>
                        </div>
                        <div className="flex-1 overflow-y-auto scroller-hidden space-y-1">
                            {groups.map(group => (
                                <button
                                    key={group}
                                    onClick={() => { setSelectedGroup(group); setSearchQuery(''); }}
                                    className={`w-full flex items-center justify-between px-6 py-4 rounded-xl transition-all ${selectedGroup === group && !searchQuery
                                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                        }`}
                                >
                                    <span className="text-label-caps">{group}</span>
                                    {selectedGroup === group && !searchQuery && <ChevronRight size={14} />}
                                </button>
                            ))}
                        </div>
                    </Card>

                    <Card className="p-8 bg-primary/5 border-dashed border-primary/20 rounded-3xl">
                        <h4 className="text-section-header text-primary mb-2">Segurança de Rede</h4>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[12px] font-bold text-muted-foreground">NODES OPERACIONAIS</span>
                        </div>
                    </Card>
                </div>

                {/* Main Content Area Executive */}
                <div className="lg:col-span-3 overflow-y-auto scroller-hidden pb-20">
                    <div className="space-y-8">
                        {(error || success) && (
                            <div className="space-y-4">
                                {error && (
                                    <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription className="text-xs font-bold uppercase tracking-tight">{error}</AlertDescription>
                                    </Alert>
                                )}
                                {success && (
                                    <Alert className="border-emerald-500 text-emerald-600 bg-emerald-50/50 backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <AlertDescription className="text-xs font-bold uppercase tracking-tight">{success}</AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-section-header flex items-center gap-3">
                                    {searchQuery ? `Resultados: "${searchQuery}"` : selectedGroup}
                                    <span className="text-section-description normal-case opacity-60">
                                        {filteredParameters.length} parâmetros técnicos
                                    </span>
                                </h2>
                            </div>
                            {!searchQuery && (
                                <Button
                                    onClick={() => handleSaveBatch(filteredParameters.map(p => ({ key: p.key, description: PARAM_METADATA[p.key]?.description || p.description })))}
                                    disabled={isSaving}
                                    className="h-14 rounded-xl px-10 bg-foreground text-background font-black uppercase text-[12px] tracking-widest shadow-lg transition-all hover:scale-[1.02]"
                                >
                                    {isSaving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
                                    Sincronizar Módulo
                                </Button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {filteredParameters.map(param => {
                                const meta = PARAM_METADATA[param.key];
                                return (
                                    <Card key={param.id} className="group/card shadow-xl shadow-muted/10 bg-card/50 backdrop-blur-sm border border-border/40 rounded-3xl p-8 hover:border-primary/40 transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="space-y-1">
                                                <h4 className="text-section-header">{meta?.label || param.key}</h4>
                                                <code className="inline-block text-section-description bg-muted/50 px-2 py-0.5 rounded-lg text-primary">
                                                    {param.key}
                                                </code>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteParameter(param.id)}
                                                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all opacity-0 group-hover/card:opacity-100"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>

                                        <p className="text-section-description mb-6">
                                            {meta?.description || param.description || 'CONFORME PROTOCOLO PADRÃO'}
                                        </p>

                                        <div className="p-6 bg-muted/20 rounded-xl border border-border/30">
                                            <SettingField
                                                label=""
                                                k={param.key}
                                                type={meta?.type || 'text'}
                                                options={meta?.options}
                                                allSettings={allSettings}
                                                setAllSettings={setAllSettings}
                                                themeColor={themeColor}
                                            />
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal for New Parameter */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden transform transition-all">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Plus size={24} className="text-blue-500" />
                                Novo Parâmetro
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6">
                            <form onSubmit={(e) => {
                                handleSaveParameter(e);
                                setIsModalOpen(false);
                            }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Chave (Key)</label>
                                    <input
                                        type="text"
                                        value={newParam.key}
                                        onChange={(e) => setNewParam({ ...newParam, key: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm"
                                        placeholder="ex: system_custom_key"
                                        required
                                    />
                                    <p className="text-[12px] text-slate-400 mt-1 ml-1">Identificador único do parâmetro no banco de dados.</p>
                                </div>

                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Módulo / Grupo</label>
                                    <div className="relative">
                                        <select
                                            value={newParam.group_name}
                                            onChange={(e) => setNewParam({ ...newParam, group_name: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
                                        >
                                            {groups.map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" size={16} />
                                    </div>
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Valor Inicial</label>
                                    <input
                                        type="text"
                                        value={newParam.value}
                                        onChange={(e) => setNewParam({ ...newParam, value: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        placeholder="Valor do parâmetro"
                                        required
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Descrição</label>
                                    <textarea
                                        value={newParam.description}
                                        onChange={(e) => setNewParam({ ...newParam, description: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none transition-all"
                                        placeholder="Descreva a finalidade deste parâmetro..."
                                    />
                                </div>

                                <div className="col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-6 py-2.5 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isSaving ? <Loader2 className="animate-spin text-white" size={18} /> : <Check size={18} />}
                                        Criar Parâmetro
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

