import React, { useState, useEffect } from 'react';
import { authClient } from '../lib/auth-client';
import { Building2, Plus, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export const Organizacoes: React.FC = () => {
    const [orgs, setOrgs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newOrgName, setNewOrgName] = useState('');
    const [newOrgSlug, setNewOrgSlug] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchOrgs = async () => {
        const { data } = await authClient.organization.list();
        if (data) {
            setOrgs(data);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchOrgs();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        setError('');
        setSuccess('');

        await authClient.organization.create({
            name: newOrgName,
            slug: newOrgSlug,
        }, {
            onSuccess: () => {
                setSuccess('Organização criada com sucesso!');
                setNewOrgName('');
                setNewOrgSlug('');
                fetchOrgs();
                setIsCreating(false);
            },
            onError: (ctx) => {
                setError(ctx.error.message);
                setIsCreating(false);
            }
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Organizações</h1>
                <p className="text-slate-500 dark:text-slate-400">Gerencie as empresas do sistema.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Create Organization Form */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <Plus size={20} className="text-blue-600" />
                        Nova Organização
                    </h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome da Empresa</label>
                            <input
                                type="text"
                                value={newOrgName}
                                onChange={(e) => {
                                    setNewOrgName(e.target.value);
                                    setNewOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                                }}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Ex: JJê Turismo"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Slug (URL)</label>
                            <input
                                type="text"
                                value={newOrgSlug}
                                onChange={(e) => setNewOrgSlug(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 rounded-lg outline-none"
                                placeholder="ex: jje-turismo"
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm rounded-lg flex items-center gap-2">
                                <CheckCircle size={16} />
                                {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isCreating}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {isCreating ? <Loader2 className="animate-spin" size={20} /> : 'Criar Organização'}
                        </button>
                    </form>
                </div>

                {/* List Organizations */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Building2 size={20} className="text-slate-600 dark:text-slate-400" />
                        Empresas Cadastradas
                    </h2>

                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="animate-spin text-slate-400" size={24} />
                        </div>
                    ) : orgs.length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                            <p className="text-slate-500 dark:text-slate-400">Nenhuma organização encontrada.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {orgs.map((org) => (
                                <div key={org.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                                            {org.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-800 dark:text-white">{org.name}</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{org.slug}</p>
                                        </div>
                                    </div>
                                    <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs rounded-full font-medium">
                                        Ativo
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
