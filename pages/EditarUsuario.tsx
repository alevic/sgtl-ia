import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, User, Lock, Settings, Activity, Shield } from 'lucide-react';
import { UserForm } from '../components/User/UserForm';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { CheckCircle2, AlertTriangle } from 'lucide-react';

type TabType = 'perfil' | 'seguranca' | 'preferencias' | 'atividades';

export const EditarUsuario: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { user: currentUser } = useApp();
    const [activeTab, setActiveTab] = useState<TabType>('perfil');
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const isOwnProfile = currentUser?.id === id;
    const isAdmin = currentUser?.role === 'admin';

    const handleSubmit = async (data: any) => {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(data),
        });

        if (response.ok) {
            setSuccess('Dados atualizados com sucesso!');
            setError('');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => setSuccess(''), 5000);
        } else {
            const errorData = await response.json();
            setError(errorData.error || 'Erro ao atualizar usuário');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            throw new Error(errorData.error || 'Erro ao atualizar usuário');
        }
    };

    const tabs = [
        {
            id: 'perfil' as TabType,
            label: 'Perfil',
            icon: User,
            description: 'Dados pessoais e avatar'
        },
        {
            id: 'seguranca' as TabType,
            label: 'Segurança',
            icon: Lock,
            description: 'Senha e autenticação'
        },
        {
            id: 'preferencias' as TabType,
            label: 'Preferências',
            icon: Settings,
            description: 'Configurações e notificações'
        },
        {
            id: 'atividades' as TabType,
            label: 'Atividades',
            icon: Activity,
            description: 'Histórico e logs'
        },
    ];

    return (
        <div key="editar-usuario-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Header Executivo */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <button
                        onClick={() => navigate(isOwnProfile ? '/admin/dashboard' : '/admin/usuarios')}
                        className="group flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                        <span className="text-[12px] font-black uppercase tracking-widest">
                            {isOwnProfile ? 'Painel Principal' : 'Gestão de Operadores'}
                        </span>
                    </button>
                    <div>
                        <h1 className="text-4xl font-black text-foreground tracking-tight">
                            {isOwnProfile ? 'MEU' : 'EDITAR'} <span className="text-primary italic">{isOwnProfile ? 'PERFIL' : 'OPERADOR'}</span>
                        </h1>
                        <p className="text-muted-foreground font-medium mt-1">
                            {isOwnProfile ? 'Configurações de identidade, segurança e preferências operacionais' : 'Sincronização de credenciais e permissões do sistema'}
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro na Operação</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {success && (
                <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 animate-in fade-in slide-in-from-top-2 duration-300">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertTitle>Sucesso</AlertTitle>
                    <AlertDescription>{success}</AlertDescription>
                </Alert>
            )}

            {/* Navigation Tabs Dynamic */}
            <Card className="shadow-2xl shadow-muted/20 bg-card/50 backdrop-blur-sm border border-border/40 rounded-[2.5rem] overflow-hidden">
                <div className="p-2 overflow-x-auto scroller-hidden">
                    <div className="flex gap-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-6 py-4 text-[12px] font-black uppercase tracking-[0.2em] transition-all rounded-2xl ${activeTab === tab.id
                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                    }`}
                            >
                                <tab.icon size={14} strokeWidth={2.5} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Tab Content Architecture */}
            <div className="animate-in fade-in slide-in-from-top-2 duration-500">
                {activeTab === 'perfil' && (
                    <div className="space-y-8">
                        <UserForm
                            mode="edit"
                            userId={id!}
                            onSubmit={handleSubmit}
                            showAvatar={true}
                            showPassword={false}
                            showRole={isAdmin}
                            showNotes={isAdmin}
                            showIsActive={isAdmin}
                            canEditUsername={false}
                            onCancel={() => navigate(isOwnProfile ? '/admin/dashboard' : '/admin/usuarios')}
                        />
                    </div>
                )}

                {activeTab === 'seguranca' && (
                    <Card className="shadow-2xl shadow-muted/20 bg-card/50 backdrop-blur-sm border border-border/40 rounded-[2.5rem] overflow-hidden">
                        <div className="p-8 border-b border-border/50 bg-muted/20 flex items-center justify-between">
                            <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                <Lock size={14} className="text-primary" />
                                Protocolos de Segurança
                            </h3>
                        </div>
                        <div className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[12px] font-black uppercase tracking-widest text-muted-foreground ml-1">Senha Atual</label>
                                        <input
                                            type="password"
                                            className="w-full h-14 px-4 bg-muted/40 border border-border/50 rounded-2xl font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[12px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nova Senha</label>
                                        <input
                                            type="password"
                                            className="w-full h-14 px-4 bg-muted/40 border border-border/50 rounded-2xl font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                                            placeholder="Mínimo 8 caracteres"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[12px] font-black uppercase tracking-widest text-muted-foreground ml-1">Confirmar Nova Senha</label>
                                        <input
                                            type="password"
                                            className="w-full h-14 px-4 bg-muted/40 border border-border/50 rounded-2xl font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                                            placeholder="Repita a nova senha"
                                        />
                                    </div>
                                    <Button className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-black uppercase text-[12px] tracking-widest shadow-lg shadow-primary/20">
                                        Atualizar Senha de Acesso
                                    </Button>
                                </div>

                                <div className="p-8 bg-muted/20 border border-dashed border-border/50 rounded-[2rem] flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="w-16 h-16 bg-muted border border-border/40 rounded-full flex items-center justify-center text-muted-foreground">
                                        <Shield size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-[12px] font-black uppercase tracking-widest text-foreground">Autenticação em Duas Etapas</h4>
                                        <p className="text-[9px] font-bold text-muted-foreground mt-1 uppercase leading-tight">Módulo de segurança avançada em fase de implementação</p>
                                    </div>
                                    <Button variant="outline" disabled className="rounded-xl h-10 px-6 opacity-40">Em breve</Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {activeTab === 'preferencias' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="shadow-2xl shadow-muted/20 bg-card/50 backdrop-blur-sm border border-border/40 rounded-[2.5rem] overflow-hidden">
                            <div className="p-8 border-b border-border/50 bg-muted/20">
                                <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground">Centro de Notificações</h3>
                            </div>
                            <div className="p-8 space-y-4">
                                {[
                                    { label: 'Alertas de Email', desc: 'Relatórios diários e alertas críticos' },
                                    { label: 'Notificações Push', desc: 'Alertas instantâneos no navegador' },
                                    { label: 'Logs de Viagem', desc: 'Atualizações em tempo real de rotas' },
                                ].map((pref, idx) => (
                                    <label key={idx} className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-border/40 cursor-pointer hover:bg-muted/30 transition-colors">
                                        <div>
                                            <p className="text-[12px] font-black uppercase tracking-widest text-foreground">{pref.label}</p>
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase">{pref.desc}</p>
                                        </div>
                                        <input type="checkbox" className="w-5 h-5 rounded-lg border-border/60 text-primary focus:ring-primary/20" defaultChecked />
                                    </label>
                                ))}
                            </div>
                        </Card>

                        <Card className="shadow-2xl shadow-muted/20 bg-card/50 backdrop-blur-sm border border-border/40 rounded-[2.5rem] overflow-hidden flex flex-col items-center justify-center p-8 text-center space-y-6">
                            <div className="w-20 h-20 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center">
                                <Settings size={32} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-foreground">Interface e Tema</h3>
                                <p className="text-[9px] font-bold text-muted-foreground mt-2 uppercase">A personalização de tema individual está sendo migrada para a arquitetura global.</p>
                            </div>
                            <Button variant="outline" disabled className="rounded-2xl h-14 px-8">Configurações Globais</Button>
                        </Card>
                    </div>
                )}

                {activeTab === 'atividades' && (
                    <Card className="shadow-2xl shadow-muted/20 bg-card/50 backdrop-blur-sm border border-border/40 rounded-[2.5rem] overflow-hidden">
                        <div className="p-20 flex flex-col items-center justify-center space-y-6 text-center">
                            <div className="w-24 h-24 bg-muted/40 rounded-[2.5rem] flex items-center justify-center text-muted-foreground/30">
                                <Activity size={48} strokeWidth={1} />
                            </div>
                            <div className="max-w-sm">
                                <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-foreground">Timeline de Operações</h3>
                                <p className="text-[9px] font-bold text-muted-foreground mt-2 uppercase leading-relaxed">
                                    O histórico detalhado de interações deste operador está sendo indexado para o novo módulo de auditoria.
                                </p>
                            </div>
                            <Button variant="outline" onClick={() => window.location.reload()} className="h-14 px-8 rounded-2xl border-border/40 font-semibold uppercase text-[12px] tracking-widest">
                                Sincronizar Timeline
                            </Button>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};
