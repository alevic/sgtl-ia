import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IParada, TipoParada, Moeda, TipoDocumento, VeiculoStatus } from '../types';
import {
    ArrowLeft, Bus, MapPin, Plus, X, User, Save
} from 'lucide-react';

const MOCK_VEICULOS = [
    { id: 'V001', placa: 'ABC-1234', modelo: 'Mercedes-Benz O500', tipo: 'ONIBUS' as const, status: VeiculoStatus.ATIVO, proxima_revisao_km: 150000 },
    { id: 'V002', placa: 'DEF-5678', modelo: 'Volvo 9800', tipo: 'ONIBUS' as const, status: VeiculoStatus.ATIVO, proxima_revisao_km: 120000 }
];

const MOCK_MOTORISTAS = [
    {
        id: 'M001',
        nome: 'Carlos Silva',
        cnh: '12345678900',
        categoria_cnh: 'D',
        validade_cnh: '2026-12-31',
        status: 'DISPONIVEL' as const,
        documento_tipo: TipoDocumento.CPF,
        documento_numero: '123.456.789-00',
        nacionalidade: 'Brasileira'
    },
    {
        id: 'M002',
        nome: 'João Santos',
        cnh: '98765432100',
        categoria_cnh: 'D',
        validade_cnh: '2025-06-30',
        status: 'DISPONIVEL' as const,
        documento_tipo: TipoDocumento.CPF,
        documento_numero: '987.654.321-00',
        nacionalidade: 'Brasileira'
    }
];

