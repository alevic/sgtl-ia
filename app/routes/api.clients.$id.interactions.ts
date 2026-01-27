import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { requireRole, pool } from "@/lib/auth.server";

// GET /api/clients/:id/interactions
export async function loader({ request, params }: LoaderFunctionArgs) {
    const session = await requireRole(request, ['admin', 'operacional', 'vendas']);
    const orgId = (session as any).session.activeOrganizationId;
    const { id } = params;

    const result = await pool.query(`
        SELECT ci.* 
        FROM client_interactions ci
        WHERE ci.cliente_id = $1 AND ci.organization_id = $2
        ORDER BY ci.data_hora DESC
    `, [id, orgId]);

    return data(result.rows);
}

// POST /api/clients/:id/interactions
export async function action({ request, params }: ActionFunctionArgs) {
    const session = await requireRole(request, ['admin', 'operacional', 'vendas']);
    const orgId = (session as any).session.activeOrganizationId;
    const { id } = params;

    if (request.method === "POST") {
        const body = await request.json();
        const { tipo, descricao, usuario_responsavel } = body;

        const result = await pool.query(
            `INSERT INTO client_interactions (cliente_id, tipo, descricao, usuario_responsavel, organization_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [id, tipo, descricao, usuario_responsavel, orgId]
        );

        return data(result.rows[0], { status: 201 });
    }

    return data({ error: "Method not allowed" }, { status: 405 });
}
