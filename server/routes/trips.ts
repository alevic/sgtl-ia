import express from "express";
import { pool } from "../auth";
import { auth } from "../auth";
import { authorize } from "../middleware";

const router = express.Router();

// ===== ROUTES MANAGEMENT =====

// GET all routes
router.get("/routes", authorize(['admin', 'operacional']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { active } = req.query;

        let query = `SELECT * FROM routes WHERE organization_id = $1`;
        const params: any[] = [orgId];

        if (active) {
            query += ` AND active = $2`;
            params.push(active === 'true');
        }

        query += ` ORDER BY name ASC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching routes:", error);
        res.status(500).json({ error: "Failed to fetch routes" });
    }
});

// GET single route
router.get("/routes/:id", authorize(['admin', 'operacional']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { id } = req.params;

        const result = await pool.query(
            `SELECT * FROM routes WHERE id = $1 AND organization_id = $2`,
            [id, orgId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Route not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching route:", error);
        res.status(500).json({ error: "Failed to fetch route" });
    }
});

// POST create route
router.post("/routes", authorize(['admin', 'operacional']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const userId = session.user.id;

        const {
            name, origin_city, origin_state, destination_city, destination_state,
            distance_km, duration_minutes, stops, type
        } = req.body;

        const result = await pool.query(
            `INSERT INTO routes (
                name, origin_city, origin_state, destination_city, destination_state,
                distance_km, duration_minutes, stops, type, organization_id, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *`,
            [
                name, origin_city, origin_state, destination_city, destination_state,
                distance_km || 0, duration_minutes || 0, JSON.stringify(stops || []),
                type || 'IDA',
                orgId, userId
            ]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error creating route:", error);
        res.status(500).json({ error: "Failed to create route" });
    }
});

// PUT update route
router.put("/routes/:id", authorize(['admin', 'operacional']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { id } = req.params;

        const {
            name, origin_city, origin_state, destination_city, destination_state,
            distance_km, duration_minutes, stops, active, type
        } = req.body;

        const result = await pool.query(
            `UPDATE routes SET
                name = COALESCE($1, name),
                origin_city = COALESCE($2, origin_city),
                origin_state = COALESCE($3, origin_state),
                destination_city = COALESCE($4, destination_city),
                destination_state = COALESCE($5, destination_state),
                distance_km = COALESCE($6, distance_km),
                duration_minutes = COALESCE($7, duration_minutes),
                stops = COALESCE($8, stops),
                active = COALESCE($9, active), 
                type = COALESCE($10, type),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $11 AND organization_id = $12
            RETURNING *`,
            [
                name, origin_city, origin_state, destination_city, destination_state,
                distance_km, duration_minutes, stops ? JSON.stringify(stops) : null, active,
                type,
                id, orgId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Route not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating route:", error);
        res.status(500).json({ error: "Failed to update route" });
    }
});

// DELETE route
router.delete("/routes/:id", authorize(['admin', 'operacional']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { id } = req.params;

        // Check for dependencies (trips)
        const tripCheck = await pool.query(
            "SELECT id FROM trips WHERE route_id = $1 LIMIT 1",
            [id]
        );

        if (tripCheck.rows.length > 0) {
            return res.status(400).json({ error: "Cannot delete route with existing trips" });
        }

        const result = await pool.query(
            "DELETE FROM routes WHERE id = $1 AND organization_id = $2 RETURNING id",
            [id, orgId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Route not found" });
        }

        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting route:", error);
        res.status(500).json({ error: "Failed to delete route" });
    }
});

// ===== TRIPS MANAGEMENT =====

// GET all trips
router.get("/trips", authorize(['admin', 'operacional', 'vendas']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { start_date, end_date, route_id, status } = req.query;

        let query = `
            SELECT t.*, 
                   r.name as route_name, 
                   v.placa as vehicle_plate, v.modelo as vehicle_model,
                   d.nome as driver_name
            FROM trips t
            JOIN routes r ON t.route_id = r.id
            LEFT JOIN vehicle v ON t.vehicle_id = v.id
            LEFT JOIN driver d ON t.driver_id = d.id
            WHERE t.organization_id = $1
        `;
        const params: any[] = [orgId];
        let paramCount = 1;

        if (start_date) {
            paramCount++;
            query += ` AND t.departure_date >= $${paramCount}`;
            params.push(start_date);
        }

        if (end_date) {
            paramCount++;
            query += ` AND t.departure_date <= $${paramCount}`;
            params.push(end_date);
        }

        if (route_id) {
            paramCount++;
            query += ` AND t.route_id = $${paramCount}`;
            params.push(route_id);
        }

        if (status) {
            paramCount++;
            query += ` AND t.status = $${paramCount}`;
            params.push(status);
        }

        query += ` ORDER BY t.departure_date ASC, t.departure_time ASC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching trips:", error);
        res.status(500).json({ error: "Failed to fetch trips" });
    }
});

