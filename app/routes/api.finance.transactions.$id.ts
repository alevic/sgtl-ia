import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { requireRole, pool } from "@/lib/auth.server";

// GET /api/finance/transactions/:id
export async function loader({ request, params }: LoaderFunctionArgs) {
    const session = await requireRole(request, ['admin', 'financeiro']);
    const orgId = (session as any).session.activeOrganizationId;
    const { id } = params;

    const result = await pool.query(
        `SELECT * FROM transaction WHERE id = $1 AND organization_id = $2`,
        [id, orgId]
    );

    if (result.rows.length === 0) {
        throw new Response("Transaction not found", { status: 404 });
    }

    return data(result.rows[0]);
}

// PUT/DELETE /api/finance/transactions/:id
export async function action({ request, params }: ActionFunctionArgs) {
    const session = await requireRole(request, ['admin', 'financeiro']);
    const orgId = (session as any).session.activeOrganizationId;
    const { id } = params;

    // Verify ownership
    const check = await pool.query(
        `SELECT id FROM transaction WHERE id = $1 AND organization_id = $2`,
        [id, orgId]
    );

    if (check.rows.length === 0) {
        return data({ error: "Transaction not found" }, { status: 404 });
    }

    if (request.method === "PUT") {
        const body = await request.json();
        const {
            tipo, descricao, valor, moeda, data_emissao,
            data_vencimento, data_pagamento, status, forma_pagamento,
            categoria_receita, categoria_despesa, centro_custo,
            classificacao_contabil, numero_documento, observacoes
        } = body;

        const category = tipo === 'RECEITA' ? categoria_receita : categoria_despesa;

        await pool.query(
            `UPDATE transaction SET
                type = $1, description = $2, amount = $3, currency = $4, date = $5,
                due_date = $6, payment_date = $7, status = $8, payment_method = $9, category = $10,
                cost_center = $11, accounting_classification = $12, document_number = $13, notes = $14
            WHERE id = $15 AND organization_id = $16`,
            [
                tipo || 'EXPENSE', descricao, valor, moeda || 'BRL', data_emissao,
                data_vencimento, data_pagamento || null, status || 'PENDING', forma_pagamento || null, category || null,
                centro_custo || null, classificacao_contabil || null, numero_documento || null, observacoes || null,
                id, orgId
            ]
        );

        return data({ success: true });
    }

    if (request.method === "DELETE") {
        await pool.query(`DELETE FROM transaction WHERE id = $1`, [id]);
        return data({ success: true });
    }

    return data({ error: "Method not allowed" }, { status: 405 });
}
