import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, FileText, Globe, AlertTriangle, Phone, MapPin, Calendar, Briefcase, CheckCircle2, Loader, AlertCircle } from 'lucide-react';
import { DatePicker } from '../components/Form/DatePicker';
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from '../components/ui/button';
import { CardContent } from '../components/ui/card';
import { PageHeader } from '../components/Layout/PageHeader';
import { FormSection } from '../components/Layout/FormSection';
import { cn } from '../lib/utils';
import { DriverStatus } from '../types';

export const NovoMotorista: React.FC = () => {
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

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSalvar = async () => {
        setError(null);
        // Validações básicas
        if (!nome.trim()) {
            setError('Nome é obrigatório');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        if (!cnh.trim()) {
            setError('Número da CNH é obrigatório');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        if (!validadeCnh) {
            setError('Validade da CNH é obrigatória');
            window.scrollTo({ top: 0, behavior: 'smooth' });
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

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/fleet/drivers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(driverData)
            });

            if (!response.ok) {
                throw new Error('Failed to create driver');
            }

            setSuccess(`Motorista ${nome} cadastrado com sucesso!`);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => navigate('/admin/motoristas'), 2000);
        } catch (error) {
            console.error("Erro ao cadastrar motorista:", error);
            setError('Erro ao cadastrar motorista. Por favor, tente novamente.');
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

    return (
        <div key="novo-motorista-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Header Executivo */}
            <PageHeader
                title="Novo Motorista"
                subtitle="Cadastre um novo motorista no sistema de frota"
                backLink="/admin/motoristas"
                backText="Voltar para Motoristas"
                rightElement={
                    <>
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/admin/motoristas')}
                            className="h-14 rounded-xl px-6 font-black uppercase text-[12px] tracking-widest"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSalvar}
                            disabled={isLoading}
                            className="h-14 rounded-xl px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[12px] tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <Loader className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            {isLoading ? 'Salvando...' : 'Salvar Motorista'}
                        </Button>
                    </>
                }
            />

            {error && (
                <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2 duration-300 rounded-3xl border-destructive/20 bg-destructive/5 backdrop-blur-sm">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="font-black uppercase text-[12px] tracking-widest">Erro no Cadastro</AlertTitle>
                    <AlertDescription className="text-xs font-medium">
                        {error}
                    </AlertDescription>
                </Alert>
            )}

            {success && (
                <Alert className="animate-in fade-in slide-in-from-top-2 duration-300 rounded-3xl border-emerald-500/20 bg-emerald-500/5 backdrop-blur-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <AlertTitle className="font-black uppercase text-[12px] tracking-widest text-emerald-500">Sucesso</AlertTitle>
                    <AlertDescription className="text-xs font-medium text-emerald-600/80">
                        {success}
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Coluna Principal (2/3) */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Dados Pessoais */}
                    <FormSection
                        title="Dados Pessoais"
                        icon={User}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">
                                    Nome Completo *
                                </label>
                                <input
                                    type="text"
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                    placeholder="Ex: Carlos Alberto Silva"
                                    className="w-full h-14 px-4 rounded-xl bg-muted/40 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">
                                    Status Operacional
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as DriverStatus)}
                                    className="w-full h-14 px-4 rounded-xl bg-muted/40 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-black uppercase text-[12px] tracking-widest outline-none appearance-none"
                                >
                                    <option value={DriverStatus.AVAILABLE}>Disponível</option>
                                    <option value={DriverStatus.IN_TRANSIT}>Em Viagem</option>
                                    <option value={DriverStatus.ON_LEAVE}>Férias</option>
                                    <option value={DriverStatus.AWAY}>Afastado</option>
                                </select>
                            </div>
                        </div>
                    </FormSection>

                    {/* Habilitação */}
                    <FormSection
                        title="CNH - Carteira Nacional de Habilitação"
                        icon={FileText}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">
                                    Número da CNH *
                                </label>
                                <input
                                    type="text"
                                    value={cnh}
                                    onChange={(e) => setCnh(e.target.value.replace(/\D/g, ''))}
                                    placeholder="12345678900"
                                    maxLength={11}
                                    className="w-full h-14 px-4 rounded-xl bg-muted/40 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">
                                    Categoria *
                                </label>
                                <select
                                    value={categoriaCnh}
                                    onChange={(e) => setCategoriaCnh(e.target.value)}
                                    className="w-full h-14 px-4 rounded-xl bg-muted/40 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-black uppercase text-[12px] tracking-widest outline-none appearance-none"
                                >
                                    <option value="A">A - Motocicleta</option>
                                    <option value="B">B - Carro</option>
                                    <option value="C">C - Veículos de Carga</option>
                                    <option value="D">D - Ônibus e Van</option>
                                    <option value="E">E - Articulados</option>
                                    <option value="AB">AB - A + B</option>
                                    <option value="AC">AC - A + C</option>
                                    <option value="AD">AD - A + D</option>
                                    <option value="AE">AE - A + E</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">
                                    Validade *
                                </label>
                                <DatePicker
                                    value={validadeCnh}
                                    onChange={setValidadeCnh}
                                    required={true}
                                />
                            </div>
                        </div>

                        {cnhValidade && (
                            <div className={cn(
                                "p-4 rounded-xl border transition-all animate-in fade-in slide-in-from-top-2 duration-300",
                                cnhValidade.cor === 'red'
                                    ? 'bg-destructive/5 border-destructive/20'
                                    : cnhValidade.cor === 'orange'
                                        ? 'bg-orange-500/5 border-orange-500/20'
                                        : 'bg-emerald-500/5 border-emerald-500/20'
                            )}>
                                <div className="flex items-center gap-2">
                                    <AlertTriangle size={14} className={cn(
                                        cnhValidade.cor === 'red' ? 'text-destructive' : cnhValidade.cor === 'orange' ? 'text-orange-500' : 'text-emerald-500'
                                    )} />
                                    <p className={cn(
                                        "text-[12px] font-black uppercase tracking-widest",
                                        cnhValidade.cor === 'red' ? 'text-destructive' : cnhValidade.cor === 'orange' ? 'text-orange-500' : 'text-emerald-500'
                                    )}>
                                        Status CNH: {cnhValidade.texto}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="pt-8 border-t border-border/50">
                            <h4 className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
                                <Globe size={12} className="text-primary" />
                                Documentação Internacional (Opcional)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">
                                        Número do Passaporte
                                    </label>
                                    <input
                                        type="text"
                                        value={passaporte}
                                        onChange={(e) => setPassaporte(e.target.value.toUpperCase())}
                                        placeholder="BR123456"
                                        className="w-full h-14 px-4 rounded-xl bg-muted/40 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium outline-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">
                                        Validade do Passaporte
                                    </label>
                                    <DatePicker
                                        value={validadePassaporte}
                                        onChange={setValidadePassaporte}
                                        disabled={!passaporte}
                                    />
                                </div>
                            </div>

                            {passaporte && passaporteValidadeInfo && (
                                <div className={cn(
                                    "mt-6 p-4 rounded-xl border transition-all animate-in fade-in slide-in-from-top-2 duration-300",
                                    passaporteValidadeInfo.cor === 'red'
                                        ? 'bg-destructive/5 border-destructive/20'
                                        : passaporteValidadeInfo.cor === 'orange'
                                            ? 'bg-orange-500/5 border-orange-500/20'
                                            : 'bg-emerald-500/5 border-emerald-500/20'
                                )}>
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle size={14} className={cn(
                                            passaporteValidadeInfo.cor === 'red' ? 'text-destructive' : passaporteValidadeInfo.cor === 'orange' ? 'text-orange-500' : 'text-emerald-500'
                                        )} />
                                        <p className={cn(
                                            "text-[12px] font-black uppercase tracking-widest",
                                            passaporteValidadeInfo.cor === 'red' ? 'text-destructive' : passaporteValidadeInfo.cor === 'orange' ? 'text-orange-500' : 'text-emerald-500'
                                        )}>
                                            Status Passaporte: {passaporteValidadeInfo.texto}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </FormSection>

                    {/* Escalas e Disponibilidade */}
                    <FormSection
                        title="Gestão e Disponibilidade"
                        icon={Briefcase}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">
                                    Data de Admissão
                                </label>
                                <DatePicker
                                    value={dataAdmissao}
                                    onChange={setDataAdmissao}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">
                                    Jornada de Trabalho
                                </label>
                                <select
                                    value={jornadaTrabalho}
                                    onChange={(e) => setJornadaTrabalho(e.target.value as typeof jornadaTrabalho)}
                                    className="w-full h-14 px-4 rounded-2xl bg-muted/40 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-black uppercase text-[12px] tracking-widest outline-none appearance-none"
                                >
                                    <option value="DIURNA">Diurna</option>
                                    <option value="NOTURNA">Noturna</option>
                                    <option value="MISTA">Mista</option>
                                    <option value="FLEXIVEL">Flexível</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">
                                    Horas Semanais
                                </label>
                                <input
                                    type="number"
                                    value={horasSemanais}
                                    onChange={(e) => setHorasSemanais(e.target.value)}
                                    placeholder="44"
                                    min="1"
                                    max="60"
                                    className="w-full h-14 px-4 rounded-xl bg-muted/40 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium outline-none"
                                />
                            </div>
                        </div>

                        <div className="pt-8 border-t border-border/50">
                            <h4 className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground mb-6">Disponibilidade Operacional</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className="flex items-center gap-3 p-4 rounded-2xl border border-border/50 bg-muted/20 cursor-pointer group hover:bg-muted/40 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={disponivelViagensLongas}
                                        onChange={(e) => setDisponivelViagensLongas(e.target.checked)}
                                        className="w-5 h-5 rounded-lg border-border/50 text-primary focus:ring-primary/20"
                                    />
                                    <span className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
                                        Viagens de Longa Distância
                                    </span>
                                </label>

                                <label className="flex items-center gap-3 p-4 rounded-2xl border border-border/50 bg-muted/20 cursor-pointer group hover:bg-muted/40 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={disponivelInternacional}
                                        onChange={(e) => setDisponivelInternacional(e.target.checked)}
                                        className="w-5 h-5 rounded-lg border-border/50 text-primary focus:ring-primary/20"
                                    />
                                    <span className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
                                        Viagens Internacionais
                                    </span>
                                </label>
                            </div>
                        </div>
                    </FormSection>
                </div>

                {/* Coluna Lateral (1/3) */}
                <div className="space-y-8">
                    {/* Contatos */}
                    <FormSection
                        title="Contato de Emergência"
                        icon={Phone}
                    >
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">
                                    Telefone Principal
                                </label>
                                <input
                                    type="tel"
                                    value={telefone}
                                    onChange={(e) => setTelefone(e.target.value)}
                                    placeholder="(11) 98765-4321"
                                    className="w-full h-14 px-4 rounded-2xl bg-muted/40 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">
                                    E-mail
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="motorista@email.com"
                                    className="w-full h-14 px-4 rounded-2xl bg-muted/40 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium outline-none"
                                />
                            </div>

                            <div className="pt-6 border-t border-border/50">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Nome do Contato</label>
                                        <input
                                            type="text"
                                            value={contatoEmergenciaNome}
                                            onChange={(e) => setContatoEmergenciaNome(e.target.value)}
                                            placeholder="Ex: Maria Silva"
                                            className="w-full h-14 px-4 rounded-xl bg-muted/40 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium text-xs outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Relação</label>
                                        <input
                                            type="text"
                                            value={contatoEmergenciaRelacao}
                                            onChange={(e) => setContatoEmergenciaRelacao(e.target.value)}
                                            placeholder="Ex: Esposa"
                                            className="w-full h-14 px-4 rounded-xl bg-muted/40 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium text-xs outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Telefone de Emergência</label>
                                        <input
                                            type="tel"
                                            value={telefoneEmergencia}
                                            onChange={(e) => setTelefoneEmergencia(e.target.value)}
                                            placeholder="(11) 99999-9999"
                                            className="w-full h-14 px-4 rounded-xl bg-muted/40 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium text-xs outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </FormSection>

                    {/* Endereço */}
                    <FormSection
                        title="Endereço Residencial"
                        icon={MapPin}
                    >
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">CEP</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={cep}
                                        onChange={handleCepChange}
                                        placeholder="12345678"
                                        maxLength={8}
                                        className="w-full h-14 px-4 rounded-xl bg-muted/40 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium outline-none"
                                    />
                                    {isSearchingCep && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <Loader className="w-4 h-4 animate-spin text-primary" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Endereço</label>
                                <input
                                    type="text"
                                    value={endereco}
                                    onChange={(e) => setEndereco(e.target.value)}
                                    placeholder="Rua, número, complemento"
                                    className="w-full h-14 px-4 rounded-2xl bg-muted/40 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium text-xs outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Cidade</label>
                                    <input
                                        type="text"
                                        value={cidade}
                                        onChange={(e) => setCidade(e.target.value)}
                                        placeholder="Cidade"
                                        className="w-full h-14 px-4 rounded-xl bg-muted/40 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium text-xs outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Estado</label>
                                    <input
                                        type="text"
                                        value={estado}
                                        onChange={(e) => setEstado(e.target.value.toUpperCase())}
                                        placeholder="UF"
                                        maxLength={2}
                                        className="w-full h-14 px-4 rounded-xl bg-muted/40 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium text-xs text-center outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </FormSection>

                    {/* Observações */}
                    <FormSection
                        title="Observações do Motorista"
                        icon={Briefcase}
                    >
                        <textarea
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                            placeholder="Notas internas sobre o motorista..."
                            rows={4}
                            className="w-full p-4 rounded-xl bg-muted/40 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium text-sm resize-none outline-none"
                        />
                    </FormSection>
                </div>
            </div>
        </div>
    );
};
