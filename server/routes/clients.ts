import express from 'express';
import { pool } from '../auth';

const router = express.Router();

// Get all clients
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM clients ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ error: 'Failed to fetch clients' });
    }
});

// Get client by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching client:', error);
        res.status(500).json({ error: 'Failed to fetch client' });
    }
});

// Create client
router.post('/', async (req, res) => {
    const {
        nome, email, telefone, documento_tipo, documento_numero,
        nacionalidade, data_nascimento, endereco, cidade, estado, pais,
        segmento, observacoes
    } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO clients (
                nome, email, telefone, documento_tipo, documento_numero,
                nacionalidade, data_nascimento, endereco, cidade, estado, pais,
                segmento, observacoes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *`,
            [
                nome, email, telefone, documento_tipo, documento_numero,
                nacionalidade, data_nascimento, endereco, cidade, estado, pais,
                segmento, observacoes
            ]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating client:', error);
        res.status(500).json({ error: 'Failed to create client' });
    }
});

// Update client
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const {
        nome, email, telefone, documento_tipo, documento_numero,
        nacionalidade, data_nascimento, endereco, cidade, estado, pais,
        segmento, observacoes
    } = req.body;

    try {
        const result = await pool.query(
            `UPDATE clients SET
                nome = $1, email = $2, telefone = $3, documento_tipo = $4, documento_numero = $5,
                nacionalidade = $6, data_nascimento = $7, endereco = $8, cidade = $9, estado = $10, pais = $11,
                segmento = $12, observacoes = $13, updated_at = CURRENT_TIMESTAMP
            WHERE id = $14
            RETURNING *`,
            [
                nome, email, telefone, documento_tipo, documento_numero,
                nacionalidade, data_nascimento, endereco, cidade, estado, pais,
                segmento, observacoes, id
            ]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating client:', error);
        res.status(500).json({ error: 'Failed to update client' });
    }
});

// Delete client
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM clients WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting client:', error);
        res.status(500).json({ error: 'Failed to delete client' });
    }
});

// Get client interactions
router.get('/:id/interactions', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM client_interactions WHERE cliente_id = $1 ORDER BY data_hora DESC', [id]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching interactions:', error);
        res.status(500).json({ error: 'Failed to fetch interactions' });
    }
});

// Add interaction
router.post('/:id/interactions', async (req, res) => {
    const { id } = req.params;
    const { tipo, descricao, usuario_responsavel } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO client_interactions (cliente_id, tipo, descricao, usuario_responsavel)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [id, tipo, descricao, usuario_responsavel]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding interaction:', error);
        res.status(500).json({ error: 'Failed to add interaction' });
    }
});

// Get client notes
router.get('/:id/notes', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM client_notes WHERE cliente_id = $1 ORDER BY data_criacao DESC', [id]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ error: 'Failed to fetch notes' });
    }
});

// Add note
router.post('/:id/notes', async (req, res) => {
    const { id } = req.params;
    const { titulo, conteudo, criado_por, importante } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO client_notes (cliente_id, titulo, conteudo, criado_por, importante)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [id, titulo, conteudo, criado_por, importante]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding note:', error);
        res.status(500).json({ error: 'Failed to add note' });
    }
});

export default router;
