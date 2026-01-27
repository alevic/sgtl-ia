import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { requireRole, pool } from "@/lib/auth.server";
import { FretamentoStatus } from "@/types";

// GET /api/charters/:id
export async function loader({ request, params }: LoaderFunctionArgs) {
    const session = await requireRole(request, ['admin', 'operacional', 'vendas']);
    const orgId = (session as any).session.activeOrganizationId;
    const { id } = params;

    const result = await pool.query(
        `SELECT * FROM charter_requests WHERE id = $1 AND organization_id = $2`,
        [id, orgId]
    );

    if (result.rows.length === 0) {
        throw new Response("Charter request not found", { status: 404 });
    }

    return data(result.rows[0]);
}

// PUT /api/charters/:id
export async function action({ request, params }: ActionFunctionArgs) {
    const session = await requireRole(request, ['admin', 'operacional', 'vendas']);
    const orgId = (session as any).session.activeOrganizationId;
    const { id } = params;

    if (request.method === "PUT") {
        const body = await request.json();
        const { status, quote_price, notes } = body;

        const check = await pool.query(
            "SELECT id FROM charter_requests WHERE id = $1 AND organization_id = $2",
            [id, orgId]
        );

        if (check.rows.length === 0) {
            return data({ error: "Charter request not found" }, { status: 404 });
        }

        const result = await pool.query(
            `UPDATE charter_requests SET
                status = COALESCE($1, status),
                quote_price = COALESCE($2, quote_price),
                notes = COALESCE($3, notes),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $4 AND organization_id = $5
            RETURNING *`,
            [status, quote_price, notes, id, orgId]
        );

        return data(result.rows[0]);
    }

    return data({ error: "Method not allowed" }, { status: 405 });
}
