import React, { useState } from 'react';
import { ICliente, TipoDocumento } from '../../types';
import { X, Save, User, Mail, Phone, MapPin, FileText, Calendar, Loader } from 'lucide-react';

interface ModalNovoClienteProps {
    isOpen: boolean;
    onClose: () => void;
    onClientCreated: (client: ICliente) => void;
}

export const ModalNovoCliente: React.FC<ModalNovoClienteProps> = ({
    isOpen,
    onClose,
    onClientCreated
}) => {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [telefone, setTelefone] = useState('');
    const [documentoTipo, setDocumentoTipo] = useState<TipoDocumento>(TipoDocumento.CPF);
    const [documentoNumero, setDocumentoNumero] = useState('');
    const [dataNascimento, setDataNascimento] = useState('');
    const [nacionalidade, setNacionalidade] = useState('Brasileira');
    const [endereco, setEndereco] = useState('');
    const [cidade, setCidade] = useState('');
    const [estado, setEstado] = useState('');
    const [pais, setPais] = useState('Brasil');
    const [segmento, setSegmento] = useState<'VIP' | 'REGULAR' | 'NOVO' | 'INATIVO'>('NOVO');
    const [observacoes, setObservacoes] = useState('');

    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handleSalvar = async () => {
        if (!nome || !email || !documentoNumero) {
            alert('Por favor, preencha os campos obrigatórios (Nome, Email e Documento).');
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/clients`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Adicione headers de autenticação se necessário, 
                    // mas assumindo que o ambiente lida com isso via cookies ou middleware global
                },
                body: JSON.stringify({
                    nome,
                    email,
                    telefone,
                    documento_tipo: documentoTipo,
                    documento_numero: documentoNumero,
                    data_nascimento: dataNascimento,
                    nacionalidade,
                    endereco,
                    cidade,
                    estado,
                    pais,
                    segmento,
                    observacoes
                })
            });

            if (response.ok) {
                const newClient = await response.json();
                onClientCreated(newClient);
                onClose();
                // Reset form
                setNome('');
                setEmail('');
                setTelefone('');
                setDocumentoNumero('');
            } else {
                const errorData = await response.json();
                alert('Erro ao salvar cliente: ' + (errorData.error || 'Erro desconhecido'));
            }
        } catch (error) {
            console.error('Error creating client:', error);
            alert('Erro de conexão ao salvar cliente.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <User size={24} className="text-blue-600" />
                            Cadastrar Novo Cliente
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Preencha os dados abaixo para cadastrar o passageiro no sistema</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Dados Pessoais */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
                                <FileText size={16} />
                                Dados Pessoais
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nome Completo *</label>
                                    <input
                                        type="text"
                                        value={nome}
                                        onChange={(e) => setNome(e.target.value)}
                                        className="w-full p-2.5 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm"
                                        placeholder="Ex: João Silva"
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email *</label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full p-2.5 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm"
                                            placeholder="joao@email.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Telefone</label>
                                        <input
                                            type="tel"
                                            value={telefone}
                                            onChange={(e) => setTelefone(e.target.value)}
                                            className="w-full p-2.5 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm"
                                            placeholder="(11) 98765-4321"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Documentação */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
                                <FileText size={16} />
                                Documentação
                            </h3>
                            <div className="space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tipo de Documento</label>
                                        <select
                                            value={documentoTipo}
                                            onChange={(e) => setDocumentoTipo(e.target.value as TipoDocumento)}
                                            className="w-full p-2.5 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm"
                                        >
                                            <option value={TipoDocumento.CPF}>CPF</option>
                                            <option value={TipoDocumento.RG}>RG</option>
                                            <option value={TipoDocumento.PASSAPORTE}>Passaporte</option>
                                            <option value={TipoDocumento.CNH}>CNH</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Número *</label>
                                        <input
                                            type="text"
                                            value={documentoNumero}
                                            onChange={(e) => setDocumentoNumero(e.target.value)}
                                            className="w-full p-2.5 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm"
                                            placeholder="000.000.000-00"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nascimento</label>
                                        <input
                                            type="date"
                                            value={dataNascimento}
                                            onChange={(e) => setDataNascimento(e.target.value)}
                                            className="w-full p-2.5 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nacionalidade</label>
                                        <input
                                            type="text"
                                            value={nacionalidade}
                                            onChange={(e) => setNacionalidade(e.target.value)}
                                            className="w-full p-2.5 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Endereço */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
                            <MapPin size={16} />
                            Endereço
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Endereço</label>
                                <input
                                    type="text"
                                    value={endereco}
                                    onChange={(e) => setEndereco(e.target.value)}
                                    className="w-full p-2.5 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm"
                                    placeholder="Rua, número, bairro..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Cidade</label>
                                <input
                                    type="text"
                                    value={cidade}
                                    onChange={(e) => setCidade(e.target.value)}
                                    className="w-full p-2.5 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Estado</label>
                                <input
                                    type="text"
                                    value={estado}
                                    onChange={(e) => setEstado(e.target.value)}
                                    className="w-full p-2.5 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm"
                                    placeholder="UF"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Observações */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Observações</label>
                        <textarea
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                            className="w-full p-2.5 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm"
                            rows={3}
                            placeholder="Informações adicionais..."
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSalvar}
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-500 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
                        Salvar e Selecionar
                    </button>
                </div>
            </div>
        </div>
    );
};
