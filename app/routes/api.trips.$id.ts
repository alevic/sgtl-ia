import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { requireRole, pool } from "@/lib/auth.server";

// GET /api/trips/:id
export async function loader({ request, params }: LoaderFunctionArgs) {
    const session = await requireRole(request, ['admin', 'operacional', 'vendas']);
    const orgId = (session as any).session.activeOrganizationId;
    const { id } = params;

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
        throw new Response("Trip not found", { status: 404 });
    }

    return data(result.rows[0]);
}

// PUT/DELETE /api/trips/:id
export async function action({ request, params }: ActionFunctionArgs) {
    const session = await requireRole(request, ['admin', 'operacional']);
    const orgId = (session as any).session.activeOrganizationId;
    const { id } = params;

    if (request.method === "PUT") {
        const body = await request.json();
        const {
            return_route_id, vehicle_id, driver_id,
            departure_date, departure_time, arrival_date, arrival_time,
            status,
            price_conventional, price_executive, price_semi_sleeper, price_sleeper, price_bed, price_master_bed,
            seats_available, notes,
            title, tags, cover_image, gallery, baggage_limit, alerts, active
        } = body;

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
            return data({ error: "Trip not found" }, { status: 404 });
        }

        return data(result.rows[0]);
    }

    if (request.method === "DELETE") {
        const result = await pool.query(
            "DELETE FROM trips WHERE id = $1 AND organization_id = $2 RETURNING id",
            [id, orgId]
        );

        if (result.rows.length === 0) {
            return data({ error: "Trip not found" }, { status: 404 });
        }

        return data({ success: true });
    }

    return data({ error: "Method not allowed" }, { status: 405 });
}
