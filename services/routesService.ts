import { api } from "./api";
import { IRota } from "../types";

export const routesService = {
    getAll: async (active?: boolean) => {
        const query = active !== undefined ? `?active=${active}` : '';
        const response = await api.get<any[]>(`/api/routes${query}`);
        return response.map(mapBackendToFrontend);
    },

    getById: async (id: string) => {
        const response = await api.get<any>(`/api/routes/${id}`);
        return mapBackendToFrontend(response);
    },

    create: async (rota: any) => {
        const response = await api.post<any>('/api/routes', rota);
        return mapBackendToFrontend(response);
    },

    update: async (id: string, rota: any) => {
        const response = await api.put<any>(`/api/routes/${id}`, rota);
        return mapBackendToFrontend(response);
    },

    delete: async (id: string) => {
        return api.delete<{ success: boolean }>(`/api/routes/${id}`);
    }
};

const mapBackendToFrontend = (data: any): IRota => {
    let pontos = data.stops;

    // Handle case where it might be a string (e.g. text column or double encoded)
    if (typeof pontos === 'string') {
        try {
            pontos = JSON.parse(pontos);
        } catch (e) {
            console.error('Error parsing stops for route:', data.id, e);
            pontos = [];
        }
    }

    // Ensure it's an array
    if (!Array.isArray(pontos)) {
        pontos = [];
    }

    // Standardize type to RouteType enum
    let routeType = data.type || 'OUTBOUND';
    if (routeType === 'IDA') routeType = 'OUTBOUND';
    if (routeType === 'VOLTA') routeType = 'INBOUND';

    return {
        id: data.id,
        nome: data.name,
        tipo_rota: routeType as any,
        pontos: pontos,
        distancia_total_km: data.distance_km,
        duracao_estimada_minutos: data.duration_minutes,
        ativa: data.active
    };
};
