import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { requireRole, pool } from "@/lib/auth.server";

// GET /api/fleet/drivers/:id
export async function loader({ request, params }: LoaderFunctionArgs) {
    const session = await requireRole(request, ['admin', 'operacional']);
    const orgId = (session as any).session.activeOrganizationId;
    const { id } = params;

    const result = await pool.query(
        `SELECT * FROM driver WHERE id = $1 AND organization_id = $2`,
        [id, orgId]
    );

    if (result.rows.length === 0) {
        throw new Response("Driver not found", { status: 404 });
    }

    return data(result.rows[0]);
}

// PUT/DELETE /api/fleet/drivers/:id
export async function action({ request, params }: ActionFunctionArgs) {
    const session = await requireRole(request, ['admin', 'operacional']);
    const orgId = (session as any).session.activeOrganizationId;
    const { id } = params;

    const check = await pool.query(
        "SELECT id FROM driver WHERE id = $1 AND organization_id = $2",
        [id, orgId]
    );

    if (check.rows.length === 0) {
        return data({ error: "Driver not found" }, { status: 404 });
    }

    if (request.method === "PUT") {
        const body = await request.json();
        const {
            nome, cnh, categoria_cnh, validade_cnh, passaporte, validade_passaporte,
            telefone, email, endereco, cidade, estado, pais, status,
            data_contratacao, salario, anos_experiencia, viagens_internacionais,
            disponivel_internacional, observacoes
        } = body;

        const result = await pool.query(
            `UPDATE driver SET
                nome = $1, cnh = $2, categoria_cnh = $3, validade_cnh = $4,
                passaporte = $5, validade_passaporte = $6, telefone = $7, email = $8,
                endereco = $9, cidade = $10, estado = $11, pais = $12, status = $13,
                data_contratacao = $14, salario = $15, anos_experiencia = $16,
                viagens_internacionais = $17, disponivel_internacional = $18, observacoes = $19,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $20 AND organization_id = $21
            RETURNING *`,
            [
                nome, cnh, categoria_cnh, validade_cnh, passaporte || null, validade_passaporte || null,
                telefone || null, email || null, endereco || null, cidade || null, estado || null, pais || null,
                status || 'AVAILABLE', data_contratacao, salario || null, anos_experiencia || null, viagens_internacionais || 0,
                disponivel_internacional || false, observacoes || null,
                id, orgId
            ]
        );

        return data(result.rows[0]);
    }

    if (request.method === "DELETE") {
        await pool.query("DELETE FROM driver WHERE id = $1 AND organization_id = $2", [id, orgId]);
        return data({ success: true });
    }

    return data({ error: "Method not allowed" }, { status: 405 });
}
