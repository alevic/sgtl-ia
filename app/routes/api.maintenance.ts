import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { requireRole, pool } from "@/lib/auth.server";
import { StatusManutencao, VeiculoStatus, StatusTransacao } from "@/types";

// GET /api/maintenance
export async function loader({ request }: LoaderFunctionArgs) {
    const session = await requireRole(request, ['admin', 'operacional', 'financeiro']);
    const orgId = (session as any).session.activeOrganizationId;
    const url = new URL(request.url);
    const vehicle_id = url.searchParams.get("vehicle_id");

    let query = `SELECT m.*, v.placa, v.modelo 
                 FROM maintenance m
                 JOIN vehicle v ON m.vehicle_id = v.id
                 WHERE m.organization_id = $1`;
    const params: any[] = [orgId];

    if (vehicle_id) {
        query += ` AND m.vehicle_id = $2`;
        params.push(vehicle_id);
    }

    query += ` ORDER BY m.data_agendada DESC, m.created_at DESC`;

    const result = await pool.query(query, params);
    return data(result.rows);
}

// POST /api/maintenance
export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== "POST") {
        return data({ error: "Method not allowed" }, { status: 405 });
    }

    const session = await requireRole(request, ['admin', 'operacional']);
    const orgId = (session as any).session.activeOrganizationId;
    const userId = (session.user as any).id;
    const body = await request.json();

    const {
        vehicle_id, tipo, status, data_agendada, data_inicio, data_conclusao,
        km_veiculo, descricao, custo_pecas, custo_mao_de_obra, moeda,
        oficina, responsavel, observacoes
    } = body;

    try {
        const result = await pool.query(
            `INSERT INTO maintenance (
                vehicle_id, tipo, status, data_agendada, data_inicio, data_conclusao,
                km_veiculo, descricao, custo_pecas, custo_mao_de_obra, moeda,
                oficina, responsavel, observacoes, organization_id, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING *`,
            [
                vehicle_id, tipo, status, data_agendada, data_inicio || null, data_conclusao || null,
                km_veiculo, descricao, custo_pecas || 0, custo_mao_de_obra || 0, moeda || 'BRL',
                oficina || null, responsavel || null, observacoes || null, orgId, userId
            ]
        );

        // Update vehicle status and KM
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
        } else {
            // Update KM even if scheduled
            await pool.query(
                `UPDATE vehicle SET km_atual = GREATEST(km_atual, $1) WHERE id = $2 AND organization_id = $3`,
                [km_veiculo || 0, vehicle_id, orgId]
            );
        }

        // Ideally create a Transaction here if it implies cost? The legacy code didn't CREATE explicit transaction in POST, only updated in PUT?
        // Checking legacy code: Legacy POST does NOT create transaction. Only logic updates vehicle.
        // Wait, did I miss something? 
        // Legacy POST logic ended at line 140. No transaction insert.
        // So we follow legacy behavior.

        return data(result.rows[0], { status: 201 });
    } catch (error: any) {
        console.error("Error creating maintenance:", error);
        return data({ error: "Falha ao criar manutenção" }, { status: 500 });
    }
}
