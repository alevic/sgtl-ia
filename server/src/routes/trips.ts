import express from "express";
import { pool } from "../auth.js";
import { auth } from "../auth.js";
import { authorize } from "../middleware.js";
import { TripStatus, RouteType } from "../types.js";
import { AuditService } from "../services/auditService.js";
import crypto from "crypto";

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
                type || RouteType.OUTBOUND,
                orgId, userId
            ]
        );

        const newRoute = result.rows[0];

        // Audit Log
        AuditService.logEvent({
            userId: session.user.id,
            organizationId: orgId as string,
            action: 'ROUTE_CREATE',
            entity: 'route',
            entityId: newRoute.id,
            newData: newRoute,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        }).catch(console.error);

        res.json(newRoute);

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

        const check = await pool.query(
            "SELECT * FROM routes WHERE id = $1 AND organization_id = $2",
            [id, orgId]
        );

        if (check.rows.length === 0) {
            return res.status(404).json({ error: "Route not found" });
        }

        const oldRoute = check.rows[0];

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

        const updatedRoute = result.rows[0];

        // Audit Log
        AuditService.logEvent({
            userId: session.user.id,
            organizationId: orgId as string,
            action: 'ROUTE_UPDATE',
            entity: 'route',
            entityId: updatedRoute.id,
            oldData: oldRoute,
            newData: updatedRoute,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        }).catch(console.error);

        res.json(updatedRoute);

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

        // Audit Log
        AuditService.logEvent({
            userId: session.user.id,
            organizationId: orgId as string,
            action: 'ROUTE_DELETE',
            entity: 'route',
            entityId: id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        }).catch(console.error);

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
                   r.name as route_name, r.origin_city, r.destination_city, r.stops as route_stops,
                   rr.name as return_route_name, rr.stops as return_route_stops,
                   v.placa as vehicle_plate, v.modelo as vehicle_model,
                   d.nome as driver_name
            FROM trips t
            JOIN routes r ON t.route_id = r.id
            LEFT JOIN routes rr ON t.return_route_id = rr.id
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

        const { active } = req.query;
        if (active) {
            paramCount++;
            query += ` AND t.active = $${paramCount}`;
            params.push(active === 'true');
        }

        query += ` ORDER BY t.departure_date ASC, t.departure_time ASC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching trips:", error);
        res.status(500).json({ error: "Failed to fetch trips" });
    }
});

// ===== TAGS MANAGEMENT =====

// GET all tags
router.get("/trips/tags", authorize(['admin', 'operacional', 'vendas']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;

        const result = await pool.query(
            "SELECT * FROM trip_tags WHERE organization_id = $1 ORDER BY nome ASC",
            [orgId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching tags:", error);
        res.status(500).json({ error: "Failed to fetch tags" });
    }
});

// POST create tag
router.post("/trips/tags", authorize(['admin', 'operacional']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { nome, cor } = req.body;

        const result = await pool.query(
            `INSERT INTO trip_tags (nome, cor, organization_id) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (nome, organization_id) DO UPDATE SET cor = EXCLUDED.cor
             RETURNING *`,
            [nome, cor || null, orgId]
        );

        const newTag = result.rows[0];

        // Audit Log
        AuditService.logEvent({
            userId: session.user.id,
            organizationId: orgId as string,
            action: 'TAG_CREATE',
            entity: 'trip_tag',
            entityId: newTag.id,
            newData: newTag,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        }).catch(console.error);

        res.json(newTag);

    } catch (error) {
        console.error("Error creating tag:", error);
        res.status(500).json({ error: "Failed to create tag" });
    }
});

// PUT update tag
router.put("/trips/tags/:id", authorize(['admin', 'operacional']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { id } = req.params;
        const { nome, cor } = req.body;

        const check = await pool.query(
            "SELECT * FROM trip_tags WHERE id = $1 AND organization_id = $2",
            [id, orgId]
        );

        if (check.rows.length === 0) {
            return res.status(404).json({ error: "Tag not found" });
        }

        const oldTag = check.rows[0];

        const result = await pool.query(
            `UPDATE trip_tags SET 
                nome = COALESCE($1, nome),
                cor = COALESCE($2, cor)
             WHERE id = $3 AND organization_id = $4
             RETURNING *`,
            [nome, cor, id, orgId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Tag not found" });
        }

        const updatedTag = result.rows[0];

        // Audit Log
        AuditService.logEvent({
            userId: session.user.id,
            organizationId: orgId as string,
            action: 'TAG_UPDATE',
            entity: 'trip_tag',
            entityId: updatedTag.id,
            oldData: oldTag,
            newData: updatedTag,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        }).catch(console.error);

        res.json(updatedTag);

    } catch (error) {
        console.error("Error updating tag:", error);
        res.status(500).json({ error: "Failed to update tag" });
    }
});

// DELETE tag
router.delete("/trips/tags/:id", authorize(['admin', 'operacional']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { id } = req.params;

        const result = await pool.query(
            "DELETE FROM trip_tags WHERE id = $1 AND organization_id = $2 RETURNING id",
            [id, orgId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Tag not found" });
        }

        // Audit Log
        AuditService.logEvent({
            userId: session.user.id,
            organizationId: orgId as string,
            action: 'TAG_DELETE',
            entity: 'trip_tag',
            entityId: id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        }).catch(console.error);

        res.json({ success: true });

    } catch (error) {
        console.error("Error deleting tag:", error);
        res.status(500).json({ error: "Failed to delete tag" });
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
                   r.name as route_name, r.origin_city, r.origin_state, r.destination_city, r.destination_state, r.stops as route_stops,
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
            route_id, return_route_id, vehicle_id, driver_id,
            departure_date, departure_time, arrival_date, arrival_time,
            price_conventional, price_executive, price_semi_sleeper, price_sleeper, price_bed, price_master_bed,
            seats_available, notes,
            title, tags, cover_image, gallery, baggage_limit, alerts
        } = req.body;

        // If vehicle is selected, get its capacity for seats_available if not provided
        let finalSeats = seats_available;
        if (!finalSeats && vehicle_id) {
            const vehicle = await pool.query("SELECT capacidade_passageiros FROM vehicle WHERE id = $1", [vehicle_id]);
            if (vehicle.rows.length > 0) {
                finalSeats = vehicle.rows[0].capacidade_passageiros;
            }
        }

        // Generate Trip Code (e.g., V-123456)
        const trip_code = 'V-' + crypto.randomBytes(3).toString('hex').toUpperCase();

        const result = await pool.query(
            `INSERT INTO trips (
                route_id, return_route_id, vehicle_id, driver_id,
                departure_date, departure_time, arrival_date, arrival_time,
                price_conventional, price_executive, price_semi_sleeper, price_sleeper, price_bed, price_master_bed,
                seats_available, status, notes, organization_id, created_by,
                title, tags, cover_image, gallery, baggage_limit, alerts,
                trip_code
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
            RETURNING *`,
            [
                route_id, return_route_id || null, vehicle_id || null, driver_id || null,
                departure_date, departure_time, arrival_date || null, arrival_time || null,
                price_conventional || null, price_executive || null, price_semi_sleeper || null, price_sleeper || null, price_bed || null, price_master_bed || null,
                finalSeats || 0, TripStatus.SCHEDULED, notes || null, orgId, userId,
                title || null, tags || [], cover_image || null, JSON.stringify(gallery || []), baggage_limit || null, alerts || null,
                trip_code
            ]
        );

        const newTrip = result.rows[0];

        // Audit Log
        AuditService.logEvent({
            userId: session.user.id,
            organizationId: orgId as string,
            action: 'TRIP_CREATE',
            entity: 'trip',
            entityId: newTrip.id,
            newData: newTrip,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        }).catch(console.error);

        res.json(newTrip);

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

        const check = await pool.query(
            "SELECT * FROM trips WHERE id = $1 AND organization_id = $2",
            [id, orgId]
        );

        if (check.rows.length === 0) {
            return res.status(404).json({ error: "Trip not found" });
        }

        const oldTrip = check.rows[0];

        const {
            return_route_id, vehicle_id, driver_id,
            departure_date, departure_time, arrival_date, arrival_time,
            status,
            price_conventional, price_executive, price_semi_sleeper, price_sleeper, price_bed, price_master_bed,
            seats_available, notes,
            title, tags, cover_image, gallery, baggage_limit, alerts, active
        } = req.body;

        const result = await pool.query(
            `UPDATE trips SET
                return_route_id = COALESCE($1, return_route_id),
                vehicle_id = COALESCE($2, vehicle_id),
                driver_id = COALESCE($3, driver_id),
                departure_date = COALESCE($4, departure_date),
                departure_time = COALESCE($5, departure_time),
                arrival_date = COALESCE($6, arrival_date),
                arrival_time = COALESCE($7, arrival_time),
                status = COALESCE($8, status),
                price_conventional = COALESCE($9, price_conventional),
                price_executive = COALESCE($10, price_executive),
                price_semi_sleeper = COALESCE($11, price_semi_sleeper),
                price_sleeper = COALESCE($12, price_sleeper),
                price_bed = COALESCE($13, price_bed),
                price_master_bed = COALESCE($14, price_master_bed),
                seats_available = COALESCE($15, seats_available),
                notes = COALESCE($16, notes),
                title = COALESCE($17, title),
                tags = COALESCE($18, tags),
                cover_image = COALESCE($19, cover_image),
                gallery = COALESCE($20, gallery),
                baggage_limit = COALESCE($21, baggage_limit),
                alerts = COALESCE($22, alerts),
                active = COALESCE($23, active),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $24 AND organization_id = $25
            RETURNING *`,
            [
                return_route_id, vehicle_id, driver_id,
                departure_date, departure_time, arrival_date, arrival_time,
                status,
                price_conventional, price_executive, price_semi_sleeper, price_sleeper, price_bed, price_master_bed,
                seats_available, notes,
                title, tags, cover_image, gallery ? JSON.stringify(gallery) : null, baggage_limit, alerts,
                active,
                id, orgId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Trip not found" });
        }

        const updatedTrip = result.rows[0];

        // Audit Log
        AuditService.logEvent({
            userId: session.user.id,
            organizationId: orgId as string,
            action: 'TRIP_UPDATE',
            entity: 'trip',
            entityId: updatedTrip.id,
            oldData: oldTrip,
            newData: updatedTrip,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        }).catch(console.error);

        res.json(updatedTrip);

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

        // Audit Log
        AuditService.logEvent({
            userId: session.user.id,
            organizationId: orgId as string,
            action: 'TRIP_DELETE',
            entity: 'trip',
            entityId: id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        }).catch(console.error);

        res.json({ success: true });

    } catch (error) {
        console.error("Error deleting trip:", error);
        res.status(500).json({ error: "Failed to delete trip" });
    }
});

export default router;
