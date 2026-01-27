import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { requireAuth, pool } from "@/lib/auth.server";
import { ReservationStatus, StatusTransacao, TipoTransacao } from "@/types";
import crypto from "crypto";

// POST /api/client/checkout
export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== "POST") {
        return data({ error: "Method not allowed" }, { status: 405 });
    }

    const session = await requireAuth(request);
    const userId = session.user.id;
    const body = await request.json();

    const {
        reservations,
        credits_used,
        is_partial,
        entry_value,
        trip_id
    } = body;

    if (!reservations || !Array.isArray(reservations) || reservations.length === 0) {
        return data({ error: "No reservations provided" }, { status: 400 });
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // 1. Get Client Info
        const clientResult = await client.query("SELECT id, saldo_creditos, organization_id FROM clients WHERE user_id = $1", [userId]);
        if (clientResult.rows.length === 0) throw new Error("Client not found");
        const clientId = clientResult.rows[0].id;
        const orgId = clientResult.rows[0].organization_id; // Default Org ID from client context? Or Trip context?

        // Use Trip Organization ID for the transaction (so revenue goes to correct org)
        const tripResult = await client.query("SELECT organization_id, title FROM trips WHERE id = $1", [trip_id]);
        if (tripResult.rows.length === 0) throw new Error("Trip not found");
        const tripOrgId = tripResult.rows[0].organization_id;

        // 2. Credit Deduction Logic
        if (credits_used && Number(credits_used) > 0) {
            const currentCredits = Number(clientResult.rows[0].saldo_creditos || 0);
            if (currentCredits < Number(credits_used)) {
                throw new Error("Saldo de créditos insuficiente");
            }

            await client.query(
                "UPDATE clients SET saldo_creditos = saldo_creditos - $1 WHERE id = $2",
                [credits_used, clientId]
            );

            // Log Credit Usage
            await client.query(
                `INSERT INTO transaction (
                    organization_id, type, category, amount, description, status, 
                    client_id, date, created_at, created_by
                ) VALUES ($1, $2, 'OUTROS', $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $7)`,
                [tripOrgId, TipoTransacao.EXPENSE, credits_used, `Uso de créditos - ${tripResult.rows[0].title}`, StatusTransacao.PAID, clientId, userId]
            );
        }

        const createdReservations = [];
        const totalAmount = reservations.reduce((sum: any, r: any) => sum + Number(r.price || 0), 0);

        // 3. Create Reservations
        for (const r of reservations) {
            // Check Availability
            const reservationCheck = await client.query(
                "SELECT id FROM reservations WHERE trip_id = $1 AND seat_id = $2 AND status != $3",
                [trip_id, r.seat_id, ReservationStatus.CANCELLED]
            );
            if (reservationCheck.rows.length > 0) {
                throw new Error(`O assento ${r.seat_number} já está reservado.`);
            }

            const ticket_code = 'T-' + crypto.randomBytes(3).toString('hex').toUpperCase();

            // Insert Reservation
            const resResult = await client.query(
                `INSERT INTO reservations (
                    trip_id, seat_id,
                    passenger_name, passenger_document, passenger_email, passenger_phone,
                    status, ticket_code, price,
                    client_id, organization_id,
                    boarding_point, dropoff_point,
                    credits_used, is_partial, amount_paid,
                    created_at, updated_at, created_by
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $17)
                RETURNING *`,
                [
                    trip_id, r.seat_id,
                    r.passenger_name, r.passenger_document, r.passenger_email || null, r.passenger_phone || null,
                    ReservationStatus.PENDING, ticket_code, r.price,
                    clientId, tripOrgId,
                    r.boarding_point || null, r.dropoff_point || null,
                    0, // credits per reservation logic simplified
                    is_partial || false,
                    0, // amount_paid starts 0
                    userId
                ]
            );
            createdReservations.push(resResult.rows[0]);
        }

        // 4. Create Financial Transactions (INCOME)
        const description = `Reserva Portal: ${tripResult.rows[0].title} (${createdReservations.length} pax)`;

        // Entry Transaction (Sinal ou Total)
        const entryAmount = entry_value || (totalAmount - (credits_used || 0));
        await client.query(
            `INSERT INTO transaction (
                organization_id, type, category, amount, description, status, 
                client_id, reservation_id, date, created_at, created_by
            ) VALUES ($1, $2, 'VENDA_PASSAGEM', $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $8)`,
            [tripOrgId, TipoTransacao.INCOME, entryAmount, description + (is_partial ? " - Entrada" : ""), StatusTransacao.PENDING, clientId, createdReservations[0].id, userId]
        );

        // Remaining Balance Transaction
        if (is_partial) {
            const remaining = totalAmount - (credits_used || 0) - entry_value;
            if (remaining > 0) {
                await client.query(
                    `INSERT INTO transaction (
                        organization_id, type, category, amount, description, status, 
                        client_id, reservation_id, date, created_at, created_by
                    ) VALUES ($1, $2, 'VENDA_PASSAGEM', $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $8)`,
                    [tripOrgId, TipoTransacao.INCOME, remaining, description + " - Restante", StatusTransacao.PENDING, clientId, createdReservations[0].id, userId]
                );
            }
        }

        // 5. Update Trip Seats Available
        await client.query(
            "UPDATE trips SET seats_available = seats_available - $1 WHERE id = $2",
            [reservations.length, trip_id]
        );

        await client.query("COMMIT");
        return data({ success: true, reservations: createdReservations });

    } catch (e: any) {
        await client.query("ROLLBACK");
        console.error("Checkout Error:", e);
        return data({ error: e.message || "Checkout falhou" }, { status: 500 });
    } finally {
        client.release();
    }
}
