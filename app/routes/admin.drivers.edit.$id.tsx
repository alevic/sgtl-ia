import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Save, User, FileText, Globe, AlertTriangle, Phone, MapPin, Calendar, Briefcase, Loader, CheckCircle2, Mail, CheckCircle } from 'lucide-react';
import { DatePicker } from '@/components/Form/DatePicker';
import { authClient } from '../lib/auth-client';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/Layout/PageHeader';
import { FormSection } from '../components/Layout/FormSection';
import { cn } from '../lib/utils';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { DriverStatus } from '../types';

export const EditarMotorista: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Dados Pessoais
    const [nome, setNome] = useState('');
    const [status, setStatus] = useState<DriverStatus>(DriverStatus.AVAILABLE);

    // Documentação
    const [cnh, setCnh] = useState('');
    const [categoriaCnh, setCategoriaCnh] = useState('D');
    const [validadeCnh, setValidadeCnh] = useState('');
    const [passaporte, setPassaporte] = useState('');
    const [validadePassaporte, setValidadePassaporte] = useState('');

    // Contatos
    const [telefone, setTelefone] = useState('');
    const [email, setEmail] = useState('');
    const [telefoneEmergencia, setTelefoneEmergencia] = useState('');
    const [contatoEmergenciaNome, setContatoEmergenciaNome] = useState('');
    const [contatoEmergenciaRelacao, setContatoEmergenciaRelacao] = useState('');

    // Endereço
    const [endereco, setEndereco] = useState('');
    const [cidade, setCidade] = useState('');
    const [estado, setEstado] = useState('');
    const [cep, setCep] = useState('');
    const [pais, setPais] = useState('Brasil');

    // Escalas e Gestão
    const [dataAdmissao, setDataAdmissao] = useState('');
    const [jornadaTrabalho, setJornadaTrabalho] = useState<'DIURNA' | 'NOTURNA' | 'MISTA' | 'FLEXIVEL'>('DIURNA');
    const [horasSemanais, setHorasSemanais] = useState('44');
    const [disponivelViagensLongas, setDisponivelViagensLongas] = useState(true);
    const [disponivelInternacional, setDisponivelInternacional] = useState(false);

    // Observações
    const [observacoes, setObservacoes] = useState('');
    const [isSearchingCep, setIsSearchingCep] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchMotorista = async () => {
            if (!id) return;

            setIsFetching(true);
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/fleet/drivers/${id}`, {
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch driver');
                }

                const data = await response.json();

                // Populate form
                setNome(data.nome || '');
                setStatus(data.status || DriverStatus.AVAILABLE);
                setCnh(data.cnh || '');
                setCategoriaCnh(data.categoria_cnh || 'D');
                setValidadeCnh(data.validade_cnh ? data.validade_cnh.split('T')[0] : '');
                setPassaporte(data.passaporte || '');
                setValidadePassaporte(data.validade_passaporte ? data.validade_passaporte.split('T')[0] : '');
                setTelefone(data.telefone || '');
                setEmail(data.email || '');
                setEndereco(data.endereco || '');
                setCidade(data.cidade || '');
                setEstado(data.estado || '');
                setPais(data.pais || 'Brasil');
                setDataAdmissao(data.data_contratacao ? data.data_contratacao.split('T')[0] : '');
                setDisponivelInternacional(data.disponivel_internacional || false);
                setObservacoes(data.observacoes || '');

            } catch (error) {
                console.error("Erro ao buscar motorista:", error);
                setError('Erro ao carregar motorista. Redirecionando...');
                setTimeout(() => navigate('/admin/motoristas'), 2000);
            } finally {
                setIsFetching(false);
            }
        };

        fetchMotorista();
    }, [id, navigate]);

    const verificarValidade = (dataValidade: string): { texto: string; cor: string } | null => {
        if (!dataValidade) return null;

        const hoje = new Date();
        const validade = new Date(dataValidade);
        const diasRestantes = Math.floor((validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

        if (diasRestantes < 0) return { texto: 'Vencido', cor: 'red' };
        if (diasRestantes < 30) return { texto: `Vence em ${diasRestantes} dias`, cor: 'orange' };
        return { texto: 'Válido', cor: 'green' };
    };

    const cnhValidade = verificarValidade(validadeCnh);
    const passaporteValidadeInfo = verificarValidade(validadePassaporte);

    const handleSalvar = async () => {
        setError('');
        setSuccess('');

        // Validações básicas
        if (!nome.trim()) {
            setError('Nome é obrigatório');
            return;
        }
        if (!cnh.trim()) {
            setError('Número da CNH é obrigatório');
            return;
        }
        if (!validadeCnh) {
            setError('Validade da CNH é obrigatória');
            return;
        }

        setIsLoading(true);

        try {
            const driverData = {
                nome,
                cnh,
                categoria_cnh: categoriaCnh,
                validade_cnh: validadeCnh,
                passaporte: passaporte || null,
                validade_passaporte: validadePassaporte || null,
                telefone: telefone || null,
                email: email || null,
                endereco: endereco || null,
                cidade: cidade || null,
                estado: estado || null,
                pais: pais || null,
                status,
                data_contratacao: dataAdmissao || new Date().toISOString().split('T')[0],
                disponivel_internacional: disponivelInternacional,
                observacoes: observacoes || null
            };

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/fleet/drivers/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(driverData)
            });

            if (!response.ok) {
                throw new Error('Failed to update driver');
            }

            setSuccess(`Motorista ${nome} atualizado com sucesso!`);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => navigate(`/admin/motoristas/${id}`), 2000);
        } catch (error) {
            console.error("Erro ao atualizar motorista:", error);
            setError('Erro ao atualizar motorista. Por favor, tente novamente.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawCep = e.target.value.replace(/\D/g, '');
        setCep(rawCep);

        if (rawCep.length === 8) {
            setIsSearchingCep(true);
            try {
                const response = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
                const data = await response.json();

                if (!data.erro) {
                    // Preenche campos se encontrados
                    if (data.logradouro) setEndereco(data.logradouro);
                    if (data.localidade) setCidade(data.localidade);
                    if (data.uf) setEstado(data.uf);
                }
            } catch (err) {
                console.error("Erro ao buscar CEP:", err);
            } finally {
                setIsSearchingCep(false);
            }
        }
    };

    if (isFetching) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-slate-500 dark:text-slate-400">Carregando motorista...</p>
            </div>
        );
    }

    return (
        <div key="editar-motorista-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Header Module */}
            <PageHeader
                title="Editar Registro"
                subtitle={`Atualizando credenciais de: ${nome || '...'}`}
                suffix="MOTORISTA"
                icon={User}
                backLink={`/admin/motoristas/${id}`}
                backLabel="Painel do Motorista"
                rightElement={
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => navigate(`/admin/motoristas/${id}`)}
                            className="h-14 rounded-2xl px-6 font-black uppercase text-[12px] tracking-widest"
                        >
                            Descartar
                        </Button>
                        <Button
                            onClick={handleSalvar}
                            disabled={isLoading}
                            className="h-14 rounded-2xl px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[12px] tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {isLoading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            {isLoading ? 'Sincronizando...' : 'Salvar Alterações'}
                        </Button>
                    </div>
                }
            />

            {error && (
                <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2 duration-300 rounded-3xl border-destructive/20 bg-destructive/5 backdrop-blur-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="font-black uppercase text-[12px] tracking-widest">Erro na Atualização</AlertTitle>
                    <AlertDescription className="text-xs font-medium">
                        {error}
                    </AlertDescription>
                </Alert>
            )}

            {success && (
                <Alert className="animate-in fade-in slide-in-from-top-2 duration-300 rounded-3xl border-emerald-500/20 bg-emerald-500/5 backdrop-blur-sm">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <AlertTitle className="font-black uppercase text-[12px] tracking-widest text-emerald-500">Sucesso</AlertTitle>
                    <AlertDescription className="text-xs font-medium text-emerald-600/80">
                        {success}
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Coluna Principal */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Dados Pessoais */}
                    <FormSection
                        title="Identificação e Perfil"
                        icon={User}
                    >
                        <div className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Nome Completo *</label>
                                <input
                                    type="text"
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                    placeholder="Ex: Carlos Alberto Silva"
                                    className="w-full h-14 px-4 bg-muted/40 border border-border/50 rounded-xl font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Status Operacional</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value as DriverStatus)}
                                        className="w-full h-14 px-4 bg-muted/40 border border-border/50 rounded-xl font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
                                    >
                                        <option value={DriverStatus.AVAILABLE}>Disponível</option>
                                        <option value={DriverStatus.IN_TRANSIT}>Em Viagem</option>
                                        <option value={DriverStatus.ON_LEAVE}>Férias</option>
                                        <option value={DriverStatus.AWAY}>Afastado</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Email Corporativo</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="motorista@email.com"
                                            className="w-full h-14 pl-12 pr-4 bg-muted/40 border border-border/50 rounded-xl font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </FormSection>

                    {/* Endereço */}
                    <FormSection
                        title="Residência e Localização"
                        icon={MapPin}
                    >
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-1.5 md:col-span-1">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">CEP</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={cep}
                                            onChange={handleCepChange}
                                            placeholder="00000000"
                                            maxLength={8}
                                            className="w-full h-14 px-4 bg-muted/40 border border-border/50 rounded-xl font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                                        />
                                        {isSearchingCep && <Loader className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />}
                                    </div>
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Logradouro / Endereço</label>
                                    <input
                                        type="text"
                                        value={endereco}
                                        onChange={(e) => setEndereco(e.target.value)}
                                        placeholder="Rua, número, complemento"
                                        className="w-full h-14 px-4 bg-muted/40 border border-border/50 rounded-xl font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Cidade</label>
                                    <input
                                        type="text"
                                        value={cidade}
                                        onChange={(e) => setCidade(e.target.value)}
                                        className="w-full h-14 px-4 bg-muted/40 border border-border/50 rounded-xl font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Estado (UF)</label>
                                    <input
                                        type="text"
                                        value={estado}
                                        onChange={(e) => setEstado(e.target.value.toUpperCase())}
                                        maxLength={2}
                                        className="w-full h-14 px-4 bg-muted/40 border border-border/50 rounded-xl font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none font-sans"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">País</label>
                                    <input
                                        type="text"
                                        value={pais}
                                        onChange={(e) => setPais(e.target.value)}
                                        className="w-full h-14 px-4 bg-muted/40 border border-border/50 rounded-xl font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </FormSection>

                    {/* Escalas e Gestão */}
                    <FormSection
                        title="Gestão e Disponibilidade"
                        icon={Briefcase}
                    >
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Data de Admissão</label>
                                    <DatePicker
                                        value={dataAdmissao}
                                        onChange={setDataAdmissao}
                                        placeholder="DD/MM/AAAA"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Jornada de Trabalho</label>
                                    <select
                                        value={jornadaTrabalho}
                                        onChange={(e) => setJornadaTrabalho(e.target.value as typeof jornadaTrabalho)}
                                        className="w-full h-14 px-4 bg-muted/40 border border-border/50 rounded-xl font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
                                    >
                                        <option value="DIURNA">Diurna</option>
                                        <option value="NOTURNA">Noturna</option>
                                        <option value="MISTA">Mista</option>
                                        <option value="FLEXIVEL">Flexível</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Horas Semanais</label>
                                    <input
                                        type="number"
                                        value={horasSemanais}
                                        onChange={(e) => setHorasSemanais(e.target.value)}
                                        min="1"
                                        max="60"
                                        className="w-full h-14 px-4 bg-muted/40 border border-border/50 rounded-xl font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                                <div className="flex flex-col gap-3 pb-2">
                                    <label className="flex items-center gap-3 group cursor-pointer">
                                        <div className={cn(
                                            "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                                            disponivelViagensLongas ? "bg-primary border-primary" : "border-border group-hover:border-primary/50"
                                        )}>
                                            <input
                                                type="checkbox"
                                                checked={disponivelViagensLongas}
                                                onChange={(e) => setDisponivelViagensLongas(e.target.checked)}
                                                className="hidden"
                                            />
                                            {disponivelViagensLongas && <CheckCircle className="w-4 h-4 text-primary-foreground" />}
                                        </div>
                                        <span className="text-[13px] font-bold text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-tight">Viagens Longas</span>
                                    </label>
                                    <label className="flex items-center gap-3 group cursor-pointer">
                                        <div className={cn(
                                            "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                                            disponivelInternacional ? "bg-primary border-primary" : "border-border group-hover:border-primary/50"
                                        )}>
                                            <input
                                                type="checkbox"
                                                checked={disponivelInternacional}
                                                onChange={(e) => setDisponivelInternacional(e.target.checked)}
                                                className="hidden"
                                            />
                                            {disponivelInternacional && <CheckCircle className="w-4 h-4 text-primary-foreground" />}
                                        </div>
                                        <span className="text-[13px] font-bold text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-tight">Viagens Internacionais</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </FormSection>
                </div>

                {/* Coluna Lateral */}
                <div className="space-y-8">
                    {/* Habilitação */}
                    <FormSection
                        title="Habilitação (CNH)"
                        icon={FileText}
                    >
                        <div className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Nº Registro CNH *</label>
                                <input
                                    type="text"
                                    value={cnh}
                                    onChange={(e) => setCnh(e.target.value.replace(/\D/g, ''))}
                                    maxLength={11}
                                    className="w-full h-14 px-4 bg-muted/40 border border-border/50 rounded-xl font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Categoria</label>
                                    <select
                                        value={categoriaCnh}
                                        onChange={(e) => setCategoriaCnh(e.target.value)}
                                        className="w-full h-14 px-4 bg-muted/40 border border-border/50 rounded-xl font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
                                    >
                                        {['A', 'B', 'C', 'D', 'E', 'AB', 'AC', 'AD', 'AE'].map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Vencimento</label>
                                    <DatePicker
                                        value={validadeCnh}
                                        onChange={setValidadeCnh}
                                    />
                                </div>
                            </div>
                            {cnhValidade && (
                                <div className={cn(
                                    "p-4 rounded-xl border-2 flex items-center gap-3",
                                    cnhValidade.cor === 'green' ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500" :
                                        cnhValidade.cor === 'orange' ? "bg-orange-500/5 border-orange-500/20 text-orange-500" :
                                            "bg-red-500/5 border-red-500/20 text-red-500"
                                )}>
                                    <AlertTriangle size={16} />
                                    <span className="text-xs font-black uppercase tracking-widest">{cnhValidade.texto}</span>
                                </div>
                            )}
                        </div>
                    </FormSection>

                    {/* Internacional */}
                    <FormSection
                        title="Passaporte (Opcional)"
                        icon={Globe}
                    >
                        <div className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Nº Passaporte</label>
                                <input
                                    type="text"
                                    value={passaporte}
                                    onChange={(e) => setPassaporte(e.target.value.toUpperCase())}
                                    className="w-full h-14 px-4 bg-muted/40 border border-border/50 rounded-xl font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Vencimento</label>
                                <DatePicker
                                    value={validadePassaporte}
                                    onChange={setValidadePassaporte}
                                    disabled={!passaporte}
                                />
                            </div>
                        </div>
                    </FormSection>

                    {/* Observações */}
                    <FormSection
                        title="Observações Internas"
                        icon={FileText}
                    >
                        <div className="p-2">
                            <textarea
                                value={observacoes}
                                onChange={(e) => setObservacoes(e.target.value)}
                                rows={5}
                                className="w-full p-4 bg-muted/40 border border-border/50 rounded-xl font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                            />
                        </div>
                    </FormSection>
                </div>
            </div>
        </div>
    );
};
