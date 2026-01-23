import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Activity, Search, Filter, ArrowLeft,
    Bus, AlertCircle, Users, Package, CheckCircle, Info, AlertTriangle, Clock
} from 'lucide-react';

// --- MOCK DATA ---
const ALL_ACTIVITIES = [
    { id: 1, type: 'success', title: 'Viagem Concluída', desc: 'Rota SP -> RJ finalizada com sucesso', time: '10 min atrás', date: 'Hoje', icon: Bus },
    { id: 2, type: 'warning', title: 'Alerta de Manutenção', desc: 'Veículo 104 precisa de revisão', time: '32 min atrás', date: 'Hoje', icon: AlertCircle },
    { id: 3, type: 'info', title: 'Nova Reserva', desc: 'Grupo de 15 passageiros confirmado', time: '1h atrás', date: 'Hoje', icon: Users },
    { id: 4, type: 'success', title: 'Entrega Realizada', desc: 'Pacote #9921 entregue no prazo', time: '2h atrás', date: 'Hoje', icon: Package },
    { id: 5, type: 'info', title: 'Novo Motorista', desc: 'Cadastro de Roberto Santos aprovado', time: '4h atrás', date: 'Hoje', icon: Users },
    { id: 6, type: 'warning', title: 'Atraso na Rota', desc: 'Trânsito intenso na saída de SP', time: 'Ontem', date: 'Ontem', icon: AlertTriangle },
    { id: 7, type: 'success', title: 'Manutenção Concluída', desc: 'Veículo 102 liberado da oficina', time: 'Ontem', date: 'Ontem', icon: CheckCircle },
    { id: 8, type: 'info', title: 'Pagamento Recebido', desc: 'Fatura #4590 quitada', time: 'Ontem', date: 'Ontem', icon: Info },
    { id: 9, type: 'success', title: 'Viagem Iniciada', desc: 'Rota RJ -> SP partiu no horário', time: '2 dias atrás', date: '24/11', icon: Bus },
    { id: 10, type: 'warning', title: 'Combustível Baixo', desc: 'Alerta de nível crítico Veículo 108', time: '2 dias atrás', date: '24/11', icon: AlertTriangle },
];

export const AtividadesRecentes: React.FC = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    const filteredActivities = ALL_ACTIVITIES.filter(activity => {
        const matchesSearch = activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            activity.desc.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || activity.type === filterType;
        return matchesSearch && matchesType;
    });

    return (
        <div key="atividades-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/dashboard')}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Activity className="text-blue-600" />
                        Atividades Recentes
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Histórico completo de eventos do sistema
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-4 justify-between">
                <div className="relative flex-1 md:max-w-md">
                    <input
                        type="text"
                        placeholder="Buscar atividades..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    <button
                        onClick={() => setFilterType('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filterType === 'all'
                            ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-800'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'
                            }`}
                    >
                        Todas
                    </button>
                    <button
                        onClick={() => setFilterType('success')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filterType === 'success'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'
                            }`}
                    >
                        Sucesso
                    </button>
                    <button
                        onClick={() => setFilterType('warning')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filterType === 'warning'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'
                            }`}
                    >
                        Alertas
                    </button>
                    <button
                        onClick={() => setFilterType('info')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filterType === 'info'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'
                            }`}
                    >
                        Info
                    </button>
                </div>
            </div>

            {/* Activity List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {filteredActivities.length > 0 ? (
                        filteredActivities.map((item) => (
                            <div key={item.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors flex gap-4 items-start">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.type === 'success' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                                    item.type === 'warning' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                        'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                    }`}>
                                    <item.icon size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h4 className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                                            {item.title}
                                        </h4>
                                        <span className="text-xs text-slate-400 whitespace-nowrap flex items-center gap-1">
                                            <Clock size={12} /> {item.time}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                        {item.desc}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                            <Activity size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                            <p>Nenhuma atividade encontrada com os filtros atuais.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
