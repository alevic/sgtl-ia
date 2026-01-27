import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { requireRole, pool } from "@/lib/auth.server";

// GET /api/trips/tags
export async function loader({ request }: LoaderFunctionArgs) {
    const session = await requireRole(request, ['admin', 'operacional', 'vendas']);
    const orgId = (session as any).session.activeOrganizationId;

    const result = await pool.query(
        "SELECT * FROM trip_tags WHERE organization_id = $1 ORDER BY nome ASC",
        [orgId]
    );

    return data(result.rows);
}

// POST /api/trips/tags
export async function action({ request }: ActionFunctionArgs) {
    const session = await requireRole(request, ['admin', 'operacional']);
    const orgId = (session as any).session.activeOrganizationId;

    if (request.method === "POST") {
        const body = await request.json();
        const { nome, cor } = body;

        const result = await pool.query(
            `INSERT INTO trip_tags (nome, cor, organization_id) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (nome, organization_id) DO UPDATE SET cor = EXCLUDED.cor
             RETURNING *`,
            [nome, cor || null, orgId]
        );

        return data(result.rows[0], { status: 201 });
    }

    return data({ error: "Method not allowed" }, { status: 405 });
}
