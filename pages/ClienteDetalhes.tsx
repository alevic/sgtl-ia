import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ICliente, IInteracao, INota, IReserva, TipoDocumento, Moeda, TipoAssento, ReservationStatusLabel, TipoInteracao, TipoInteracaoLabel } from '../types';
import { useAppContext } from '../context/AppContext';
import {
    ArrowLeft, User, Mail, Phone, MapPin, Calendar, DollarSign,
    FileText, MessageSquare, History, Star, Edit, Plus, Check, X
} from 'lucide-react';
import { clientsService } from '../services/clientsService';
import { reservationsService } from '../services/reservationsService';

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
        tipo: TipoInteracao.EMAIL,
        descricao: 'Enviado confirmação de reserva para viagem SP-Florianópolis',
        data_hora: '2023-10-14T10:30:00',
        usuario_responsavel: 'Sistema'
    },
    {
        id: '2',
        cliente_id: '1',
        tipo: TipoInteracao.PHONE,
        descricao: 'Cliente ligou para confirmar horário de embarque',
        data_hora: '2023-10-13T14:15:00',
        usuario_responsavel: 'João - Atendimento'
    },
    {
        id: '3',
        cliente_id: '1',
        tipo: TipoInteracao.WHATSAPP,
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


export const ClienteDetalhes: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAppContext();
    const [activeTab, setActiveTab] = useState<'perfil' | 'historico' | 'interacoes' | 'notas'>('perfil');
    const [cliente, setCliente] = useState<ICliente | null>(null);
    const [interacoes, setInteracoes] = useState<IInteracao[]>([]);
    const [notas, setNotas] = useState<INota[]>([]);
    const [reservas, setReservas] = useState<IReserva[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal states
    const [showInteractionModal, setShowInteractionModal] = useState(false);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    // New item states
    const [newInteraction, setNewInteraction] = useState({ tipo: TipoInteracao.PHONE, descricao: '' });
    const [newNote, setNewNote] = useState({ titulo: '', conteudo: '', importante: false });
    const [editFormData, setEditFormData] = useState<Partial<ICliente>>({});

    const getTipoIcon = (tipo: TipoInteracao) => {
        switch (tipo) {
            case TipoInteracao.EMAIL: return <Mail size={16} className="text-blue-600" />;
            case TipoInteracao.PHONE: return <Phone size={16} className="text-green-600" />;
            case TipoInteracao.WHATSAPP: return <MessageSquare size={16} className="text-green-600" />;
            case TipoInteracao.IN_PERSON: return <User size={16} className="text-purple-600" />;
            case TipoInteracao.SYSTEM: return <History size={16} className="text-slate-600" />;
            default: return <MessageSquare size={16} className="text-slate-600" />;
        }
    };

    const fetchData = async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            console.log('Fetching client details for ID:', id);
            const [clientData, interactionsData, notesData, reservationsData] = await Promise.all([
                clientsService.getById(id),
                clientsService.getInteractions(id),
                clientsService.getNotes(id),
                reservationsService.getAll({ client_id: id })
            ]);

            setCliente(clientData);
            setInteracoes(interactionsData);
            setNotas(notesData);

            // Map backend fields to frontend interface
            const mappedReservations = reservationsData.map((res: any) => ({
                id: res.id,
                codigo: res.ticket_code,
                viagem_id: res.trip_id,
                data_reserva: res.created_at,
                status: res.status,
                valor_total: Number(res.price),
                moeda: 'BRL', // Default to BRL
                assento_numero: res.seat_number,
                trip_title: res.trip_title,
                departure_date: res.departure_date,
                departure_time: res.departure_time
            }));

            setReservas(mappedReservations);

        } catch (error) {
            console.error('Error fetching client details:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const handleAddInteraction = async () => {
        if (!id) return;
        try {
            const addedInteraction = await clientsService.addInteraction(id, {
                ...newInteraction,
                usuario_responsavel: user.name
            });

            setInteracoes([addedInteraction, ...interacoes]);
            setShowInteractionModal(false);
            setNewInteraction({ tipo: TipoInteracao.PHONE, descricao: '' });
        } catch (error) {
            console.error('Error adding interaction:', error);
        }
    };

    const handleAddNote = async () => {
        if (!id) return;
        try {
            const addedNote = await clientsService.addNote(id, {
                ...newNote,
                criado_por: user.name
            });

            setNotas([addedNote, ...notas]);
            setShowNoteModal(false);
            setNewNote({ titulo: '', conteudo: '', importante: false });
        } catch (error) {
            console.error('Error adding note:', error);
        }
    };

    const handleEditClick = () => {
        if (cliente) {
            setEditFormData({
                ...cliente,
                // Ensure dates are formatted for input type="date"
                data_nascimento: cliente.data_nascimento ? new Date(cliente.data_nascimento).toISOString().split('T')[0] : ''
            });
            setShowEditModal(true);
        }
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveEdit = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/clients/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editFormData)
            });

            if (response.ok) {
                const updatedClient = await response.json();
                setCliente(updatedClient);
                setShowEditModal(false);
            } else {
                console.error('Failed to update client');
            }
        } catch (error) {
            console.error('Error updating client:', error);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center">Carregando...</div>;
    }

    if (!cliente) {
        return <div className="p-8 text-center">Cliente não encontrado</div>;
    }

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
                <Link
                    to={`/admin/clientes/${id}/editar`}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                    <Edit size={18} />
                    Editar
                </Link>
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Editar Cliente</h2>
                            <button onClick={() => setShowEditModal(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
                                <input
                                    type="text"
                                    name="nome"
                                    value={editFormData.nome || ''}
                                    onChange={handleEditChange}
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={editFormData.email || ''}
                                    onChange={handleEditChange}
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefone</label>
                                <input
                                    type="text"
                                    name="telefone"
                                    value={editFormData.telefone || ''}
                                    onChange={handleEditChange}
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo de Documento</label>
                                <select
                                    name="documento_tipo"
                                    value={editFormData.documento_tipo || TipoDocumento.CPF}
                                    onChange={handleEditChange}
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                >
                                    <option value={TipoDocumento.CPF}>CPF</option>
                                    <option value={TipoDocumento.RG}>RG</option>
                                    <option value={TipoDocumento.PASSAPORTE}>Passaporte</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Número do Documento</label>
                                <input
                                    type="text"
                                    name="documento_numero"
                                    value={editFormData.documento_numero || ''}
                                    onChange={handleEditChange}
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nacionalidade</label>
                                <input
                                    type="text"
                                    name="nacionalidade"
                                    value={editFormData.nacionalidade || ''}
                                    onChange={handleEditChange}
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data de Nascimento</label>
                                <input
                                    type="date"
                                    name="data_nascimento"
                                    value={editFormData.data_nascimento ? new Date(editFormData.data_nascimento).toISOString().split('T')[0] : ''}
                                    onChange={handleEditChange}
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Endereço</label>
                                <input
                                    type="text"
                                    name="endereco"
                                    value={editFormData.endereco || ''}
                                    onChange={handleEditChange}
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cidade</label>
                                <input
                                    type="text"
                                    name="cidade"
                                    value={editFormData.cidade || ''}
                                    onChange={handleEditChange}
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Estado</label>
                                <input
                                    type="text"
                                    name="estado"
                                    value={editFormData.estado || ''}
                                    onChange={handleEditChange}
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">País</label>
                                <input
                                    type="text"
                                    name="pais"
                                    value={editFormData.pais || ''}
                                    onChange={handleEditChange}
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Segmento</label>
                                <select
                                    name="segmento"
                                    value={editFormData.segmento || 'REGULAR'}
                                    onChange={handleEditChange}
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                >
                                    <option value="REGULAR">Regular</option>
                                    <option value="VIP">VIP</option>
                                    <option value="NOVO">Novo</option>
                                    <option value="INATIVO">Inativo</option>
                                </select>
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Observações</label>
                                <textarea
                                    name="observacoes"
                                    value={editFormData.observacoes || ''}
                                    onChange={handleEditChange}
                                    rows={3}
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg shadow-blue-500/30 transition-all"
                            >
                                Salvar Alterações
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Card Principal - Stats Hero */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 text-white">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/10 rounded-lg p-4 text-center">
                        <p className="text-sm opacity-80">Total de Viagens</p>
                        <p className="text-3xl font-bold">{cliente.historico_viagens || 0}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 text-center">
                        <p className="text-sm opacity-80">Créditos</p>
                        <p className="text-3xl font-bold">{cliente.saldo_creditos || 0}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 text-center">
                        <p className="text-sm opacity-80">Total Gasto</p>
                        <p className="text-2xl font-bold">R$ {Number(cliente.valor_total_gasto || 0).toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 text-center">
                        <p className="text-sm opacity-80">Última Viagem</p>
                        <p className="text-lg font-bold">
                            {cliente.ultima_viagem ? new Date(cliente.ultima_viagem).toLocaleDateString('pt-BR') : 'N/A'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            < div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm" >
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
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Coluna Esquerda - Info Pessoal e Documentação */}
                            <div className="space-y-6">
                                {/* Informações Pessoais */}
                                <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-5">
                                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                                        <User size={18} className="text-blue-500" />
                                        Informações Pessoais
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Email</p>
                                            <p className="font-medium text-slate-800 dark:text-white mt-0.5">{cliente.email || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Telefone</p>
                                            <p className="font-medium text-slate-800 dark:text-white mt-0.5">{cliente.telefone || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Data de Nascimento</p>
                                            <p className="font-medium text-slate-800 dark:text-white mt-0.5">
                                                {cliente.data_nascimento ? new Date(cliente.data_nascimento).toLocaleDateString('pt-BR') : '-'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Segmento</p>
                                            <p className="font-medium text-slate-800 dark:text-white mt-0.5 flex items-center gap-1">
                                                <Star size={14} className="text-purple-500" />
                                                {cliente.segmento || 'Não definido'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Documentação */}
                                <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-5">
                                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                                        <FileText size={18} className="text-orange-500" />
                                        Documentação
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Tipo de Documento</p>
                                            <p className="font-medium text-slate-800 dark:text-white mt-0.5">{cliente.documento_tipo || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Número</p>
                                            <p className="font-medium text-slate-800 dark:text-white mt-0.5">{cliente.documento_numero || '-'}</p>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Nacionalidade</p>
                                            <p className="font-medium text-slate-800 dark:text-white mt-0.5">{cliente.nacionalidade || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Coluna Direita - Endereço e Observações */}
                            <div className="space-y-6">
                                {/* Endereço */}
                                <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-5">
                                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                                        <MapPin size={18} className="text-red-500" />
                                        Endereço
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Logradouro</p>
                                            <p className="font-medium text-slate-800 dark:text-white mt-0.5">{cliente.endereco || '-'}</p>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Cidade</p>
                                                <p className="font-medium text-slate-800 dark:text-white mt-0.5">{cliente.cidade || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Estado</p>
                                                <p className="font-medium text-slate-800 dark:text-white mt-0.5">{cliente.estado || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">País</p>
                                                <p className="font-medium text-slate-800 dark:text-white mt-0.5">{cliente.pais || '-'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Observações */}
                                <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-5">
                                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                                        <MessageSquare size={18} className="text-blue-500" />
                                        Observações
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                                        {cliente.observacoes || 'Nenhuma observação registrada.'}
                                    </p>
                                </div>

                                {/* Tags */}
                                {cliente.tags && cliente.tags.length > 0 && (
                                    <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-5">
                                        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4">Tags</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {cliente.tags.map((tag, index) => (
                                                <span key={index} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
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
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-bold text-slate-800 dark:text-white">{reserva.codigo}</p>
                                                <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded">
                                                    Assento {reserva.assento_numero || 'N/A'}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                {reserva.trip_title || 'Viagem'}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {reserva.departure_date ? new Date(reserva.departure_date).toLocaleDateString('pt-BR') : ''} {reserva.departure_time?.substring(0, 5)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-green-600 dark:text-green-400">
                                                {reserva.moeda} {(reserva.valor_total || 0).toFixed(2)}
                                            </p>
                                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${reserva.status === 'CONFIRMED' || reserva.status === 'USED' || reserva.status === 'COMPLETED'
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : reserva.status === 'CANCELLED'
                                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                }`}>
                                                {ReservationStatusLabel[reserva.status as any] || reserva.status}
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
                                <button
                                    onClick={() => setShowInteractionModal(true)}
                                    className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                                >
                                    <Plus size={16} />
                                    Nova Interação
                                </button>
                            </div>

                            {showInteractionModal && (
                                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 mb-4 shadow-sm">
                                    <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-3">Nova Interação</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
                                            <select
                                                value={newInteraction.tipo}
                                                onChange={(e) => setNewInteraction({ ...newInteraction, tipo: e.target.value as TipoInteracao })}
                                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                            >
                                                <option value={TipoInteracao.PHONE}>Telefone</option>
                                                <option value={TipoInteracao.EMAIL}>Email</option>
                                                <option value={TipoInteracao.WHATSAPP}>WhatsApp</option>
                                                <option value={TipoInteracao.IN_PERSON}>Presencial</option>
                                                <option value={TipoInteracao.SYSTEM}>Sistema</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
                                            <textarea
                                                value={newInteraction.descricao}
                                                onChange={(e) => setNewInteraction({ ...newInteraction, descricao: e.target.value })}
                                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                                rows={3}
                                                placeholder="Descreva a interação..."
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setShowInteractionModal(false)}
                                                className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleAddInteraction}
                                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
                                            >
                                                Salvar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {interacoes.map((interacao) => (
                                <div
                                    key={interacao.id}
                                    className="border-l-4 border-blue-500 bg-slate-50 dark:bg-slate-700/50 p-4 rounded-r-lg"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        {getTipoIcon(interacao.tipo)}
                                        <span className="font-semibold text-slate-800 dark:text-white">{TipoInteracaoLabel[interacao.tipo] || interacao.tipo}</span>
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
                                <button
                                    onClick={() => setShowNoteModal(true)}
                                    className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                                >
                                    <Plus size={16} />
                                    Nova Nota
                                </button>
                            </div>

                            {showNoteModal && (
                                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 mb-4 shadow-sm">
                                    <h4 className="font-bold text-slate-700 dark:text-slate-200 mb-3">Nova Nota</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título</label>
                                            <input
                                                type="text"
                                                value={newNote.titulo}
                                                onChange={(e) => setNewNote({ ...newNote, titulo: e.target.value })}
                                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                                placeholder="Título da nota"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Conteúdo</label>
                                            <textarea
                                                value={newNote.conteudo}
                                                onChange={(e) => setNewNote({ ...newNote, conteudo: e.target.value })}
                                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                                rows={3}
                                                placeholder="Conteúdo da nota..."
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="importante"
                                                checked={newNote.importante}
                                                onChange={(e) => setNewNote({ ...newNote, importante: e.target.checked })}
                                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <label htmlFor="importante" className="text-sm text-slate-700 dark:text-slate-300">Marcar como importante</label>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setShowNoteModal(false)}
                                                className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleAddNote}
                                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
                                            >
                                                Salvar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
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
            </div >
        </div >
    );
};
