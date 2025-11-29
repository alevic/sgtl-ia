import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, User, FileText, Globe, AlertTriangle, Phone, MapPin, Calendar, Briefcase } from 'lucide-react';

export const EditarMotorista: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Dados Pessoais
    const [nome, setNome] = useState('');
    const [status, setStatus] = useState<'DISPONIVEL' | 'EM_VIAGEM' | 'FERIAS' | 'AFASTADO'>('DISPONIVEL');

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

    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

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
                setStatus(data.status || 'DISPONIVEL');
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
                alert('Erro ao carregar motorista. Redirecionando...');
                navigate('/admin/motoristas');
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
        // Validações básicas
        if (!nome.trim()) {
            alert('Nome é obrigatório');
            return;
        }
        if (!cnh.trim()) {
            alert('Número da CNH é obrigatório');
            return;
        }
        if (!validadeCnh) {
            alert('Validade da CNH é obrigatória');
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

            alert(`Motorista ${nome} atualizado com sucesso!`);
            navigate(`/admin/motoristas/${id}`);
        } catch (error) {
            console.error("Erro ao atualizar motorista:", error);
            alert('Erro ao atualizar motorista. Por favor, tente novamente.');
        } finally {
            setIsLoading(false);
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
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(`/admin/motoristas/${id}`)}
                    className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Editar Motorista</h1>
                    <p className="text-slate-500 dark:text-slate-400">Atualize as informações do motorista</p>
                </div>
                <button
                    onClick={handleSalvar}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                    <Save size={18} />
                    {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Dados Pessoais */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <User size={20} className="text-blue-600" />
                        Dados Pessoais
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Nome Completo *
                            </label>
                            <input
                                type="text"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                placeholder="Ex: Carlos Alberto Silva"
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Status Inicial
                            </label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as typeof status)}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="DISPONIVEL">Disponível</option>
                                <option value="FERIAS">Férias</option>
                                <option value="AFASTADO">Afastado</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* CNH */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <FileText size={20} className="text-blue-600" />
                        CNH - Carteira Nacional de Habilitação
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Número da CNH *
                            </label>
                            <input
                                type="text"
                                value={cnh}
                                onChange={(e) => setCnh(e.target.value.replace(/\D/g, ''))}
                                placeholder="12345678900"
                                maxLength={11}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Categoria *
                            </label>
                            <select
                                value={categoriaCnh}
                                onChange={(e) => setCategoriaCnh(e.target.value)}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
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

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Validade *
                            </label>
                            <input
                                type="date"
                                value={validadeCnh}
                                onChange={(e) => setValidadeCnh(e.target.value)}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {cnhValidade && (
                        <div className={`mt-4 p-3 rounded-lg border ${cnhValidade.cor === 'red'
                            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                            : cnhValidade.cor === 'orange'
                                ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                                : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                            }`}>
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={18} className={`text-${cnhValidade.cor}-600`} />
                                <p className={`text-sm font-medium text-${cnhValidade.cor}-700 dark:text-${cnhValidade.cor}-300`}>
                                    CNH: {cnhValidade.texto}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Contatos */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <Phone size={20} className="text-green-600" />
                        Contatos
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Telefone Principal
                            </label>
                            <input
                                type="tel"
                                value={telefone}
                                onChange={(e) => setTelefone(e.target.value)}
                                placeholder="(11) 98765-4321"
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="motorista@email.com"
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Endereço */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <MapPin size={20} className="text-red-600" />
                        Endereço
                    </h3>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Endereço Completo
                            </label>
                            <input
                                type="text"
                                value={endereco}
                                onChange={(e) => setEndereco(e.target.value)}
                                placeholder="Rua, número, complemento"
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    CEP
                                </label>
                                <input
                                    type="text"
                                    value={cep}
                                    onChange={(e) => setCep(e.target.value.replace(/\D/g, ''))}
                                    placeholder="12345-678"
                                    maxLength={8}
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Cidade
                                </label>
                                <input
                                    type="text"
                                    value={cidade}
                                    onChange={(e) => setCidade(e.target.value)}
                                    placeholder="São Paulo"
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Estado
                                </label>
                                <input
                                    type="text"
                                    value={estado}
                                    onChange={(e) => setEstado(e.target.value.toUpperCase())}
                                    placeholder="SP"
                                    maxLength={2}
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    País
                                </label>
                                <input
                                    type="text"
                                    value={pais}
                                    onChange={(e) => setPais(e.target.value)}
                                    placeholder="Brasil"
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Escalas e Gestão */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <Briefcase size={20} className="text-purple-600" />
                        Informações para Escalas e Gestão
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                                <Calendar size={14} className="text-blue-600" />
                                Data de Admissão
                            </label>
                            <input
                                type="date"
                                value={dataAdmissao}
                                onChange={(e) => setDataAdmissao(e.target.value)}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Jornada de Trabalho
                            </label>
                            <select
                                value={jornadaTrabalho}
                                onChange={(e) => setJornadaTrabalho(e.target.value as typeof jornadaTrabalho)}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="DIURNA">Diurna</option>
                                <option value="NOTURNA">Noturna</option>
                                <option value="MISTA">Mista</option>
                                <option value="FLEXIVEL">Flexível</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Horas Semanais
                            </label>
                            <input
                                type="number"
                                value={horasSemanais}
                                onChange={(e) => setHorasSemanais(e.target.value)}
                                placeholder="44"
                                min="1"
                                max="60"
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <div className="border-t border-slate-200 dark:border-slate-600 pt-4 mt-2">
                                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3">Disponibilidade</h4>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={disponivelViagensLongas}
                                            onChange={(e) => setDisponivelViagensLongas(e.target.checked)}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Disponível para viagens longas
                                        </span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={disponivelInternacional}
                                            onChange={(e) => setDisponivelInternacional(e.target.checked)}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Disponível para viagens internacionais
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Documentação Internacional */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <Globe size={20} className="text-blue-600" />
                        Documentação Internacional (Opcional)
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Número do Passaporte
                            </label>
                            <input
                                type="text"
                                value={passaporte}
                                onChange={(e) => setPassaporte(e.target.value.toUpperCase())}
                                placeholder="BR123456"
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Validade do Passaporte
                            </label>
                            <input
                                type="date"
                                value={validadePassaporte}
                                onChange={(e) => setValidadePassaporte(e.target.value)}
                                disabled={!passaporte}
                                className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>

                    {passaporte && passaporteValidadeInfo && (
                        <div className={`mt-4 p-3 rounded-lg border ${passaporteValidadeInfo.cor === 'red'
                            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                            : passaporteValidadeInfo.cor === 'orange'
                                ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                                : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                            }`}>
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={18} className={`text-${passaporteValidadeInfo.cor}-600`} />
                                <p className={`text-sm font-medium text-${passaporteValidadeInfo.cor}-700 dark:text-${passaporteValidadeInfo.cor}-300`}>
                                    Passaporte: {passaporteValidadeInfo.texto}
                                </p>
                            </div>
                        </div>
                    )}

                    {passaporte && !validadePassaporte && (
                        <div className="mt-4 p-3 rounded-lg border bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={18} className="text-orange-600" />
                                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                                    Informe a validade do passaporte
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Observações */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4">
                        Observações
                    </h3>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Informações Adicionais
                        </label>
                        <textarea
                            value={observacoes}
                            onChange={(e) => setObservacoes(e.target.value)}
                            placeholder="Ex: Especializado em viagens longas, conhecimento de rotas internacionais, experiência com veículos de grande porte..."
                            rows={4}
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
