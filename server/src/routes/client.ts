import express from "express";
import { pool } from "../auth.js";
import { clientAuthorize } from "../middleware.js";
import crypto from "crypto";
import { ReservationStatus, StatusTransacao, TipoTransacao } from "../types.js";
import { db } from "../db/drizzle.js";
import { clients, reservations, trips, routes, seat, transactions } from "../db/schema.js";
import { eq, and, ne, sql, desc, asc } from "drizzle-orm";
import { FinanceService } from "../services/financeService.js";

const router = express.Router();

// GET /api/client/dashboard
router.get("/dashboard", clientAuthorize(), async (req, res) => {
    try {
        const userId = (req as any).session.user.id;

        // 1. Fetch Client Profile
        let [clientProfile] = await db.select()
            .from(clients)
            .where(eq(clients.user_id, userId))
            .limit(1);

        if (!clientProfile) {
            // Lazy Creation: If no client record exists, create one from user data
            console.log(`[DASHBOARD] Lazy-creating client profile for userId: ${userId}`);

            // Fetch basic user data using raw pool for "user" if needed or keep it simple
            const userResult = await pool.query('SELECT name, email, phone, cpf FROM "user" WHERE id = $1', [userId]);

            if (userResult.rows.length === 0) {
                return res.status(404).json({ error: "User not found" });
            }

            const user = userResult.rows[0];
            const orgId = (req as any).session.session.activeOrganizationId;

            // Insert new client record
            [clientProfile] = await db.insert(clients)
                .values({
                    tipo_cliente: 'PESSOA_FISICA',
                    nome: user.name,
                    email: user.email,
                    telefone: user.phone || null,
                    documento_tipo: 'CPF',
                    documento: user.cpf || '',
                    organization_id: orgId,
                    user_id: userId,
                    data_cadastro: new Date(),
                    saldo_creditos: '0'
                })
                .returning();
        }
        const clientId = clientProfile.id;

        // 2. Fetch Future Reservations
        const reservationsList = await db.select({
            id: reservations.id,
            ticket_code: reservations.ticket_code,
            status: reservations.status,
            passenger_name: reservations.passenger_name,
            price: reservations.price,
            departure_date: trips.departure_date,
            departure_time: trips.departure_time,
            trip_title: trips.title,
            route_name: routes.name,
            origin_city: routes.origin_city,
            origin_state: routes.origin_state,
            destination_city: routes.destination_city,
            destination_state: routes.destination_state,
            seat_number: seat.numero,
            seat_type: seat.tipo
        })
            .from(reservations)
            .innerJoin(trips, eq(reservations.trip_id, trips.id))
            .innerJoin(routes, eq(trips.route_id, routes.id))
            .leftJoin(seat, eq(reservations.seat_id, seat.id))
            .where(and(
                eq(reservations.client_id, clientId),
                ne(reservations.status, ReservationStatus.CANCELLED)
            ))
            .orderBy(asc(trips.departure_date), asc(trips.departure_time));

        // 3. Fetch Recent Parcels - Keep as is for now or refactor later
        // (Assuming parcels doesn't have a Drizzle schema yet)
        const parcelsResult = await pool.query(
            `SELECT * FROM parcel_orders 
             WHERE sender_document = $1 OR recipient_document = $1
             ORDER BY created_at DESC LIMIT 5`,
            [clientProfile.documento]
        );

        res.json({
            profile: clientProfile,
            reservations: reservationsList,
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
            reservations: reservationsData, // Array of reservation objects
            credits_used,
            is_partial,
            entry_value,
            trip_id
        } = req.body;

        if (!reservationsData || !Array.isArray(reservationsData) || reservationsData.length === 0) {
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

            await db.update(clients)
                .set({
                    saldo_creditos: sql`${clients.saldo_creditos} - ${credits_used}`
                })
                .where(eq(clients.id, clientId));

            // Log Credit Usage (Financial Transaction)
            const catId = await FinanceService.getCategoryIdByName('OUTROS', orgId);

            await db.insert(transactions)
                .values({
                    organization_id: orgId,
                    type: TipoTransacao.EXPENSE,
                    category: 'OUTROS',
                    category_id: catId,
                    amount: credits_used.toString(),
                    description: `Uso de créditos na reserva - ${tripResult.rows[0].title}`,
                    status: StatusTransacao.PAID,
                    client_id: clientId,
                    date: new Date(),
                    created_by: userId
                });
        }

        const createdReservations = [];
        const totalAmount = reservationsData.reduce((sum, r) => sum + Number(r.price || 0), 0);

        // 4. Create Reservations
        for (const r of reservationsData) {
            // Double Booking Check
            const reservationCheck = await client.query(
                "SELECT id FROM reservations WHERE trip_id = $1 AND seat_id = $2 AND status != $3",
                [trip_id, r.seat_id, ReservationStatus.CANCELLED]
            );
            if (reservationCheck.rows.length > 0) {
                throw new Error(`O assento ${r.seat_number} já está reservado.`);
            }

            const ticket_code = 'T-' + crypto.randomBytes(3).toString('hex').toUpperCase();

            const [newRes] = await db.insert(reservations)
                .values({
                    trip_id,
                    seat_id: r.seat_id,
                    passenger_name: r.passenger_name,
                    passenger_document: r.passenger_document,
                    passenger_email: r.passenger_email || null,
                    passenger_phone: r.passenger_phone || null,
                    status: ReservationStatus.PENDING,
                    ticket_code,
                    price: r.price.toString(),
                    client_id: clientId,
                    organization_id: orgId,
                    boarding_point: r.boarding_point || null,
                    dropoff_point: r.dropoff_point || null,
                    credits_used: '0',
                    is_partial: is_partial || false,
                    amount_paid: '0',
                    created_by: userId
                })
                .returning();
            createdReservations.push(newRes);
        }

        // 5. Create Financial Transactions (Entry and Remaining Balance)
        const description = `Reserva Portal: ${tripResult.rows[0].title} (${createdReservations.length} pax)`;
        const catId = await FinanceService.getCategoryIdByName('VENDA_PASSAGEM', orgId);

        // Transaction for Entry/Total
        await db.insert(transactions)
            .values({
                organization_id: orgId,
                type: TipoTransacao.INCOME,
                category: 'VENDA_PASSAGEM',
                category_id: catId,
                amount: (entry_value || (totalAmount - (credits_used || 0))).toString(),
                description: description + (is_partial ? " - Entrada/Sinal" : ""),
                status: StatusTransacao.PENDING,
                client_id: clientId,
                reservation_id: createdReservations[0].id,
                date: new Date(),
                created_by: userId
            });

        if (is_partial) {
            const remaining = totalAmount - (credits_used || 0) - entry_value;
            if (remaining > 0) {
                await db.insert(transactions)
                    .values({
                        organization_id: orgId,
                        type: TipoTransacao.INCOME,
                        category: 'VENDA_PASSAGEM',
                        category_id: catId,
                        amount: remaining.toString(),
                        description: description + " - Restante no Embarque",
                        status: StatusTransacao.PENDING,
                        client_id: clientId,
                        reservation_id: createdReservations[0].id,
                        date: new Date(),
                        created_by: userId
                    });
            }
        }

        // 6. Update Trip Seats
        await db.update(trips)
            .set({
                seats_available: sql`${trips.seats_available} - ${reservationsData.length}`
            })
            .where(eq(trips.id, trip_id));

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
