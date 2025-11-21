import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ICliente, IInteracao, INota, IReserva, TipoDocumento, Moeda } from '../types';
import {
    ArrowLeft, User, Mail, Phone, MapPin, Calendar, DollarSign,
    FileText, MessageSquare, History, Star, Edit, Plus, Check, X
} from 'lucide-react';

// Mock Data
const MOCK_CLIENTE: ICliente = {
    id: '1',
    nome: 'Maria Oliveira Santos',
    email: 'maria.santos@email.com',
    telefone: '(11) 98765-4321',
    saldo_creditos: 250,
    historico_viagens: 15,
    documento_tipo: TipoDocumento.CPF,
    documento_numero: '123.456.789-00',
    nacionalidade: 'Brasileira',
    data_cadastro: '2022-03-15',
    data_nascimento: '1985-06-20',
    endereco: 'Rua das Flores, 123, Apto 45',
    cidade: 'São Paulo',
    estado: 'SP',
    pais: 'Brasil',
    segmento: 'VIP',
    tags: ['Frequente', 'Turismo', 'Fidelidade'],
    ultima_viagem: '2023-10-15',
    valor_total_gasto: 8500.00,
    observacoes: 'Cliente preferencial, sempre viaja em datas comemorativas'
};

const MOCK_INTERACOES: IInteracao[] = [
    {
        id: '1',
        cliente_id: '1',
        tipo: 'EMAIL',
        descricao: 'Enviado confirmação de reserva para viagem SP-Florianópolis',
        data_hora: '2023-10-14T10:30:00',
        usuario_responsavel: 'Sistema'
    },
    {
        id: '2',
        cliente_id: '1',
        tipo: 'TELEFONE',
        descricao: 'Cliente ligou para confirmar horário de embarque',
        data_hora: '2023-10-13T14:15:00',
        usuario_responsavel: 'João - Atendimento'
    },
    {
        id: '3',
        cliente_id: '1',
        tipo: 'WHATSAPP',
        descricao: 'Enviada promoção de Natal - 20% de desconto',
        data_hora: '2023-10-01T09:00:00',
        usuario_responsavel: 'Marketing'
    }
];

const MOCK_NOTAS: INota[] = [
    {
        id: '1',
        cliente_id: '1',
        titulo: 'Cliente VIP - Preferências',
        conteudo: 'Sempre prefere assento próximo à janela. Gosta de viajar à noite.',
        data_criacao: '2023-09-15T10:00:00',
        criado_por: 'Ana - Gerente',
        importante: true
    },
    {
        id: '2',
        cliente_id: '1',
        titulo: 'Feedback positivo',
        conteudo: 'Cliente elogiou atendimento na última viagem. Muito satisfeita com o serviço.',
        data_criacao: '2023-10-16T11:30:00',
        criado_por: 'João - Atendimento',
        importante: false
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
        status: 'UTILIZADA',
        valor_pago: 180.00,
        moeda: Moeda.BRL,
        forma_pagamento: 'PIX'
    },
    {
        id: '2',
        codigo: 'RSV-2023-045',
        viagem_id: 'V005',
        cliente_id: '1',
        assento_numero: '08',
        data_reserva: '2023-09-20T10:15:00',
        status: 'UTILIZADA',
        valor_pago: 220.00,
        moeda: Moeda.BRL,
        forma_pagamento: 'CARTAO'
    }
];

