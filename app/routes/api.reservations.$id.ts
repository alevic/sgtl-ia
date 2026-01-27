import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { requireRole, pool } from "@/lib/auth.server";

// GET /api/reservations/:id
export async function loader({ request, params }: LoaderFunctionArgs) {
    const session = await requireRole(request, ['admin', 'operacional', 'vendas']);
    const orgId = (session as any).session.activeOrganizationId;
    const { id } = params;

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
        throw new Response("Reservation not found", { status: 404 });
    }

    return data(result.rows[0]);
}

// PUT /api/reservations/:id
export async function action({ request, params }: ActionFunctionArgs) {
    const session = await requireRole(request, ['admin', 'operacional', 'vendas']);
    const orgId = (session as any).session.activeOrganizationId;
    const { id } = params;

    if (request.method === "PUT") {
        const body = await request.json();
        const { status, notes, passenger_name, passenger_document, forma_pagamento, valor_pago, boarding_point, dropoff_point } = body;

        const currentRes = await pool.query(
            "SELECT status, trip_id FROM reservations WHERE id = $1 AND organization_id = $2",
            [id, orgId]
        );

        if (currentRes.rows.length === 0) {
            return data({ error: "Reservation not found" }, { status: 404 });
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

        return data(result.rows[0]);
    }

    return data({ error: "Method not allowed" }, { status: 405 });
}
