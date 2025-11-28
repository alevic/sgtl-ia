import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { IMotorista } from '../types';
import { ArrowLeft, Edit, Trash2, User, FileText, Globe, Phone, MapPin, Calendar, Briefcase, AlertTriangle, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export const MotoristaDetalhes: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [motorista, setMotorista] = useState<IMotorista | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const fetchMotorista = async () => {
            if (!id) return;

            setIsLoading(true);
            try {
                const response = await fetch(`http://localhost:4000/api/fleet/drivers/${id}`, {
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch driver');
                }

                const data = await response.json();
                setMotorista(data);
            } catch (error) {
                console.error("Erro ao buscar motorista:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMotorista();
    }, [id]);

    const handleDelete = async () => {
        if (!id || !window.confirm('Tem certeza que deseja excluir este motorista? Esta ação não pode ser desfeita.')) {
            return;
        }

        setIsDeleting(true);
        try {
            const response = await fetch(`http://localhost:4000/api/fleet/drivers/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to delete driver');
            }

            alert('Motorista excluído com sucesso!');
            navigate('/admin/motoristas');
        } catch (error) {
            console.error("Erro ao excluir motorista:", error);
            alert('Erro ao excluir motorista. Por favor, tente novamente.');
        } finally {
            setIsDeleting(false);
        }
    };

    const verificarValidade = (dataValidade: string) => {
        const hoje = new Date();
        const validade = new Date(dataValidade);
        const diasRestantes = Math.floor((validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

        if (diasRestantes < 0) return { texto: 'Vencido', cor: 'red' };
        if (diasRestantes < 30) return { texto: `${diasRestantes} dias`, cor: 'orange' };
        return { texto: new Date(dataValidade).toLocaleDateString('pt-BR', { timeZone: 'UTC' }), cor: 'green' };
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-slate-500 dark:text-slate-400">Carregando motorista...</p>
            </div>
        );
    }

    if (!motorista) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-slate-500 dark:text-slate-400">Motorista não encontrado</p>
            </div>
        );
    }

    const cnhValidade = verificarValidade(motorista.validade_cnh);
    const passaporteValidade = motorista.validade_passaporte ? verificarValidade(motorista.validade_passaporte) : null;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/motoristas')}
                    className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{motorista.nome}</h1>
                    <p className="text-slate-500 dark:text-slate-400">Detalhes do motorista</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Trash2 size={18} />
                        {isDeleting ? 'Excluindo...' : 'Excluir'}
                    </button>
                    <Link
                        to={`/admin/motoristas/${id}/editar`}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                    >
                        <Edit size={18} />
                        Editar
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coluna Esquerda */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Dados Pessoais */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <User size={20} className="text-blue-600" />
                            Dados Pessoais
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Status</p>
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold 
                                    ${motorista.status === 'DISPONIVEL' ? 'bg-green-100 text-green-700' :
                                        motorista.status === 'EM_VIAGEM' ? 'bg-blue-100 text-blue-700' :
                                            motorista.status === 'FERIAS' ? 'bg-orange-100 text-orange-700' :
                                                'bg-red-100 text-red-700'}`}>
                                    {motorista.status}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Data de Admissão</p>
                                <p className="font-medium text-slate-800 dark:text-white">
                                    {new Date(motorista.data_contratacao).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Documentação */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <FileText size={20} className="text-blue-600" />
                            Documentação
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-semibold text-slate-700 dark:text-slate-300">CNH</h4>
                                    <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Cat. {motorista.categoria_cnh}
                                    </span>
                                </div>
                                <p className="text-2xl font-mono text-slate-800 dark:text-white mb-2">{motorista.cnh}</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Validade:</p>
                                    <span className={`text-sm font-semibold text-${cnhValidade.cor}-600`}>
                                        {cnhValidade.texto}
                                    </span>
                                </div>
                            </div>

                            {motorista.passaporte ? (
                                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-semibold text-slate-700 dark:text-slate-300">Passaporte</h4>
                                        <Globe size={16} className="text-blue-500" />
                                    </div>
                                    <p className="text-2xl font-mono text-slate-800 dark:text-white mb-2">{motorista.passaporte}</p>
                                    {passaporteValidade && (
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm text-slate-500 dark:text-slate-400">Validade:</p>
                                            <span className={`text-sm font-semibold text-${passaporteValidade.cor}-600`}>
                                                {passaporteValidade.texto}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 border-dashed">
                                    <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                        <AlertCircle size={18} />
                                        Sem passaporte cadastrado
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Observações */}
                    {motorista.observacoes && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4">Observações</h3>
                            <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{motorista.observacoes}</p>
                        </div>
                    )}
                </div>

                {/* Coluna Direita */}
                <div className="space-y-6">
                    {/* Contatos */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <Phone size={20} className="text-green-600" />
                            Contatos
                        </h3>
                        <div className="space-y-4">
                            {motorista.telefone && (
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Telefone</p>
                                    <p className="text-slate-800 dark:text-white">{motorista.telefone}</p>
                                </div>
                            )}
                            {motorista.email && (
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Email</p>
                                    <p className="text-slate-800 dark:text-white">{motorista.email}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Endereço */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <MapPin size={20} className="text-red-600" />
                            Endereço
                        </h3>
                        <div className="space-y-2 text-slate-600 dark:text-slate-300">
                            {motorista.endereco && <p>{motorista.endereco}</p>}
                            {(motorista.cidade || motorista.estado) && (
                                <p>{motorista.cidade}{motorista.cidade && motorista.estado ? ' - ' : ''}{motorista.estado}</p>
                            )}
                            {motorista.pais && <p>{motorista.pais}</p>}
                        </div>
                    </div>

                    {/* Qualificações */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <Briefcase size={20} className="text-purple-600" />
                            Qualificações
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-600 dark:text-slate-300">Viagens Internacionais</span>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${motorista.disponivel_internacional ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {motorista.disponivel_internacional ? 'SIM' : 'NÃO'}
                                </span>
                            </div>
                            {motorista.viagens_internacionais !== undefined && (
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-600 dark:text-slate-300">Total de Viagens</span>
                                    <span className="font-bold text-slate-800 dark:text-white">{motorista.viagens_internacionais}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
