import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { requireRole, pool } from "@/lib/auth.server";
import bcrypt from "bcryptjs";

// GET /api/users/:id - Get user by ID (admin only)
export async function loader({ request, params }: LoaderFunctionArgs) {
    await requireRole(request, ['admin']);
    const { id } = params;

    const result = await pool.query(
        'SELECT id, username, name, email, phone, documento, documento_tipo, birth_date, image, role, notes, is_active as "isActive", "createdAt" FROM "user" WHERE id = $1',
        [id]
    );

    if (result.rows.length === 0) {
        throw new Response("User not found", { status: 404 });
    }

    return data(result.rows[0]);
}

// PUT/DELETE /api/users/:id
export async function action({ request, params }: ActionFunctionArgs) {
    await requireRole(request, ['admin']);
    const { id } = params;

    if (request.method === "PUT") {
        const body = await request.json();
        const { username, name, email, phone, documento, documento_tipo, birthDate, image, role, notes, isActive, newPassword } = body;

        if (!name || !phone) {
            return data({ error: "Nome e telefone são obrigatórios" }, { status: 400 });
        }

        // Uniqueness checks (excluding current user)
        const check = await pool.query(
            'SELECT id FROM "user" WHERE (LOWER(username) = LOWER($1) OR (email IS NOT NULL AND LOWER(email) = LOWER($2)) OR (phone IS NOT NULL AND phone = $3)) AND id != $4',
            [username || '', email || '', phone || '', id]
        );

        if (check.rows.length > 0) {
            return data({ error: "Username, email ou telefone já estão em uso por outro usuário" }, { status: 400 });
        }

        await pool.query(
            `UPDATE "user" 
             SET username = $1, name = $2, email = $3, phone = $4, documento = $5, documento_tipo = $6, birth_date = $7, image = $8, role = $9, notes = $10, is_active = $11, "updatedAt" = CURRENT_TIMESTAMP
             WHERE id = $12`,
            [username, name, email || null, phone, documento || null, documento_tipo || 'CPF', birthDate || null, image || null, role, notes || null, isActive !== false, id]
        );

        // Sync accountId if username changed
        if (username) {
            await pool.query(
                `UPDATE account SET "accountId" = $1 WHERE "userId" = $2 AND "providerId" = 'credential'`,
                [username, id]
            );
        }

        // Update password if provided
        if (newPassword) {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await pool.query(
                `UPDATE account SET password = $1, "updatedAt" = CURRENT_TIMESTAMP 
                  WHERE "userId" = $2 AND "providerId" = 'credential'`,
                [hashedPassword, id]
            );
        }

        console.log(`[ADMIN] User updated: ${id}`);
        return data({ success: true });
    }

    if (request.method === "DELETE") {
        await pool.query('DELETE FROM "user" WHERE id = $1', [id]);
        console.log(`[ADMIN] User deleted: ${id}`);
        return data({ success: true });
    }

    return data({ error: "Method not allowed" }, { status: 405 });
}
