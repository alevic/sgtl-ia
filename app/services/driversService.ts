import { api } from "./api";
import { IMotorista } from "../types";

export const driversService = {
    getAll: async (active?: boolean) => {
        const query = active !== undefined ? `?status=${active ? 'DISPONIVEL' : ''}` : '';
        return api.get<IMotorista[]>(`/api/fleet/drivers${query}`);
    },

    getById: async (id: string) => {
        return api.get<IMotorista>(`/api/fleet/drivers/${id}`);
    }
};
