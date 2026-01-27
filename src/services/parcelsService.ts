import { api } from "./api";
import { IEncomenda } from '@/types';

export const parcelsService = {
    getAll: async (filters?: { status?: string; search?: string }) => {
        const params = new URLSearchParams();
        if (filters?.status && filters.status !== 'TODOS') params.append('status', filters.status);
        if (filters?.search) params.append('search', filters.search);

        return api.get<IEncomenda[]>(`/api/parcels?${params.toString()}`);
    },

    getById: async (id: string) => {
        return api.get<IEncomenda>(`/api/parcels/${id}`);
    },

    create: async (encomenda: any) => {
        return api.post<IEncomenda>('/api/parcels', encomenda);
    },

    update: async (id: string, encomenda: any) => {
        return api.put<IEncomenda>(`/api/parcels/${id}`, encomenda);
    },

    delete: async (id: string) => {
        return api.delete<{ success: boolean }>(`/api/parcels/${id}`);
    }
};