export const ClienteDetalhes: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [activeTab, setActiveTab] = useState<'perfil' | 'historico' | 'interacoes' | 'notas'>('perfil');
    const [cliente] = useState<ICliente>(MOCK_CLIENTE);
    const [interacoes] = useState<IInteracao[]>(MOCK_INTERACOES);
    const [notas] = useState<INota[]>(MOCK_NOTAS);
    const [reservas] = useState<IReserva[]>(MOCK_RESERVAS);

    const getTipoIcon = (tipo: IInteracao['tipo']) => {
        switch (tipo) {
            case 'EMAIL': return <Mail size={16} className="text-blue-600" />;
            case 'TELEFONE': return <Phone size={16} className="text-green-600" />;
            case 'WHATSAPP': return <MessageSquare size={16} className="text-green-600" />;
            case 'PRESENCIAL': return <User size={16} className="text-purple-600" />;
            case 'SISTEMA': return <History size={16} className="text-slate-600" />;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Cabeçalho */}
            <div className="flex items-center gap-4">
                <Link
                    to="/admin/clientes"
                    className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{cliente.nome}</h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Cliente desde {new Date(cliente.data_cadastro).toLocaleDateString('pt-BR')}
                    </p>
                </div>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-2">
                    <Edit size={18} />
                    Editar
                </button>
            </div>

            {/* Card Principal */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 text-white">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold">
                            {cliente.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{cliente.nome}</h2>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-semibold flex items-center gap-1">
                                    <Star size={14} />
                                    {cliente.segmento}
                                </span>
                                {cliente.tags.map((tag, index) => (
                                    <span key={index} className="px-2 py-1 bg-white/10 rounded text-xs">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white/10 rounded-lg p-4">
                        <p className="text-sm opacity-80">Total de Viagens</p>
                        <p className="text-3xl font-bold">{cliente.historico_viagens}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                        <p className="text-sm opacity-80">Créditos</p>
                        <p className="text-3xl font-bold">{cliente.saldo_creditos}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                        <p className="text-sm opacity-80">Total Gasto</p>
                        <p className="text-2xl font-bold">R$ {cliente.valor_total_gasto.toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                        <p className="text-sm opacity-80">Última Viagem</p>
                        <p className="text-lg font-bold">
                            {cliente.ultima_viagem ? new Date(cliente.ultima_viagem).toLocaleDateString('pt-BR') : 'N/A'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="border-b border-slate-200 dark:border-slate-700">
                    <div className="flex gap-2 p-2">
                        <button
                            onClick={() => setActiveTab('perfil')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'perfil' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                        >
                            Perfil
                        </button>
                        <button
                            onClick={() => setActiveTab('historico')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'historico' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                        >
                            Histórico
                        </button>
                        <button
                            onClick={() => setActiveTab('interacoes')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'interacoes' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                        >
                            Interações
                        </button>
                        <button
                            onClick={() => setActiveTab('notas')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'notas' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                        >
                            Notas
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {/* Tab: Perfil */}
                    {activeTab === 'perfil' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4">Informações Pessoais</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <Mail size={18} className="text-blue-600" />
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Email</p>
                                                <p className="font-semibold text-slate-800 dark:text-white">{cliente.email}</p>
                                            </div>
                                        </div>
                                        {cliente.telefone && (
                                            <div className="flex items-center gap-3">
                                                <Phone size={18} className="text-green-600" />
                                                <div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">Telefone</p>
                                                    <p className="font-semibold text-slate-800 dark:text-white">{cliente.telefone}</p>
                                                </div>
                                            </div>
                                        )}
                                        {cliente.data_nascimento && (
                                            <div className="flex items-center gap-3">
                                                <Calendar size={18} className="text-purple-600" />
                                                <div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">Data de Nascimento</p>
                                                    <p className="font-semibold text-slate-800 dark:text-white">
                                                        {new Date(cliente.data_nascimento).toLocaleDateString('pt-BR')}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4">Endereço</h3>
                                    <div className="space-y-3">
                                        {cliente.endereco && (
                                            <div className="flex items-start gap-3">
                                                <MapPin size={18} className="text-red-600 mt-1" />
                                                <div>
                                                    <p className="font-semibold text-slate-800 dark:text-white">{cliente.endereco}</p>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                                        {cliente.cidade}, {cliente.estado} - {cliente.pais}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4">Documentação</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <FileText size={18} className="text-orange-600" />
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{cliente.documento_tipo}</p>
                                                <p className="font-semibold text-slate-800 dark:text-white">{cliente.documento_numero}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <FileText size={18} className="text-blue-600" />
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Nacionalidade</p>
                                                <p className="font-semibold text-slate-800 dark:text-white">{cliente.nacionalidade}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {cliente.observacoes && (
                                    <div>
                                        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4">Observações</h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                                            {cliente.observacoes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tab: Histórico */}
                    {activeTab === 'historico' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-700 dark:text-slate-200">Histórico de Reservas</h3>
                            </div>
                            {reservas.map((reserva) => (
                                <div
                                    key={reserva.id}
                                    className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-white">{reserva.codigo}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                Assento {reserva.assento_numero} • {new Date(reserva.data_reserva).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-green-600 dark:text-green-400">
                                                {reserva.moeda} {reserva.valor_pago.toFixed(2)}
                                            </p>
                                            <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                                {reserva.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Tab: Interações */}
                    {activeTab === 'interacoes' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-700 dark:text-slate-200">Histórico de Interações</h3>
                                <button className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
                                    <Plus size={16} />
                                    Nova Interação
                                </button>
                            </div>
                            {interacoes.map((interacao) => (
                                <div
                                    key={interacao.id}
                                    className="border-l-4 border-blue-500 bg-slate-50 dark:bg-slate-700/50 p-4 rounded-r-lg"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        {getTipoIcon(interacao.tipo)}
                                        <span className="font-semibold text-slate-800 dark:text-white">{interacao.tipo}</span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            {new Date(interacao.data_hora).toLocaleString('pt-BR')}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">{interacao.descricao}</p>
                                    {interacao.usuario_responsavel && (
                                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                                            Por: {interacao.usuario_responsavel}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Tab: Notas */}
                    {activeTab === 'notas' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-700 dark:text-slate-200">Notas do Cliente</h3>
                                <button className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
                                    <Plus size={16} />
                                    Nova Nota
                                </button>
                            </div>
                            {notas.map((nota) => (
                                <div
                                    key={nota.id}
                                    className={`border rounded-lg p-4 ${nota.importante ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                            {nota.importante && <Star size={16} className="text-orange-600" />}
                                            {nota.titulo}
                                        </h4>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            {new Date(nota.data_criacao).toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{nota.conteudo}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-500">Por: {nota.criado_por}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
