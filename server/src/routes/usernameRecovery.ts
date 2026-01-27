import { Router } from 'express';
import { pool } from '../config';
import { sendWhatsAppMessage } from '../services/whatsappService';

const router = Router();

/**
 * Recover username via WhatsApp
 * POST /api/auth/recover-username
 * Body: { identifier: "Phone, CPF or Email" }
 */
router.post('/recover-username', async (req, res) => {
    try {
        const { identifier } = req.body;

        if (!identifier) {
            return res.status(400).json({ error: 'Telefone, CPF ou Email é obrigatório' });
        }

        // Clean identifier
        const cleanIdentifier = identifier.replace(/\D/g, '');

        // Find user by phone, CPF, or email
        const result = await pool.query(
            `SELECT username, name, phone FROM "user" 
             WHERE REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', '') = $1
             OR REPLACE(REPLACE(cpf, '.', ''), '-', '') = $1
             OR LOWER(email) = LOWER($2)`,
            [cleanIdentifier, identifier]
        );

        if (result.rows.length === 0) {
            // Don't reveal if user exists (security)
            return res.json({
                success: true,
                message: 'Se o usuário existir, o username foi enviado via WhatsApp.'
            });
        }

        const user = result.rows[0];

        if (!user.phone) {
            return res.status(400).json({ error: 'Usuário não possui telefone cadastrado' });
        }

        if (!user.username) {
            return res.status(400).json({ error: 'Usuário não possui username cadastrado' });
        }

        // Send username via WhatsApp
        const message = `Olá ${user.name}!\n\nSeu username é: *${user.username}*\n\nUse-o para fazer login no sistema.\n\nSe você não solicitou esta informação, ignore esta mensagem.`;

        await sendWhatsAppMessage(user.phone, message);

        console.log(`📱 Username sent to ${user.phone}: ${user.username}`);

        res.json({
            success: true,
            message: 'Username enviado via WhatsApp!'
        });
    } catch (error) {
        console.error('Error recovering username:', error);
        res.status(500).json({ error: 'Erro ao recuperar username' });
    }
});

export default router;
