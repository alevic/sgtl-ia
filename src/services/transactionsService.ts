import { api } from "./api";
import { ITransacao } from "../../types";

export const transactionsService = {
    getAll: async () => {
        return api.get<ITransacao[]>('/api/finance/transactions');
    },

    create: async (transaction: Partial<ITransacao>) => {
        return api.post('/api/finance/transactions', transaction);
    },

    update: async (id: string, transaction: Partial<ITransacao>) => {
        return api.put(`/api/finance/transactions/${id}`, transaction);
    },

    delete: async (id: string) => {
        return api.delete(`/api/finance/transactions/${id}`);
    }
};
