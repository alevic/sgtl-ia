import { createAuthClient } from "better-auth/react"
import { adminClient, organizationClient, phoneNumberClient } from "better-auth/client/plugins"

// Smart API URL detection
function getApiUrl(): string {
    // First, try environment variable (works in development)
    if (import.meta.env.VITE_API_URL) {
        console.log('[AUTH] Using VITE_API_URL:', import.meta.env.VITE_API_URL);
        return import.meta.env.VITE_API_URL;
    }

    // In production, detect based on current domain
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;

        // If we're on jjeturismo.com.br, use api.jjeturismo.com.br
        if (hostname === 'jjeturismo.com.br' || hostname.endsWith('.jjeturismo.com.br')) {
            console.log('[AUTH] Detected jjeturismo.com.br domain, using API:', 'https://api.jjeturismo.com.br');
            return 'https://api.jjeturismo.com.br';
        }

        // Fallback to same origin
        console.log('[AUTH] Using same origin:', window.location.origin);
        return window.location.origin;
    }

    // SSR fallback
    return "http://localhost:4000";
}

export const authClient = createAuthClient({
    baseURL: getApiUrl(),
    plugins: [
        adminClient(),
        organizationClient(),
        phoneNumberClient()
    ]
})
