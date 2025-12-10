import React, { useState } from 'react';
import { IViagem } from '../../types';
import { Calendar, MapPin, Search, Bus, Clock, Check } from 'lucide-react';

interface SeletorViagemProps {
    viagens: IViagem[];
    viagemSelecionada: IViagem | null;
    onChange: (viagem: IViagem | null) => void;
}

export const SeletorViagem: React.FC<SeletorViagemProps> = ({
    viagens,
    viagemSelecionada,
    onChange
}) => {
    const [busca, setBusca] = useState('');
    const [filtroStatus, setFiltroStatus] = useState<'TODOS' | 'AGENDADA' | 'CONFIRMADA'>('TODOS');

    const formatarDataHora = (data: string) => {
        if (!data) return 'Data não definida';
        const d = new Date(data);
        if (isNaN(d.getTime())) return 'Data inválida';
        return d.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const viagensFiltradas = viagens.filter(v => {
        const matchStatus = filtroStatus === 'TODOS' ||
            (filtroStatus === 'AGENDADA' && (v.status === 'AGENDADA' || v.status === 'SCHEDULED')) ||
            (filtroStatus === 'CONFIRMADA' && (v.status === 'CONFIRMADA' || v.status === 'CONFIRMED'));

        const matchBusca = busca === '' ||
            v.titulo?.toLowerCase().includes(busca.toLowerCase()) ||
            v.origem?.toLowerCase().includes(busca.toLowerCase()) ||
            v.destino?.toLowerCase().includes(busca.toLowerCase()) ||
            v.route_name?.toLowerCase().includes(busca.toLowerCase()) ||
            v.origin_city?.toLowerCase().includes(busca.toLowerCase()) ||
            v.destination_city?.toLowerCase().includes(busca.toLowerCase());

        return matchStatus && matchBusca && (
            v.status === 'AGENDADA' || v.status === 'CONFIRMADA' ||
            v.status === 'SCHEDULED' || v.status === 'CONFIRMED'
        );
    });

    return (
        <div className="space-y-4">
            {/* Busca e Filtros */}
            <div className="space-y-3">
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por origem, destino ou título..."
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setFiltroStatus('TODOS')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filtroStatus === 'TODOS'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                    >
                        Todas
                    </button>
                    <button
                        onClick={() => setFiltroStatus('AGENDADA')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filtroStatus === 'AGENDADA'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                    >
                        Agendadas
                    </button>
                    <button
                        onClick={() => setFiltroStatus('CONFIRMADA')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filtroStatus === 'CONFIRMADA'
                            ? 'bg-green-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                    >
                        Confirmadas
                    </button>
                </div>
            </div>

            {/* Viagem Selecionada */}
            {viagemSelecionada && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide">Viagem Selecionada</span>
                        <Check size={20} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-white mb-2">{viagemSelecionada.titulo || viagemSelecionada.route_name}</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span>{formatarDataHora(viagemSelecionada.departure_date || viagemSelecionada.data_partida || '')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <MapPin size={14} />
                            <span>{viagemSelecionada.origem || viagemSelecionada.origin_city}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => onChange(null)}
                        className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        Alterar viagem
                    </button>
                </div>
            )}

            {/* Lista de Viagens */}
            {!viagemSelecionada && (
                <div className="max-h-96 overflow-y-auto space-y-2">
                    {viagensFiltradas.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                            <Bus size={48} className="mx-auto mb-2 opacity-50" />
                            <p>Nenhuma viagem disponível</p>
                        </div>
                    ) : (
                        viagensFiltradas.map(viagem => (
                            <button
                                key={viagem.id}
                                onClick={() => onChange(viagem)}
                                className="w-full p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {viagem.titulo || viagem.route_name}
                                        </h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${viagem.status === 'CONFIRMADA' || viagem.status === 'CONFIRMED'
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                }`}>
                                                {viagem.status === 'CONFIRMED' ? 'CONFIRMADA' :
                                                    viagem.status === 'SCHEDULED' ? 'AGENDADA' :
                                                        viagem.status}
                                            </span>
                                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                                                {viagem.tipo_viagem === 'IDA_E_VOLTA' ? 'Ida e Volta' : (viagem.tipo_viagem || viagem.trip_type || 'Viagem')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <div className="flex items-center gap-1">
                                        <MapPin size={14} className="text-green-600" />
                                        <span>{viagem.origem || viagem.origin_city}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <MapPin size={14} className="text-red-600" />
                                        <span>{viagem.destino || viagem.destination_city}</span>
                                    </div>
                                    <div className="flex items-center gap-1 col-span-2">
                                        <Calendar size={14} />
                                        <span>{formatarDataHora(viagem.departure_date || viagem.data_partida || '')}</span>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};
