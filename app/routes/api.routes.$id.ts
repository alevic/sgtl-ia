import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { requireRole, pool } from "@/lib/auth.server";

// GET /api/routes/:id
export async function loader({ request, params }: LoaderFunctionArgs) {
    const session = await requireRole(request, ['admin', 'operacional']);
    const orgId = (session as any).session.activeOrganizationId;
    const { id } = params;

    const result = await pool.query(
        `SELECT * FROM routes WHERE id = $1 AND organization_id = $2`,
        [id, orgId]
    );

    if (result.rows.length === 0) {
        throw new Response("Route not found", { status: 404 });
    }

    return data(result.rows[0]);
}

// PUT/DELETE /api/routes/:id
export async function action({ request, params }: ActionFunctionArgs) {
    const session = await requireRole(request, ['admin', 'operacional']);
    const orgId = (session as any).session.activeOrganizationId;
    const { id } = params;

    if (request.method === "PUT") {
        const body = await request.json();
        const {
            name, origin_city, origin_state, destination_city, destination_state,
            distance_km, duration_minutes, stops, active, type
        } = body;

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
            return data({ error: "Route not found" }, { status: 404 });
        }

        return data(result.rows[0]);
    }

    if (request.method === "DELETE") {
        // Check for dependencies (trips)
        const tripCheck = await pool.query(
            "SELECT id FROM trips WHERE route_id = $1 LIMIT 1",
            [id]
        );

        if (tripCheck.rows.length > 0) {
            return data({ error: "Cannot delete route with existing trips" }, { status: 400 });
        }

        const result = await pool.query(
            "DELETE FROM routes WHERE id = $1 AND organization_id = $2 RETURNING id",
            [id, orgId]
        );

        if (result.rows.length === 0) {
            return data({ error: "Route not found" }, { status: 404 });
        }

        return data({ success: true });
    }

    return data({ error: "Method not allowed" }, { status: 405 });
}
