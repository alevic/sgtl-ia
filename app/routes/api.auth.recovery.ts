import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { pool } from "@/lib/auth.server";
import { sendWhatsAppMessage } from "@/lib/whatsapp.server";
import crypto from "crypto";
import bcrypt from "bcryptjs";

// In-memory store (Replace with Redis/DB in production scaling)
const resetCodes = new Map<string, { code: string; userId: string; expiresAt: Date }>();

export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== "POST") {
        return data({ error: "Method not allowed" }, { status: 405 });
    }

    const body = await request.json();
    const { intent } = body;

    if (intent === "request" || intent === "recover-username") {
        const { identifier } = body;
        if (!identifier) return data({ error: "Identificador obrigatório" }, { status: 400 });

        const cleanIdentifier = identifier.replace(/\D/g, '');

        const result = await pool.query(
            `SELECT id, name, phone, username, cpf, email FROM "user" 
             WHERE LOWER(username) = LOWER($1)
             OR REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', '') = $2
             OR ($2 <> '' AND REPLACE(REPLACE(cpf, '.', ''), '-', '') = $2)
             OR LOWER(email) = LOWER($1)`,
            [identifier, cleanIdentifier]
        );

        if (result.rows.length === 0) {
            return data({ success: true, message: 'Se o usuário existir, a informação foi enviada.' });
        }

        const user = result.rows[0];
        if (!user.phone) {
            return data({ error: 'Usuário não possui telefone cadastrado' }, { status: 400 });
        }

        if (intent === "recover-username") {
            if (!user.username) return data({ error: "Usuário sem username" }, { status: 400 });
            const message = `Olá ${user.name}!\n\nSeu username é: *${user.username}*\n\nUse-o para login.`;
            await sendWhatsAppMessage(user.phone, message);
            return data({ success: true, message: 'Username enviado via WhatsApp' });
        }


        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
        const phoneKey = user.phone.replace(/\D/g, '');

        resetCodes.set(phoneKey, { code, userId: user.id, expiresAt });

        const message = `Olá ${user.name}! Seu código de recuperação de senha é: ${code}\n\nExpira em 10 minutos.`;
        await sendWhatsAppMessage(user.phone, message);

        console.log(`[RECOVERY] Code sent to ${user.username}: ${code}`); // Log for debug

        return data({ success: true, message: 'Código enviado via WhatsApp', phoneHint: user.phone.slice(-4) });
    }

    // 2. Verify Code
    if (intent === "verify") {
        const { phone, code } = body;
        if (!phone || !code) return data({ error: "Campos obrigatórios" }, { status: 400 });

        const phoneKey = phone.replace(/\D/g, '');
        const stored = resetCodes.get(phoneKey);

        if (!stored) return data({ error: "Código inválido ou expirado" }, { status: 400 });
        if (stored.expiresAt < new Date()) {
            resetCodes.delete(phoneKey);
            return data({ error: "Código expirado" }, { status: 400 });
        }
        if (stored.code !== code) return data({ error: "Código incorreto" }, { status: 400 });

        const resetToken = crypto.randomBytes(32).toString('hex');
        resetCodes.set(resetToken, {
            code: '', userId: stored.userId, expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        });
        resetCodes.delete(phoneKey);

        return data({ success: true, resetToken });
    }

    // 3. Reset Password
    if (intent === "reset") {
        const { resetToken, newPassword } = body;
        if (!resetToken || !newPassword) return data({ error: "Campos obrigatórios" }, { status: 400 });

        const stored = resetCodes.get(resetToken);
        if (!stored || stored.expiresAt < new Date()) {
            return data({ error: "Token inválido ou expirado" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user password (Better Auth credential)
        await pool.query(
            `UPDATE account SET password = $1, "updatedAt" = CURRENT_TIMESTAMP 
             WHERE "userId" = $2 AND "providerId" = 'credential'`,
            [hashedPassword, stored.userId]
        );

        resetCodes.delete(resetToken);
        return data({ success: true, message: "Senha alterada com sucesso" });
    }

    return data({ error: "Invalid intent" }, { status: 400 });
}
