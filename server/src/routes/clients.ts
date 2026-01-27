import express from 'express';
import { pool, auth } from '../auth.js';
import { ReservationStatus } from '../types.js';
import { AuditService } from '../services/auditService.js';

const router = express.Router();

// Helper for authorization
const authorize = (allowedRoles: string[]) => {
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            const session = await auth.api.getSession({ headers: req.headers as HeadersInit });
            if (!session) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            if (!session.session.activeOrganizationId) {
                return res.status(401).json({ error: "Unauthorized: No active organization" });
            }

            const userRole = (session.user as any).role || 'user';

            if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
                return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
            }

            (req as any).session = session;
            next();
        } catch (error) {
            console.error("Auth middleware error:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    };
};

// Get all clients
router.get('/', authorize(['admin', 'operacional', 'vendas', 'financeiro']), async (req, res) => {
    const orgId = (req as any).session.session.activeOrganizationId;
    const { search } = req.query;
    try {
        let sql = `
            SELECT c.*,
            (
                SELECT COALESCE(COUNT(*), 0)
                FROM reservations r 
                WHERE r.client_id = c.id 
                AND (r.status IN ($2, $3, $4) OR r.status IN ('CONFIRMADA', 'UTILIZADA', 'EMBARCADO', 'CONFIRMED', 'USED', 'CHECKED_IN'))
                AND r.organization_id = $1
            )::int as historico_viagens,
            (
                SELECT COALESCE(SUM(r.amount_paid), 0)
                FROM reservations r 
                WHERE r.client_id = c.id 
                AND (r.status NOT IN ($5, $6) AND r.status NOT IN ('CANCELADA', 'PENDENTE', 'CANCELLED', 'PENDING'))
                AND r.organization_id = $1
            )::float as valor_total_gasto,
            (
                SELECT MAX(t.departure_date)
                FROM reservations r 
                JOIN trips t ON r.trip_id = t.id
                WHERE r.client_id = c.id 
                AND (r.status IN ($2, $3, $4) OR r.status IN ('CONFIRMADA', 'UTILIZADA', 'EMBARCADO', 'CONFIRMED', 'USED', 'CHECKED_IN'))
                AND t.departure_date <= CURRENT_DATE
                AND r.organization_id = $1
            ) as ultima_viagem
            FROM clients c 
            WHERE 1=1
        `;
        const params: any[] = [
            orgId,
            ReservationStatus.CONFIRMED,
            ReservationStatus.USED,
            ReservationStatus.CHECKED_IN,
            ReservationStatus.CANCELLED,
            ReservationStatus.PENDING
        ];

        if (search) {
            sql += ` AND (c.nome ILIKE $6 OR c.email ILIKE $6 OR c.documento ILIKE $6)`;
            params.push(`%${search}%`);
        }

        sql += ` ORDER BY c.created_at DESC`;

        const result = await pool.query(sql, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ error: 'Failed to fetch clients' });
    }
});

