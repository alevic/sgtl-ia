import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MapPin, Flag, Building, Plus, Search, Edit, Trash2, Save, X, Tag, AlertCircle, CheckCircle2, ArrowLeft, Layers
} from 'lucide-react';
import { IEstado, ICidade, IBairro, ITag, ICostCenter, IFinanceCategory, TipoTransacao } from '@/types';
import { tripsService } from '../services/tripsService';
import { locationService } from '../services/locationService';
import { financeAuxService } from '../services/financeAuxService';
import { PageHeader } from '../components/Layout/PageHeader';
import { ListFilterSection } from '../components/Layout/ListFilterSection';
import { cn } from '../lib/utils';
import { Input } from '../components/ui/input';
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

type TabType = 'estados' | 'cidades' | 'bairros' | 'tags' | 'centros-custo' | 'categorias';

export const CadastrosAuxiliares: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('centros-custo');
    const [busca, setBusca] = useState('');

    // State for data
    const [estados, setEstados] = useState<IEstado[]>([]);
    const [cidades, setCidades] = useState<ICidade[]>([]);
    const [bairros, setBairros] = useState<IBairro[]>([]);
    const [tags, setTags] = useState<ITag[]>([]);
    const [costCenters, setCostCenters] = useState<ICostCenter[]>([]);
    const [categories, setCategories] = useState<IFinanceCategory[]>([]);

    // State for editing/creating
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Fetch data on mount and tab change
    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'estados') {
                const data = await locationService.getStates();
                setEstados(data.map(s => ({
                    id: s.id.toString(),
                    nome: s.name,
                    uf: s.uf,
                    pais_id: '1' // Brasil
                })));
            } else if (activeTab === 'cidades') {
                // Load all cities
                const states = await locationService.getStates();
                const allCities: ICidade[] = [];
                for (const state of states) {
                    const cities = await locationService.getCities(state.id);
                    allCities.push(...cities.map(c => ({
                        id: c.id.toString(),
                        nome: c.name,
                        estado_id: c.state_id.toString(),
                        ibge_code: ''
                    })));
                }
                setCidades(allCities);
                // Also load states for the dropdown
                setEstados(states.map(s => ({
                    id: s.id.toString(),
                    nome: s.name,
                    uf: s.uf,
                    pais_id: '1'
                })));
            } else if (activeTab === 'bairros') {
                // Load all neighborhoods
                const states = await locationService.getStates();
                const allCities: ICidade[] = [];
                const allNeighborhoods: IBairro[] = [];
                for (const state of states) {
                    const cities = await locationService.getCities(state.id);
                    allCities.push(...cities.map(c => ({
                        id: c.id.toString(),
                        nome: c.name,
                        estado_id: c.state_id.toString(),
                        ibge_code: ''
                    })));
                    for (const city of cities) {
                        const neighborhoods = await locationService.getNeighborhoods(city.id);
                        allNeighborhoods.push(...neighborhoods.map(n => ({
                            id: n.id.toString(),
                            nome: n.name,
                            cidade_id: n.city_id.toString()
                        })));
                    }
                }
                setBairros(allNeighborhoods);
                setCidades(allCities);
            } else if (activeTab === 'tags') {
                const data = await tripsService.getTags();
                setTags(data);
            } else if (activeTab === 'centros-custo') {
                const data = await financeAuxService.getCostCenters();
                setCostCenters(data);
            } else if (activeTab === 'categorias') {
                const [cats, centers] = await Promise.all([
                    financeAuxService.getCategories(),
                    financeAuxService.getCostCenters()
                ]);
                setCategories(cats);
                setCostCenters(centers);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            setError('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

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

    const handleSave = async () => {
        setError(null);
        setSuccess(null);
        try {
            if (activeTab === 'estados') {
                setError('Estados são dados do sistema e não podem ser editados.');
                return;
            } else if (activeTab === 'cidades') {
                if (editingId) {
                    await locationService.updateCity(parseInt(editingId), formData.nome);
                } else {
                    if (!formData.estado_id) {
                        setError('Selecione um estado');
                        return;
                    }
                    await locationService.createCity(formData.nome, parseInt(formData.estado_id));
                }
            } else if (activeTab === 'bairros') {
                if (editingId) {
                    await locationService.updateNeighborhood(parseInt(editingId), formData.nome);
                } else {
                    if (!formData.cidade_id) {
                        setError('Selecione uma cidade');
                        return;
                    }
                    await locationService.createNeighborhood(formData.nome, parseInt(formData.cidade_id));
                }
            } else if (activeTab === 'tags') {
                if (editingId) {
                    await tripsService.updateTag(editingId, { nome: formData.nome, cor: formData.cor });
                } else {
                    await tripsService.createTag({ nome: formData.nome, cor: formData.cor });
                }
            } else if (activeTab === 'centros-custo') {
                if (editingId) {
                    await financeAuxService.updateCostCenter(editingId, { name: formData.name, description: formData.description });
                } else {
                    await financeAuxService.createCostCenter({ name: formData.name, description: formData.description });
                }
            } else if (activeTab === 'categorias') {
                if (editingId) {
                    setError('Edição de categorias ainda não suportada via Cadastros Auxiliares. Exclua e crie uma nova.');
                    return;
                } else {
                    if (!formData.cost_center_id || !formData.type) {
                        setError('Selecione um centro de custo e um tipo');
                        return;
                    }
                    await financeAuxService.createCategory({
                        name: formData.name,
                        type: formData.type,
                        cost_center_id: formData.cost_center_id
                    });
                }
            }
            setSuccess('Registro salvo com sucesso!');
            handleCancel();
            await loadData();
        } catch (error) {
            console.error('Error saving:', error);
            setError('Erro ao salvar');
        }
    };

    const handleDelete = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        const id = deleteId;
        setDeleteId(null);
        setError(null);

        try {
            if (activeTab === 'estados') {
                setError('Estados são dados do sistema e não podem ser excluídos.');
                return;
            } else if (activeTab === 'cidades') {
                await locationService.deleteCity(parseInt(id));
            } else if (activeTab === 'bairros') {
                await locationService.deleteNeighborhood(parseInt(id));
            } else if (activeTab === 'tags') {
                await tripsService.deleteTag(id);
            } else if (activeTab === 'centros-custo') {
                await financeAuxService.deleteCostCenter(id);
            } else if (activeTab === 'categorias') {
                await financeAuxService.deleteCategory(id);
            }
            setSuccess('Excluído com sucesso');
            await loadData();
        } catch (error) {
            console.error('Error deleting:', error);
            setError('Erro ao excluir. Verifique se não existem dependências.');
        }
    };

    const renderForm = () => {
        switch (activeTab) {
            case 'estados':
                return (
                    <div className="p-4 text-center text-slate-500">
                        Estados são dados do sistema e não podem ser editados.
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
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Estado</label>
                            <select
                                value={formData.estado_id || ''}
                                onChange={e => setFormData({ ...formData, estado_id: e.target.value })}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                disabled={!!editingId}
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
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cidade</label>
                            <select
                                value={formData.cidade_id || ''}
                                onChange={e => setFormData({ ...formData, cidade_id: e.target.value })}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                disabled={!!editingId}
                            >
                                <option value="">Selecione...</option>
                                {cidades.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                            </select>
                        </div>
                    </div>
                );
            case 'tags':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome da Tag</label>
                            <input
                                type="text"
                                value={formData.nome || ''}
                                onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                placeholder="Ex: Turismo"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cor (Opcional)</label>
                            <input
                                type="color"
                                value={formData.cor || '#3b82f6'}
                                onChange={e => setFormData({ ...formData, cor: e.target.value })}
                                className="w-full h-10 p-1 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800"
                            />
                        </div>
                    </div>
                );
            case 'centros-custo':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do Centro de Custo</label>
                            <input
                                type="text"
                                value={formData.name || ''}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                placeholder="Ex: Manutenção e Oficina"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
                            <textarea
                                value={formData.description || ''}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                rows={3}
                                placeholder="Finalidade deste centro de custo..."
                            />
                        </div>
                    </div>
                );
            case 'categorias':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome da Categoria Financeira</label>
                            <input
                                type="text"
                                value={formData.name || ''}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                placeholder="Ex: Diesel S10"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Centro de Custo</label>
                            <select
                                value={formData.cost_center_id || ''}
                                onChange={e => setFormData({ ...formData, cost_center_id: e.target.value })}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            >
                                <option value="">Selecione...</option>
                                {costCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo de Fluxo</label>
                            <select
                                value={formData.type || ''}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            >
                                <option value="">Selecione...</option>
                                <option value={TipoTransacao.INCOME}>RECEITA (+)</option>
                                <option value={TipoTransacao.EXPENSE}>DESPESA (-)</option>
                            </select>
                        </div>
                    </div>
                );
        }
    };

    const renderList = () => {
        let data: any[] = [];
        let columns: { key: string, label: string, render?: (item: any) => React.ReactNode }[] = [];

        if (activeTab === 'estados') {
            data = estados;
            columns = [
                { key: 'nome', label: 'Nome' },
                { key: 'uf', label: 'UF' },
            ];
        } else if (activeTab === 'cidades') {
            data = cidades;
            columns = [
                { key: 'nome', label: 'Nome' },
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
        } else if (activeTab === 'tags') {
            data = tags;
            columns = [
                {
                    key: 'nome',
                    label: 'Tag',
                    render: (item) => (
                        <div className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: item.cor || '#3b82f6' }}
                            />
                            <span className="font-medium">{item.nome}</span>
                        </div>
                    )
                },
                { key: 'cor', label: 'Código da Cor' },
            ];
        } else if (activeTab === 'centros-custo') {
            data = costCenters;
            columns = [
                { key: 'name', label: 'Nome' },
                { key: 'description', label: 'Descrição' },
            ];
        } else if (activeTab === 'categorias') {
            data = categories;
            columns = [
                { key: 'name', label: 'Nome' },
                {
                    key: 'type', label: 'Tipo', render: (item) => (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${item.type === TipoTransacao.INCOME ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {item.type === TipoTransacao.INCOME ? 'Receita' : 'Despesa'}
                        </span>
                    )
                },
                {
                    key: 'cost_center_id', label: 'Centro de Custo', render: (item) => {
                        const cc = costCenters.find(c => c.id === item.cost_center_id);
                        return cc ? cc.name : 'N/A';
                    }
                },
            ];
        }

        // Filter
        const filteredData = data.filter(item => {
            const searchVal = busca.toLowerCase();
            if (activeTab === 'centros-custo') return item.name.toLowerCase().includes(searchVal);
            if (activeTab === 'categorias') return item.name.toLowerCase().includes(searchVal);
            return item.nome.toLowerCase().includes(searchVal);
        });

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
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length + 1} className="p-8 text-center text-slate-500 dark:text-slate-400">
                                    Carregando...
                                </td>
                            </tr>
                        ) : filteredData.length === 0 ? (
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
                                            {activeTab !== 'estados' && (
                                                <>
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-sm transition-colors"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-sm transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </>
                                            )}
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
        <div key="cadastros-aux-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Registro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {error && (
                <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            {success && (
                <Alert className="border-emerald-500 text-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 animate-in fade-in slide-in-from-top-2 duration-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <AlertTitle>Sucesso</AlertTitle>
                    <AlertDescription>{success}</AlertDescription>
                </Alert>
            )}
            {/* Header Module */}
            <PageHeader
                title="Cadastros Auxiliares"
                subtitle="Manutenção de tabelas básicas, parâmetros territoriais e categorização do ecossistema"
                icon={Layers}
                backLink="/admin"
                backLabel="Painel Administrativo"
                rightElement={
                    activeTab !== 'estados' && (
                        <Button
                            onClick={handleNew}
                            className="h-14 rounded-sm px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[12px] tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Plus className="w-4 h-4 mr-2" strokeWidth={3} />
                            Novo Registro
                        </Button>
                    )
                }
            />

            {/* Navigation Tabs Module */}
            <div className="flex bg-muted p-1.5 rounded-sm border border-border/50 h-16 w-full lg:w-fit gap-2 overflow-x-auto scroller-hidden">
                {[
                    { id: 'centros-custo', label: 'Centros de Custo', icon: Layers },
                    { id: 'categorias', label: 'Categorizações Fin.', icon: Tag },
                    { id: 'tags', label: 'Tags Operacionais', icon: CheckCircle2 },
                    { id: 'estados', label: 'Territórios', icon: Flag },
                    { id: 'cidades', label: 'Cidades', icon: Building },
                    { id: 'bairros', label: 'Bairros', icon: MapPin },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={cn(
                            "flex items-center gap-2.5 px-6 h-full text-[10px] font-black uppercase tracking-widest transition-all rounded-sm whitespace-nowrap",
                            activeTab === tab.id
                                ? "bg-background text-primary shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                    >
                        <tab.icon size={14} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Search Module */}
            <ListFilterSection>
                <div className="relative group flex-1">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder={`Pesquisar em ${activeTab}...`}
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        className="w-full h-14 pl-12 bg-muted border-input rounded-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-primary/20 text-xs tracking-tight"
                    />
                </div>
            </ListFilterSection>

            {/* Content Table Executive */}
            <Card className="shadow-2xl shadow-muted/20 bg-card   border border-border/40 rounded-[2.5rem] overflow-hidden">
                <div className="overflow-x-auto">
                    {renderList()}
                </div>
            </Card>

            {/* Modal de Edição Executivo */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/60   flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-2xl bg-card border border-border/40 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-border/50 bg-muted flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-sm text-primary font-black uppercase text-xs">
                                    {editingId ? 'EDT' : 'NEW'}
                                </div>
                                <h2 className="text-sm font-black uppercase tracking-widest text-foreground">
                                    {editingId ? 'Editar' : 'Novo'} Registro no Módulo {activeTab}
                                </h2>
                            </div>
                            <button onClick={handleCancel} className="p-2 hover:bg-muted rounded-sm transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8">
                            {renderForm()}
                            <div className="flex gap-4 mt-8 pt-8 border-t border-border/50">
                                <Button
                                    variant="outline"
                                    onClick={handleCancel}
                                    className="flex-1 h-14 rounded-sm border-border/40 font-black uppercase text-[12px] tracking-widest"
                                >
                                    Cancelar Operação
                                </Button>
                                {activeTab !== 'estados' && (
                                    <Button
                                        onClick={handleSave}
                                        className="flex-1 h-14 rounded-sm bg-primary text-primary-foreground font-black uppercase text-[12px] tracking-widest shadow-lg shadow-primary/20"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        Salvar Alterações
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};
