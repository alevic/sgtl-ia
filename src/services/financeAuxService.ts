import { api } from "./api";
import { ICostCenter, IFinanceCategory } from '@/types';

export const financeAuxService = {
    // Cost Centers
    getCostCenters: async () => {
        return api.get<ICostCenter[]>('/api/finance/cost-centers');
    },
    createCostCenter: async (data: { name: string, description?: string }) => {
        return api.post<ICostCenter>('/api/finance/cost-centers', data);
    },
    updateCostCenter: async (id: string, data: { name: string, description?: string }) => {
        return api.put<ICostCenter>(`/api/finance/cost-centers/${id}`, data);
    },
    deleteCostCenter: async (id: string) => {
        return api.delete(`/api/finance/cost-centers/${id}`);
    },

    // Categories
    getCategories: async () => {
        return api.get<IFinanceCategory[]>('/api/finance/categories');
    },
    createCategory: async (data: { name: string, type: string, cost_center_id: string }) => {
        return api.post<IFinanceCategory>('/api/finance/categories', data);
    },
    deleteCategory: async (id: string) => {
        return api.delete(`/api/finance/categories/${id}`);
    }
};
