import { api } from "./api";
import { IReserva } from "../types";

export const reservationsService = {
    getAll: async (filters?: { status?: string; search?: string; trip_id?: string; client_id?: string }) => {
        const params = new URLSearchParams();
        if (filters?.status && filters.status !== 'TODOS') params.append('status', filters.status);
        if (filters?.search) params.append('search', filters.search);
        if (filters?.trip_id) params.append('trip_id', filters.trip_id);
        if (filters?.client_id) params.append('client_id', filters.client_id);

        return api.get<IReserva[]>(`/api/reservations?${params.toString()}`);
    },

    getById: async (id: string) => {
        return api.get<IReserva>(`/api/reservations/${id}`);
    },

    // Get reserved seat numbers for a specific trip
    getReservedSeats: async (tripId: string): Promise<string[]> => {
        try {
            // Use any type as backend response may have different fields than typed interface
            const reservations = await api.get<any[]>(`/api/reservations?trip_id=${tripId}`);
            // Extract seat numbers from all active reservations (not cancelled)
            const reservedSeats: string[] = [];
            reservations.forEach((r: any) => {
                const status = r.status || '';
                if (status !== 'CANCELADA' && status !== 'CANCELLED') {
                    // Check for seat_number (single passenger) or passengers array
                    if (r.seat_number) {
                        reservedSeats.push(String(r.seat_number));
                    }
                    if (r.passengers && Array.isArray(r.passengers)) {
                        r.passengers.forEach((p: any) => {
                            if (p.seat_number || p.assento_numero) {
                                reservedSeats.push(String(p.seat_number || p.assento_numero));
                            }
                        });
                    }
                }
            });
            return reservedSeats;
        } catch (error) {
            console.error('Error fetching reserved seats:', error);
            return [];
        }
    },

    create: async (reserva: any) => {
        return api.post<IReserva>('/api/reservations', reserva);
    },

    update: async (id: string, reserva: any) => {
        return api.put<IReserva>(`/api/reservations/${id}`, reserva);
    },

    delete: async (id: string) => {
        return api.delete<{ success: boolean }>(`/api/reservations/${id}`);
    }
};
