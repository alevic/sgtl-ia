import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Activity, Search, Filter, ArrowLeft,
    Bus, AlertCircle, Users, Package, CheckCircle, Info, AlertTriangle, Clock,
    Eye, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { api } from '../services/api';
import { useDateFormatter } from '../hooks/useDateFormatter';

interface AuditLog {
    id: string;
    action: string;
    entity: string;
    entityId: string | null;
    oldData: string | null;
    newData: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: string;
    userName: string | null;
    userEmail: string | null;
    username: string | null;
}

export const AtividadesRecentes: React.FC = () => {
    const navigate = useNavigate();
    const { formatDate, formatDateTime } = useDateFormatter();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1,
        total: 0
    });
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    const fetchLogs = async (page = 1) => {
        setLoading(true);
        try {
            const result = await api.get<any>(`/api/admin/audit-logs?page=${page}&limit=20`);
            setLogs(result.data);
            setPagination(result.pagination);
        } catch (error) {
            console.error("Erro ao buscar logs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(pagination.page);
    }, [pagination.page]);

    const getIcon = (action: string) => {
        if (action.includes('CREATE')) return CheckCircle;
        if (action.includes('UPDATE')) return Info;
        if (action.includes('DELETE')) return AlertCircle;
        if (action.includes('LOGIN')) return Users;
        return Activity;
    };

    const getTypeColor = (action: string) => {
        if (action.includes('DELETE')) return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
        if (action.includes('CREATE')) return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
        if (action.includes('UPDATE')) return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
        if (action.includes('LOGIN')) return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400';
        return 'bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400';
    };


    return (
        <div key="atividades-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/dashboard')}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-sm transition-colors"
                >
                    <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Activity className="text-blue-600" />
                        Histórico de Atividades
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Registro completo de eventos auditados no sistema
                    </p>
                </div>
            </div>

            {/* Filters (Search pending full backend implementation) */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-sm shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-4 justify-between">
                <div className="relative flex-1 md:max-w-md">
                    <input
                        type="text"
                        placeholder="Buscar por ação ou usuário..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    Total: {pagination.total} eventos
                </div>
            </div>

            {/* Activity List */}
            <div className="bg-white dark:bg-slate-800 rounded-sm shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {loading ? (
                        <div className="p-12 text-center text-slate-500">
                            <Clock className="mx-auto mb-4 animate-spin" />
                            Carregando histórico...
                        </div>
                    ) : logs.length > 0 ? (
                        logs.map((log) => {
                            const Icon = getIcon(log.action);
                            return (
                                <div key={log.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors flex gap-4 items-start">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getTypeColor(log.action)}`}>
                                        <Icon size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                                                {log.action} - {log.entity}
                                            </h4>
                                            <span className="text-xs text-slate-400 whitespace-nowrap flex items-center gap-1">
                                                <Clock size={12} /> {formatDateTime(log.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                            Realizado por <span className="font-medium">{log.userName || 'Sistema'}</span> {log.username ? `(@${log.username})` : (log.userEmail ? `(${log.userEmail})` : '')}
                                        </p>
                                        {log.entityId && (
                                            <p className="text-xs text-slate-400 mt-1">
                                                Objeto ID: {log.entityId}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setSelectedLog(log)}
                                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-sm transition-colors text-slate-400 hover:text-blue-600"
                                    >
                                        <Eye size={18} />
                                    </button>
                                </div>
                            );
                        })
                    ) : (
                        <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                            <Activity size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                            <p>Nenhuma atividade encontrada.</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-center gap-2">
                        <button
                            disabled={pagination.page === 1}
                            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                            className="p-2 border rounded-sm disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="flex items-center px-4 text-sm font-medium">
                            Página {pagination.page} de {pagination.totalPages}
                        </span>
                        <button
                            disabled={pagination.page === pagination.totalPages}
                            onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                            className="p-2 border rounded-sm disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}
            </div>

            {/* Details Modal */}
            {selectedLog && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-800 rounded-sm shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <Eye className="text-blue-600" size={24} />
                                    Detalhes da Atividade
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    {selectedLog.action} em {selectedLog.entity} • {formatDateTime(selectedLog.createdAt)}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-sm transition-colors text-slate-400 hover:text-slate-600"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Metadata Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-sm">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Usuário</span>
                                    <p className="text-sm font-semibold">{selectedLog.userName || 'Sistema'}</p>
                                    <p className="text-xs text-slate-500">@{selectedLog.username || 'sgtl-ia'}</p>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-sm">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Entidade</span>
                                    <p className="text-sm font-semibold uppercase">{selectedLog.entity}</p>
                                    <p className="text-xs text-slate-500">ID: {selectedLog.entityId || 'N/A'}</p>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-sm">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Origem</span>
                                    <p className="text-sm font-semibold">{selectedLog.ipAddress || 'Remoto'}</p>
                                    <p className="text-[10px] text-slate-500 truncate" title={selectedLog.userAgent || ''}>{selectedLog.userAgent || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Data Comparison */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Old Data */}
                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <AlertTriangle size={14} className="text-amber-500" />
                                        Estado Anterior
                                    </h3>
                                    <pre className="p-4 bg-slate-900 text-slate-300 rounded-sm text-xs font-mono overflow-x-auto min-h-[150px] border border-slate-700">
                                        {selectedLog.oldData ? JSON.stringify(JSON.parse(selectedLog.oldData), null, 2) : '// Nenhum dado anterior'}
                                    </pre>
                                </div>

                                {/* New Data */}
                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <CheckCircle size={14} className="text-emerald-500" />
                                        Novo Estado
                                    </h3>
                                    <pre className="p-4 bg-slate-900 text-emerald-400 rounded-sm text-xs font-mono overflow-x-auto min-h-[150px] border border-slate-700">
                                        {selectedLog.newData ? JSON.stringify(JSON.parse(selectedLog.newData), null, 2) : '// Nenhum dado novo'}
                                    </pre>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-sm font-bold text-xs tracking-widest uppercase transition-all"
                            >
                                FECHAR
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
