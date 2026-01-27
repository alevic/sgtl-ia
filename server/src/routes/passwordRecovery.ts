import { Router } from 'express';
import { pool } from '../config.js';
import { sendWhatsAppMessage } from '../services/whatsappService.js';
import crypto from 'crypto';

const router = Router();

// Store for temporary password reset codes (in production, use Redis)
const resetCodes = new Map<string, { code: string; userId: string; expiresAt: Date }>();

/**
 * Request password reset code via WhatsApp
 * POST /api/auth/request-password-reset
 * Body: { identifier: "Username, Phone, CPF or Email" }
 */
router.post('/request-password-reset', async (req, res) => {
    try {
        const { identifier } = req.body;

        if (!identifier) {
            return res.status(400).json({ error: 'Username, Telefone, CPF ou Email é obrigatório' });
        }

        // Clean identifier (remove formatting)
        const cleanIdentifier = identifier.replace(/\D/g, '');

        // Find user by username, phone, CPF, or email
        const result = await pool.query(
            `SELECT id, name, phone, username FROM "user" 
             WHERE LOWER(username) = LOWER($1)
             OR REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', '') = $2
             OR REPLACE(REPLACE(cpf, '.', ''), '-', '') = $2
             OR LOWER(email) = LOWER($1)`,
            [identifier, cleanIdentifier]
        );

        if (result.rows.length === 0) {
            // Don't reveal if user exists or not (security)
            return res.json({ success: true, message: 'Se o usuário existir, um código foi enviado via WhatsApp.' });
        }

        const user = result.rows[0];

        if (!user.phone) {
            return res.status(400).json({ error: 'Usuário não possui telefone cadastrado' });
        }

        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Store code (use phone as key for consistency)
        const phoneKey = user.phone.replace(/\D/g, '');
        resetCodes.set(phoneKey, { code, userId: user.id, expiresAt });

        // Send via WhatsApp
        const message = `Olá ${user.name}! Seu código de recuperação de senha é: ${code}\n\nEste código expira em 10 minutos.\n\nSe você não solicitou esta recuperação, ignore esta mensagem.`;

        await sendWhatsAppMessage(user.phone, message);

        console.log(`🔐 Password reset code sent to ${user.phone}: ${code}`);

        res.json({ success: true, message: 'Código enviado via WhatsApp!', phoneHint: user.phone.slice(-4) });
    } catch (error) {
        console.error('Error requesting password reset:', error);
        res.status(500).json({ error: 'Erro ao solicitar recuperação de senha' });
    }
});

/**
 * Verify reset code
 * POST /api/auth/verify-reset-code
 * Body: { phone: "user's phone", code: "123456" }
 */
router.post('/verify-reset-code', async (req, res) => {
    try {
        const { phone, code } = req.body;

        if (!phone || !code) {
            return res.status(400).json({ error: 'Telefone e código são obrigatórios' });
        }

        const phoneKey = phone.replace(/\D/g, '');
        const storedData = resetCodes.get(phoneKey);

        if (!storedData) {
            return res.status(400).json({ error: 'Código inválido ou expirado' });
        }

        if (storedData.expiresAt < new Date()) {
            resetCodes.delete(phoneKey);
            return res.status(400).json({ error: 'Código expirado' });
        }

        if (storedData.code !== code) {
            return res.status(400).json({ error: 'Código incorreto' });
        }

        // Code is valid, return a temporary token
        const resetToken = crypto.randomBytes(32).toString('hex');

        // Store reset token (replace code with token)
        resetCodes.set(resetToken, {
            code: '',
            userId: storedData.userId,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
        });

        // Delete the code
        resetCodes.delete(phoneKey);

        res.json({ success: true, resetToken });
    } catch (error) {
        console.error('Error verifying reset code:', error);
        res.status(500).json({ error: 'Erro ao verificar código' });
    }
});

/**
 * Reset password with token
 * POST /api/auth/reset-password-with-token
 * Body: { resetToken: "...", newPassword: "..." }
 */
router.post('/reset-password-with-token', async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;

        if (!resetToken || !newPassword) {
            return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'Senha deve ter no mínimo 8 caracteres' });
        }

        const storedData = resetCodes.get(resetToken);

        if (!storedData) {
            return res.status(400).json({ error: 'Token inválido ou expirado' });
        }

        if (storedData.expiresAt < new Date()) {
            resetCodes.delete(resetToken);
            return res.status(400).json({ error: 'Token expirado' });
        }

        // Hash password with bcrypt
        const bcrypt = await import('bcrypt');
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password in database
        await pool.query(
            'UPDATE account SET password = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE "userId" = $2 AND "providerId" = \'credential\'',
            [hashedPassword, storedData.userId]
        );

        // Delete reset token
        resetCodes.delete(resetToken);

        console.log(`✅ Password reset successful for user ${storedData.userId}`);

        res.json({ success: true, message: 'Senha alterada com sucesso!' });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ error: 'Erro ao redefinir senha' });
    }
});

export default router;
