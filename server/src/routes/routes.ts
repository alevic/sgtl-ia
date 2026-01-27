import { Router } from 'express';
import { pool } from '../auth';
import { RouteType } from '../../../types.js';

const router = Router();

// Listar todas as rotas
router.get('/', async (req, res) => {
    try {
        const { active } = req.query;
        let query = 'SELECT * FROM routes';
        const params: any[] = [];

        if (active !== undefined) {
            query += ' WHERE active = $1';
            params.push(active === 'true');
        }

        query += ' ORDER BY name ASC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar rotas:', error);
        res.status(500).json({ error: 'Erro interno ao listar rotas' });
    }
});

// Obter rota por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM routes WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Rota não encontrada' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar rota:', error);
        res.status(500).json({ error: 'Erro interno ao buscar rota' });
    }
});

// Criar nova rota
router.post('/', async (req, res) => {
    try {
        const {
            name,
            origin_city,
            origin_state,
            destination_city,
            destination_state,
            distance_km,
            duration_minutes,
            stops,
            active,
            type,
            organization_id
        } = req.body;

        // Validar campos obrigatórios
        if (!name || !origin_city || !origin_state || !destination_city || !destination_state) {
            return res.status(400).json({ error: 'Campos obrigatórios não informados' });
        }

        const orgId = organization_id || 'default-org'; // TODO: Get from authenticated user

        const result = await pool.query(
            `INSERT INTO routes (
                name, origin_city, origin_state, destination_city, destination_state,
                distance_km, duration_minutes, stops, active, type, organization_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
            [
                name, origin_city, origin_state, destination_city, destination_state,
                distance_km, duration_minutes, JSON.stringify(stops), active, type || RouteType.OUTBOUND, orgId
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao criar rota:', error);
        res.status(500).json({ error: 'Erro interno ao criar rota' });
    }
});

// Atualizar rota
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            origin_city,
            origin_state,
            destination_city,
            destination_state,
            distance_km,
            duration_minutes,
            stops,
            active,
            type
        } = req.body;

        const result = await pool.query(
            `UPDATE routes SET
                name = $1,
                origin_city = $2,
                origin_state = $3,
                destination_city = $4,
                destination_state = $5,
                distance_km = $6,
                duration_minutes = $7,
                stops = $8,
                active = $9,
                type = $10,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $11 RETURNING *`,
            [
                name, origin_city, origin_state, destination_city, destination_state,
                distance_km, duration_minutes, JSON.stringify(stops), active, type || RouteType.OUTBOUND, id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Rota não encontrada' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar rota:', error);
        res.status(500).json({ error: 'Erro interno ao atualizar rota' });
    }
});

// Excluir rota
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check dependencies (trips)
        const tripsCheck = await pool.query('SELECT id FROM trips WHERE route_id = $1', [id]);
        if (tripsCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Não é possível excluir rota com viagens vinculadas' });
        }

        const result = await pool.query('DELETE FROM routes WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Rota não encontrada' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao excluir rota:', error);
        res.status(500).json({ error: 'Erro interno ao excluir rota' });
    }
});

export const routesRouter = router;