// GET single trip
router.get("/trips/:id", authorize(['admin', 'operacional', 'vendas']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { id } = req.params;

        const result = await pool.query(
            `SELECT t.*, 
                   r.name as route_name, r.origin_city, r.destination_city,
                   v.placa as vehicle_plate, v.modelo as vehicle_model, v.tipo as vehicle_type, v.capacidade_passageiros,
                   d.nome as driver_name
            FROM trips t
            JOIN routes r ON t.route_id = r.id
            LEFT JOIN vehicle v ON t.vehicle_id = v.id
            LEFT JOIN driver d ON t.driver_id = d.id
            WHERE t.id = $1 AND t.organization_id = $2`,
            [id, orgId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Trip not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching trip:", error);
        res.status(500).json({ error: "Failed to fetch trip" });
    }
});

// POST create trip
router.post("/trips", authorize(['admin', 'operacional']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const userId = session.user.id;

        const {
            route_id, vehicle_id, driver_id,
            departure_date, departure_time, arrival_date, arrival_time,
            price_conventional, price_executive, price_semi_sleeper, price_sleeper,
            seats_available, notes
        } = req.body;

        // If vehicle is selected, get its capacity for seats_available if not provided
        let finalSeats = seats_available;
        if (!finalSeats && vehicle_id) {
            const vehicle = await pool.query("SELECT capacidade_passageiros FROM vehicle WHERE id = $1", [vehicle_id]);
            if (vehicle.rows.length > 0) {
                finalSeats = vehicle.rows[0].capacidade_passageiros;
            }
        }

        const result = await pool.query(
            `INSERT INTO trips (
                route_id, vehicle_id, driver_id,
                departure_date, departure_time, arrival_date, arrival_time,
                price_conventional, price_executive, price_semi_sleeper, price_sleeper,
                seats_available, notes, organization_id, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING *`,
            [
                route_id, vehicle_id || null, driver_id || null,
                departure_date, departure_time, arrival_date || null, arrival_time || null,
                price_conventional || null, price_executive || null, price_semi_sleeper || null, price_sleeper || null,
                finalSeats || 0, notes || null, orgId, userId
            ]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error creating trip:", error);
        res.status(500).json({ error: "Failed to create trip" });
    }
});

// PUT update trip
router.put("/trips/:id", authorize(['admin', 'operacional']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { id } = req.params;

        const {
            vehicle_id, driver_id,
            departure_date, departure_time, arrival_date, arrival_time,
            status,
            price_conventional, price_executive, price_semi_sleeper, price_sleeper,
            seats_available, notes
        } = req.body;

        const result = await pool.query(
            `UPDATE trips SET
                vehicle_id = $1, driver_id = $2,
                departure_date = $3, departure_time = $4, arrival_date = $5, arrival_time = $6,
                status = COALESCE($7, status),
                price_conventional = $8, price_executive = $9, price_semi_sleeper = $10, price_sleeper = $11,
                seats_available = $12, notes = $13, updated_at = CURRENT_TIMESTAMP
            WHERE id = $14 AND organization_id = $15
            RETURNING *`,
            [
                vehicle_id || null, driver_id || null,
                departure_date, departure_time, arrival_date || null, arrival_time || null,
                status,
                price_conventional || null, price_executive || null, price_semi_sleeper || null, price_sleeper || null,
                seats_available, notes || null,
                id, orgId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Trip not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating trip:", error);
        res.status(500).json({ error: "Failed to update trip" });
    }
});

// DELETE trip
router.delete("/trips/:id", authorize(['admin', 'operacional']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { id } = req.params;

        const result = await pool.query(
            "DELETE FROM trips WHERE id = $1 AND organization_id = $2 RETURNING id",
            [id, orgId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Trip not found" });
        }

        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting trip:", error);
        res.status(500).json({ error: "Failed to delete trip" });
    }
});

export default router;
