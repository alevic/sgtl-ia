import { createAuthClient } from "better-auth/react"
import { adminClient, organizationClient, phoneNumberClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
    baseURL: import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : "http://localhost:4000"),
    plugins: [
        adminClient(),
        organizationClient(),
        phoneNumberClient()
    ]
})
