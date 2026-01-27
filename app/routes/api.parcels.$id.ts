import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { requireRole, pool } from "@/lib/auth.server";
import { EncomendaStatus } from "@/types";

// GET /api/parcels/:id
export async function loader({ request, params }: LoaderFunctionArgs) {
    const session = await requireRole(request, ['admin', 'operacional', 'vendas']);
    const orgId = (session as any).session.activeOrganizationId;
    const { id } = params;

    const result = await pool.query(
        `SELECT p.*, 
               t.departure_date, t.departure_time,
               route.name as route_name
        FROM parcel_orders p
        LEFT JOIN trips t ON p.trip_id = t.id
        LEFT JOIN routes route ON t.route_id = route.id
        WHERE p.id = $1 AND p.organization_id = $2`,
        [id, orgId]
    );

    if (result.rows.length === 0) {
        throw new Response("Parcel not found", { status: 404 });
    }

    return data(result.rows[0]);
}

// PUT /api/parcels/:id
export async function action({ request, params }: ActionFunctionArgs) {
    const session = await requireRole(request, ['admin', 'operacional', 'vendas']);
    const orgId = (session as any).session.activeOrganizationId;
    const { id } = params;

    if (request.method === "PUT") {
        const body = await request.json();
        const { status, notes, trip_id } = body;

        const check = await pool.query(
            "SELECT id FROM parcel_orders WHERE id = $1 AND organization_id = $2",
            [id, orgId]
        );

        if (check.rows.length === 0) {
            return data({ error: "Parcel not found" }, { status: 404 });
        }

        const result = await pool.query(
            `UPDATE parcel_orders SET
                status = COALESCE($1, status),
                notes = COALESCE($2, notes),
                trip_id = COALESCE($3, trip_id),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $4 AND organization_id = $5
            RETURNING *`,
            [status, notes, trip_id, id, orgId]
        );

        return data(result.rows[0]);
    }

    return data({ error: "Method not allowed" }, { status: 405 });
}
