import express from "express";
import { pool } from "../auth";
import { clientAuthorize } from "../middleware";
import crypto from "crypto";
import { ReservationStatus, StatusTransacao, TipoTransacao } from "../../../types.js";

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
            // Lazy Creation: If no client record exists, create one from user data
            console.log(`[DASHBOARD] Lazy-creating client profile for userId: ${userId}`);

            // Fetch basic user data
            const userResult = await pool.query(
                'SELECT name, email, phone, cpf FROM "user" WHERE id = $1',
                [userId]
            );

            if (userResult.rows.length === 0) {
                return res.status(404).json({ error: "User not found" });
            }

            const user = userResult.rows[0];
            const orgId = (req as any).session.session.activeOrganizationId;

            // Insert new client record
            const newClientResult = await pool.query(
                `INSERT INTO clients (
                    tipo_cliente, nome, email, telefone, 
                    documento_tipo, documento,
                    organization_id, user_id,
                    data_cadastro, saldo_creditos
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, 0)
                RETURNING *`,
                [
                    'PESSOA_FISICA',
                    user.name,
                    user.email,
                    user.phone || null,
                    'CPF',
                    user.cpf || '',
                    orgId,
                    userId
                ]
            );

            clientResult.rows[0] = newClientResult.rows[0];
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
            WHERE r.client_id = $1 AND r.status != $2
            ORDER BY t.departure_date ASC, t.departure_time ASC`,
            [clientId, ReservationStatus.CANCELLED]
        );

        // 3. Fetch Recent Parcels
        const parcelsResult = await pool.query(
            `SELECT * FROM parcel_orders 
             WHERE sender_document = $1 OR recipient_document = $1
             ORDER BY created_at DESC LIMIT 5`,
            [clientProfile.documento]
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

// GET /api/client/profile - Get authenticated client's profile
router.get("/profile", clientAuthorize(), async (req, res) => {
    try {
        const userId = (req as any).session.user.id;

        // Fetch user data
        const userResult = await pool.query(
            'SELECT id, name, username, email, phone, cpf, birth_date, image FROM "user" WHERE id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        // Fetch client data
        const clientResult = await pool.query(
            "SELECT saldo_creditos FROM clients WHERE user_id = $1",
            [userId]
        );

        const profile = {
            ...userResult.rows[0],
            saldo_creditos: clientResult.rows[0]?.saldo_creditos || 0
        };

        res.json(profile);
    } catch (error) {
        console.error("Error fetching client profile:", error);
        res.status(500).json({ error: "Failed to fetch profile" });
    }
});

// PUT /api/client/profile - Update client profile
router.put("/profile", clientAuthorize(), async (req, res) => {
    try {
        const userId = (req as any).session.user.id;
        const { name, email, phone, cpf, birthDate, image } = req.body;

        // Check email uniqueness (excluding current user)
        if (email) {
            const emailCheck = await pool.query(
                'SELECT id FROM "user" WHERE LOWER(email) = LOWER($1) AND id != $2',
                [email, userId]
            );
            if (emailCheck.rows.length > 0) {
                return res.status(400).json({ error: "Email já está em uso" });
            }
        }

        // Update user table
        await pool.query(
            'UPDATE "user" SET name = $1, email = $2, phone = $3, cpf = $4, birth_date = $5, image = $6 WHERE id = $7',
            [name, email || null, phone || null, cpf || null, birthDate || null, image || null, userId]
        );

        // Update clients table
        await pool.query(
            "UPDATE clients SET nome = $1, email = $2, telefone = $3, documento = $4 WHERE user_id = $5",
            [name, email || null, phone || null, cpf || null, userId]
        );

        console.log(`[CLIENT PROFILE] Updated profile for user: ${userId}`);
        res.json({ success: true, message: "Perfil atualizado com sucesso" });
    } catch (error) {
        console.error("Error updating client profile:", error);
        res.status(500).json({ error: "Failed to update profile" });
    }
});


// POST /api/client/checkout
router.post("/checkout", clientAuthorize(), async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = (req as any).session.user.id;
        const {
            reservations, // Array of reservation objects
            credits_used,
            is_partial,
            entry_value,
            trip_id
        } = req.body;

        if (!reservations || !Array.isArray(reservations) || reservations.length === 0) {
            return res.status(400).json({ error: "No reservations provided" });
        }

        await client.query("BEGIN");

        // 1. Get Client Info
        const clientResult = await client.query("SELECT id, saldo_creditos, organization_id FROM clients WHERE user_id = $1", [userId]);
        if (clientResult.rows.length === 0) throw new Error("Client not found");
        const clientId = clientResult.rows[0].id;
        const clientOrgId = clientResult.rows[0].organization_id;

        // 2. Get Trip Info
        const tripResult = await client.query("SELECT organization_id, title FROM trips WHERE id = $1", [trip_id]);
        if (tripResult.rows.length === 0) throw new Error("Trip not found");
        const orgId = tripResult.rows[0].organization_id;

        // 3. Credit Deduction Logic
        if (credits_used && Number(credits_used) > 0) {
            const currentCredits = Number(clientResult.rows[0].saldo_creditos || 0);
            if (currentCredits < Number(credits_used)) {
                throw new Error("Saldo de créditos insuficiente");
            }

            await client.query(
                "UPDATE clients SET saldo_creditos = saldo_creditos - $1 WHERE id = $2",
                [credits_used, clientId]
            );

            // Log Credit Usage (Financial Transaction)
            await client.query(
                `INSERT INTO transaction (
                    organization_id, type, category, amount, description, status, 
                    client_id, date, created_at
                ) VALUES ($1, $2, 'OUTROS', $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                [orgId, TipoTransacao.EXPENSE, credits_used, `Uso de créditos na reserva - ${tripResult.rows[0].title}`, StatusTransacao.PAID, clientId]
            );
        }

        const createdReservations = [];
        const totalAmount = reservations.reduce((sum, r) => sum + Number(r.price || 0), 0);

        // 4. Create Reservations
        for (const r of reservations) {
            // Double Booking Check
            const reservationCheck = await client.query(
                "SELECT id FROM reservations WHERE trip_id = $1 AND seat_id = $2 AND status != $3",
                [trip_id, r.seat_id, ReservationStatus.CANCELLED]
            );
            if (reservationCheck.rows.length > 0) {
                throw new Error(`O assento ${r.seat_number} já está reservado.`);
            }

            const ticket_code = 'T-' + crypto.randomBytes(3).toString('hex').toUpperCase();

            // Calculate individualized stats for this reservation (pro-rata distribution if needed, but usually we just tag the main group)
            // For now, we store the full price and mark the group
            const resResult = await client.query(
                `INSERT INTO reservations (
                    trip_id, seat_id,
                    passenger_name, passenger_document, passenger_email, passenger_phone,
                    status, ticket_code, price,
                    client_id, organization_id,
                    boarding_point, dropoff_point,
                    credits_used, is_partial, amount_paid,
                    created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING *`,
                [
                    trip_id, r.seat_id,
                    r.passenger_name, r.passenger_document, r.passenger_email || null, r.passenger_phone || null,
                    ReservationStatus.PENDING, ticket_code, r.price,
                    clientId, orgId,
                    r.boarding_point || null, r.dropoff_point || null,
                    0, // credits_used per reservation (store total on financial or split?) - common practice: store total on financial
                    is_partial || false,
                    0 // amount_paid starts at 0 until payment confirmed
                ]
            );
            createdReservations.push(resResult.rows[0]);
        }

        // 5. Create Financial Transactions (Entry and Remaining Balance)
        const description = `Reserva Portal: ${tripResult.rows[0].title} (${createdReservations.length} pax)`;

        // Transaction for Entry/Total
        await client.query(
            `INSERT INTO transaction (
                organization_id, type, category, amount, description, status, 
                client_id, reservation_id, date, created_at
            ) VALUES ($1, $2, 'VENDA_PASSAGEM', $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [orgId, TipoTransacao.INCOME, entry_value || (totalAmount - (credits_used || 0)), description + (is_partial ? " - Entrada/Sinal" : ""), StatusTransacao.PENDING, clientId, createdReservations[0].id]
        );

        if (is_partial) {
            const remaining = totalAmount - (credits_used || 0) - entry_value;
            if (remaining > 0) {
                await client.query(
                    `INSERT INTO transaction (
                        organization_id, type, category, amount, description, status, 
                        client_id, reservation_id, date, created_at
                    ) VALUES ($1, $2, 'VENDA_PASSAGEM', $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
                    [orgId, TipoTransacao.INCOME, remaining, description + " - Restante no Embarque", StatusTransacao.PENDING, clientId, createdReservations[0].id]
                );
            }
        }

        // 6. Update Trip Seats
        await client.query(
            "UPDATE trips SET seats_available = seats_available - $1 WHERE id = $2",
            [reservations.length, trip_id]
        );

        await client.query("COMMIT");
        console.log(`[Public Checkout] Success! ${createdReservations.length} reservations created for org ${orgId}`);
        res.json({ success: true, reservations: createdReservations });

    } catch (error: any) {
        await client.query("ROLLBACK");
        console.error("Error in batch client checkout:", error);
        res.status(500).json({ error: error.message || "Failed to process reservation" });
    } finally {
        client.release();
    }
});

export default router;
