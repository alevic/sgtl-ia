import React, { useState } from 'react';
import {
    MapPin, Globe, Flag, Building, Plus, Search, Edit, Trash2, Save, X, Check
} from 'lucide-react';
import { IPais, IEstado, ICidade, IBairro } from '../types';

// Mock Data
const MOCK_PAISES: IPais[] = [
    { id: '1', nome: 'Brasil', sigla: 'BR', ddi: '+55' },
    { id: '2', nome: 'Argentina', sigla: 'AR', ddi: '+54' },
    { id: '3', nome: 'Paraguai', sigla: 'PY', ddi: '+595' },
    { id: '4', nome: 'Estados Unidos', sigla: 'US', ddi: '+1' },
];

const MOCK_ESTADOS: IEstado[] = [
    { id: '1', nome: 'São Paulo', uf: 'SP', pais_id: '1' },
    { id: '2', nome: 'Rio de Janeiro', uf: 'RJ', pais_id: '1' },
    { id: '3', nome: 'Minas Gerais', uf: 'MG', pais_id: '1' },
    { id: '4', nome: 'Santa Catarina', uf: 'SC', pais_id: '1' },
    { id: '5', nome: 'Buenos Aires', uf: 'BA', pais_id: '2' },
];

const MOCK_CIDADES: ICidade[] = [
    { id: '1', nome: 'São Paulo', estado_id: '1', ibge_code: '3550308' },
    { id: '2', nome: 'Campinas', estado_id: '1', ibge_code: '3509502' },
    { id: '3', nome: 'Rio de Janeiro', estado_id: '2', ibge_code: '3304557' },
    { id: '4', nome: 'Florianópolis', estado_id: '4', ibge_code: '4205407' },
];

const MOCK_BAIRROS: IBairro[] = [
    { id: '1', nome: 'Centro', cidade_id: '1' },
    { id: '2', nome: 'Vila Madalena', cidade_id: '1' },
    { id: '3', nome: 'Copacabana', cidade_id: '3' },
    { id: '4', nome: 'Centro', cidade_id: '4' },
];

type TabType = 'paises' | 'estados' | 'cidades' | 'bairros';

