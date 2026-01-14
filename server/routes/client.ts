import express from "express";
import { pool } from "../auth";
import { clientAuthorize } from "../middleware";
import crypto from "crypto";

const router = express.Router();

// GET /api/client/dashboard
router.get("/dashboard", clientAuthorize(), async (req, res) => {
    try {
        const userId = (req as any).session.user.id;

        // 1. Fetch Client Profile
        const clientResult = await pool.query(
            "SELECT * FROM clients WHERE user_id = $1",
            [userId]
        );

        if (clientResult.rows.length === 0) {
            return res.status(404).json({ error: "Client profile not found" });
        }

        const clientProfile = clientResult.rows[0];
        const clientId = clientProfile.id;

        // 2. Fetch Future Reservations
        const reservationsResult = await pool.query(
            `SELECT r.*, 
                   t.departure_date, t.departure_time, t.title as trip_title,
                   route.name as route_name, route.origin_city, route.origin_state, 
                   route.destination_city, route.destination_state,
                   route.origin_neighborhood, route.destination_neighborhood,
                   route.stops as route_stops,
                   s.numero as seat_number, s.tipo as seat_type
            FROM reservations r
            JOIN trips t ON r.trip_id = t.id
            JOIN routes route ON t.route_id = route.id
            LEFT JOIN seat s ON r.seat_id = s.id
            WHERE r.client_id = $1 AND r.status != 'CANCELLED'
            ORDER BY t.departure_date ASC, t.departure_time ASC`,
            [clientId]
        );

        // 3. Fetch Recent Parcels
        const parcelsResult = await pool.query(
            `SELECT * FROM parcel_orders 
             WHERE sender_document = $1 OR recipient_document = $1
             ORDER BY created_at DESC LIMIT 5`,
            [clientProfile.documento_numero]
        );

        res.json({
            profile: clientProfile,
            reservations: reservationsResult.rows,
            parcels: parcelsResult.rows
        });
    } catch (error) {
        console.error("Error fetching client dashboard:", error);
        res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
});

// POST /api/client/reservations
router.get("/reservations/:id", clientAuthorize(), async (req, res) => {
    try {
        const userId = (req as any).session.user.id;
        const { id } = req.params;

        const result = await pool.query(
            `SELECT r.*, 
                   t.departure_date, t.departure_time, t.title as trip_title,
                   route.name as route_name, route.origin_city, route.origin_state, 
                   route.destination_city, route.destination_state,
                   route.origin_neighborhood, route.destination_neighborhood,
                   route.stops as route_stops,
                   s.numero as seat_number, s.tipo as seat_type,
                   v.modelo as vehicle_model, v.placa as vehicle_plate
            FROM reservations r
            JOIN trips t ON r.trip_id = t.id
            JOIN routes route ON t.route_id = route.id
            LEFT JOIN seat s ON r.seat_id = s.id
            LEFT JOIN vehicle v ON t.vehicle_id = v.id
            JOIN clients c ON r.client_id = c.id
            WHERE r.id = $1 AND c.user_id = $2`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Reservation not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching client reservation:", error);
        res.status(500).json({ error: "Failed to fetch reservation" });
    }
});

// POST /api/client/checkout
router.post("/checkout", clientAuthorize(), async (req, res) => {
    try {
        const userId = (req as any).session.user.id;
        const {
            trip_id, seat_id,
            passenger_name, passenger_document, passenger_email, passenger_phone,
            price, boarding_point, dropoff_point
        } = req.body;

        // 1. Get Client ID
        const clientResult = await pool.query("SELECT id, organization_id FROM clients WHERE user_id = $1", [userId]);
        if (clientResult.rows.length === 0) return res.status(404).json({ error: "Client not found" });

        const clientId = clientResult.rows[0].id;
        const orgId = clientResult.rows[0].organization_id;

        // 2. Double Booking Check (simplified version of reservations.ts logic)
        const reservationCheck = await pool.query(
            "SELECT id FROM reservations WHERE trip_id = $1 AND seat_id = $2 AND status != 'CANCELLED'",
            [trip_id, seat_id]
        );

        if (reservationCheck.rows.length > 0) {
            return res.status(400).json({ error: "Seat already reserved" });
        }

        // 3. Create Reservation
        const ticket_code = 'T-' + crypto.randomBytes(3).toString('hex').toUpperCase();

        const result = await pool.query(
            `INSERT INTO reservations (
                trip_id, seat_id,
                passenger_name, passenger_document, passenger_email, passenger_phone,
                status, ticket_code, price,
                client_id, organization_id,
                boarding_point, dropoff_point
            ) VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7, $8, $9, $10, $11, $12)
            RETURNING *`,
            [
                trip_id, seat_id,
                passenger_name, passenger_document, passenger_email || null, passenger_phone || null,
                ticket_code, price,
                clientId, orgId,
                boarding_point || null, dropoff_point || null
            ]
        );

        // 4. Update Trip Seats
        await pool.query(
            "UPDATE trips SET seats_available = seats_available - 1 WHERE id = $1",
            [trip_id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error in client checkout:", error);
        res.status(500).json({ error: "Failed to process reservation" });
    }
});

export default router;
