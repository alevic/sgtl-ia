import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TipoDocumento } from '../types';
import { ArrowLeft, Save, User, Mail, Phone, MapPin, FileText, Calendar, MessageSquare } from 'lucide-react';
import { clientsService } from '../services/clientsService';

export const EditarCliente: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        telefone: '',
        documento_tipo: TipoDocumento.CPF,
        documento: '',
        nacionalidade: '',
        data_nascimento: '',
        endereco: '',
        cidade: '',
        estado: '',
        pais: 'Brasil',
        segmento: 'Standard',
        observacoes: '',
        saldo_creditos: 0
    });

    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    useEffect(() => {
        const fetchCliente = async () => {
            if (!id) return;

            setIsFetching(true);
            try {
                const data = await clientsService.getById(id);

                setFormData({
                    nome: data.nome || '',
                    email: data.email || '',
                    telefone: data.telefone || '',
                    documento_tipo: data.documento_tipo || TipoDocumento.CPF,
                    documento: data.documento || '',
                    nacionalidade: data.nacionalidade || '',
                    data_nascimento: data.data_nascimento ? new Date(data.data_nascimento).toISOString().split('T')[0] : '',
                    endereco: data.endereco || '',
                    cidade: data.cidade || '',
                    estado: data.estado || '',
                    pais: data.pais || 'Brasil',
                    segmento: data.segmento || 'Standard',
                    observacoes: data.observacoes || '',
                    saldo_creditos: data.saldo_creditos || 0
                });
            } catch (error) {
                console.error("Erro ao buscar cliente:", error);
                alert('Erro ao carregar cliente. Redirecionando...');
                navigate('/admin/clientes');
            } finally {
                setIsFetching(false);
            }
        };

        fetchCliente();
    }, [id, navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSalvar = async () => {
        if (!formData.nome || !formData.email) {
            alert('Por favor, preencha nome e email do cliente.');
            return;
        }

        setIsLoading(true);
        try {
            await clientsService.update(id!, formData);
            navigate(`/admin/clientes/${id}`);
        } catch (error) {
            console.error("Erro ao atualizar cliente:", error);
            alert('Erro ao atualizar cliente. Por favor, tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-slate-500 dark:text-slate-400">Carregando cliente...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(`/admin/clientes/${id}`)}
                    className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Editar Cliente</h1>
                    <p className="text-slate-500 dark:text-slate-400">Atualize as informações do cliente</p>
                </div>
                <button
                    onClick={handleSalvar}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                    <Save size={18} />
                    {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Informações Pessoais */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <User size={20} className="text-blue-600" />
                        Informações Pessoais
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Nome Completo *
                            </label>
                            <input
                                type="text"
                                name="nome"
                                value={formData.nome}
                                onChange={handleChange}
                                placeholder="Nome completo do cliente"
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                <span className="flex items-center gap-1"><Mail size={14} /> Email *</span>
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="email@exemplo.com"
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                <span className="flex items-center gap-1"><Phone size={14} /> Telefone</span>
                            </label>
                            <input
                                type="text"
                                name="telefone"
                                value={formData.telefone}
                                onChange={handleChange}
                                placeholder="(11) 99999-9999"
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                <span className="flex items-center gap-1"><Calendar size={14} /> Data de Nascimento</span>
                            </label>
                            <input
                                type="date"
                                name="data_nascimento"
                                value={formData.data_nascimento}
                                onChange={handleChange}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Segmento
                            </label>
                            <select
                                name="segmento"
                                value={formData.segmento}
                                onChange={handleChange}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="Standard">Standard</option>
                                <option value="VIP">VIP</option>
                                <option value="Corporativo">Corporativo</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Documentação */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <FileText size={20} className="text-orange-600" />
                        Documentação
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Tipo de Documento
                            </label>
                            <select
                                name="documento_tipo"
                                value={formData.documento_tipo}
                                onChange={handleChange}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value={TipoDocumento.CPF}>CPF</option>
                                <option value={TipoDocumento.RG}>RG</option>
                                <option value={TipoDocumento.PASSAPORTE}>Passaporte</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Número do Documento
                            </label>
                            <input
                                type="text"
                                name="documento"
                                value={formData.documento}
                                onChange={handleChange}
                                placeholder="000.000.000-00"
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Nacionalidade
                            </label>
                            <input
                                type="text"
                                name="nacionalidade"
                                value={formData.nacionalidade}
                                onChange={handleChange}
                                placeholder="Brasileira"
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Endereço */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <MapPin size={20} className="text-red-600" />
                        Endereço
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Logradouro
                            </label>
                            <input
                                type="text"
                                name="endereco"
                                value={formData.endereco}
                                onChange={handleChange}
                                placeholder="Rua, número, complemento"
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Cidade
                            </label>
                            <input
                                type="text"
                                name="cidade"
                                value={formData.cidade}
                                onChange={handleChange}
                                placeholder="São Paulo"
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Estado
                            </label>
                            <input
                                type="text"
                                name="estado"
                                value={formData.estado}
                                onChange={handleChange}
                                placeholder="SP"
                                maxLength={2}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                País
                            </label>
                            <input
                                type="text"
                                name="pais"
                                value={formData.pais}
                                onChange={handleChange}
                                placeholder="Brasil"
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Créditos e Observações */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <MessageSquare size={20} className="text-blue-600" />
                        Créditos e Observações
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Saldo de Créditos
                            </label>
                            <input
                                type="number"
                                name="saldo_creditos"
                                value={formData.saldo_creditos}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Observações
                            </label>
                            <textarea
                                name="observacoes"
                                value={formData.observacoes}
                                onChange={handleChange}
                                placeholder="Informações adicionais sobre o cliente..."
                                rows={4}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
