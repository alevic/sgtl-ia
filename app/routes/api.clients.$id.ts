import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { requireRole, pool } from "@/lib/auth.server";

// GET /api/clients/:id
export async function loader({ request, params }: LoaderFunctionArgs) {
    const session = await requireRole(request, ['admin', 'operacional', 'vendas', 'financeiro']);
    const orgId = (session as any).session.activeOrganizationId;
    const { id } = params;

    const result = await pool.query(`
        SELECT c.*,
        (
            SELECT COALESCE(COUNT(*), 0)
            FROM reservations r 
            WHERE r.client_id = c.id 
            AND (r.status IN ('CONFIRMADA', 'UTILIZADA', 'EMBARCADO', 'CONFIRMED', 'USED', 'CHECKED_IN'))
            AND r.organization_id = $2
        )::int as historico_viagens,
        (
            SELECT COALESCE(SUM(r.amount_paid), 0)
            FROM reservations r 
            WHERE r.client_id = c.id 
            AND (r.status NOT IN ('CANCELADA', 'PENDENTE', 'CANCELLED', 'PENDING'))
            AND r.organization_id = $2
        )::float as valor_total_gasto,
        (
            SELECT MAX(t.departure_date)
            FROM reservations r 
            JOIN trips t ON r.trip_id = t.id
            WHERE r.client_id = c.id 
            AND (r.status IN ('CONFIRMADA', 'UTILIZADA', 'EMBARCADO', 'CONFIRMED', 'USED', 'CHECKED_IN'))
            AND t.departure_date <= CURRENT_DATE
            AND r.organization_id = $2
        ) as ultima_viagem
        FROM clients c 
        WHERE c.id = $1
    `, [id, orgId]);

    if (result.rows.length === 0) {
        throw new Response("Client not found", { status: 404 });
    }

    return data(result.rows[0]);
}

// PUT/DELETE /api/clients/:id
export async function action({ request, params }: ActionFunctionArgs) {
    const { id } = params;

    if (request.method === "PUT") {
        await requireRole(request, ['admin', 'operacional', 'vendas', 'financeiro']);
        const body = await request.json();
        const {
            nome, email, telefone, documento_tipo, documento,
            nacionalidade, data_nascimento, endereco, cidade, estado, pais,
            segmento, observacoes, saldo_creditos
        } = body;

        const result = await pool.query(
            `UPDATE clients SET
                nome = COALESCE($1, nome),
                email = COALESCE($2, email),
                telefone = COALESCE($3, telefone),
                documento_tipo = COALESCE($4, documento_tipo),
                documento = COALESCE($5, documento),
                nacionalidade = COALESCE($6, nacionalidade),
                data_nascimento = COALESCE($7, data_nascimento),
                endereco = COALESCE($8, endereco),
                cidade = COALESCE($9, cidade),
                estado = COALESCE($10, estado),
                pais = COALESCE($11, pais),
                segmento = COALESCE($12, segmento),
                observacoes = COALESCE($13, observacoes),
                saldo_creditos = COALESCE($14, saldo_creditos),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $15
            RETURNING *`,
            [
                nome, email, telefone, documento_tipo, documento,
                nacionalidade, data_nascimento, endereco, cidade, estado, pais,
                segmento, observacoes, saldo_creditos, id
            ]
        );

        if (result.rows.length === 0) {
            return data({ error: "Client not found" }, { status: 404 });
        }

        return data(result.rows[0]);
    }

    if (request.method === "DELETE") {
        await requireRole(request, ['admin']);
        const result = await pool.query('DELETE FROM clients WHERE id = $1', [id]);

        if (result.rowCount === 0) {
            return data({ error: "Client not found" }, { status: 404 });
        }

        return data({ success: true });
    }

    return data({ error: "Method not allowed" }, { status: 405 });
}
