import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ICliente } from '../types';
import {
    Users, Search, Filter, UserPlus, Star, TrendingUp,
    Phone, Mail, MapPin, Calendar, Award, Tag
} from 'lucide-react';
import { clientsService } from '../services/clientsService';
import { ClientActions } from '../components/CRM/ClientActions';

const SegmentoBadge: React.FC<{ segmento: ICliente['segmento'] }> = ({ segmento }) => {
    const configs = {
        VIP: { color: 'purple', icon: Star, label: 'VIP' },
        REGULAR: { color: 'blue', icon: Users, label: 'Regular' },
        NOVO: { color: 'green', icon: UserPlus, label: 'Novo' },
        INATIVO: { color: 'slate', icon: Users, label: 'Inativo' }
    };

    const config = configs[segmento] || configs.REGULAR;
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-${config.color}-100 dark:bg-${config.color}-900/30 text-${config.color}-700 dark:text-${config.color}-300`}>
            <Icon size={12} />
            {config.label}
        </span>
    );
};

export const CRM: React.FC = () => {
    const [clientes, setClientes] = useState<ICliente[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filtroSegmento, setFiltroSegmento] = useState<'TODOS' | ICliente['segmento']>('TODOS');
    const [busca, setBusca] = useState('');

    useEffect(() => {
        fetchClientes();
    }, []);

    const fetchClientes = async () => {
        setIsLoading(true);
        try {
            const data = await clientsService.getAll();
            setClientes(data);
        } catch (error) {
            console.error('Error fetching clients:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const clientesFiltrados = clientes.filter(c => {
        const matchSegmento = filtroSegmento === 'TODOS' || c.segmento === filtroSegmento;
        const matchBusca = busca === '' ||
            c.nome.toLowerCase().includes(busca.toLowerCase()) ||
            c.email.toLowerCase().includes(busca.toLowerCase()) ||
            c.documento_numero?.includes(busca) ||
            c.telefone?.includes(busca);
        return matchSegmento && matchBusca;
    });

    // Estatísticas
    const totalClientes = clientes.length;
    const clientesVIP = clientes.filter(c => c.segmento === 'VIP').length;
    const totalViagens = clientes.reduce((sum, c) => sum + (c.historico_viagens || 0), 0);
    const valorTotal = clientes.reduce((sum, c) => sum + Number(c.valor_total_gasto || 0), 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">CRM - Clientes</h1>
                    <p className="text-slate-500 dark:text-slate-400">Gestão de relacionamento com clientes</p>
                </div>
                <Link
                    to="/admin/clientes/novo"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                    <UserPlus size={18} />
                    Novo Cliente
                </Link>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total de Clientes</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{totalClientes}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <Users size={24} className="text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Clientes VIP</p>
                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{clientesVIP}</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                            <Star size={24} className="text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total de Viagens</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{totalViagens}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                            <TrendingUp size={24} className="text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Receita Total</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                R$ {valorTotal.toLocaleString('pt-BR')}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                            <Award size={24} className="text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar por nome, email, documento ou telefone..."
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => setFiltroSegmento('TODOS')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${filtroSegmento === 'TODOS' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                        >
                            <Filter size={16} />
                            Todos
                        </button>
                        <button
                            onClick={() => setFiltroSegmento('VIP')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filtroSegmento === 'VIP' ? 'bg-purple-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                        >
                            VIP
                        </button>
                        <button
                            onClick={() => setFiltroSegmento('REGULAR')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filtroSegmento === 'REGULAR' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                        >
                            Regular
                        </button>
                        <button
                            onClick={() => setFiltroSegmento('NOVO')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filtroSegmento === 'NOVO' ? 'bg-green-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                        >
                            Novos
                        </button>
                    </div>
                </div>
            </div>

            {/* Lista de Clientes */}
            <div className="grid gap-4">
                {isLoading ? (
                    <div className="text-center p-12 text-slate-500">Carregando clientes...</div>
                ) : clientesFiltrados.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                        <Users size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">Nenhum cliente encontrado</p>
                    </div>
                ) : (
                    clientesFiltrados.map((cliente) => (
                        <Link
                            key={cliente.id}
                            to={`/admin/clientes/${cliente.id}`}
                            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 hover:shadow-md transition-all hover:border-blue-300 dark:hover:border-blue-700"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                                        {cliente.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{cliente.nome}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Cliente desde {new Date(cliente.data_cadastro).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <SegmentoBadge segmento={cliente.segmento} />
                                    <ClientActions cliente={cliente} onUpdate={fetchClientes} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                <div className="flex items-center gap-2">
                                    <Mail size={16} className="text-blue-600" />
                                    <span className="text-sm text-slate-600 dark:text-slate-400 truncate">{cliente.email}</span>
                                </div>
                                {cliente.telefone && (
                                    <div className="flex items-center gap-2">
                                        <Phone size={16} className="text-green-600" />
                                        <span className="text-sm text-slate-600 dark:text-slate-400">{cliente.telefone}</span>
                                    </div>
                                )}
                                {cliente.cidade && (
                                    <div className="flex items-center gap-2">
                                        <MapPin size={16} className="text-red-600" />
                                        <span className="text-sm text-slate-600 dark:text-slate-400">{cliente.cidade}, {cliente.estado}</span>
                                    </div>
                                )}
                                {cliente.ultima_viagem && (
                                    <div className="flex items-center gap-2">
                                        <Calendar size={16} className="text-purple-600" />
                                        <span className="text-sm text-slate-600 dark:text-slate-400">
                                            Última viagem: {new Date(cliente.ultima_viagem).toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                                <div className="flex gap-4">
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Viagens</p>
                                        <p className="font-bold text-slate-800 dark:text-white">{cliente.historico_viagens || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Créditos</p>
                                        <p className="font-bold text-green-600 dark:text-green-400">{Number(cliente.saldo_creditos || 0).toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Total Gasto</p>
                                        <p className="font-bold text-blue-600 dark:text-blue-400">
                                            R$ {Number(cliente.valor_total_gasto || 0).toLocaleString('pt-BR')}
                                        </p>
                                    </div>
                                </div>
                                {cliente.tags && cliente.tags.length > 0 && (
                                    <div className="flex gap-1 flex-wrap">
                                        {cliente.tags.slice(0, 3).map((tag, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs"
                                            >
                                                <Tag size={10} />
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
};

