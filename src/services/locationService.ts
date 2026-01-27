import { api } from './api';

export interface IState {
    id: number;
    name: string;
    uf: string;
}

export interface ICity {
    id: number;
    name: string;
    state_id: number;
}

export interface INeighborhood {
    id: number;
    name: string;
    city_id: number;
}

export const locationService = {
    getStates: async (): Promise<IState[]> => {
        return await api.get('/api/locations/states');
    },

    getCities: async (stateId: number): Promise<ICity[]> => {
        return await api.get(`/api/locations/cities/${stateId}`);
    },

    getNeighborhoods: async (cityId: number): Promise<INeighborhood[]> => {
        return await api.get(`/api/locations/neighborhoods/${cityId}`);
    },

    createCity: async (name: string, stateId: number): Promise<ICity> => {
        return await api.post('/api/locations/cities', { name, stateId });
    },

    updateCity: async (id: number, name: string): Promise<ICity> => {
        return await api.put(`/api/locations/cities/${id}`, { name });
    },

    deleteCity: async (id: number): Promise<void> => {
        await api.delete(`/api/locations/cities/${id}`);
    },

    createNeighborhood: async (name: string, cityId: number): Promise<INeighborhood> => {
        return await api.post('/api/locations/neighborhoods', { name, cityId });
    },

    updateNeighborhood: async (id: number, name: string): Promise<INeighborhood> => {
        return await api.put(`/api/locations/neighborhoods/${id}`, { name });
    },

    deleteNeighborhood: async (id: number): Promise<void> => {
        await api.delete(`/api/locations/neighborhoods/${id}`);
    }
};
