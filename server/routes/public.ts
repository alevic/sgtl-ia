import express from "express";
import { pool, auth } from "../auth";

const router = express.Router();

// Public Routes - No Authentication Required

// GET /public/routes - List active routes (for search dropdowns)
router.get("/routes", async (req, res) => {
    try {
        // Assuming we want to show routes from all organizations or filter by domain?
        // For now, let's return all active routes. 
        // In a multi-tenant app, we might need to know which org the portal belongs to.
        // Assuming single org for now or passed via query param?
        // Let's assume the frontend sends an organizationId or we return all.
        // Ideally, the portal URL determines the org.
        // For this MVP, let's just return all active routes.

        const result = await pool.query(
            "SELECT id, name, origin_city, origin_state, destination_city, destination_state FROM routes WHERE active = true ORDER BY name ASC"
        );
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching public routes:", error);
        res.status(500).json({ error: "Failed to fetch routes" });
    }
});

// GET /public/trips - Search trips
router.get("/trips", async (req, res) => {
    try {
        const { origin_city, destination_city, date } = req.query;

        let query = `
            SELECT t.id, t.departure_date, t.departure_time, t.arrival_date, t.arrival_time,
                   t.price_conventional, t.price_executive, t.price_semi_sleeper, t.price_sleeper,
                   t.seats_available, t.tags, t.cover_image, t.title,
                   r.name as route_name, r.origin_city, r.destination_city, r.duration_minutes,
                   v.tipo as vehicle_type
            FROM trips t
            JOIN routes r ON t.route_id = r.id
            LEFT JOIN vehicle v ON t.vehicle_id = v.id
            WHERE t.status = 'SCHEDULED' AND t.seats_available > 0
        `;
        const params: any[] = [];
        let paramCount = 0;

        if (origin_city) {
            paramCount++;
            query += ` AND r.origin_city ILIKE $${paramCount}`;
            params.push(`%${origin_city}%`);
        }

        if (destination_city) {
            paramCount++;
            query += ` AND r.destination_city ILIKE $${paramCount}`;
            params.push(`%${destination_city}%`);
        }

        if (date) {
            paramCount++;
            query += ` AND t.departure_date = $${paramCount}`;
            params.push(date);
        }

        query += ` ORDER BY t.departure_date ASC, t.departure_time ASC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error("Error searching trips:", error);
        res.status(500).json({ error: "Failed to search trips" });
    }
});

// POST /public/charters - Request a charter quote
router.post("/charters", async (req, res) => {
    try {
        const {
            contact_name, contact_email, contact_phone, company_name,
            origin_city, origin_state, destination_city, destination_state,
            departure_date, departure_time, return_date, return_time,
            passenger_count, vehicle_type_requested,
            description, organization_id // Frontend must send this
        } = req.body;

        if (!organization_id) {
            return res.status(400).json({ error: "Organization ID is required" });
        }

        const result = await pool.query(
            `INSERT INTO charter_requests (
                contact_name, contact_email, contact_phone, company_name,
                origin_city, origin_state, destination_city, destination_state,
                departure_date, departure_time, return_date, return_time,
                passenger_count, vehicle_type_requested,
                description, status,
                organization_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'PENDING', $16)
            RETURNING id`,
            [
                contact_name, contact_email, contact_phone, company_name || null,
                origin_city, origin_state, destination_city, destination_state,
                departure_date, departure_time || null, return_date || null, return_time || null,
                passenger_count, vehicle_type_requested || null,
                description || null, organization_id
            ]
        );

        res.status(201).json({ success: true, id: result.rows[0].id });
    } catch (error) {
        console.error("Error submitting charter request:", error);
        res.status(500).json({ error: "Failed to submit charter request" });
    }
});

// POST /public/parcels - Request parcel shipping
router.post("/parcels", async (req, res) => {
    try {
        const {
            sender_name, sender_document, sender_phone,
            recipient_name, recipient_document, recipient_phone,
            origin_city, origin_state, destination_city, destination_state,
            description, weight, dimensions,
            organization_id // Frontend must send this
        } = req.body;

        if (!organization_id) {
            return res.status(400).json({ error: "Organization ID is required" });
        }

        // Generate temporary tracking code
        const crypto = await import("crypto");
        const tracking_code = 'REQ-' + crypto.randomBytes(3).toString('hex').toUpperCase();

        const result = await pool.query(
            `INSERT INTO parcel_orders (
                sender_name, sender_document, sender_phone,
                recipient_name, recipient_document, recipient_phone,
                origin_city, origin_state, destination_city, destination_state,
                description, weight, dimensions,
                status, tracking_code, price,
                organization_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'PENDING', $14, 0, $15)
            RETURNING id, tracking_code`,
            [
                sender_name, sender_document, sender_phone,
                recipient_name, recipient_document, recipient_phone,
                origin_city, origin_state, destination_city, destination_state,
                description, weight || 0, dimensions || null,
                tracking_code, organization_id
            ]
        );

        res.status(201).json({ success: true, id: result.rows[0].id, tracking_code: result.rows[0].tracking_code });
    } catch (error) {
        console.error("Error submitting parcel request:", error);
        res.status(500).json({ error: "Failed to submit parcel request" });
    }
});

// POST /public/client/signup - Register a new client
router.post("/client/signup", async (req, res) => {
    try {
        const { name, email, password, phone, document, organization_id } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // 1. Create User in Better Auth
        const authResponse = await auth.api.signUpEmail({
            body: {
                email,
                password,
                name
            }
        }) as any;

        if (!authResponse || !authResponse.user) {
            return res.status(500).json({ error: "Failed to create user" });
        }

        const userId = authResponse.user.id;

        // Force role update to ensure it is 'client'
        await pool.query('UPDATE "user" SET role = $1 WHERE id = $2', ['client', userId]);

        // 2. Create Client Profile
        await pool.query(
            `INSERT INTO clients (
                nome, email, telefone, documento_numero, 
                organization_id, user_id,
                data_cadastro
            ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
            [
                name, email, phone || null, document || null,
                organization_id || null,
                userId
            ]
        );

        res.json({ success: true, user: authResponse.user, session: authResponse.session });

    } catch (error: any) {
        console.error("Error signing up client:", error);
        res.status(500).json({ error: error.body?.message || error.message || "Failed to sign up" });
    }
});

export default router;
