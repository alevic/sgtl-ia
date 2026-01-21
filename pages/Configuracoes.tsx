import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { EmpresaContexto } from '../types';
import {
    Save, Bell, Shield, Monitor, RefreshCw, Database,
    Settings2, Plus, Trash2, AlertCircle, Loader2,
    Globe, CalendarClock, Wallet, Truck, Users, CreditCard,
    Search, X, ChevronRight, Check
} from 'lucide-react';
import { authClient } from '../lib/auth-client';

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
        <div className="space-y-1">
            <div className="flex justify-between items-baseline">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
                <code className="text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-900 px-1 rounded">{k}</code>
            </div>
            {description && <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{description}</p>}

            {type === 'textarea' ? (
                <textarea
                    value={value}
                    onChange={(e) => handleChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                />
            ) : type === 'select' ? (
                <select
                    value={value}
                    onChange={(e) => handleChange(e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            ) : type === 'checkbox' ? (
                <label className="relative inline-flex items-center cursor-pointer mt-1">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={value === 'true'}
                        onChange={(e) => handleChange(e.target.checked ? 'true' : 'false')}
                    />
                    <div className={`w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-${themeColor}-300 dark:peer-focus:ring-${themeColor}-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-${themeColor}-600`}></div>
                </label>
            ) : (
                <input
                    type={type}
                    value={value}
                    onChange={(e) => handleChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
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
        if (!window.confirm('Excluir este parâmetro?')) return;

        try {
            const { data: session } = await authClient.getSession();
            if (!session?.session.activeOrganizationId) return;

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/organization/${session.session.activeOrganizationId}/parameters/${paramId}`, {
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
        <div className="flex flex-col h-[calc(100vh-120px)] group">
            {/* Header with Search */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Configurações do Sistema</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Administre todos os parâmetros e preferências globais.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Pesquisar..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl transition-all text-sm font-bold shadow-md shadow-blue-600/20 whitespace-nowrap"
                    >
                        <Plus size={18} />
                        <span className="hidden md:inline">Novo Parâmetro</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden gap-6">
                {/* Sidebar Groups */}
                <div className="w-64 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col shrink-0">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Módulos</span>
                    </div>
                    <div className="flex-1 overflow-y-auto py-2">
                        {groups.map(group => (
                            <button
                                key={group}
                                onClick={() => { setSelectedGroup(group); setSearchQuery(''); }}
                                className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-all ${selectedGroup === group && !searchQuery
                                    ? `bg-${themeColor}-50 dark:bg-${themeColor}-900/20 text-${themeColor}-600 dark:text-${themeColor}-400 border-r-4 border-${themeColor}-600`
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                    }`}
                            >
                                {group}
                                {selectedGroup === group && !searchQuery && <ChevronRight size={14} />}
                            </button>
                        ))}
                    </div>
                    <div className="p-4 border-t border-slate-100 dark:border-slate-700">
                        {/* Removed inline button */}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {/* Feedback Messages */}
                    {(error || success) && (
                        <div className="mb-6 space-y-2">
                            {error && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2 border border-red-100 dark:border-red-900/30">
                                    <AlertCircle size={18} /> {error}
                                </div>
                            )}
                            {success && (
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm rounded-lg border border-green-100 dark:border-green-900/30 flex items-center gap-2">
                                    <Check size={18} /> {success}
                                </div>
                            )}
                        </div>
                    )}

                    {isLoadingParams ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
                            <Loader2 className="animate-spin" size={32} />
                            <p className="text-sm">Carregando parâmetros...</p>
                        </div>
                    ) : filteredParameters.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 gap-4">
                            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-full">
                                <Search size={32} className="text-slate-300" />
                            </div>
                            <div className="text-center">
                                <p className="font-medium text-slate-800 dark:text-white">Nenhum parâmetro encontrado</p>
                                <p className="text-sm">Tente ajustar sua pesquisa ou trocar de módulo.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 pb-12">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-tight">
                                    {searchQuery ? `Resultados para "${searchQuery}"` : selectedGroup}
                                    <span className="text-xs font-normal text-slate-400 normal-case">({filteredParameters.length} itens)</span>
                                </h2>
                                {!searchQuery && (
                                    <button
                                        onClick={() => handleSaveBatch(filteredParameters.map(p => ({ key: p.key, description: PARAM_METADATA[p.key]?.description || p.description })))}
                                        disabled={isSaving}
                                        className={`flex items-center gap-2 bg-${themeColor}-600 hover:bg-${themeColor}-700 text-white px-4 py-2 rounded-lg transition-all text-sm font-bold shadow-md shadow-${themeColor}-600/20 disabled:opacity-50`}
                                    >
                                        {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                        Salvar Tudo
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                {filteredParameters.map(param => {
                                    const meta = PARAM_METADATA[param.key];
                                    return (
                                        <div key={param.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-blue-400 dark:hover:border-blue-500 transition-all flex flex-col justify-between group/card">
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-bold text-slate-800 dark:text-white">{meta?.label || param.key}</h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <code className="text-[10px] font-mono bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-800 uppercase">
                                                                {param.key}
                                                            </code>
                                                            <select
                                                                value={param.group_name || meta?.group || 'Avançado'}
                                                                onChange={(e) => {
                                                                    const newGroup = e.target.value;
                                                                    const { data: session } = authClient.getSession() as any;
                                                                    if (!session?.session.activeOrganizationId) return;

                                                                    fetch(`${import.meta.env.VITE_API_URL}/api/organization/${session.session.activeOrganizationId}/parameters`, {
                                                                        method: 'POST',
                                                                        credentials: 'include',
                                                                        headers: { 'Content-Type': 'application/json' },
                                                                        body: JSON.stringify({
                                                                            key: param.key,
                                                                            value: param.value,
                                                                            description: param.description,
                                                                            group_name: newGroup
                                                                        })
                                                                    }).then(() => {
                                                                        setSuccess('Módulo atualizado!');
                                                                        fetchParameters();
                                                                    });
                                                                }}
                                                                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-none outline-none focus:ring-1 focus:ring-blue-500 appearance-none cursor-pointer"
                                                            >
                                                                {groups.map(g => <option key={g} value={g}>{g}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleDeleteParameter(param.id)}
                                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                                            title="Excluir Parâmetro"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                                    {meta?.description || param.description || 'Sem descrição definida.'}
                                                </p>
                                                <div className="pt-2">
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
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
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
                                    <p className="text-[10px] text-slate-400 mt-1 ml-1">Identificador único do parâmetro no banco de dados.</p>
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

