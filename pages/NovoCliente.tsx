import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TipoDocumento } from '../types';
import { ArrowLeft, Save, User, Mail, Phone, MapPin, FileText, Calendar, Globe, Briefcase, Loader } from 'lucide-react';
import { clientsService } from '../services/clientsService';
import { locationService, IState, ICity } from '../services/locationService';
import { DatePicker } from '../components/Form/DatePicker';
import { PhoneInput } from '../components/Form/PhoneInput';
import { DocumentInput } from '../components/Form/DocumentInput';
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { CardContent } from '../components/ui/card';
import { PageHeader } from '../components/Layout/PageHeader';
import { FormSection } from '../components/Layout/FormSection';
import { cn } from '../lib/utils';

export const NovoCliente: React.FC = () => {
    const navigate = useNavigate();

    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [telefone, setTelefone] = useState('');
    const [countryCode, setCountryCode] = useState('+55');
    const [documentoTipo, setDocumentoTipo] = useState<TipoDocumento>(TipoDocumento.CPF);
    const [documento, setDocumento] = useState('');
    const [dataNascimento, setDataNascimento] = useState('');
    const [nacionalidade, setNacionalidade] = useState('Brasileira');
    const [endereco, setEndereco] = useState('');
    const [cep, setCep] = useState('');
    const [cidade, setCidade] = useState('');
    const [estado, setEstado] = useState('');
    const [pais, setPais] = useState('Brasil');
    const [segmento, setSegmento] = useState<'VIP' | 'REGULAR' | 'NOVO' | 'INATIVO'>('NOVO');
    const [observacoes, setObservacoes] = useState('');

    const [states, setStates] = useState<IState[]>([]);
    const [cities, setCities] = useState<ICity[]>([]);
    const [selectedStateId, setSelectedStateId] = useState<number | ''>('');
    const [selectedCityId, setSelectedCityId] = useState<number | ''>('');
    const [isSearchingCep, setIsSearchingCep] = useState(false);

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Carregar estados ao montar
    React.useEffect(() => {
        locationService.getStates().then(setStates).catch(console.error);
    }, []);

    // Carregar cidades quando o estado mudar
    React.useEffect(() => {
        if (selectedStateId) {
            locationService.getCities(Number(selectedStateId)).then(setCities).catch(console.error);
            // Se mudou o estado manualmente, limpa a cidade selecionada
            if (!isSearchingCep) {
                setSelectedCityId('');
                setCidade('');
            }
        } else {
            setCities([]);
            setSelectedCityId('');
            setCidade('');
        }
    }, [selectedStateId]);

    const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawCep = e.target.value.replace(/\D/g, '');
        setCep(rawCep);

        if (rawCep.length === 8) {
            setIsSearchingCep(true);
            try {
                const response = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
                const data = await response.json();

                if (!data.erro) {
                    if (data.logradouro) setEndereco(data.logradouro);

                    // Tentar encontrar o estado pelo UF
                    if (data.uf) {
                        const state = states.find(s => s.uf === data.uf);
                        if (state) {
                            setSelectedStateId(state.id);
                            setEstado(state.uf);

                            // Buscar cidades do estado para tentar selecionar a cidade
                            const fetchedCities = await locationService.getCities(state.id);
                            setCities(fetchedCities);

                            if (data.localidade) {
                                const city = fetchedCities.find(c =>
                                    c.name.toLowerCase() === data.localidade.toLowerCase()
                                );
                                if (city) {
                                    setSelectedCityId(city.id);
                                    setCidade(city.name);
                                } else {
                                    // Se não achou na base, deixamos em branco para o usuário selecionar/criar
                                    setSelectedCityId('');
                                    setCidade(data.localidade); // Guardamos o nome mas sem ID do seletor
                                }
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Erro ao buscar CEP:", err);
            } finally {
                setIsSearchingCep(false);
            }
        }
    };

    const handleStateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setSelectedStateId(id === '' ? '' : Number(id));
        const state = states.find(s => s.id === Number(id));
        setEstado(state ? state.uf : '');
    };

    const handleCitySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setSelectedCityId(id === '' ? '' : Number(id));
        const city = cities.find(c => c.id === Number(id));
        setCidade(city ? city.name : '');
    };

    const handleSalvar = async () => {
        setIsSaving(true);
        try {
            await clientsService.create({
                nome,
                email,
                telefone: telefone ? `${countryCode}${telefone}` : '',
                documento_tipo: documentoTipo,
                documento: documento,
                data_nascimento: dataNascimento,
                nacionalidade,
                endereco,
                cidade,
                estado,
                pais,
                segmento,
                observacoes
            });

            navigate('/admin/clientes');
        } catch (error) {
            console.error('Error creating client:', error);
            setError('Erro ao salvar cliente. Verifique os dados e tente novamente.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div key="novo-cliente-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Header Executivo */}
            <PageHeader
                title="Novo Cliente"
                subtitle="Cadastre um novo perfil de passageiro ou parceiro comercial"
                backLink="/admin/clientes"
                backText="Painel de Clientes"
                rightElement={
                    <>
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/admin/clientes')}
                            className="h-14 rounded-sm px-6 font-black uppercase text-[12px] tracking-widest"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSalvar}
                            disabled={isSaving}
                            className="h-14 rounded-sm px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[12px] tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {isSaving ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            {isSaving ? 'Processando...' : 'Salvar Registro'}
                        </Button>
                    </>
                }
            />

            {error && (
                <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2 duration-300 rounded-sm border-destructive/20 bg-destructive/5  ">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="font-black uppercase text-[12px] tracking-widest">Erro no Cadastro</AlertTitle>
                    <AlertDescription className="text-xs font-medium">
                        {error}
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Coluna Principal */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Dados Pessoais */}
                    <FormSection
                        title="Credenciais e Identificação"
                        icon={User}
                    >
                        <div className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Nome Completo *</label>
                                <input
                                    type="text"
                                    value={nome}
                                    onChange={(e) => setNome(e.target.value)}
                                    placeholder="Ex: João da Silva"
                                    className="w-full h-14 px-4 bg-muted border border-border/50 rounded-sm font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Email *</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="email@exemplo.com"
                                            className="w-full h-14 pl-12 pr-4 bg-muted border border-border/50 rounded-sm font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Telefone / WhatsApp</label>
                                    <PhoneInput
                                        value={telefone}
                                        onChange={setTelefone}
                                        countryCode={countryCode}
                                        onCountryCodeChange={setCountryCode}
                                        required
                                        showLabel={false}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Data de Nascimento</label>
                                    <DatePicker value={dataNascimento} onChange={setDataNascimento} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Nacionalidade</label>
                                    <div className="relative group">
                                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                                        <input
                                            type="text"
                                            value={nacionalidade}
                                            onChange={(e) => setNacionalidade(e.target.value)}
                                            placeholder="Brasileira"
                                            className="w-full h-14 pl-12 pr-4 bg-muted border border-border/50 rounded-sm font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </FormSection>

                    {/* Endereço */}
                    <FormSection
                        title="Base de Localização"
                        icon={MapPin}
                    >
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="md:col-span-1 space-y-1.5">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">CEP</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={cep}
                                            onChange={handleCepChange}
                                            placeholder="00000-000"
                                            maxLength={8}
                                            className="w-full h-14 px-4 bg-muted border border-border/50 rounded-sm font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                                        />
                                        {isSearchingCep && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                <Loader className="w-4 h-4 animate-spin text-primary" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="md:col-span-3 space-y-1.5">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Endereço Completo</label>
                                    <input
                                        type="text"
                                        value={endereco}
                                        onChange={(e) => setEndereco(e.target.value)}
                                        placeholder="Rua, número, complemento"
                                        className="w-full h-14 px-4 bg-muted border border-border/50 rounded-sm font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Estado (UF) *</label>
                                    <select
                                        value={selectedStateId}
                                        onChange={handleStateSelect}
                                        className="w-full h-14 px-4 bg-muted border border-border/50 rounded-sm font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="">Selecione...</option>
                                        {states.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.uf})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Cidade *</label>
                                    <select
                                        value={selectedCityId}
                                        onChange={handleCitySelect}
                                        disabled={!selectedStateId}
                                        className="w-full h-14 px-4 bg-muted border border-border/50 rounded-sm font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer disabled:opacity-50"
                                    >
                                        <option value="">Selecione...</option>
                                        {cities.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">País</label>
                                    <input
                                        type="text"
                                        value={pais}
                                        onChange={(e) => setPais(e.target.value)}
                                        placeholder="Brasil"
                                        className="w-full h-14 px-4 bg-muted border border-border/50 rounded-sm font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </FormSection>
                </div>

                {/* Coluna Lateral */}
                <div className="space-y-8">
                    {/* Documentação */}
                    <FormSection
                        title="Protocolos Oficiais"
                        icon={FileText}
                    >
                        <DocumentInput
                            documentType={documentoTipo}
                            documentNumber={documento}
                            onTypeChange={setDocumentoTipo}
                            onNumberChange={setDocumento}
                            required
                        />
                    </FormSection>

                    {/* Classificação */}
                    <FormSection
                        title="Nível Comercial"
                        icon={Briefcase}
                    >
                        <div className="space-y-1.5">
                            <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Segmento</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['NOVO', 'REGULAR', 'VIP', 'INATIVO'].map((seg) => (
                                    <button
                                        key={seg}
                                        onClick={() => setSegmento(seg as any)}
                                        className={cn(
                                            "py-3 rounded-sm border-2 transition-all font-black text-[12px] tracking-widest uppercase",
                                            segmento === seg
                                                ? "border-primary bg-primary shadow-lg shadow-primary/20 text-primary-foreground"
                                                : "border-border/50 text-muted-foreground hover:border-border hover:bg-muted"
                                        )}
                                    >
                                        {seg}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </FormSection>

                    {/* Observações */}
                    <FormSection
                        title="Histórico e Memória"
                        icon={FileText}
                    >
                        <textarea
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                            rows={6}
                            placeholder="Informações relevantes sobre o relacionamento..."
                            className="w-full p-4 bg-muted border border-border/50 rounded-sm font-medium text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-all"
                        />
                    </FormSection>
                </div>
            </div>
        </div>
    );
};
