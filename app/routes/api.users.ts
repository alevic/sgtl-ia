import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { requireRole, pool, auth } from "@/lib/auth.server";

// GET /api/users - List all users (admin only)
export async function loader({ request }: LoaderFunctionArgs) {
    await requireRole(request, ['admin']);

    const result = await pool.query(
        'SELECT id, username, name, email, phone, documento as cpf, role, "createdAt" FROM "user"'
    );

    return data(result.rows);
}

// POST /api/users - Create new user (admin only)
export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== "POST") {
        return data({ error: "Method not allowed" }, { status: 405 });
    }

    const session = await requireRole(request, ['admin']);
    const body = await request.json();
    const { username, name, email, phone, cpf, birthDate, role, password, notes, isActive } = body;

    // Validation
    if (!username || !name || !password) {
        return data({ error: "Username, nome e senha são obrigatórios" }, { status: 400 });
    }

    // Uniqueness checks
    const check = await pool.query(
        'SELECT id FROM "user" WHERE LOWER(username) = LOWER($1) OR (email IS NOT NULL AND LOWER(email) = LOWER($2)) OR (phone IS NOT NULL AND phone = $3)',
        [username, email || '', phone || '']
    );

    if (check.rows.length > 0) {
        return data({ error: "Username, email ou telefone já estão em uso" }, { status: 400 });
    }

    try {
        // Create user via Better Auth
        const authResponse = await auth.api.signUpEmail({
            body: {
                email: email || `${username}@sgtl-internal.com`,
                password,
                name
            }
        }) as any;

        if (!authResponse || !authResponse.user) {
            return data({ error: "Falha ao criar usuário na base de autenticação" }, { status: 500 });
        }

        const userId = authResponse.user.id;

        // Update custom fields
        await pool.query(
            `UPDATE "user" 
             SET username = $1, phone = $2, documento = $3, birth_date = $4, role = $5, notes = $6, is_active = $7, "updatedAt" = CURRENT_TIMESTAMP
             WHERE id = $8`,
            [username, phone || null, cpf || null, birthDate || null, role || 'user', notes || null, isActive !== false, userId]
        );

        // Standardize accountId to username
        await pool.query(
            `UPDATE account 
             SET "accountId" = $1, "updatedAt" = CURRENT_TIMESTAMP
             WHERE "userId" = $2 AND "providerId" = 'credential'`,
            [username, userId]
        );

        // Create client profile if role includes 'client'
        const roles = (role || 'user').split(',').map((r: string) => r.trim());
        if (roles.includes('client')) {
            const orgId = (session as any).session.activeOrganizationId;
            await pool.query(
                `INSERT INTO clients (
                    tipo_cliente, nome, email, telefone, 
                    documento_tipo, documento,
                    organization_id, user_id,
                    data_cadastro, saldo_creditos
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, 0)
                ON CONFLICT (user_id) DO NOTHING`,
                ['PESSOA_FISICA', name, email || null, phone || null, 'CPF', cpf || null, orgId, userId]
            );
        }

        console.log(`[ADMIN] User created: ${username} (ID: ${userId})`);
        return data({ success: true, userId });

    } catch (error: any) {
        console.error("Error creating user:", error);
        return data({ error: error.message || "Erro ao criar usuário" }, { status: 500 });
    }
}