// Get client by ID
router.get('/:id', authorize(['admin', 'operacional', 'vendas', 'financeiro']), async (req, res) => {
    const { id } = req.params;
    const orgId = (req as any).session.session.activeOrganizationId;
    try {
        const result = await pool.query(`
            SELECT c.*,
            (
                SELECT COALESCE(COUNT(*), 0)
                FROM reservations r 
                WHERE r.client_id = c.id 
                AND (r.status IN ($3, $4, $5) OR r.status IN ('CONFIRMADA', 'UTILIZADA', 'EMBARCADO', 'CONFIRMED', 'USED', 'CHECKED_IN'))
                AND r.organization_id = $2
            )::int as historico_viagens,
            (
                SELECT COALESCE(SUM(r.amount_paid), 0)
                FROM reservations r 
                WHERE r.client_id = c.id 
                AND (r.status NOT IN ($6, $7) AND r.status NOT IN ('CANCELADA', 'PENDENTE', 'CANCELLED', 'PENDING'))
                AND r.organization_id = $2
            )::float as valor_total_gasto,
            (
                SELECT MAX(t.departure_date)
                FROM reservations r 
                JOIN trips t ON r.trip_id = t.id
                WHERE r.client_id = c.id 
                AND (r.status IN ($3, $4, $5) OR r.status IN ('CONFIRMADA', 'UTILIZADA', 'EMBARCADO', 'CONFIRMED', 'USED', 'CHECKED_IN'))
                AND t.departure_date <= CURRENT_DATE
                AND r.organization_id = $2
            ) as ultima_viagem
            FROM clients c 
            WHERE c.id = $1
        `, [
            id,
            orgId,
            ReservationStatus.CONFIRMED,
            ReservationStatus.USED,
            ReservationStatus.CHECKED_IN,
            ReservationStatus.CANCELLED,
            ReservationStatus.PENDING
        ]);

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
router.post('/', authorize(['admin', 'operacional', 'vendas']), async (req, res) => {
    const orgId = (req as any).session.session.activeOrganizationId;
    const {
        nome, email, telefone, documento_tipo, documento,
        nacionalidade, data_nascimento, endereco, cidade, estado, pais,
        segmento, observacoes
    } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO clients (
                nome, email, telefone, documento_tipo, documento,
                nacionalidade, data_nascimento, endereco, cidade, estado, pais,
                segmento, observacoes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *`,
            [
                nome, email, telefone, documento_tipo, documento,
                nacionalidade, data_nascimento, endereco, cidade, estado, pais,
                segmento, observacoes
            ]
        );
        const newClient = result.rows[0];

        // Audit Log
        AuditService.logEvent({
            userId: (req as any).session.user.id,
            organizationId: orgId as string,
            action: 'CLIENT_CREATE',
            entity: 'client',
            entityId: newClient.id,
            newData: newClient,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        }).catch(console.error);

        res.status(201).json(newClient);

    } catch (error) {
        console.error('Error creating client:', error);
        res.status(500).json({ error: 'Failed to create client' });
    }
});

// Update client
// Update client (Supports partial updates)
router.put('/:id', authorize(['admin', 'operacional', 'vendas', 'financeiro']), async (req, res) => {
    const { id } = req.params;
    const orgId = (req as any).session.session.activeOrganizationId;
    const {
        nome, email, telefone, documento_tipo, documento,
        nacionalidade, data_nascimento, endereco, cidade, estado, pais,
        segmento, observacoes, saldo_creditos
    } = req.body;

    try {
        const check = await pool.query(
            "SELECT * FROM clients WHERE id = $1",
            [id]
        );

        if (check.rows.length === 0) {
            return res.status(404).json({ error: 'Client not found or outside organization' });
        }

        const oldClient = check.rows[0];

        const result = await pool.query(
            `UPDATE clients SET
                nome = COALESCE($1, nome),
                email = COALESCE($2, email),
                telefone = COALESCE($3, telefone),
                documento_tipo = COALESCE($4, documento_tipo),
                documento = COALESCE($5, documento),
                nacionalidade = COALESCE($6, nacionalidade),
                data_nascimento = COALESCE($7, data_nascimento),
                endereco = COALESCE($8, endereco),
                cidade = COALESCE($9, cidade),
                estado = COALESCE($10, estado),
                pais = COALESCE($11, pais),
                segmento = COALESCE($12, segmento),
                observacoes = COALESCE($13, observacoes),
                saldo_creditos = COALESCE($14, saldo_creditos),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $15
            RETURNING *`,
            [
                nome, email, telefone, documento_tipo, documento,
                nacionalidade, data_nascimento, endereco, cidade, estado, pais,
                segmento, observacoes, saldo_creditos, id
            ]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Client not found or outside organization' });
        }
        const updatedClient = result.rows[0];

        // Audit Log
        AuditService.logEvent({
            userId: (req as any).session.user.id,
            organizationId: orgId as string,
            action: 'CLIENT_UPDATE',
            entity: 'client',
            entityId: updatedClient.id,
            oldData: oldClient,
            newData: updatedClient,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        }).catch(console.error);

        res.json(updatedClient);

    } catch (error) {
        console.error('Error updating client:', error);
        res.status(500).json({ error: 'Failed to update client' });
    }
});

// Delete client
router.delete('/:id', authorize(['admin']), async (req, res) => {
    const { id } = req.params;
    const orgId = (req as any).session.session.activeOrganizationId;
    try {
        const result = await pool.query('DELETE FROM clients WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }
        // Audit Log
        AuditService.logEvent({
            userId: (req as any).session.user.id,
            organizationId: orgId as string,
            action: 'CLIENT_DELETE',
            entity: 'client',
            entityId: id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        }).catch(console.error);

        res.json({ success: true });

    } catch (error) {
        console.error('Error deleting client:', error);
        res.status(500).json({ error: 'Failed to delete client' });
    }
});

// Get client interactions
router.get('/:id/interactions', authorize(['admin', 'operacional', 'vendas']), async (req, res) => {
    const { id } = req.params;
    const orgId = (req as any).session.session.activeOrganizationId;
    try {
        const result = await pool.query(`
            SELECT ci.* 
            FROM client_interactions ci
            WHERE ci.cliente_id = $1 AND ci.organization_id = $2
            ORDER BY ci.data_hora DESC
        `, [id, orgId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching interactions:', error);
        res.status(500).json({ error: 'Failed to fetch interactions' });
    }
});

// Add interaction
router.post('/:id/interactions', authorize(['admin', 'operacional', 'vendas']), async (req, res) => {
    const { id } = req.params;
    const orgId = (req as any).session.session.activeOrganizationId;
    const { tipo, descricao, usuario_responsavel } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO client_interactions (cliente_id, tipo, descricao, usuario_responsavel, organization_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [id, tipo, descricao, usuario_responsavel, orgId]
        );
        const newInteraction = result.rows[0];

        // Audit Log
        AuditService.logEvent({
            userId: (req as any).session.user.id,
            organizationId: orgId as string,
            action: 'INTERACTION_CREATE',
            entity: 'client_interaction',
            entityId: newInteraction.id,
            newData: newInteraction,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        }).catch(console.error);

        res.status(201).json(newInteraction);

    } catch (error) {
        console.error('Error adding interaction:', error);
        res.status(500).json({ error: 'Failed to add interaction' });
    }
});

// Get client notes
router.get('/:id/notes', authorize(['admin', 'operacional', 'vendas']), async (req, res) => {
    const { id } = req.params;
    const orgId = (req as any).session.session.activeOrganizationId;
    try {
        const result = await pool.query(`
            SELECT cn.* 
            FROM client_notes cn
            WHERE cn.cliente_id = $1 AND cn.organization_id = $2
            ORDER BY cn.data_criacao DESC
        `, [id, orgId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ error: 'Failed to fetch notes' });
    }
});

// Add note
router.post('/:id/notes', authorize(['admin', 'operacional', 'vendas']), async (req, res) => {
    const { id } = req.params;
    const orgId = (req as any).session.session.activeOrganizationId;
    const { titulo, conteudo, criado_por, importante } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO client_notes (cliente_id, titulo, conteudo, criado_por, importante, organization_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [id, titulo, conteudo, criado_por, importante, orgId]
        );
        const newNote = result.rows[0];

        // Audit Log
        AuditService.logEvent({
            userId: (req as any).session.user.id,
            organizationId: orgId as string,
            action: 'NOTE_CREATE',
            entity: 'client_note',
            entityId: newNote.id,
            newData: newNote,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        }).catch(console.error);

        res.status(201).json(newNote);

    } catch (error) {
        console.error('Error adding note:', error);
        res.status(500).json({ error: 'Failed to add note' });
    }
});

export default router;
