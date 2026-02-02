import React, { useState, useEffect } from 'react';
import { ICliente, TipoDocumento } from '@/types';
import { X, Save, User, Mail, MapPin, FileText, Loader, Globe, Briefcase } from 'lucide-react';
import { clientsService } from '../../services/clientsService';
import { locationService, IState, ICity } from '../../services/locationService';
import { SwissDatePicker } from '../Form/SwissDatePicker';
import { PhoneInput } from '../Form/PhoneInput';
import { DocumentInput } from '../Form/DocumentInput';
import { FormSection } from '../Layout/FormSection';
import { cn } from '../../lib/utils';

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
    useEffect(() => {
        if (isOpen) {
            locationService.getStates().then(setStates).catch(console.error);
        }
    }, [isOpen]);

    // Carregar cidades quando o estado mudar
    useEffect(() => {
        if (selectedStateId) {
            locationService.getCities(Number(selectedStateId)).then(setCities).catch(console.error);
            if (!isSearchingCep) {
                setSelectedCityId('');
                setCidade('');
            }
        } else {
            setCities([]);
            setSelectedCityId('');
            setCidade('');
        }
    }, [selectedStateId, isSearchingCep]);

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

                    if (data.uf) {
                        const state = states.find(s => s.uf === data.uf);
                        if (state) {
                            setSelectedStateId(state.id);
                            setEstado(state.uf);

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
                                    setSelectedCityId('');
                                    setCidade(data.localidade);
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
        if (!nome || !email || !documento) {
            setError('Por favor, preencha os campos obrigatórios (Nome, Email e Documento).');
            return;
        }

        setIsSaving(true);
        setError(null);
        try {
            const newClient = await clientsService.create({
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

            onClientCreated(newClient);
            onClose();
            // Reset form
            resetForm();
        } catch (error: any) {
            console.error('Error creating client:', error);
            setError('Erro ao salvar cliente: ' + (error.message || 'Erro desconhecido'));
        } finally {
            setIsSaving(false);
        }
    };

    const resetForm = () => {
        setNome('');
        setEmail('');
        setTelefone('');
        setDocumento('');
        setDataNascimento('');
        setCep('');
        setEndereco('');
        setSelectedStateId('');
        setSelectedCityId('');
        setCidade('');
        setEstado('');
        setObservacoes('');
        setError(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60   animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 w-full max-w-5xl rounded-sm shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <User size={24} className="text-primary" strokeWidth={2.5} />
                            Cadastrar Novo Perfil de Passageiro
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Integração direta com a base CRM de passageiros</p>
                    </div>
                    <button
                        onClick={() => { resetForm(); onClose(); }}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-sm transition-colors"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 overflow-y-auto space-y-8 bg-slate-50/50 dark:bg-slate-900/50">
                    {error && (
                        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold uppercase tracking-widest rounded-sm animate-in shake duration-300">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Coluna de Dados e Localização */}
                        <div className="lg:col-span-2 space-y-8">
                            <FormSection title="Credenciais e Contato" icon={User}>
                                <div className="space-y-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nome Completo *</label>
                                        <input
                                            type="text"
                                            value={nome}
                                            onChange={(e) => setNome(e.target.value)}
                                            placeholder="Ex: João da Silva"
                                            className="w-full h-12 px-4 bg-white dark:bg-slate-800 border border-border/50 rounded-sm font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email *</label>
                                            <div className="relative group">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="email@exemplo.com"
                                                    className="w-full h-12 pl-12 pr-4 bg-white dark:bg-slate-800 border border-border/50 rounded-sm font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">WhatsApp</label>
                                            <PhoneInput
                                                value={telefone}
                                                onChange={setTelefone}
                                                countryCode={countryCode}
                                                onCountryCodeChange={setCountryCode}
                                                showLabel={false}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nacionalidade</label>
                                            <div className="relative group">
                                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
                                                <input
                                                    type="text"
                                                    value={nacionalidade}
                                                    onChange={(e) => setNacionalidade(e.target.value)}
                                                    placeholder="Brasileira"
                                                    className="w-full h-12 pl-12 pr-4 bg-white dark:bg-slate-800 border border-border/50 rounded-sm font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Data Nascimento</label>
                                            <SwissDatePicker value={dataNascimento} onChange={setDataNascimento} />
                                        </div>
                                    </div>
                                </div>
                            </FormSection>

                            <FormSection title="Base de Localização" icon={MapPin}>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <div className="md:col-span-1 space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">CEP</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={cep}
                                                    onChange={handleCepChange}
                                                    placeholder="00000-000"
                                                    maxLength={8}
                                                    className="w-full h-12 px-4 bg-white dark:bg-slate-800 border border-border/50 rounded-sm font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                                                />
                                                {isSearchingCep && (
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                        <Loader className="w-4 h-4 animate-spin text-primary" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="md:col-span-3 space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Endereço Completo</label>
                                            <input
                                                type="text"
                                                value={endereco}
                                                onChange={(e) => setEndereco(e.target.value)}
                                                placeholder="Rua, número, complemento"
                                                className="w-full h-12 px-4 bg-white dark:bg-slate-800 border border-border/50 rounded-sm font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Estado (UF) *</label>
                                            <select
                                                value={selectedStateId}
                                                onChange={handleStateSelect}
                                                className="w-full h-12 px-4 bg-white dark:bg-slate-800 border border-border/50 rounded-sm font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer"
                                            >
                                                <option value="">Selecione...</option>
                                                {states.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name} ({s.uf})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Cidade *</label>
                                            <select
                                                value={selectedCityId}
                                                onChange={handleCitySelect}
                                                disabled={!selectedStateId}
                                                className="w-full h-12 px-4 bg-white dark:bg-slate-800 border border-border/50 rounded-sm font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer disabled:opacity-50"
                                            >
                                                <option value="">Selecione...</option>
                                                {cities.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">País</label>
                                            <input
                                                type="text"
                                                value={pais}
                                                onChange={(e) => setPais(e.target.value)}
                                                placeholder="Brasil"
                                                className="w-full h-12 px-4 bg-white dark:bg-slate-800 border border-border/50 rounded-sm font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </FormSection>
                        </div>

                        {/* Coluna Lateral */}
                        <div className="space-y-8">
                            <FormSection title="Identificação" icon={FileText}>
                                <DocumentInput
                                    documentType={documentoTipo}
                                    documentNumber={documento}
                                    onTypeChange={setDocumentoTipo}
                                    onNumberChange={setDocumento}
                                    required
                                />
                            </FormSection>

                            <FormSection title="Classificação" icon={Briefcase}>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Segmento</label>
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

                            <FormSection title="Notas Adicionais" icon={FileText}>
                                <textarea
                                    value={observacoes}
                                    onChange={(e) => setObservacoes(e.target.value)}
                                    rows={4}
                                    placeholder="Informações relevantes sobre este perfil..."
                                    className="w-full p-4 bg-white dark:bg-slate-800 border border-border/50 rounded-sm font-medium text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-all"
                                />
                            </FormSection>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 flex-shrink-0">
                    <button
                        onClick={() => { resetForm(); onClose(); }}
                        className="px-8 py-3 rounded-sm font-black uppercase text-[12px] tracking-widest border border-border/50 hover:bg-muted transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSalvar}
                        disabled={isSaving}
                        className="px-10 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-sm font-black uppercase text-[12px] tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
                        {isSaving ? 'Salvando...' : 'Salvar e Selecionar'}
                    </button>
                </div>
            </div>
        </div>
    );
};
