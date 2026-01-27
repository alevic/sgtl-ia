import React, { useEffect, useState } from 'react';
import { X, FileDown, Loader, User, Armchair } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { IReserva } from '@/types';
import { reservationsService } from '../services/reservationsService';

interface PassengerListModalProps {
    isOpen: boolean;
    onClose: () => void;
    tripId: string;
    tripData: {
        title: string;
        vehicle: string;
        departureDate: string;
        arrivalDate: string;
    };
}

export const PassengerListModal: React.FC<PassengerListModalProps> = ({
    isOpen,
    onClose,
    tripId,
    tripData
}) => {
    const [passengers, setPassengers] = useState<IReserva[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && tripId) {
            fetchPassengers();
        }
    }, [isOpen, tripId]);

    const fetchPassengers = async () => {
        try {
            setLoading(true);
            const data = await reservationsService.getAll({ trip_id: tripId });
            // Filter out cancelled reservations if needed, or keep them with status
            // Usually for a manifest we might want only confirmed/pending
            const activePassengers = data.filter(p => p.status !== 'CANCELLED');
            setPassengers(activePassengers);
        } catch (error) {
            console.error('Erro ao buscar passageiros:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.text('Lista de Passageiros', 14, 20);

        doc.setFontSize(12);
        doc.text(`Viagem: ${tripData.title}`, 14, 30);
        doc.text(`Veículo: ${tripData.vehicle}`, 14, 38);
        doc.text(`Data: ${tripData.departureDate} - ${tripData.arrivalDate}`, 14, 46);

        // Table Data
        const tableBody = passengers.map(p => {
            const balance = (Number(p.price) || 0) - (Number(p.amount_paid) || 0);
            const seatInfo = p.seat_number ? `Assento ${p.seat_number}` : 'N/A';
            return [
                p.passenger_name || 'N/A',
                seatInfo,
                p.status,
                `R$ ${balance.toFixed(2)}`
            ];
        });

        // Generate Table
        autoTable(doc, {
            startY: 55,
            head: [['Passageiro', 'Assento', 'Status', 'Saldo Devedor']],
            body: tableBody,
            headStyles: { fillColor: [41, 128, 185] }, // Blue header
            alternateRowStyles: { fillColor: [245, 245, 245] },
        });

        doc.save(`passageiros-viagem-${tripId}.pdf`);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50   animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-sm w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-800 rounded-t-2xl z-10">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <User className="text-blue-600" size={24} />
                            Lista de Passageiros
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {tripData.title} • {tripData.vehicle}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-sm transition-colors"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-4">
                            <Loader className="animate-spin text-blue-600" size={40} />
                            <p className="text-slate-500">Carregando passageiros...</p>
                        </div>
                    ) : passengers.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                            <User size={48} className="mx-auto mb-4 opacity-50" />
                            <p>Nenhum passageiro encontrado para esta viagem.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Stats Summary could go here */}

                            <div className="overflow-hidden rounded-sm border border-slate-200 dark:border-slate-700">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-medium">
                                        <tr>
                                            <th className="px-4 py-3">Passageiro</th>
                                            <th className="px-4 py-3">Assento</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3 text-right">Valor Total</th>
                                            <th className="px-4 py-3 text-right">Pago</th>
                                            <th className="px-4 py-3 text-right">Saldo Devedor</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {passengers.map((p) => {
                                            const balance = (Number(p.price) || 0) - (Number(p.amount_paid) || 0);
                                            return (
                                                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                                                        {p.passenger_name || 'N/A'}
                                                        {p.passenger_document && (
                                                            <div className="text-xs text-slate-400 font-normal">
                                                                {p.passenger_document}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <Armchair size={16} className="text-slate-400" />
                                                            <span className="font-mono text-slate-700 dark:text-slate-300">
                                                                {p.seat_number || '-'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold
                                                            ${p.status === 'CONFIRMED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                                p.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                                    'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                                            }`}>
                                                            {p.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                                                        R$ {Number(p.price || 0).toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-green-600 dark:text-green-400">
                                                        R$ {Number(p.amount_paid || 0).toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className={`font-semibold ${balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`}>
                                                            R$ {balance.toFixed(2)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-sm transition-colors font-medium"
                    >
                        Fechar
                    </button>
                    <button
                        onClick={handleExportPDF}
                        disabled={loading || passengers.length === 0}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
                    >
                        <FileDown size={18} />
                        Exportar PDF
                    </button>
                </div>
            </div>
        </div>
    );
};
