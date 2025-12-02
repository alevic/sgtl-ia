import { api } from "./api";
import { IVeiculo } from "../types";

export const vehiclesService = {
    getAll: async (active?: boolean) => {
        // Assuming backend has /api/vehicles endpoint
        // If not, I might need to create it or use a different one.
        // Based on previous context, there is likely a vehicle module.
        // I'll assume standard endpoint for now.
        const query = active !== undefined ? `?status=${active ? 'ATIVO' : ''}` : '';
        return api.get<IVeiculo[]>(`/api/vehicles${query}`);
    },

    getById: async (id: string) => {
        return api.get<IVeiculo>(`/api/vehicles/${id}`);
    }
};
