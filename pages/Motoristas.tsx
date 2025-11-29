import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IMotorista } from '../types';
import { User, Calendar, CheckCircle, XCircle, AlertCircle, FileText, Search, Filter } from 'lucide-react';



const StatusBadge: React.FC<{ status: IMotorista['status'] }> = ({ status }) => {
    const configs = {
        DISPONIVEL: { color: 'green', icon: CheckCircle, label: 'Disponível' },
        EM_VIAGEM: { color: 'blue', icon: AlertCircle, label: 'Em Viagem' },
        FERIAS: { color: 'orange', icon: Calendar, label: 'Férias' },
        AFASTADO: { color: 'red', icon: XCircle, label: 'Afastado' }
    };

    const config = configs[status];
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-${config.color}-100 dark:bg-${config.color}-900/30 text-${config.color}-700 dark:text-${config.color}-300`}>
            <Icon size={14} />
            {config.label}
        </span>
    );
};

export const Motoristas: React.FC = () => {
    const navigate = useNavigate();
    const [motoristas, setMotoristas] = useState<IMotorista[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [busca, setBusca] = useState('');
    const [filtroStatus, setFiltroStatus] = useState<'TODOS' | IMotorista['status']>('TODOS');

    const fetchMotoristas = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/fleet/drivers`, {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch drivers');
            }

            const data = await response.json();
            setMotoristas(data);
        } catch (error) {
            console.error("Erro ao buscar motoristas:", error);
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        fetchMotoristas();
    }, []);

    const motoristasFiltrados = motoristas.filter(motorista => {
        const matchStatus = filtroStatus === 'TODOS' || motorista.status === filtroStatus;
        const matchBusca = busca === '' ||
            motorista.nome.toLowerCase().includes(busca.toLowerCase()) ||
            motorista.cnh.includes(busca);
        return matchStatus && matchBusca;
    });

    const verificarValidade = (dataValidade: string) => {
        const hoje = new Date();
        const validade = new Date(dataValidade);
        const diasRestantes = Math.floor((validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

        if (diasRestantes < 0) return { texto: 'Vencido', cor: 'red' };
        if (diasRestantes < 30) return { texto: `${diasRestantes} dias`, cor: 'orange' };
        return { texto: new Date(dataValidade).toLocaleDateString('pt-BR', { timeZone: 'UTC' }), cor: 'slate' };
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Motoristas</h1>
                    <p className="text-slate-500 dark:text-slate-400">Gestão de motoristas e documentação</p>
                </div>
                <button
                    onClick={() => navigate('/admin/motoristas/novo')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                    <User size={18} />
                    Novo Motorista
                </button>
            </div>

            {/* Filtros */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar por nome ou CNH..."
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => setFiltroStatus('TODOS')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${filtroStatus === 'TODOS' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                        >
                            <Filter size={16} />
                            Todos
                        </button>
                        <button
                            onClick={() => setFiltroStatus('DISPONIVEL')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filtroStatus === 'DISPONIVEL' ? 'bg-green-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                        >
                            Disponível
                        </button>
                        <button
                            onClick={() => setFiltroStatus('EM_VIAGEM')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filtroStatus === 'EM_VIAGEM' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                        >
                            Em Viagem
                        </button>
                        <button
                            onClick={() => setFiltroStatus('FERIAS')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filtroStatus === 'FERIAS' ? 'bg-orange-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                        >
                            Férias
                        </button>
                        <button
                            onClick={() => setFiltroStatus('AFASTADO')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filtroStatus === 'AFASTADO' ? 'bg-red-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                        >
                            Afastado
                        </button>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                    <p className="text-slate-500 dark:text-slate-400">Carregando motoristas...</p>
                </div>
            ) : motoristasFiltrados.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                    <User size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">Nenhum motorista encontrado</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {motoristasFiltrados.map((motorista) => {
                        const cnhValidade = verificarValidade(motorista.validade_cnh);
                        const passaporteValidade = motorista.validade_passaporte
                            ? verificarValidade(motorista.validade_passaporte)
                            : null;

                        return (
                            <div
                                key={motorista.id}
                                onClick={() => navigate(`/admin/motoristas/${motorista.id}`)}
                                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 hover:shadow-md transition-all cursor-pointer hover:border-blue-300 dark:hover:border-blue-700"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                            <User size={28} className="text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{motorista.nome}</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">CNH: {motorista.cnh} - Categoria {motorista.categoria_cnh}</p>
                                        </div>
                                    </div>
                                    <StatusBadge status={motorista.status} />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center gap-3">
                                        <FileText size={18} className="text-slate-400" />
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Validade CNH</p>
                                            <p className={`font-semibold text-${cnhValidade.cor}-700 dark:text-${cnhValidade.cor}-300`}>
                                                {cnhValidade.texto}
                                            </p>
                                        </div>
                                    </div>

                                    {motorista.passaporte && passaporteValidade && (
                                        <div className="flex items-center gap-3">
                                            <FileText size={18} className="text-slate-400" />
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Passaporte: {motorista.passaporte}</p>
                                                <p className={`font-semibold text-${passaporteValidade.cor}-700 dark:text-${passaporteValidade.cor}-300`}>
                                                    {passaporteValidade.texto}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {!motorista.passaporte && (
                                        <div className="flex items-center gap-3">
                                            <AlertCircle size={18} className="text-orange-500" />
                                            <p className="text-sm text-orange-600 dark:text-orange-400">Sem passaporte cadastrado</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
