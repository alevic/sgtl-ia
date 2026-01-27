import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { requireRole, pool } from "@/lib/auth.server";
import { StatusManutencao, VeiculoStatus, StatusTransacao } from "@/types";

// GET /api/maintenance/:id
export async function loader({ request, params }: LoaderFunctionArgs) {
    const session = await requireRole(request, ['admin', 'operacional', 'financeiro']);
    const orgId = (session as any).session.activeOrganizationId;
    const { id } = params;

    const result = await pool.query(
        `SELECT m.*, v.placa, v.modelo, v.tipo as vehicle_type, t.id as transaction_id, t.status as transaction_status
         FROM maintenance m
         JOIN vehicle v ON m.vehicle_id = v.id
         LEFT JOIN transaction t ON t.maintenance_id = m.id
         WHERE m.id = $1 AND m.organization_id = $2`,
        [id, orgId]
    );

    if (result.rows.length === 0) {
        throw new Response("Maintenance not found", { status: 404 });
    }

    return data(result.rows[0]);
}

// PUT/DELETE /api/maintenance/:id
export async function action({ request, params }: ActionFunctionArgs) {
    const session = await requireRole(request, ['admin', 'operacional']);
    const orgId = (session as any).session.activeOrganizationId;
    const { id } = params;

    if (request.method === "DELETE") {
        const check = await pool.query(
            "SELECT id FROM maintenance WHERE id = $1 AND organization_id = $2",
            [id, orgId]
        );
        if (check.rows.length === 0) {
            return data({ error: "Maintenance not found" }, { status: 404 });
        }
        await pool.query("DELETE FROM maintenance WHERE id = $1", [id]);
        return data({ success: true });
    }

    if (request.method === "PUT") {
        const body = await request.json();
        const {
            vehicle_id, tipo, status, data_agendada, data_inicio, data_conclusao,
            km_veiculo, descricao, custo_pecas, custo_mao_de_obra, moeda,
            oficina, responsavel, observacoes
        } = body;

        const check = await pool.query(
            "SELECT id FROM maintenance WHERE id = $1 AND organization_id = $2",
            [id, orgId]
        );

        if (check.rows.length === 0) {
            return data({ error: "Maintenance not found" }, { status: 404 });
        }

        const result = await pool.query(
            `UPDATE maintenance SET
                vehicle_id = $1, tipo = $2, status = $3, data_agendada = $4,
                data_inicio = $5, data_conclusao = $6, km_veiculo = $7,
                descricao = $8, custo_pecas = $9, custo_mao_de_obra = $10,
                moeda = $11, oficina = $12, responsavel = $13, observacoes = $14,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $15 AND organization_id = $16
            RETURNING *`,
            [
                vehicle_id, tipo, status, data_agendada, data_inicio || null, data_conclusao || null,
                km_veiculo, descricao, custo_pecas || 0, custo_mao_de_obra || 0, moeda || 'BRL',
                oficina || null, responsavel || null, observacoes || null, id, orgId
            ]
        );

        // Update transaction logic
        if (status !== StatusManutencao.CANCELLED && status !== 'CANCELADA') {
            const custoTotal = (Number(custo_pecas) || 0) + (Number(custo_mao_de_obra) || 0);
            if (custoTotal > 0) {
                await pool.query(
                    `UPDATE transaction SET 
                        amount = $1, 
                        description = 'Manutenção ' || COALESCE((SELECT placa FROM vehicle WHERE id = $6), 'Veículo') || ' - ' || $2,
                        date = $3
                      WHERE maintenance_id = $4 AND organization_id = $5 AND (status = $7 OR status = 'PENDENTE')`,
                    [custoTotal, tipo, data_agendada, id, orgId, vehicle_id, StatusTransacao.PENDING]
                );
            }
        }

        // Update vehicle status logic
        if (status === StatusManutencao.IN_PROGRESS || status === 'EM_ANDAMENTO') {
            await pool.query(
                `UPDATE vehicle SET status = $1, km_atual = GREATEST(km_atual, $2) WHERE id = $3 AND organization_id = $4`,
                [VeiculoStatus.MAINTENANCE, km_veiculo || 0, vehicle_id, orgId]
            );
        } else if (status === StatusManutencao.COMPLETED || status === 'CONCLUIDA') {
            await pool.query(
                `UPDATE vehicle SET status = $1, km_atual = GREATEST(km_atual, $2) WHERE id = $3 AND organization_id = $4`,
                [VeiculoStatus.ACTIVE, km_veiculo || 0, vehicle_id, orgId]
            );

            // Mark transaction as PAID
            await pool.query(
                `UPDATE transaction SET status = $1, payment_date = CURRENT_DATE 
                 WHERE maintenance_id = $2 AND organization_id = $3 AND (status = $4 OR status = 'PENDENTE')`,
                [StatusTransacao.PAID, id, orgId, StatusTransacao.PENDING]
            );
        } else if (status === StatusManutencao.CANCELLED || status === 'CANCELADA') {
            await pool.query(
                `UPDATE transaction SET status = $1 WHERE maintenance_id = $2 AND organization_id = $3`,
                [StatusTransacao.CANCELLED, id, orgId]
            );
        } else {
            await pool.query(
                `UPDATE vehicle SET km_atual = GREATEST(km_atual, $1) WHERE id = $2 AND organization_id = $3`,
                [km_veiculo || 0, vehicle_id, orgId]
            );
        }

        return data(result.rows[0]);
    }

    return data({ error: "Method not allowed" }, { status: 405 });
}
