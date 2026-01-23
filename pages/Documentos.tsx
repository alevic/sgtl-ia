import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText, Search, Filter, Download, Upload, Trash2,
    AlertTriangle, CheckCircle, Clock,
    Truck, Users, Building, ArrowLeft
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EmpresaContexto } from '../types';
import { ResponsiveActions, ActionItem } from '../components/Common/ResponsiveActions';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

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
        <div key="documentos-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Header Executivo */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <button
                        onClick={() => navigate('/admin')}
                        className="group flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                        <span className="text-[12px] font-black uppercase tracking-widest">Painel Administrativo</span>
                    </button>
                    <div>
                        <h1 className="text-4xl font-black text-foreground tracking-tight">
                            GESTÃO DE <span className="text-primary italic">DOCUMENTOS</span>
                        </h1>
                        <p className="text-muted-foreground font-medium mt-1">
                            Central de custódia e controle de validades de arquivos digitais
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => { }}
                        className="h-14 rounded-2xl px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[12px] tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        Novo Documento
                    </Button>
                </div>
            </div>

            {/* Tabs & Filters */}
            <Card className="shadow-2xl shadow-muted/20 bg-card/50 backdrop-blur-sm border border-border/40 rounded-[2rem] overflow-hidden">
                <div className="p-4 flex flex-col md:flex-row justify-between gap-6">
                    <div className="flex border-b border-border/50 md:border-none">
                        <button
                            onClick={() => setActiveTab('veiculo')}
                            className={`flex items-center gap-3 px-6 py-4 text-[12px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${activeTab === 'veiculo'
                                ? 'border-primary text-primary bg-primary/5'
                                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
                                }`}
                        >
                            <Truck size={14} />
                            Veículos
                        </button>
                        <button
                            onClick={() => setActiveTab('motorista')}
                            className={`flex items-center gap-3 px-6 py-4 text-[12px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${activeTab === 'motorista'
                                ? 'border-primary text-primary bg-primary/5'
                                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
                                }`}
                        >
                            <Users size={14} />
                            Motoristas
                        </button>
                        <button
                            onClick={() => setActiveTab('administrativo')}
                            className={`flex items-center gap-3 px-6 py-4 text-[12px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${activeTab === 'administrativo'
                                ? 'border-primary text-primary bg-primary/5'
                                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
                                }`}
                        >
                            <Building size={14} />
                            Empresa
                        </button>
                    </div>

                    <div className="flex items-center gap-4 px-4 pb-4 md:pb-0">
                        <div className="relative w-full md:w-80 group">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Filtrar por nome ou entidade..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full h-14 pl-12 pr-4 bg-muted/40 border border-border/50 rounded-2xl font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none text-xs"
                            />
                        </div>
                    </div>
                </div>
            </Card>

            {/* Document List */}
            <Card className="shadow-2xl shadow-muted/20 bg-card/50 backdrop-blur-sm border border-border/40 rounded-[2.5rem] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-muted/20 border-b border-border/50">
                            <tr>
                                <th className="px-8 py-6 text-[12px] font-black uppercase tracking-widest text-muted-foreground">Documento</th>
                                <th className="px-8 py-6 text-[12px] font-black uppercase tracking-widest text-muted-foreground">Entidade</th>
                                <th className="px-8 py-6 text-[12px] font-black uppercase tracking-widest text-muted-foreground">Emissão</th>
                                <th className="px-8 py-6 text-[12px] font-black uppercase tracking-widest text-muted-foreground">Vencimento</th>
                                <th className="px-8 py-6 text-[12px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                                <th className="px-8 py-6 text-right text-[12px] font-black uppercase tracking-widest text-muted-foreground">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {filteredDocs.length > 0 ? (
                                filteredDocs.map((doc) => (
                                    <tr key={doc.id} className="group hover:bg-muted/30 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                    <FileText size={18} strokeWidth={2.5} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-xs uppercase tracking-tight text-foreground">{doc.nome}</p>
                                                    <p className="text-[12px] font-bold text-muted-foreground uppercase opacity-60 tracking-widest mt-0.5">{doc.tamanho}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-[12px] font-black uppercase tracking-widest text-muted-foreground">{doc.entidade}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-xs font-bold text-foreground">
                                                {new Date(doc.data_emissao).toLocaleDateString('pt-BR')}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-xs font-bold text-foreground">
                                                {doc.data_vencimento !== '-' ? new Date(doc.data_vencimento).toLocaleDateString('pt-BR') : '-'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusColor(doc.status)}`}>
                                                {getStatusIcon(doc.status)}
                                                {doc.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-2 bg-muted/50 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all rounded-xl">
                                                    <Download size={16} strokeWidth={2.5} />
                                                </button>
                                                <button className="p-2 bg-muted/50 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all rounded-xl">
                                                    <Trash2 size={16} strokeWidth={2.5} />
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
                                            <p className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground">Nenhum documento encontrado nesta categoria.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};
