import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { requireAuth, pool } from "@/lib/auth.server";
import bcrypt from "bcryptjs";

// POST /api/profile/change-password
export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== "POST") {
        return data({ error: "Method not allowed" }, { status: 405 });
    }

    const session = await requireAuth(request);
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
        return data({ error: "Senhas são obrigatórias" }, { status: 400 });
    }

    if (newPassword.length < 8) {
        return data({ error: "A nova senha deve ter no mínimo 8 caracteres" }, { status: 400 });
    }

    const accountResult = await pool.query(
        'SELECT password, "accountId" FROM account WHERE "userId" = $1 AND "providerId" = \'credential\'',
        [session.user.id]
    );

    if (accountResult.rows.length === 0) {
        return data({ error: "Conta não encontrada" }, { status: 404 });
    }

    const isValid = await bcrypt.compare(currentPassword, accountResult.rows[0].password);

    if (!isValid) {
        return data({ error: "Senha atual incorreta" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Get username for accountId sync
    const userResult = await pool.query('SELECT username FROM "user" WHERE id = $1', [session.user.id]);
    const username = userResult.rows[0]?.username || session.user.email;

    await pool.query(
        'UPDATE account SET password = $1, "accountId" = $2, "updatedAt" = CURRENT_TIMESTAMP WHERE "userId" = $3 AND "providerId" = \'credential\'',
        [hashedPassword, username, session.user.id]
    );

    console.log(`[PROFILE] Password changed for user: ${username}`);
    return data({ success: true });
}
