import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TipoDocumento } from '../types';
import { ArrowLeft, Save, User, Mail, Phone, MapPin, FileText, Calendar, MessageSquare, Loader } from 'lucide-react';
import { clientsService } from '../services/clientsService';
import { DatePicker } from '../components/Form/DatePicker';
import { PhoneInput } from '../components/Form/PhoneInput';
import { DocumentInput } from '../components/Form/DocumentInput';
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { authClient } from '../lib/auth-client';
import { useApp } from '../context/AppContext';
import { PageHeader } from '../components/Layout/PageHeader';
import { FormSection } from '../components/Layout/FormSection';
import { cn } from '../lib/utils';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';

export const EditarCliente: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        telefone: '',
        documento_tipo: TipoDocumento.CPF,
        documento: '',
        nacionalidade: '',
        data_nascimento: '',
        endereco: '',
        cidade: '',
        estado: '',
        pais: 'Brasil',
        segmento: 'Standard',
        observacoes: '',
        saldo_creditos: 0
    });
    const [countryCode, setCountryCode] = useState('+55');

    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        const fetchCliente = async () => {
            if (!id) return;

            setIsFetching(true);
            try {
                const data = await clientsService.getById(id);

                setFormData({
                    nome: data.nome || '',
                    email: data.email || '',
                    telefone: data.telefone || '',
                    documento_tipo: data.documento_tipo || TipoDocumento.CPF,
                    documento: data.documento || '',
                    nacionalidade: data.nacionalidade || '',
                    data_nascimento: data.data_nascimento ? new Date(data.data_nascimento).toISOString().split('T')[0] : '',
                    endereco: data.endereco || '',
                    cidade: data.cidade || '',
                    estado: data.estado || '',
                    pais: data.pais || 'Brasil',
                    segmento: data.segmento || 'Standard',
                    observacoes: data.observacoes || '',
                    saldo_creditos: data.saldo_creditos || 0
                });

                // Parse phone and country code
                const fullPhone = data.telefone || '';
                if (fullPhone.startsWith('+')) {
                    // Try to match longest prefix first
                    const prefixes = ['+351', '+55', '+54', '+52', '+49', '+44', '+39', '+34', '+33', '+1'];
                    const match = prefixes.find(p => fullPhone.startsWith(p));
                    if (match) {
                        setCountryCode(match);
                        setFormData(prev => ({ ...prev, telefone: fullPhone.substring(match.length) }));
                    } else {
                        setFormData(prev => ({ ...prev, telefone: fullPhone }));
                    }
                } else {
                    setFormData(prev => ({ ...prev, telefone: fullPhone }));
                }
            } catch (error) {
                console.error("Erro ao buscar cliente:", error);
                setError('Erro ao carregar cliente. Redirecionando...');
                setTimeout(() => navigate('/admin/clientes'), 2000);
            } finally {
                setIsFetching(false);
            }
        };

        fetchCliente();
    }, [id, navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSalvar = async () => {
        setError(null);
        if (!formData.nome || !formData.email) {
            setError('Por favor, preencha nome e email do cliente.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        setIsLoading(true);
        try {
            const dataToSave = {
                ...formData,
                telefone: formData.telefone ? `${countryCode}${formData.telefone}` : ''
            };
            await clientsService.update(id!, dataToSave);
            setSuccess('Cliente atualizado com sucesso!');
            setTimeout(() => navigate(`/admin/clientes/${id}`), 2000);
        } catch (error) {
            console.error("Erro ao atualizar cliente:", error);
            setError('Erro ao atualizar cliente. Por favor, tente novamente.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4 animate-in fade-in duration-500">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-[12px] font-black uppercase tracking-[0.2em] text-muted-foreground">Sincronizando Dados...</p>
            </div>
        );
    }

    return (
        <div key="editar-cliente-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Header Module */}
            <PageHeader
                title="Editar Registro"
                subtitle={`Atualizando credenciais de: ${formData.nome || '...'}`}
                suffix="CLIENTE"
                icon={User}
                backLink={`/admin/clientes/${id}`}
                backLabel="Painel do Cliente"
                rightElement={
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => navigate(`/admin/clientes/${id}`)}
                            className="h-14 rounded-sm px-6 font-black uppercase text-[12px] tracking-widest"
                        >
                            Descartar
                        </Button>
                        <Button
                            onClick={handleSalvar}
                            disabled={isLoading}
                            className="h-14 rounded-sm px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-[12px] tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {isLoading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            {isLoading ? 'Sincronizando...' : 'Salvar Alterações'}
                        </Button>
                    </div>
                }
            />

            {error && (
                <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2 duration-300 rounded-[2rem] border-destructive/20 bg-destructive/5  ">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="font-black uppercase text-[12px] tracking-widest">Erro na Atualização</AlertTitle>
                    <AlertDescription className="text-xs font-medium">
                        {error}
                    </AlertDescription>
                </Alert>
            )}

            {success && (
                <Alert className="animate-in fade-in slide-in-from-top-2 duration-300 rounded-[2rem] border-emerald-500/20 bg-emerald-500/5  ">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <AlertTitle className="font-black uppercase text-[12px] tracking-widest text-emerald-500">Sucesso</AlertTitle>
                    <AlertDescription className="text-xs font-medium text-emerald-600/80">
                        {success}
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Coluna Principal */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Informações Pessoais */}
                    <FormSection
                        title="Informações Pessoais"
                        icon={User}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5 md:col-span-2">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Nome Completo *</label>
                                <input
                                    type="text"
                                    name="nome"
                                    value={formData.nome}
                                    onChange={handleChange}
                                    placeholder="Nome completo do cliente"
                                    className="w-full h-14 px-4 bg-muted border border-border/50 rounded-sm font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Email *</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="email@exemplo.com"
                                        className="w-full h-14 pl-12 pr-4 bg-muted border border-border/50 rounded-sm font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Telefone / WhatsApp</label>
                                <PhoneInput
                                    value={formData.telefone}
                                    onChange={(val) => setFormData(prev => ({ ...prev, telefone: val }))}
                                    countryCode={countryCode}
                                    onCountryCodeChange={setCountryCode}
                                    required={false}
                                    showLabel={false}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Data de Nascimento</label>
                                <DatePicker
                                    value={formData.data_nascimento}
                                    onChange={(val) => setFormData(prev => ({ ...prev, data_nascimento: val }))}
                                    placeholder="DD/MM/AAAA"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Segmento</label>
                                <select
                                    name="segmento"
                                    value={formData.segmento}
                                    onChange={handleChange}
                                    className="w-full h-14 px-4 bg-muted border border-border/50 rounded-sm font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
                                >
                                    <option value="Standard">Standard</option>
                                    <option value="VIP">VIP</option>
                                    <option value="Corporativo">Corporativo</option>
                                </select>
                            </div>
                        </div>
                    </FormSection>

                    {/* Endereço */}
                    <FormSection
                        title="Localização e Endereço"
                        icon={MapPin}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-1.5 md:col-span-2 lg:col-span-3">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Logradouro</label>
                                <input
                                    type="text"
                                    name="endereco"
                                    value={formData.endereco}
                                    onChange={handleChange}
                                    placeholder="Rua, número, complemento"
                                    className="w-full h-14 px-4 bg-muted border border-border/50 rounded-sm font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Cidade</label>
                                <input
                                    type="text"
                                    name="cidade"
                                    value={formData.cidade}
                                    onChange={handleChange}
                                    placeholder="São Paulo"
                                    className="w-full h-14 px-4 bg-muted border border-border/50 rounded-sm font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Estado (UF)</label>
                                <input
                                    type="text"
                                    name="estado"
                                    value={formData.estado}
                                    onChange={handleChange}
                                    placeholder="SP"
                                    maxLength={2}
                                    className="w-full h-14 px-4 bg-muted border border-border/50 rounded-sm font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none uppercase"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">País</label>
                                <input
                                    type="text"
                                    name="pais"
                                    value={formData.pais}
                                    onChange={handleChange}
                                    placeholder="Brasil"
                                    className="w-full h-14 px-4 bg-muted border border-border/50 rounded-sm font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </div>
                        </div>
                    </FormSection>
                </div>

                {/* Coluna Lateral */}
                <div className="space-y-8">
                    {/* Documentação */}
                    <FormSection
                        title="Documentação"
                        icon={FileText}
                    >
                        <div className="space-y-6">
                            <DocumentInput
                                documentType={formData.documento_tipo}
                                documentNumber={formData.documento}
                                onTypeChange={(val) => setFormData(prev => ({ ...prev, documento_tipo: val }))}
                                onNumberChange={(val) => setFormData(prev => ({ ...prev, documento: val }))}
                                required
                            />
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Nacionalidade</label>
                                <input
                                    type="text"
                                    name="nacionalidade"
                                    value={formData.nacionalidade}
                                    onChange={handleChange}
                                    placeholder="Brasileira"
                                    className="w-full h-14 px-4 bg-muted border border-border/50 rounded-sm font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </div>
                        </div>
                    </FormSection>

                    {/* Financeiro e Notas */}
                    <FormSection
                        title="Resumo e Notas"
                        icon={MessageSquare}
                    >
                        <div className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Saldo de Créditos</label>
                                <input
                                    type="number"
                                    name="saldo_creditos"
                                    value={formData.saldo_creditos}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    className="w-full h-14 px-4 bg-muted border border-border/50 rounded-sm font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Observações Internas</label>
                                <textarea
                                    name="observacoes"
                                    value={formData.observacoes}
                                    onChange={handleChange}
                                    placeholder="Notas sobre o cliente..."
                                    rows={5}
                                    className="w-full p-4 bg-muted border border-border/50 rounded-sm font-bold transition-all focus:ring-2 focus:ring-primary/20 outline-none min-h-[150px] resize-none"
                                />
                            </div>
                        </div>
                    </FormSection>
                </div>
            </div>
        </div>
    );
};