export const NovaViagem: React.FC = () => {
    const navigate = useNavigate();

    const [titulo, setTitulo] = useState('');
    const [origem, setOrigem] = useState('');
    const [destino, setDestino] = useState('');
    const [dataPartida, setDataPartida] = useState('');
    const [horaPartida, setHoraPartida] = useState('');
    const [dataChegada, setDataChegada] = useState('');
    const [horaChegada, setHoraChegada] = useState('');
    const [internacional, setInternacional] = useState(false);
    const [moeda, setMoeda] = useState<Moeda>(Moeda.BRL);
    const [veiculoId, setVeiculoId] = useState('');
    const [motoristaId, setMotoristaId] = useState('');
    const [paradas, setParadas] = useState<Partial<IParada>[]>([]);

    const adicionarParada = () => {
        setParadas([
            ...paradas,
            {
                id: `P${paradas.length + 1}`,
                nome: '',
                tipo: TipoParada.EMBARQUE,
                horario_chegada: '',
                horario_partida: ''
            }
        ]);
    };

    const removerParada = (index: number) => {
        setParadas(paradas.filter((_, i) => i !== index));
    };

    const atualizarParada = (index: number, campo: string, valor: any) => {
        const novasParadas = [...paradas];
        novasParadas[index] = { ...novasParadas[index], [campo]: valor };
        setParadas(novasParadas);
    };

    const handleSalvar = () => {
        console.log({
            titulo,
            origem,
            destino,
            data_partida: `${dataPartida}T${horaPartida}:00`,
            data_chegada_prevista: `${dataChegada}T${horaChegada}:00`,
            internacional,
            moeda_base: moeda,
            veiculo_id: veiculoId,
            motorista_id: motoristaId,
            paradas
        });
        navigate('/admin/viagens');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/viagens')}
                    className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Nova Viagem</h1>
                    <p className="text-slate-500 dark:text-slate-400">Preencha os dados da viagem</p>
                </div>
                <button
                    onClick={handleSalvar}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                    <Save size={18} />
                    Salvar Viagem
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <Bus size={20} className="text-blue-600" />
                            Informações Básicas
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Título da Viagem
                                </label>
                                <input
                                    type="text"
                                    value={titulo}
                                    onChange={(e) => setTitulo(e.target.value)}
                                    placeholder="Ex: São Paulo → Rio de Janeiro"
                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Origem</label>
                                    <input
                                        type="text"
                                        value={origem}
                                        onChange={(e) => setOrigem(e.target.value)}
                                        placeholder="Ex: São Paulo, SP"
                                        className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Destino</label>
                                    <input
                                        type="text"
                                        value={destino}
                                        onChange={(e) => setDestino(e.target.value)}
                                        placeholder="Ex: Rio de Janeiro, RJ"
                                        className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data de Partida</label>
                                    <input
                                        type="date"
                                        value={dataPartida}
                                        onChange={(e) => setDataPartida(e.target.value)}
                                        className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Horário de Partida</label>
                                    <input
                                        type="time"
                                        value={horaPartida}
                                        onChange={(e) => setHoraPartida(e.target.value)}
                                        className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data de Chegada</label>
                                    <input
                                        type="date"
                                        value={dataChegada}
                                        onChange={(e) => setDataChegada(e.target.value)}
                                        className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Horário de Chegada</label>
                                    <input
                                        type="time"
                                        value={horaChegada}
                                        onChange={(e) => setHoraChegada(e.target.value)}
                                        className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={internacional}
                                        onChange={(e) => setInternacional(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Viagem Internacional
                                    </span>
                                </label>

                                {internacional && (
                                    <select
                                        value={moeda}
                                        onChange={(e) => setMoeda(e.target.value as Moeda)}
                                        className="p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value={Moeda.BRL}>BRL</option>
                                        <option value={Moeda.USD}>USD</option>
                                        <option value={Moeda.EUR}>EUR</option>
                                        <option value={Moeda.ARS}>ARS</option>
                                        <option value={Moeda.PYG}>PYG</option>
                                    </select>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                <MapPin size={20} className="text-green-600" />
                                Paradas Intermediárias
                            </h3>
                            <button
                                onClick={adicionarParada}
                                className="px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                            >
                                <Plus size={16} />
                                Adicionar Parada
                            </button>
                        </div>

                        {paradas.length === 0 ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
                                Nenhuma parada intermediária adicionada
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {paradas.map((parada, index) => (
                                    <div
                                        key={index}
                                        className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-900"
                                    >
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-semibold text-slate-700 dark:text-slate-200">
                                                Parada #{index + 1}
                                            </h4>
                                            <button
                                                onClick={() => removerParada(index)}
                                                className="text-red-600 hover:text-red-700 dark:text-red-400"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="col-span-2">
                                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                                    Cidade
                                                </label>
                                                <input
                                                    type="text"
                                                    value={parada.nome || ''}
                                                    onChange={(e) => atualizarParada(index, 'nome', e.target.value)}
                                                    placeholder="Ex: Curitiba, PR"
                                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                                />
                                            </div>

                                            <div className="col-span-2">
                                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                                    Tipo
                                                </label>
                                                <select
                                                    value={parada.tipo || TipoParada.EMBARQUE}
                                                    onChange={(e) => atualizarParada(index, 'tipo', e.target.value)}
                                                    className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                                >
                                                    <option value={TipoParada.EMBARQUE}>Embarque</option>
                                                    <option value={TipoParada.DESEMBARQUE}>Desembarque</option>
                                                    <option value={TipoParada.PARADA_TECNICA}>Parada Técnica</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <Bus size={20} className="text-purple-600" />
                            Veículo
                        </h3>

                        <select
                            value={veiculoId}
                            onChange={(e) => setVeiculoId(e.target.value)}
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">-- Selecione --</option>
                            {MOCK_VEICULOS.map((veiculo) => (
                                <option key={veiculo.id} value={veiculo.id}>
                                    {veiculo.placa} - {veiculo.modelo}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <User size={20} className="text-orange-600" />
                            Motorista
                        </h3>

                        <select
                            value={motoristaId}
                            onChange={(e) => setMotoristaId(e.target.value)}
                            className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">-- Selecione --</option>
                            {MOCK_MOTORISTAS.map((motorista) => (
                                <option key={motorista.id} value={motorista.id}>
                                    {motorista.nome}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};
