import express from "express";
import { pool } from "../auth";
import { auth } from "../auth";
import crypto from "crypto";

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

// GET all reservations
router.get("/", authorize(['admin', 'operacional', 'vendas']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { trip_id, status, ticket_code, passenger_name } = req.query;

        let query = `
            SELECT r.*, 
                   t.departure_date, t.departure_time, t.title as trip_title,
                   route.name as route_name, route.stops as route_stops,
                   rr.stops as return_route_stops,
                   s.numero as seat_number, s.tipo as seat_type
            FROM reservations r
            JOIN trips t ON r.trip_id = t.id
            JOIN routes route ON t.route_id = route.id
            LEFT JOIN routes rr ON t.return_route_id = rr.id
            LEFT JOIN seat s ON r.seat_id = s.id
            WHERE r.organization_id = $1
        `;
        const params: any[] = [orgId];
        let paramCount = 1;

        if (trip_id) {
            paramCount++;
            query += ` AND r.trip_id = $${paramCount}`;
            params.push(trip_id);
        }

        if (status) {
            paramCount++;
            query += ` AND r.status = $${paramCount}`;
            params.push(status);
        }

        if (ticket_code) {
            paramCount++;
            query += ` AND r.ticket_code ILIKE $${paramCount}`;
            params.push(`%${ticket_code}%`);
        }

        if (passenger_name) {
            paramCount++;
            query += ` AND r.passenger_name ILIKE $${paramCount}`;
            params.push(`%${passenger_name}%`);
        }

        if (req.query.client_id) {
            paramCount++;
            query += ` AND r.client_id = $${paramCount}`;
            params.push(req.query.client_id);
        }

        query += ` ORDER BY r.created_at DESC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching reservations:", error);
        res.status(500).json({ error: "Failed to fetch reservations" });
    }
});

// GET single reservation
router.get("/:id", authorize(['admin', 'operacional', 'vendas']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { id } = req.params;

        const result = await pool.query(
            `SELECT r.*, 
                   t.departure_date, t.departure_time, t.title as trip_title,
                   route.name as route_name, route.origin_city, route.destination_city,
                   s.numero as seat_number, s.tipo as seat_type
            FROM reservations r
            JOIN trips t ON r.trip_id = t.id
            JOIN routes route ON t.route_id = route.id
            LEFT JOIN seat s ON r.seat_id = s.id
            WHERE r.id = $1 AND r.organization_id = $2`,
            [id, orgId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Reservation not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching reservation:", error);
        res.status(500).json({ error: "Failed to fetch reservation" });
    }
});

// POST create reservation
router.post("/", authorize(['admin', 'operacional', 'vendas']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const userId = session.user.id;

        const {
            trip_id, seat_id, seat_number,
            passenger_name, passenger_document, passenger_email, passenger_phone,
            price, client_id, notes, status,
            valor_pago, forma_pagamento,
            boarding_point, dropoff_point
        } = req.body;

        // Verify status if provided
        const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'CHECKED_IN', 'NO_SHOW', 'USED', 'COMPLETED'];
        const finalStatus = (status && validStatuses.includes(status)) ? status : 'PENDING';

        // Check for double booking using seat_number if provided (fallback for when seat_id is missing or to cover all bases)
        if (seat_number) {
            const duplicateCheck = await pool.query(
                `SELECT r.id FROM reservations r 
                 LEFT JOIN seat s ON r.seat_id = s.id
                 WHERE r.trip_id = $1 
                 AND (r.seat_id = $2 OR s.numero = $3)
                 AND r.status != 'CANCELLED'`,
                [trip_id, seat_id || '00000000-0000-0000-0000-000000000000', seat_number]
            );

            if (duplicateCheck.rows.length > 0) {
                return res.status(409).json({ error: `O assento ${seat_number} já está reservado para esta viagem.` });
            }
        }

        // Verify seat availability if seat_id is provided
        if (seat_id) {
            const seatCheck = await pool.query(
                "SELECT status FROM seat WHERE id = $1",
                [seat_id]
            );
            if (seatCheck.rows.length === 0) {
                return res.status(404).json({ error: "Seat not found" });
            }

            // Check overlap by seat_id
            const reservationCheck = await pool.query(
                "SELECT id FROM reservations WHERE trip_id = $1 AND seat_id = $2 AND status != 'CANCELLED'",
                [trip_id, seat_id]
            );

            if (reservationCheck.rows.length > 0) {
                return res.status(400).json({ error: "Seat already reserved for this trip" });
            }
        }

        // Generate Ticket Code (e.g., T-123456)
        const ticket_code = 'T-' + crypto.randomBytes(3).toString('hex').toUpperCase();

        const result = await pool.query(
            `INSERT INTO reservations (
                trip_id, seat_id,
                passenger_name, passenger_document, passenger_email, passenger_phone,
                status, ticket_code, price,
                user_id, client_id, notes,
                organization_id, created_by,
                amount_paid, payment_method, external_payment_id,
                boarding_point, dropoff_point
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            RETURNING *`,
            [
                trip_id, seat_id || null,
                passenger_name, passenger_document, passenger_email || null, passenger_phone || null,
                finalStatus, ticket_code, price,
                null, client_id || null, notes || null,
                orgId, userId,
                valor_pago || 0, forma_pagamento || null,
                req.body.external_payment_id || null, // Store External Payment ID
                boarding_point || null, dropoff_point || null
            ]
        );

        // Update seats available count on trip
        await pool.query(
            "UPDATE trips SET seats_available = seats_available - 1 WHERE id = $1",
            [trip_id]
        );

        // Handle Credit Deduction
        const { credits_used } = req.body;
        if (credits_used && Number(credits_used) > 0 && client_id) {
            // Verify and Deduct
            // We use a transaction-like approach or just direct update checks
            const debitResult = await pool.query(
                `UPDATE clients 
                 SET saldo_creditos = saldo_creditos - $1 
                 WHERE id = $2 AND saldo_creditos >= $1
                 RETURNING id`,
                [credits_used, client_id]
            );

            if (debitResult.rowCount === 0) {
                console.warn(`Failed to deduct credits for client ${client_id}. Insufficient funds or invalid ID.`);
                // We don't rollback the reservation here to avoid partial state chaos, but user should know.
                // ideally this runs in a transaction block with the reservation creation.
            }
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error creating reservation:", error);
        res.status(500).json({ error: "Failed to create reservation" });
    }
});

// PUT update reservation (e.g., cancel, check-in)
router.put("/:id", authorize(['admin', 'operacional', 'vendas']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { id } = req.params;
        const { status, notes, passenger_name, passenger_document, forma_pagamento, valor_pago, boarding_point, dropoff_point } = req.body;

        const currentRes = await pool.query(
            "SELECT status, trip_id FROM reservations WHERE id = $1 AND organization_id = $2",
            [id, orgId]
        );

        if (currentRes.rows.length === 0) {
            return res.status(404).json({ error: "Reservation not found" });
        }

        const oldStatus = currentRes.rows[0].status;

        const result = await pool.query(
            `UPDATE reservations SET
                status = COALESCE($1, status),
                notes = COALESCE($2, notes),
                passenger_name = COALESCE($3, passenger_name),
                passenger_document = COALESCE($4, passenger_document),
                payment_method = COALESCE($5, payment_method),
                amount_paid = COALESCE($6, amount_paid),
                boarding_point = COALESCE($7, boarding_point),
                dropoff_point = COALESCE($8, dropoff_point),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $9 AND organization_id = $10
            RETURNING *`,
            [status, notes, passenger_name, passenger_document, forma_pagamento, valor_pago, boarding_point, dropoff_point, id, orgId]
        );

        // Handle seat count logic if status changes
        if (status === 'CANCELLED' && oldStatus !== 'CANCELLED') {
            await pool.query(
                "UPDATE trips SET seats_available = seats_available + 1 WHERE id = $1",
                [currentRes.rows[0].trip_id]
            );
        } else if (status !== 'CANCELLED' && oldStatus === 'CANCELLED') {
            await pool.query(
                "UPDATE trips SET seats_available = seats_available - 1 WHERE id = $1",
                [currentRes.rows[0].trip_id]
            );
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating reservation:", error);
        res.status(500).json({ error: "Failed to update reservation" });
    }
});

export default router;
