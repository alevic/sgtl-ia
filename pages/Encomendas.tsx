import React, { useState } from 'react';
import { IEncomenda, TipoEncomenda, Moeda } from '../types';
import { Package, Truck, Bus, MapPin, Calendar, TrendingUp, Check } from 'lucide-react';

const MOCK_ENCOMENDAS: IEncomenda[] = [
    {
        id: '1',
        codigo: 'ENC-2023-001',
        tipo: TipoEncomenda.CARGA_ONIBUS,
        status: 'EM_TRANSITO',
        origem: 'São Paulo, SP',
        destino: 'Florianópolis, SC',
        remetente_nome: 'João Silva',
        destinatario_nome: 'Maria Santos',
        destinatario_telefone: '(48) 99999-9999',
        peso_kg: 5.5,
        volume_m3: 0.02,
        valor_declarado: 250.00,
        moeda: Moeda.BRL,
        previsao_entrega: '2023-10-16',
        viagem_id: 'V001',
        historico: [
            { id: 'h1', data_hora: '2023-10-15T08:00:00', local: 'São Paulo, SP', descricao: 'Encomenda recebida', tipo: 'RECEBIDO' },
            { id: 'h2', data_hora: '2023-10-15T22:00:00', local: 'São Paulo, SP', descricao: 'Embarcado no ônibus #8940', tipo: 'EM_TRANSITO' }
        ]
    },
    {
        id: '2',
        codigo: 'FRT-2023-045',
        tipo: TipoEncomenda.FRETE_CAMINHAO,
        status: 'AGUARDANDO',
        origem: 'Curitiba, PR',
        destino: 'Buenos Aires, Argentina',
        remetente_nome: 'ABC Comércio Ltda',
        destinatario_nome: 'XYZ S.A.',
        destinatario_telefone: '+54 11 4444-5555',
        peso_kg: 850,
        volume_m3: 12.5,
        valor_declarado: 15000.00,
        moeda: Moeda.USD,
        previsao_entrega: '2023-10-20',
        caminhao_id: 'C003',
        historico: [
            { id: 'h3', data_hora: '2023-10-14T14:30:00', local: 'Curitiba, PR', descricao: 'Aguardando coleta', tipo: 'RECEBIDO' }
        ]
    }
];

const TipoTag: React.FC<{ tipo: TipoEncomenda }> = ({ tipo }) => {
    if (tipo === TipoEncomenda.CARGA_ONIBUS) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                <Bus size={14} />
                Carga Ônibus
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-semibold">
            <Truck size={14} />
            Frete Caminhão
        </span>
    );
};

const StatusBadge: React.FC<{ status: IEncomenda['status'] }> = ({ status }) => {
    const configs = {
        AGUARDANDO: { color: 'slate', label: 'Aguardando' },
        EM_TRANSITO: { color: 'blue', label: 'Em Trânsito' },
        ENTREGUE: { color: 'green', label: 'Entregue' },
        DEVOLVIDA: { color: 'red', label: 'Devolvida' }
    };

    const config = configs[status];

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-${config.color}-100 dark:bg-${config.color}-900/30 text-${config.color}-700 dark:text-${config.color}-300`}>
            {config.label}
        </span>
    );
};

export const Encomendas: React.FC = () => {
    const [encomendas] = useState<IEncomenda[]>(MOCK_ENCOMENDAS);
    const [filtroTipo, setFiltroTipo] = useState<'TODOS' | TipoEncomenda>('TODOS');

    const encomendasFiltradas = filtroTipo === 'TODOS'
        ? encomendas
        : encomendas.filter(e => e.tipo === filtroTipo);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Encomendas</h1>
                    <p className="text-slate-500 dark:text-slate-400">Logística híbrida: Ônibus e Caminhões</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-2">
                    <Package size={18} />
                    Nova Encomenda
                </button>
            </div>

            {/* Filtros */}
            <div className="flex gap-2">
                <button
                    onClick={() => setFiltroTipo('TODOS')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${filtroTipo === 'TODOS' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                >
                    Todos
                </button>
                <button
                    onClick={() => setFiltroTipo(TipoEncomenda.CARGA_ONIBUS)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${filtroTipo === TipoEncomenda.CARGA_ONIBUS ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                >
                    <Bus size={16} />
                    Carga Ônibus
                </button>
                <button
                    onClick={() => setFiltroTipo(TipoEncomenda.FRETE_CAMINHAO)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${filtroTipo === TipoEncomenda.FRETE_CAMINHAO ? 'bg-orange-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                >
                    <Truck size={16} />
                    Frete Caminhão
                </button>
            </div>

            {/* Lista de Encomendas */}
            <div className="grid gap-4">
                {encomendasFiltradas.map((encomenda) => (
                    <div key={encomenda.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                                    <Package size={24} className="text-slate-600 dark:text-slate-300" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">{encomenda.codigo}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <TipoTag tipo={encomenda.tipo} />
                                        <StatusBadge status={encomenda.status} />
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-slate-500 dark:text-slate-400">Valor Declarado</p>
                                <p className="text-lg font-bold text-slate-800 dark:text-white">
                                    {encomenda.moeda} {encomenda.valor_declarado.toFixed(2)}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Origem</p>
                                <div className="flex items-center gap-2">
                                    <MapPin size={16} className="text-green-600" />
                                    <p className="font-semibold text-slate-800 dark:text-white">{encomenda.origem}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Destino</p>
                                <div className="flex items-center gap-2">
                                    <MapPin size={16} className="text-red-600" />
                                    <p className="font-semibold text-slate-800 dark:text-white">{encomenda.destino}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Previsão de Entrega</p>
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} className="text-blue-600" />
                                    <p className="font-semibold text-slate-800 dark:text-white">
                                        {new Date(encomenda.previsao_entrega).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Peso</p>
                                <p className="font-semibold text-slate-800 dark:text-white">{encomenda.peso_kg} kg</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Volume</p>
                                <p className="font-semibold text-slate-800 dark:text-white">{encomenda.volume_m3} m³</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Remetente</p>
                                <p className="font-semibold text-slate-800 dark:text-white">{encomenda.remetente_nome}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Destinatário</p>
                                <p className="font-semibold text-slate-800 dark:text-white">{encomenda.destinatario_nome}</p>
                            </div>
                        </div>

                        {/* Timeline de Rastreamento */}
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">Histórico de Rastreamento</p>
                            <div className="space-y-2">
                                {encomenda.historico.map((evento, index) => (
                                    <div key={evento.id} className="flex items-start gap-3">
                                        <div className="relative">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${evento.tipo === 'ENTREGUE' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                                                <Check size={14} className={`${evento.tipo === 'ENTREGUE' ? 'text-green-600' : 'text-blue-600'}`} />
                                            </div>
                                            {index < encomenda.historico.length - 1 && (
                                                <div className="absolute top-6 left-3 w-0.5 h-6 bg-slate-200 dark:bg-slate-700" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-slate-800 dark:text-white">{evento.descricao}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {evento.local} • {new Date(evento.data_hora).toLocaleString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
