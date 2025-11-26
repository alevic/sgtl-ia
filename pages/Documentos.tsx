import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText, Search, Filter, Download, Upload, Trash2,
    AlertTriangle, CheckCircle, Clock, MoreVertical,
    Truck, Users, Building
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EmpresaContexto } from '../types';

interface IDocumento {
    id: string;
    nome: string;
    tipo: 'veiculo' | 'motorista' | 'administrativo';
    entidade: string; // Placa, Nome do Motorista, ou Departamento
    data_emissao: string;
    data_vencimento: string;
    status: 'valido' | 'vencendo' | 'vencido';
    tamanho: string;
}

const MOCK_DOCUMENTOS: IDocumento[] = [
    // Veículos
    { id: 'D001', nome: 'CRLV 2024', tipo: 'veiculo', entidade: 'ABC-1234', data_emissao: '2024-01-15', data_vencimento: '2024-12-31', status: 'valido', tamanho: '2.5 MB' },
    { id: 'D002', nome: 'Seguro Obrigatório', tipo: 'veiculo', entidade: 'XYZ-9876', data_emissao: '2023-11-20', data_vencimento: '2024-11-20', status: 'vencido', tamanho: '1.8 MB' },
    { id: 'D003', nome: 'Laudo de Vistoria', tipo: 'veiculo', entidade: 'DEF-5678', data_emissao: '2024-06-10', data_vencimento: '2024-12-10', status: 'vencendo', tamanho: '3.2 MB' },

    // Motoristas
    { id: 'D004', nome: 'CNH - Categoria D', tipo: 'motorista', entidade: 'João Silva', data_emissao: '2022-05-10', data_vencimento: '2027-05-10', status: 'valido', tamanho: '1.2 MB' },
    { id: 'D005', nome: 'Exame Toxicológico', tipo: 'motorista', entidade: 'Carlos Souza', data_emissao: '2024-01-05', data_vencimento: '2024-12-05', status: 'vencendo', tamanho: '4.5 MB' },

    // Administrativo
    { id: 'D006', nome: 'Alvará de Funcionamento', tipo: 'administrativo', entidade: 'Sede Principal', data_emissao: '2024-01-01', data_vencimento: '2024-12-31', status: 'valido', tamanho: '1.5 MB' },
    { id: 'D007', nome: 'Contrato Social', tipo: 'administrativo', entidade: 'Jurídico', data_emissao: '2020-03-15', data_vencimento: '-', status: 'valido', tamanho: '5.0 MB' },
];

export const Documentos: React.FC = () => {
    const navigate = useNavigate();
    const { currentContext } = useApp();
    const [activeTab, setActiveTab] = useState<'veiculo' | 'motorista' | 'administrativo'>('veiculo');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredDocs = MOCK_DOCUMENTOS.filter(doc => {
        const matchesTab = doc.tipo === activeTab;
        const matchesSearch = doc.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.entidade.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'valido': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'vencendo': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'vencido': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'valido': return <CheckCircle size={14} />;
            case 'vencendo': return <Clock size={14} />;
            case 'vencido': return <AlertTriangle size={14} />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <FileText className="text-blue-600" />
                        Gestão de Documentos
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Central de documentos e arquivos digitais
                    </p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm">
                    <Upload size={18} />
                    <span>Novo Documento</span>
                </button>
            </div>

            {/* Tabs & Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                        <button
                            onClick={() => setActiveTab('veiculo')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'veiculo'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                        >
                            <Truck size={18} />
                            Veículos
                        </button>
                        <button
                            onClick={() => setActiveTab('motorista')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'motorista'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                        >
                            <Users size={18} />
                            Motoristas
                        </button>
                        <button
                            onClick={() => setActiveTab('administrativo')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'administrativo'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                        >
                            <Building size={18} />
                            Administrativo
                        </button>
                    </div>

                    <div className="relative w-full md:w-64">
                        <input
                            type="text"
                            placeholder="Buscar documentos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                        />
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                </div>
            </div>

            {/* Document List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-medium">
                            <tr>
                                <th className="px-6 py-4">Nome do Documento</th>
                                <th className="px-6 py-4">Referência</th>
                                <th className="px-6 py-4">Data Emissão</th>
                                <th className="px-6 py-4">Vencimento</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredDocs.length > 0 ? (
                                filteredDocs.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                                                    <FileText size={16} />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-800 dark:text-white">{doc.nome}</p>
                                                    <p className="text-xs text-slate-500">{doc.tamanho}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                            {doc.entidade}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                            {new Date(doc.data_emissao).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                            {doc.data_vencimento !== '-' ? new Date(doc.data_vencimento).toLocaleDateString('pt-BR') : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                                                {getStatusIcon(doc.status)}
                                                {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="Baixar">
                                                    <Download size={18} />
                                                </button>
                                                <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Excluir">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <FileText size={32} className="text-slate-300 dark:text-slate-600" />
                                            <p>Nenhum documento encontrado nesta categoria.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
