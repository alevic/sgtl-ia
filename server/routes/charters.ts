import express from "express";
import { pool } from "../auth";
import { auth } from "../auth";
import { FretamentoStatus } from "../../types";

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

            if (!allowedRoles.includes(userRole)) {
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

// GET all charter requests
router.get("/", authorize(['admin', 'operacional', 'vendas']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { status, contact_name, start_date, end_date } = req.query;

        let query = `SELECT * FROM charter_requests WHERE organization_id = $1`;
        const params: any[] = [orgId];
        let paramCount = 1;

        if (status) {
            paramCount++;
            query += ` AND status = $${paramCount}`;
            params.push(status);
        }

        if (contact_name) {
            paramCount++;
            query += ` AND contact_name ILIKE $${paramCount}`;
            params.push(`%${contact_name}%`);
        }

        if (start_date) {
            paramCount++;
            query += ` AND departure_date >= $${paramCount}`;
            params.push(start_date);
        }

        if (end_date) {
            paramCount++;
            query += ` AND departure_date <= $${paramCount}`;
            params.push(end_date);
        }

        query += ` ORDER BY created_at DESC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching charter requests:", error);
        res.status(500).json({ error: "Failed to fetch charter requests" });
    }
});

// GET single charter request
router.get("/:id", authorize(['admin', 'operacional', 'vendas']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { id } = req.params;

        const result = await pool.query(
            `SELECT * FROM charter_requests WHERE id = $1 AND organization_id = $2`,
            [id, orgId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Charter request not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching charter request:", error);
        res.status(500).json({ error: "Failed to fetch charter request" });
    }
});

// POST create charter request
router.post("/", authorize(['admin', 'operacional', 'vendas']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const userId = session.user.id;

        const {
            contact_name, contact_email, contact_phone, company_name,
            origin_city, origin_state, destination_city, destination_state,
            departure_date, departure_time, return_date, return_time,
            passenger_count, vehicle_type_requested,
            description, client_id, notes
        } = req.body;

        const result = await pool.query(
            `INSERT INTO charter_requests (
                contact_name, contact_email, contact_phone, company_name,
                origin_city, origin_state, destination_city, destination_state,
                departure_date, departure_time, return_date, return_time,
                passenger_count, vehicle_type_requested,
                description, status,
                user_id, client_id, notes,
                organization_id, created_by,
                vehicle_id, driver_id, rota_ida_id, rota_volta_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
            RETURNING *`,
            [
                contact_name, contact_email, contact_phone, company_name || null,
                origin_city, origin_state, destination_city, destination_state,
                departure_date, departure_time || null, return_date || null, return_time || null,
                passenger_count, vehicle_type_requested || null,
                description || null, FretamentoStatus.REQUEST,
                null, client_id || null, notes || null,
                orgId, userId,
                req.body.vehicle_id || null, req.body.driver_id || null, req.body.rota_ida_id || null, req.body.rota_volta_id || null
            ]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error creating charter request:", error);
        res.status(500).json({ error: "Failed to create charter request" });
    }
});

// PUT update charter request (e.g., quote, approve)
router.put("/:id", authorize(['admin', 'operacional', 'vendas']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { id } = req.params;
        const { status, quote_price, notes } = req.body;

        const result = await pool.query(
            `UPDATE charter_requests SET
                status = COALESCE($1, status),
                quote_price = COALESCE($2, quote_price),
                notes = COALESCE($3, notes),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $4 AND organization_id = $5
            RETURNING *`,
            [status, quote_price, notes, id, orgId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Charter request not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating charter request:", error);
        res.status(500).json({ error: "Failed to update charter request" });
    }
});

export default router;
