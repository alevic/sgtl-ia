import { authClient } from "../lib/auth-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// Removed getHeaders as better-auth uses cookies
// If you need specific headers, add them here
const defaultHeaders = {
    'Content-Type': 'application/json'
};

export const api = {
    get: async <T>(endpoint: string): Promise<T> => {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'GET',
            headers: defaultHeaders,
            credentials: 'include'
        });
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        return response.json();
    },

    post: async <T>(endpoint: string, data: any): Promise<T> => {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: defaultHeaders,
            credentials: 'include',
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        return response.json();
    },

    put: async <T>(endpoint: string, data: any): Promise<T> => {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers: defaultHeaders,
            credentials: 'include',
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        return response.json();
    },

    delete: async <T>(endpoint: string): Promise<T> => {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers: defaultHeaders,
            credentials: 'include'
        });
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        return response.json();
    }
};
