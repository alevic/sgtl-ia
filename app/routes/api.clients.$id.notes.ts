import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { requireRole, pool } from "@/lib/auth.server";

// GET /api/clients/:id/notes
export async function loader({ request, params }: LoaderFunctionArgs) {
    const session = await requireRole(request, ['admin', 'operacional', 'vendas']);
    const orgId = (session as any).session.activeOrganizationId;
    const { id } = params;

    const result = await pool.query(`
        SELECT cn.* 
        FROM client_notes cn
        WHERE cn.cliente_id = $1 AND cn.organization_id = $2
        ORDER BY cn.data_criacao DESC
    `, [id, orgId]);

    return data(result.rows);
}

// POST /api/clients/:id/notes
export async function action({ request, params }: ActionFunctionArgs) {
    const session = await requireRole(request, ['admin', 'operacional', 'vendas']);
    const orgId = (session as any).session.activeOrganizationId;
    const { id } = params;

    if (request.method === "POST") {
        const body = await request.json();
        const { titulo, conteudo, criado_por, importante } = body;

        const result = await pool.query(
            `INSERT INTO client_notes (cliente_id, titulo, conteudo, criado_por, importante, organization_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`,
            [id, titulo, conteudo, criado_por, importante, orgId]
        );

        return data(result.rows[0], { status: 201 });
    }

    return data({ error: "Method not allowed" }, { status: 405 });
}
