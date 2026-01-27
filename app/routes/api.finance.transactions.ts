import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { requireRole, pool } from "@/lib/auth.server";

// GET /api/finance/transactions - List transactions
export async function loader({ request }: LoaderFunctionArgs) {
    const session = await requireRole(request, ['admin', 'financeiro']);
    const orgId = (session as any).session.activeOrganizationId;

    const result = await pool.query(
        `SELECT 
            id,
            type as tipo,
            description as descricao,
            amount as valor,
            currency as moeda,
            date as data_emissao,
            due_date as data_vencimento,
            payment_date as data_pagamento,
            status,
            payment_method as forma_pagamento,
            category as categoria_despesa,
            category as categoria_receita,
            cost_center as centro_custo,
            accounting_classification as classificacao_contabil,
            document_number as numero_documento,
            notes as observacoes,
            created_by as criado_por,
            created_at as criado_em
        FROM transaction 
        WHERE organization_id = $1 
        ORDER BY date DESC, created_at DESC`,
        [orgId]
    );

    return data(result.rows);
}

// POST /api/finance/transactions - Create transaction
export async function action({ request }: ActionFunctionArgs) {
    const session = await requireRole(request, ['admin', 'financeiro']);
    const orgId = (session as any).session.activeOrganizationId;
    const userId = session.user.id;

    if (request.method === "POST") {
        const body = await request.json();
        const {
            tipo, descricao, valor, moeda, data_emissao,
            data_vencimento, data_pagamento, status, forma_pagamento,
            categoria_receita, categoria_despesa, centro_custo,
            classificacao_contabil, numero_documento, observacoes,
            maintenance_id, reserva_id
        } = body;

        const category = tipo === 'RECEITA' ? categoria_receita : categoria_despesa;

        await pool.query(
            `INSERT INTO transaction (
                type, description, amount, currency, date,
                due_date, payment_date, status, payment_method, category,
                cost_center, accounting_classification, document_number, notes,
                organization_id, created_by, maintenance_id, reservation_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
            [
                tipo || 'EXPENSE', descricao, valor, moeda || 'BRL', data_emissao,
                data_vencimento, data_pagamento || null, status || 'PENDING', forma_pagamento || null, category || null,
                centro_custo || null, classificacao_contabil || null, numero_documento || null, observacoes || null,
                orgId, userId, maintenance_id || null, reserva_id || null
            ]
        );

        return data({ success: true });
    }

    return data({ error: "Method not allowed" }, { status: 405 });
}
