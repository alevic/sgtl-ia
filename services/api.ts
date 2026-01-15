import { authClient } from "../lib/auth-client";

// Smart API URL detection (same logic as auth-client)
function getApiUrl(): string {
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }

    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname === 'jjeturismo.com.br' || hostname.endsWith('.jjeturismo.com.br')) {
            return 'https://api.jjeturismo.com.br';
        }
        return window.location.origin;
    }

    return "http://localhost:4000";
}

const API_URL = getApiUrl();

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
