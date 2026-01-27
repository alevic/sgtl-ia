import { api } from "./api";
import { ICliente } from '@/types';

export const clientsService = {
    getAll: async (search?: string) => {
        const query = search ? `?search=${search}` : '';
        return api.get<ICliente[]>(`/api/clients${query}`);
    },

    getById: async (id: string) => {
        return api.get<ICliente>(`/api/clients/${id}`);
    },

    create: async (cliente: any) => {
        return api.post<ICliente>('/api/clients', cliente);
    },

    update: async (id: string, cliente: any) => {
        return api.put<ICliente>(`/api/clients/${id}`, cliente);
    },

    delete: async (id: string) => {
        return api.delete<{ success: boolean }>(`/api/clients/${id}`);
    },

    getInteractions: async (id: string) => {
        return api.get<any[]>(`/api/clients/${id}/interactions`);
    },

    addInteraction: async (id: string, interaction: any) => {
        return api.post<any>(`/api/clients/${id}/interactions`, interaction);
    },

    getNotes: async (id: string) => {
        return api.get<any[]>(`/api/clients/${id}/notes`);
    },

    addNote: async (id: string, note: any) => {
        return api.post<any>(`/api/clients/${id}/notes`, note);
    }
};
