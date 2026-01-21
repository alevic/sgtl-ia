import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDateFormatter } from '../hooks/useDateFormatter';
import { Package, User, MapPin, Truck, Save, ArrowLeft, Loader } from 'lucide-react';
import { parcelsService } from '../services/parcelsService';
import { tripsService } from '../services/tripsService';
import { IViagem, TripStatus } from '../types';

export const NovaEncomenda: React.FC = () => {
    const navigate = useNavigate();
    const { formatDate } = useDateFormatter();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [trips, setTrips] = useState<IViagem[]>([]);

    const [formData, setFormData] = useState({
        sender_name: '',
        sender_document: '',
        sender_phone: '',
        recipient_name: '',
        recipient_document: '',
        recipient_phone: '',
        origin_city: '',
        origin_state: '',
        destination_city: '',
        destination_state: '',
        description: '',
        weight: 0,
        dimensions: '',
        price: 0,
        trip_id: '',
        notes: ''
    });

    useEffect(() => {
        loadTrips();
    }, []);

    const loadTrips = async () => {
        try {
            const data = await tripsService.getAll();
            // Filter active trips
            const activeTrips = data.filter(t =>
                t.status === TripStatus.SCHEDULED || (t.status as string) === 'CONFIRMED' ||
                (t.status as string) === 'AGENDADA' || (t.status as string) === 'CONFIRMADA'
            );
            setTrips(activeTrips);
        } catch (error) {
            console.error('Erro ao carregar viagens:', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            await parcelsService.create({
                ...formData,
                trip_id: formData.trip_id || null
            });
            alert('Encomenda criada com sucesso!');
            navigate('/admin/encomendas');
        } catch (error) {
            console.error('Erro ao criar encomenda:', error);
            alert('Erro ao criar encomenda.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/encomendas')}
                    className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                    <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Nova Encomenda</h1>
                    <p className="text-slate-500 dark:text-slate-400">Registrar nova encomenda</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Remetente e Destinatário */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Remetente */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <User size={20} />
                            Remetente
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
                                <input
                                    type="text"
                                    name="sender_name"
                                    required
                                    value={formData.sender_name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Documento (CPF/CNPJ)</label>
                                    <input
                                        type="text"
                                        name="sender_document"
                                        value={formData.sender_document}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefone</label>
                                    <input
                                        type="text"
                                        name="sender_phone"
                                        value={formData.sender_phone}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Destinatário */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <User size={20} />
                            Destinatário
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
                                <input
                                    type="text"
                                    name="recipient_name"
                                    required
                                    value={formData.recipient_name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Documento (CPF/CNPJ)</label>
                                    <input
                                        type="text"
                                        name="recipient_document"
                                        value={formData.recipient_document}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefone</label>
                                    <input
                                        type="text"
                                        name="recipient_phone"
                                        value={formData.recipient_phone}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Origem e Destino */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <MapPin size={20} />
                        Rota
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h4 className="font-medium text-slate-600 dark:text-slate-400">Origem</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cidade</label>
                                    <input
                                        type="text"
                                        name="origin_city"
                                        required
                                        value={formData.origin_city}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">UF</label>
                                    <input
                                        type="text"
                                        name="origin_state"
                                        required
                                        maxLength={2}
                                        value={formData.origin_state}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white uppercase"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h4 className="font-medium text-slate-600 dark:text-slate-400">Destino</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cidade</label>
                                    <input
                                        type="text"
                                        name="destination_city"
                                        required
                                        value={formData.destination_city}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">UF</label>
                                    <input
                                        type="text"
                                        name="destination_state"
                                        required
                                        maxLength={2}
                                        value={formData.destination_state}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white uppercase"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detalhes do Pacote */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <Package size={20} />
                        Detalhes do Pacote
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-3">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
                            <input
                                type="text"
                                name="description"
                                required
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Ex: Caixa com eletrônicos"
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Peso (kg)</label>
                            <input
                                type="number"
                                name="weight"
                                step="0.1"
                                min="0"
                                value={formData.weight}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Dimensões (cm)</label>
                            <input
                                type="text"
                                name="dimensions"
                                placeholder="Ex: 30x20x10"
                                value={formData.dimensions}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor do Frete (R$)</label>
                            <input
                                type="number"
                                name="price"
                                step="0.01"
                                min="0"
                                required
                                value={formData.price}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Transporte */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <Truck size={20} />
                        Transporte (Opcional)
                    </h3>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vincular à Viagem</label>
                        <select
                            name="trip_id"
                            value={formData.trip_id}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        >
                            <option value="">Selecione uma viagem...</option>
                            {trips.map(trip => (
                                <option key={trip.id} value={trip.id}>
                                    {trip.route_name} - {formatDate(trip.departure_date || '')} {trip.departure_time}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Selecione uma viagem para embarcar esta encomenda imediatamente.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/encomendas')}
                        className="px-6 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg font-semibold transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                    >
                        {saving ? <Loader size={20} className="animate-spin" /> : <Save size={20} />}
                        {saving ? 'Salvando...' : 'Salvar Encomenda'}
                    </button>
                </div>
            </form>
        </div>
    );
};
