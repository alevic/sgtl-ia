export const publicService = {
    getSettings: async (organizationId: string) => {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/public/settings?organization_id=${organizationId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch public settings');
        }
        return response.json();
    }
};
