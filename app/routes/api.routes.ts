import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { requireRole, pool } from "@/lib/auth.server";

// GET /api/routes - List routes
export async function loader({ request }: LoaderFunctionArgs) {
    const session = await requireRole(request, ['admin', 'operacional']);
    const orgId = (session as any).session.activeOrganizationId;
    const url = new URL(request.url);
    const active = url.searchParams.get("active");

    let query = `SELECT * FROM routes WHERE organization_id = $1`;
    const params: any[] = [orgId];

    if (active) {
        query += ` AND active = $2`;
        params.push(active === 'true');
    }

    query += ` ORDER BY name ASC`;

    const result = await pool.query(query, params);
    return data(result.rows);
}

// POST /api/routes - Create route
export async function action({ request }: ActionFunctionArgs) {
    const session = await requireRole(request, ['admin', 'operacional']);
    const orgId = (session as any).session.activeOrganizationId;
    const userId = session.user.id;

    if (request.method === "POST") {
        const body = await request.json();
        const {
            name, origin_city, origin_state, destination_city, destination_state,
            distance_km, duration_minutes, stops, type
        } = body;

        const result = await pool.query(
            `INSERT INTO routes (
                name, origin_city, origin_state, destination_city, destination_state,
                distance_km, duration_minutes, stops, type, organization_id, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *`,
            [
                name, origin_city, origin_state, destination_city, destination_state,
                distance_km || 0, duration_minutes || 0, JSON.stringify(stops || []),
                type || 'OUTBOUND',
                orgId, userId
            ]
        );

        return data(result.rows[0], { status: 201 });
    }

    return data({ error: "Method not allowed" }, { status: 405 });
}
