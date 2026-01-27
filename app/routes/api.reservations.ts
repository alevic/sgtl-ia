import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { requireRole, pool } from "@/lib/auth.server";
import crypto from "crypto";

// GET /api/reservations - List reservations
export async function loader({ request }: LoaderFunctionArgs) {
    const session = await requireRole(request, ['admin', 'operacional', 'vendas']);
    const orgId = (session as any).session.activeOrganizationId;
    const url = new URL(request.url);
    const { trip_id, status, ticket_code, passenger_name, vehicle_id, client_id } = Object.fromEntries(url.searchParams);

    let query = `
        SELECT r.*, 
               t.departure_date, t.departure_time, t.title as trip_title, t.id as trip_id,
               t.vehicle_id,
               route.name as route_name, route.stops as route_stops,
               rr.stops as return_route_stops,
               s.numero as seat_number, s.tipo as seat_type,
               v.placa as vehicle_plate, v.modelo as vehicle_model
        FROM reservations r
        JOIN trips t ON r.trip_id = t.id
        JOIN routes route ON t.route_id = route.id
        LEFT JOIN routes rr ON t.return_route_id = rr.id
        LEFT JOIN seat s ON r.seat_id = s.id
        LEFT JOIN vehicle v ON t.vehicle_id = v.id
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

    if (vehicle_id) {
        paramCount++;
        query += ` AND t.vehicle_id = $${paramCount}`;
        params.push(vehicle_id);
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

    if (client_id) {
        paramCount++;
        query += ` AND r.client_id = $${paramCount}`;
        params.push(client_id);
    }

    query += ` ORDER BY r.created_at DESC`;

    const result = await pool.query(query, params);
    return data(result.rows);
}

// POST /api/reservations - Create reservation
export async function action({ request }: ActionFunctionArgs) {
    const session = await requireRole(request, ['admin', 'operacional', 'vendas']);
    const orgId = (session as any).session.activeOrganizationId;
    const userId = session.user.id;

    if (request.method === "POST") {
        const body = await request.json();
        const {
            trip_id, seat_id, seat_number,
            passenger_name, passenger_document, passenger_email, passenger_phone,
            price, client_id, notes, status,
            valor_pago, forma_pagamento,
            boarding_point, dropoff_point,
            credits_used, external_payment_id
        } = body;

        const finalStatus = status || 'PENDING';

        // Check for double booking
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
                return data({ error: `O assento ${seat_number} já está reservado para esta viagem.` }, { status: 409 });
            }
        }

        // Verify seat availability if seat_id is provided
        if (seat_id) {
            const seatCheck = await pool.query(
                "SELECT status FROM seat WHERE id = $1",
                [seat_id]
            );
            if (seatCheck.rows.length === 0) {
                return data({ error: "Seat not found" }, { status: 404 });
            }

            const reservationCheck = await pool.query(
                "SELECT id FROM reservations WHERE trip_id = $1 AND seat_id = $2 AND status != 'CANCELLED'",
                [trip_id, seat_id]
            );

            if (reservationCheck.rows.length > 0) {
                return data({ error: "Seat already reserved for this trip" }, { status: 400 });
            }
        }

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
                external_payment_id || null,
                boarding_point || null, dropoff_point || null
            ]
        );

        // Update seats available count on trip
        await pool.query(
            "UPDATE trips SET seats_available = seats_available - 1 WHERE id = $1",
            [trip_id]
        );

        // Handle Credit Deduction
        if (credits_used && Number(credits_used) > 0 && client_id) {
            await pool.query(
                `UPDATE clients 
                 SET saldo_creditos = saldo_creditos - $1 
                 WHERE id = $2 AND saldo_creditos >= $1`,
                [credits_used, client_id]
            );
        }

        return data(result.rows[0], { status: 201 });
    }

    return data({ error: "Method not allowed" }, { status: 405 });
}
