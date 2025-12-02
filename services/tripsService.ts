import { api } from "./api";
import { IViagem } from "../types";

export const tripsService = {
    getAll: async (filters?: { status?: string; search?: string }) => {
        const params = new URLSearchParams();
        if (filters?.status && filters.status !== 'TODOS') params.append('status', filters.status);
        if (filters?.search) params.append('search', filters.search);

        return api.get<IViagem[]>(`/api/trips?${params.toString()}`);
    },

    getById: async (id: string) => {
        return api.get<IViagem>(`/api/trips/${id}`);
    },

    create: async (viagem: Omit<IViagem, 'id'>) => {
        return api.post<IViagem>('/api/trips', viagem);
    },

    update: async (id: string, viagem: Partial<IViagem>) => {
        return api.put<IViagem>(`/api/trips/${id}`, viagem);
    },

    delete: async (id: string) => {
        return api.delete<{ success: boolean }>(`/api/trips/${id}`);
    }
};
