import { Router } from 'express';
import {
    isUsernameAvailable,
    generateAvailableUsernames,
    validateUsername
} from '../services/usernameService.js';

const router = Router();

/**
 * Check if username is available
 * GET /api/auth/check-username/:username
 */
router.get('/check-username/:username', async (req, res) => {
    try {
        const { username } = req.params;

        // Validate format
        const validation = validateUsername(username);
        if (!validation.valid) {
            return res.json({
                available: false,
                error: validation.error
            });
        }

        // Check availability
        const available = await isUsernameAvailable(username);

        res.json({ available });
    } catch (error) {
        console.error('Error checking username:', error);
        res.status(500).json({ error: 'Erro ao verificar username' });
    }
});

/**
 * Generate username suggestions based on name
 * POST /api/auth/suggest-username
 * Body: { name: "João Silva" }
 */
router.post('/suggest-username', async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || typeof name !== 'string') {
            return res.status(400).json({ error: 'Nome é obrigatório' });
        }

        const suggestions = await generateAvailableUsernames(name);

        res.json({ suggestions });
    } catch (error) {
        console.error('Error generating username suggestions:', error);
        res.status(500).json({ error: 'Erro ao gerar sugestões de username' });
    }
});

export default router;