export const CadastrosAuxiliares: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('paises');
    const [busca, setBusca] = useState('');

    // State for data (initialized with mocks)
    const [paises, setPaises] = useState<IPais[]>(MOCK_PAISES);
    const [estados, setEstados] = useState<IEstado[]>(MOCK_ESTADOS);
    const [cidades, setCidades] = useState<ICidade[]>(MOCK_CIDADES);
    const [bairros, setBairros] = useState<IBairro[]>(MOCK_BAIRROS);

    // State for editing/creating
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<any>({});

    const handleEdit = (item: any) => {
        setFormData(item);
        setEditingId(item.id);
        setIsEditing(true);
    };

    const handleNew = () => {
        setFormData({});
        setEditingId(null);
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditingId(null);
        setFormData({});
    };

    const handleSave = () => {
        // Logic to save (simulate backend)
        const newItem = { ...formData, id: editingId || Math.random().toString(36).substr(2, 9) };

        if (activeTab === 'paises') {
            setPaises(prev => editingId ? prev.map(i => i.id === editingId ? newItem : i) : [...prev, newItem]);
        } else if (activeTab === 'estados') {
            setEstados(prev => editingId ? prev.map(i => i.id === editingId ? newItem : i) : [...prev, newItem]);
        } else if (activeTab === 'cidades') {
            setCidades(prev => editingId ? prev.map(i => i.id === editingId ? newItem : i) : [...prev, newItem]);
        } else if (activeTab === 'bairros') {
            setBairros(prev => editingId ? prev.map(i => i.id === editingId ? newItem : i) : [...prev, newItem]);
        }

        handleCancel();
    };

    const handleDelete = (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este item?')) return;

        if (activeTab === 'paises') setPaises(prev => prev.filter(i => i.id !== id));
        else if (activeTab === 'estados') setEstados(prev => prev.filter(i => i.id !== id));
        else if (activeTab === 'cidades') setCidades(prev => prev.filter(i => i.id !== id));
        else if (activeTab === 'bairros') setBairros(prev => prev.filter(i => i.id !== id));
    };

    const renderForm = () => {
        switch (activeTab) {
            case 'paises':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome</label>
                            <input
                                type="text"
                                value={formData.nome || ''}
                                onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sigla</label>
                            <input
                                type="text"
                                value={formData.sigla || ''}
                                onChange={e => setFormData({ ...formData, sigla: e.target.value })}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">DDI</label>
                            <input
                                type="text"
                                value={formData.ddi || ''}
                                onChange={e => setFormData({ ...formData, ddi: e.target.value })}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>
                );
            case 'estados':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome</label>
                            <input
                                type="text"
                                value={formData.nome || ''}
                                onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">UF</label>
                            <input
                                type="text"
                                value={formData.uf || ''}
                                onChange={e => setFormData({ ...formData, uf: e.target.value })}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">País</label>
                            <select
                                value={formData.pais_id || ''}
                                onChange={e => setFormData({ ...formData, pais_id: e.target.value })}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            >
                                <option value="">Selecione...</option>
                                {paises.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                            </select>
                        </div>
                    </div>
                );
            case 'cidades':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome</label>
                            <input
                                type="text"
                                value={formData.nome || ''}
                                onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Código IBGE</label>
                            <input
                                type="text"
                                value={formData.ibge_code || ''}
                                onChange={e => setFormData({ ...formData, ibge_code: e.target.value })}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Estado</label>
                            <select
                                value={formData.estado_id || ''}
                                onChange={e => setFormData({ ...formData, estado_id: e.target.value })}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            >
                                <option value="">Selecione...</option>
                                {estados.map(e => <option key={e.id} value={e.id}>{e.nome} ({e.uf})</option>)}
                            </select>
                        </div>
                    </div>
                );
            case 'bairros':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome</label>
                            <input
                                type="text"
                                value={formData.nome || ''}
                                onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cidade</label>
                            <select
                                value={formData.cidade_id || ''}
                                onChange={e => setFormData({ ...formData, cidade_id: e.target.value })}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            >
                                <option value="">Selecione...</option>
                                {cidades.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                            </select>
                        </div>
                    </div>
                );
        }
    };

    const renderList = () => {
        let data: any[] = [];
        let columns: { key: string, label: string, render?: (item: any) => React.ReactNode }[] = [];

        if (activeTab === 'paises') {
            data = paises;
            columns = [
                { key: 'nome', label: 'Nome' },
                { key: 'sigla', label: 'Sigla' },
                { key: 'ddi', label: 'DDI' },
            ];
        } else if (activeTab === 'estados') {
            data = estados;
            columns = [
                { key: 'nome', label: 'Nome' },
                { key: 'uf', label: 'UF' },
                { key: 'pais_id', label: 'País', render: (item) => paises.find(p => p.id === item.pais_id)?.nome || 'N/A' },
            ];
        } else if (activeTab === 'cidades') {
            data = cidades;
            columns = [
                { key: 'nome', label: 'Nome' },
                { key: 'ibge_code', label: 'IBGE' },
                {
                    key: 'estado_id', label: 'Estado', render: (item) => {
                        const est = estados.find(e => e.id === item.estado_id);
                        return est ? `${est.nome} (${est.uf})` : 'N/A';
                    }
                },
            ];
        } else if (activeTab === 'bairros') {
            data = bairros;
            columns = [
                { key: 'nome', label: 'Nome' },
                { key: 'cidade_id', label: 'Cidade', render: (item) => cidades.find(c => c.id === item.cidade_id)?.nome || 'N/A' },
            ];
        }

        // Filter
        const filteredData = data.filter(item =>
            item.nome.toLowerCase().includes(busca.toLowerCase())
        );

        return (
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                            {columns.map(col => (
                                <th key={col.key} className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
                                    {col.label}
                                </th>
                            ))}
                            <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-300 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + 1} className="p-8 text-center text-slate-500 dark:text-slate-400">
                                    Nenhum registro encontrado.
                                </td>
                            </tr>
                        ) : (
                            filteredData.map(item => (
                                <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    {columns.map(col => (
                                        <td key={col.key} className="p-4 text-sm text-slate-700 dark:text-slate-300">
                                            {col.render ? col.render(item) : item[col.key]}
                                        </td>
                                    ))}
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Cadastros Auxiliares</h1>
                    <p className="text-slate-500 dark:text-slate-400">Gerencie tabelas de apoio do sistema</p>
                </div>
                <button
                    onClick={handleNew}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                    <Plus size={18} />
                    Novo Registro
                </button>
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('paises')}
                        className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'paises'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                    >
                        <Globe size={18} />
                        Países
                    </button>
                    <button
                        onClick={() => setActiveTab('estados')}
                        className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'estados'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                    >
                        <Flag size={18} />
                        Estados
                    </button>
                    <button
                        onClick={() => setActiveTab('cidades')}
                        className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'cidades'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                    >
                        <Building size={18} />
                        Cidades
                    </button>
                    <button
                        onClick={() => setActiveTab('bairros')}
                        className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'bairros'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                    >
                        <MapPin size={18} />
                        Bairros
                    </button>
                </div>

                {/* Toolbar */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <div className="relative max-w-md">
                        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder={`Buscar em ${activeTab}...`}
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Content */}
                {renderList()}
            </div>

            {/* Modal de Edição */}
            {isEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                                {editingId ? 'Editar Registro' : 'Novo Registro'}
                            </h3>
                            <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6">
                            {renderForm()}
                        </div>

                        <div className="flex justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                <Save size={18} />
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
