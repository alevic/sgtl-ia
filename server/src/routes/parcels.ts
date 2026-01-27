import express from "express";
import { pool } from "../auth";
import { auth } from "../auth";
import crypto from "crypto";
import { EncomendaStatus } from "../../../types.js";

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

// GET all parcels
router.get("/", authorize(['admin', 'operacional', 'vendas']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { status, tracking_code, sender_name, recipient_name } = req.query;

        let query = `SELECT * FROM parcel_orders WHERE organization_id = $1`;
        const params: any[] = [orgId];
        let paramCount = 1;

        if (status) {
            paramCount++;
            query += ` AND status = $${paramCount}`;
            params.push(status);
        }

        if (tracking_code) {
            paramCount++;
            query += ` AND tracking_code ILIKE $${paramCount}`;
            params.push(`%${tracking_code}%`);
        }

        if (sender_name) {
            paramCount++;
            query += ` AND sender_name ILIKE $${paramCount}`;
            params.push(`%${sender_name}%`);
        }

        if (recipient_name) {
            paramCount++;
            query += ` AND recipient_name ILIKE $${paramCount}`;
            params.push(`%${recipient_name}%`);
        }

        query += ` ORDER BY created_at DESC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching parcels:", error);
        res.status(500).json({ error: "Failed to fetch parcels" });
    }
});

// GET single parcel
router.get("/:id", authorize(['admin', 'operacional', 'vendas']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { id } = req.params;

        const result = await pool.query(
            `SELECT p.*, 
                   t.departure_date, t.departure_time,
                   route.name as route_name
            FROM parcel_orders p
            LEFT JOIN trips t ON p.trip_id = t.id
            LEFT JOIN routes route ON t.route_id = route.id
            WHERE p.id = $1 AND p.organization_id = $2`,
            [id, orgId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Parcel not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching parcel:", error);
        res.status(500).json({ error: "Failed to fetch parcel" });
    }
});

// POST create parcel
router.post("/", authorize(['admin', 'operacional', 'vendas']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const userId = session.user.id;

        const {
            sender_name, sender_document, sender_phone,
            recipient_name, recipient_document, recipient_phone,
            origin_city, origin_state, destination_city, destination_state,
            description, weight, dimensions,
            price, client_id, notes, trip_id
        } = req.body;

        // Generate Tracking Code (e.g., P-123456)
        const tracking_code = 'P-' + crypto.randomBytes(3).toString('hex').toUpperCase();

        const result = await pool.query(
            `INSERT INTO parcel_orders (
                sender_name, sender_document, sender_phone,
                recipient_name, recipient_document, recipient_phone,
                origin_city, origin_state, destination_city, destination_state,
                description, weight, dimensions,
                status, tracking_code, price,
                trip_id, user_id, client_id, notes,
                organization_id, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
            RETURNING *`,
            [
                sender_name, sender_document, sender_phone,
                recipient_name, recipient_document, recipient_phone,
                origin_city, origin_state, destination_city, destination_state,
                description, weight || 0, dimensions || null,
                EncomendaStatus.PENDING, tracking_code, price,
                trip_id || null, null, client_id || null, notes || null,
                orgId, userId
            ]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error creating parcel:", error);
        res.status(500).json({ error: "Failed to create parcel" });
    }
});

// PUT update parcel
router.put("/:id", authorize(['admin', 'operacional', 'vendas']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { id } = req.params;
        const { status, notes, trip_id } = req.body;

        const result = await pool.query(
            `UPDATE parcel_orders SET
                status = COALESCE($1, status),
                notes = COALESCE($2, notes),
                trip_id = COALESCE($3, trip_id),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $4 AND organization_id = $5
            RETURNING *`,
            [status, notes, trip_id, id, orgId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Parcel not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating parcel:", error);
        res.status(500).json({ error: "Failed to update parcel" });
    }
});

export default router;
