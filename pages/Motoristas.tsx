import React, { useState } from 'react';
import { IMotorista } from '../types';
import { User, Calendar, CheckCircle, XCircle, AlertCircle, FileText } from 'lucide-react';

const MOCK_MOTORISTAS: IMotorista[] = [
    {
        id: '1',
        nome: 'Carlos Silva',
        cnh: '12345678900',
        categoria_cnh: 'D',
        validade_cnh: '2026-12-31',
        passaporte: 'BR123456',
        validade_passaporte: '2027-06-15',
        status: 'DISPONIVEL'
    },
    {
        id: '2',
        nome: 'João Santos',
        cnh: '98765432100',
        categoria_cnh: 'E',
        validade_cnh: '2025-08-20',
        status: 'EM_VIAGEM'
    },
    {
        id: '3',
        nome: 'Ana Paula Costa',
        cnh: '45678912300',
        categoria_cnh: 'D',
        validade_cnh: '2025-03-10',
        passaporte: 'BR789012',
        validade_passaporte: '2028-01-20',
        status: 'DISPONIVEL'
    }
];

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
    const [motoristas] = useState<IMotorista[]>(MOCK_MOTORISTAS);

    const verificarValidade = (dataValidade: string) => {
        const hoje = new Date();
        const validade = new Date(dataValidade);
        const diasRestantes = Math.floor((validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

        if (diasRestantes < 0) return { texto: 'Vencido', cor: 'red' };
        if (diasRestantes < 30) return { texto: `${diasRestantes} dias`, cor: 'orange' };
        return { texto: new Date(dataValidade).toLocaleDateString('pt-BR'), cor: 'slate' };
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Motoristas</h1>
                    <p className="text-slate-500 dark:text-slate-400">Gestão de motoristas e documentação</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-2">
                    <User size={18} />
                    Novo Motorista
                </button>
            </div>

            <div className="grid gap-4">
                {motoristas.map((motorista) => {
                    const cnhValidade = verificarValidade(motorista.validade_cnh);
                    const passaporteValidade = motorista.validade_passaporte
                        ? verificarValidade(motorista.validade_passaporte)
                        : null;

                    return (
                        <div key={motorista.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 hover:shadow-md transition-shadow">
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
        </div>
    );
};
