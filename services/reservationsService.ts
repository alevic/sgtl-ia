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
