import React, { useState, useEffect } from 'react';
import { Activity, Filter, Search, Loader2, FileText, Users, Plane, Package } from 'lucide-react';

interface UserActivityLogProps {
    userId: string;
}

interface ActivityItem {
    id: string;
    action: string;
    module: string;
    description: string;
    timestamp: string;
    icon: React.ReactNode;
}

export const UserActivityLog: React.FC<UserActivityLogProps> = ({ userId }) => {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    // Mock data for demonstration
    const mockActivities: ActivityItem[] = [];

    const getModuleIcon = (module: string) => {
        switch (module) {
            case 'viagens': return <Plane size={16} className="text-blue-600" />;
            case 'reservas': return <FileText size={16} className="text-green-600" />;
            case 'clientes': return <Users size={16} className="text-purple-600" />;
            case 'encomendas': return <Package size={16} className="text-orange-600" />;
            default: return <Activity size={16} className="text-slate-600" />;
        }
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} dia${days > 1 ? 's' : ''} atrás`;
        if (hours > 0) return `${hours} hora${hours > 1 ? 's' : ''} atrás`;
        return 'Agora mesmo';
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar atividades..."
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                            />
                        </div>
                    </div>
                    <div>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                        >
                            <option value="all">Todos os módulos</option>
                            <option value="viagens">Viagens</option>
                            <option value="reservas">Reservas</option>
                            <option value="clientes">Clientes</option>
                            <option value="encomendas">Encomendas</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Activity List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <Activity size={20} className="text-blue-600" />
                    Histórico de Atividades
                </h3>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="animate-spin text-blue-600" size={32} />
                    </div>
                ) : mockActivities.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                        <Activity size={48} className="mx-auto mb-3 opacity-50" />
                        <p className="font-medium">Nenhuma atividade registrada</p>
                        <p className="text-sm mt-1">Funcionalidade em desenvolvimento</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {mockActivities.map((activity) => (
                            <div
                                key={activity.id}
                                className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                            >
                                <div className="mt-1">
                                    {activity.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        {activity.description}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        {activity.module} • {formatTimestamp(activity.timestamp)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Export Data */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-2">
                    Exportar Dados
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Baixe uma cópia de todos os seus dados (LGPD)
                </p>
                <button
                    disabled
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 rounded-lg font-medium cursor-not-allowed"
                >
                    Em desenvolvimento
                </button>
            </div>
        </div>
    );
};
