import { api } from "./api";
import { IVeiculo } from "../types";

export const vehiclesService = {
    getAll: async (active?: boolean) => {
        const query = active !== undefined ? `?status=${active ? 'ATIVO' : ''}` : '';
        return api.get<IVeiculo[]>(`/api/fleet/vehicles${query}`);
    },

    getById: async (id: string) => {
        return api.get<IVeiculo>(`/api/fleet/vehicles/${id}`);
    },

    getSeats: async (id: string) => {
        return api.get<any[]>(`/api/fleet/vehicles/${id}/seats`);
    }
};
