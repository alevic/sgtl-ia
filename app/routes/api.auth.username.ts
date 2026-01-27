import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { pool } from "@/lib/auth.server";

// Services logic migrated inline for simplicity

function validateUsername(username: string): { valid: boolean; error?: string } {
    if (!username || username.length < 3) return { valid: false, error: 'Mínimo 3 caracteres' };
    if (username.length > 30) return { valid: false, error: 'Máximo 30 caracteres' };
    if (!/^[a-zA-Z0-9._]+$/.test(username)) return { valid: false, error: 'Apenas letras, números, . e _' };
    if (!/^[a-zA-Z]/.test(username)) return { valid: false, error: 'Deve começar com letra' };
    return { valid: true };
}

async function isUsernameAvailable(username: string): Promise<boolean> {
    const result = await pool.query('SELECT id FROM "user" WHERE LOWER(username) = LOWER($1)', [username]);
    return result.rows.length === 0;
}

// GET /api/auth/username?check=xxx
// POST /api/auth/username (Suggest)
export async function loader({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const check = url.searchParams.get("check");

    if (check) {
        const validation = validateUsername(check);
        if (!validation.valid) return data({ available: false, error: validation.error });
        const available = await isUsernameAvailable(check);
        return data({ available });
    }

    return data({ error: "Missing check param" }, { status: 400 });
}

export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== "POST") return data({ error: "Method not allowed" }, { status: 405 });

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string') return data({ error: "Name required" }, { status: 400 });

    // Generate logic
    const cleanName = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z\s]/g, '').trim();
    const parts = cleanName.split(/\s+/);
    const firstName = parts[0] || '';
    const lastName = parts[parts.length - 1] || '';
    const suggestions: string[] = [];

    if (firstName && lastName) suggestions.push(`${firstName}.${lastName}`);
    if (firstName && lastName) suggestions.push(`${firstName}${lastName}`);
    if (firstName) suggestions.push(firstName);

    const availableSuggestions: string[] = [];
    for (const s of [...new Set(suggestions)]) {
        if (await isUsernameAvailable(s)) availableSuggestions.push(s);
        else {
            for (let i = 1; i < 100; i++) {
                if (await isUsernameAvailable(`${s}${i}`)) {
                    availableSuggestions.push(`${s}${i}`);
                    break;
                }
            }
        }
        if (availableSuggestions.length >= 3) break;
    }

    return data({ suggestions: availableSuggestions });
}
