import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { IReserva, IViagem, ICliente, Moeda } from '../types';
import { Ticket, User, Bus, Calendar, DollarSign, Filter, Plus, Search } from 'lucide-react';

const MOCK_CLIENTES: ICliente[] = [
    {
        id: '1',
        nome: 'Maria Oliveira',
        email: 'maria@email.com',
        saldo_creditos: 100,
        historico_viagens: 5,
        documento_tipo: 'CPF' as any,
        documento_numero: '123.456.789-00',
        nacionalidade: 'Brasileira'
    },
    {
        id: '2',
        nome: 'João Santos',
        email: 'joao@email.com',
        saldo_creditos: 50,
        historico_viagens: 2,
        documento_tipo: 'CPF' as any,
        documento_numero: '987.654.321-00',
        nacionalidade: 'Brasileira'
    }
];

const MOCK_VIAGENS: IViagem[] = [
    {
        id: 'V001',
        titulo: 'São Paulo → Florianópolis',
        origem: 'São Paulo, SP',
        destino: 'Florianópolis, SC',
        paradas: [],
        data_partida: '2023-10-20T22:00:00',
        data_chegada_prevista: '2023-10-21T08:00:00',
        status: 'CONFIRMADA',
        ocupacao_percent: 75,
        internacional: false,
        moeda_base: Moeda.BRL
    }
];

const MOCK_RESERVAS: IReserva[] = [
    {
        id: '1',
        codigo: 'RSV-2023-001',
        viagem_id: 'V001',
        cliente_id: '1',
        assento_numero: '12',
        data_reserva: '2023-10-15T14:30:00',
        status: 'CONFIRMADA',
        valor_pago: 180.00,
        moeda: Moeda.BRL,
        forma_pagamento: 'PIX'
    },
    {
        id: '2',
        codigo: 'RSV-2023-002',
        viagem_id: 'V001',
        cliente_id: '2',
        assento_numero: '15',
        data_reserva: '2023-10-16T09:15:00',
        status: 'PENDENTE',
        valor_pago: 180.00,
        moeda: Moeda.BRL,
        forma_pagamento: 'BOLETO'
    }
];

const StatusBadge: React.FC<{ status: IReserva['status'] }> = ({ status }) => {
    const configs = {
        PENDENTE: { color: 'yellow', label: 'Pendente' },
        CONFIRMADA: { color: 'green', label: 'Confirmada' },
        CANCELADA: { color: 'red', label: 'Cancelada' },
        UTILIZADA: { color: 'blue', label: 'Utilizada' }
    };

    const config = configs[status];

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-${config.color}-100 dark:bg-${config.color}-900/30 text-${config.color}-700 dark:text-${config.color}-300`}>
            {config.label}
        </span>
    );
};

export const Reservas: React.FC = () => {
    const [reservas] = useState<IReserva[]>(MOCK_RESERVAS);
    const [clientes] = useState<ICliente[]>(MOCK_CLIENTES);
    const [viagens] = useState<IViagem[]>(MOCK_VIAGENS);
    const [filtroStatus, setFiltroStatus] = useState<'TODOS' | IReserva['status']>('TODOS');
    const [busca, setBusca] = useState('');

    const getCliente = (clienteId: string) => clientes.find(c => c.id === clienteId);
    const getViagem = (viagemId: string) => viagens.find(v => v.id === viagemId);

    const reservasFiltradas = reservas.filter(r => {
        const matchStatus = filtroStatus === 'TODOS' || r.status === filtroStatus;
        const cliente = getCliente(r.cliente_id);
        const matchBusca = busca === '' ||
            r.codigo.toLowerCase().includes(busca.toLowerCase()) ||
            cliente?.nome.toLowerCase().includes(busca.toLowerCase());
        return matchStatus && matchBusca;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Reservas</h1>
                    <p className="text-slate-500 dark:text-slate-400">Gestão de reservas de passagens</p>
                </div>
                <Link
                    to="/admin/reservas/nova"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                    <Plus size={18} />
                    Nova Reserva
                </Link>
            </div>

            {/* Filtros */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar por código ou nome do cliente..."
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => setFiltroStatus('TODOS')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${filtroStatus === 'TODOS' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                        >
                            <Filter size={16} />
                            Todos
                        </button>
                        <button
                            onClick={() => setFiltroStatus('PENDENTE')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filtroStatus === 'PENDENTE' ? 'bg-yellow-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                        >
                            Pendente
                        </button>
                        <button
                            onClick={() => setFiltroStatus('CONFIRMADA')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filtroStatus === 'CONFIRMADA' ? 'bg-green-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                        >
                            Confirmada
                        </button>
                        <button
                            onClick={() => setFiltroStatus('CANCELADA')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filtroStatus === 'CANCELADA' ? 'bg-red-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                        >
                            Cancelada
                        </button>
                    </div>
                </div>
            </div>

            {/* Lista de Reservas */}
            <div className="grid gap-4">
                {reservasFiltradas.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                        <Ticket size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">Nenhuma reserva encontrada</p>
                    </div>
                ) : (
                    reservasFiltradas.map((reserva) => {
                        const cliente = getCliente(reserva.cliente_id);
                        const viagem = getViagem(reserva.viagem_id);

                        return (
                            <div key={reserva.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                            <Ticket size={24} className="text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{reserva.codigo}</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                Reservado em {new Date(reserva.data_reserva).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>
                                    <StatusBadge status={reserva.status} />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Passageiro</p>
                                        <div className="flex items-center gap-2">
                                            <User size={16} className="text-blue-600" />
                                            <p className="font-semibold text-slate-800 dark:text-white">{cliente?.nome}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Viagem</p>
                                        <div className="flex items-center gap-2">
                                            <Bus size={16} className="text-blue-600" />
                                            <p className="font-semibold text-slate-800 dark:text-white">{viagem?.titulo}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Assento</p>
                                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{reserva.assento_numero}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Valor</p>
                                        <div className="flex items-center gap-2">
                                            <DollarSign size={16} className="text-green-600" />
                                            <p className="font-bold text-green-600 dark:text-green-400">
                                                {reserva.moeda} {reserva.valor_pago.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-700 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={16} className="text-slate-400" />
                                        <span className="text-slate-600 dark:text-slate-400">
                                            Partida: {new Date(viagem?.data_partida || '').toLocaleDateString('pt-BR')} às {new Date(viagem?.data_partida || '').toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    {reserva.forma_pagamento && (
                                        <div>
                                            <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium">
                                                {reserva.forma_pagamento}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
