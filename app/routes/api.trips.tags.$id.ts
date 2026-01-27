import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { requireRole, pool } from "@/lib/auth.server";

// PUT/DELETE /api/trips/tags/:id
export async function action({ request, params }: ActionFunctionArgs) {
    const session = await requireRole(request, ['admin', 'operacional']);
    const orgId = (session as any).session.activeOrganizationId;
    const { id } = params;

    if (request.method === "PUT") {
        const body = await request.json();
        const { nome, cor } = body;

        const result = await pool.query(
            `UPDATE trip_tags SET 
                nome = COALESCE($1, nome),
                cor = COALESCE($2, cor)
             WHERE id = $3 AND organization_id = $4
             RETURNING *`,
            [nome, cor, id, orgId]
        );

        if (result.rows.length === 0) {
            return data({ error: "Tag not found" }, { status: 404 });
        }

        return data(result.rows[0]);
    }

    if (request.method === "DELETE") {
        const result = await pool.query(
            "DELETE FROM trip_tags WHERE id = $1 AND organization_id = $2 RETURNING id",
            [id, orgId]
        );

        if (result.rows.length === 0) {
            return data({ error: "Tag not found" }, { status: 404 });
        }

        return data({ success: true });
    }

    return data({ error: "Method not allowed" }, { status: 405 });
}
