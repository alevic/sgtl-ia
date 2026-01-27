import { api } from "./api";
import { IFretamento } from "../types";

export const chartersService = {
    getAll: async (filters?: { status?: string; search?: string }) => {
        const params = new URLSearchParams();
        if (filters?.status && filters.status !== 'TODOS') params.append('status', filters.status);
        if (filters?.search) params.append('search', filters.search);

        return api.get<IFretamento[]>(`/api/charters?${params.toString()}`);
    },

    getById: async (id: string) => {
        return api.get<IFretamento>(`/api/charters/${id}`);
    },

    create: async (fretamento: any) => {
        return api.post<IFretamento>('/api/charters', fretamento);
    },

    update: async (id: string, fretamento: any) => {
        return api.put<IFretamento>(`/api/charters/${id}`, fretamento);
    },

    delete: async (id: string) => {
        return api.delete<{ success: boolean }>(`/api/charters/${id}`);
    }
};
