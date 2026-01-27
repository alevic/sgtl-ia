import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { requireRole, pool } from "@/lib/auth.server";
import bcrypt from "bcryptjs";

// POST /api/users/:id/reset-password - Admin reset password
export async function action({ request, params }: ActionFunctionArgs) {
    if (request.method !== "POST") {
        return data({ error: "Method not allowed" }, { status: 405 });
    }

    await requireRole(request, ['admin']);
    const { id } = params;
    const body = await request.json();
    const { newPassword } = body;

    if (!newPassword || newPassword.length < 8) {
        return data({ error: "A senha deve ter no mínimo 8 caracteres" }, { status: 400 });
    }

    const userCheck = await pool.query('SELECT username FROM "user" WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
        return data({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password AND ensure accountId is standardized to username
    await pool.query(
        `UPDATE account 
         SET password = $1, "accountId" = $2, "updatedAt" = CURRENT_TIMESTAMP
         WHERE "userId" = $3 AND "providerId" = 'credential'`,
        [hashedPassword, userCheck.rows[0].username, id]
    );

    console.log(`[ADMIN] Password reset for user: ${userCheck.rows[0].username}`);
    return data({ success: true });
}
