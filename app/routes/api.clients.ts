import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { requireRole, pool } from "@/lib/auth.server";

// GET /api/clients - List clients with stats
export async function loader({ request }: LoaderFunctionArgs) {
    const session = await requireRole(request, ['admin', 'operacional', 'vendas', 'financeiro']);
    const orgId = (session as any).session.activeOrganizationId;
    const url = new URL(request.url);
    const search = url.searchParams.get("search");

    let sql = `
        SELECT c.*,
        (
            SELECT COALESCE(COUNT(*), 0)
            FROM reservations r 
            WHERE r.client_id = c.id 
            AND (r.status IN ('CONFIRMADA', 'UTILIZADA', 'EMBARCADO', 'CONFIRMED', 'USED', 'CHECKED_IN'))
            AND r.organization_id = $1
        )::int as historico_viagens,
        (
            SELECT COALESCE(SUM(r.amount_paid), 0)
            FROM reservations r 
            WHERE r.client_id = c.id 
            AND (r.status NOT IN ('CANCELADA', 'PENDENTE', 'CANCELLED', 'PENDING'))
            AND r.organization_id = $1
        )::float as valor_total_gasto,
        (
            SELECT MAX(t.departure_date)
            FROM reservations r 
            JOIN trips t ON r.trip_id = t.id
            WHERE r.client_id = c.id 
            AND (r.status IN ('CONFIRMADA', 'UTILIZADA', 'EMBARCADO', 'CONFIRMED', 'USED', 'CHECKED_IN'))
            AND t.departure_date <= CURRENT_DATE
            AND r.organization_id = $1
        ) as ultima_viagem
        FROM clients c 
        WHERE 1=1
    `;
    const params: any[] = [orgId];

    if (search) {
        sql += ` AND (c.nome ILIKE $2 OR c.email ILIKE $2 OR c.documento ILIKE $2)`;
        params.push(`%${search}%`);
    }

    sql += ` ORDER BY c.created_at DESC`;

    const result = await pool.query(sql, params);
    return data(result.rows);
}

// POST /api/clients - Create client
export async function action({ request }: ActionFunctionArgs) {
    await requireRole(request, ['admin', 'operacional', 'vendas']);

    if (request.method === "POST") {
        const body = await request.json();
        const {
            nome, email, telefone, documento_tipo, documento,
            nacionalidade, data_nascimento, endereco, cidade, estado, pais,
            segmento, observacoes
        } = body;

        const result = await pool.query(
            `INSERT INTO clients (
                nome, email, telefone, documento_tipo, documento,
                nacionalidade, data_nascimento, endereco, cidade, estado, pais,
                segmento, observacoes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *`,
            [
                nome, email, telefone, documento_tipo, documento,
                nacionalidade, data_nascimento, endereco, cidade, estado, pais,
                segmento, observacoes
            ]
        );

        return data(result.rows[0], { status: 201 });
    }

    return data({ error: "Method not allowed" }, { status: 405 });
}
