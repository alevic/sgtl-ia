export const publicService = {
    getSettings: async (organizationId: string) => {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/public/settings?organization_id=${organizationId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch public settings');
        }
        return response.json();
    },

    getTripById: async (id: string) => {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/public/trips/${id}`);
        if (!response.ok) {
            throw new Error('Failed to fetch public trip details');
        }
        return response.json();
    },

    getTrips: async () => {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/public/trips`);
        if (!response.ok) {
            throw new Error('Failed to fetch public trips');
        }
        return response.json();
    },

    getTags: async () => {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/public/tags`);
        if (!response.ok) {
            // Silently fail tags as they are not critical
            return [];
        }
        return response.json();
    },

    getVehicleById: async (id: string) => {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/public/vehicles/${id}`);
        if (!response.ok) throw new Error('Failed to fetch public vehicle');
        return response.json();
    },

    getVehicleSeats: async (id: string) => {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/public/vehicles/${id}/seats`);
        if (!response.ok) throw new Error('Failed to fetch public vehicle seats');
        return response.json();
    },

    getReservedSeats: async (tripId: string) => {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/public/trips/${tripId}/reserved-seats`);
        if (!response.ok) throw new Error('Failed to fetch reserved seats');
        return response.json();
    },

    resolveIdentifier: async (identifier: string) => {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/public/resolve-identifier?identifier=${encodeURIComponent(identifier)}`);
        if (!response.ok) throw new Error('Failed to resolve identifier');
        return response.json();
    },

    signupClient: async (data: any) => {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/public/client/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to sign up');
        }
        return response.json();
    }
};
