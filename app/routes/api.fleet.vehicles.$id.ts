import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { requireRole, pool } from "@/lib/auth.server";

// GET /api/fleet/vehicles/:id
export async function loader({ request, params }: LoaderFunctionArgs) {
    const session = await requireRole(request, ['admin', 'operacional']);
    const orgId = (session as any).session.activeOrganizationId;
    const { id } = params;

    const result = await pool.query(
        `SELECT * FROM vehicle WHERE id = $1 AND organization_id = $2`,
        [id, orgId]
    );

    if (result.rows.length === 0) {
        throw new Response("Vehicle not found", { status: 404 });
    }

    const vehicle = result.rows[0];

    // Fetch features
    const featuresResult = await pool.query(
        `SELECT id, category, label, value FROM vehicle_feature WHERE vehicle_id = $1`,
        [id]
    );

    return data({
        ...vehicle,
        features: featuresResult.rows
    });
}

// PUT/DELETE /api/fleet/vehicles/:id
export async function action({ request, params }: ActionFunctionArgs) {
    const session = await requireRole(request, ['admin', 'operacional']);
    const orgId = (session as any).session.activeOrganizationId;
    const { id } = params;

    // Verify ownership
    const check = await pool.query(
        "SELECT id FROM vehicle WHERE id = $1 AND organization_id = $2",
        [id, orgId]
    );

    if (check.rows.length === 0) {
        return data({ error: "Vehicle not found" }, { status: 404 });
    }

    if (request.method === "PUT") {
        const body = await request.json();
        const {
            placa, modelo, tipo, status, ano, km_atual, proxima_revisao_km,
            ultima_revisao, is_double_deck, capacidade_passageiros,
            capacidade_carga, observacoes, motorista_atual, features, imagem, galeria
        } = body;

        const result = await pool.query(
            `UPDATE vehicle SET
                placa = $1, modelo = $2, tipo = $3, status = $4, ano = $5,
                km_atual = $6, proxima_revisao_km = $7, ultima_revisao = $8,
                is_double_deck = $9, capacidade_passageiros = $10,
                capacidade_carga = $11, observacoes = $12, motorista_atual = $13,
                imagem = $14, galeria = $15,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $16 AND organization_id = $17
            RETURNING *`,
            [
                placa, modelo, tipo, status || 'ACTIVE', ano, km_atual, proxima_revisao_km,
                ultima_revisao || null, is_double_deck || false, capacidade_passageiros || null,
                capacidade_carga || null, observacoes || null, motorista_atual || null,
                imagem || null, galeria ? JSON.stringify(galeria) : null,
                id, orgId
            ]
        );

        // Update features (Sync)
        if (Array.isArray(features)) {
            await pool.query(`DELETE FROM vehicle_feature WHERE vehicle_id = $1`, [id]);
            for (const feature of features) {
                if (feature.label) {
                    await pool.query(
                        `INSERT INTO vehicle_feature (vehicle_id, category, label, value) VALUES ($1, $2, $3, $4)`,
                        [id, feature.category || null, feature.label, feature.value || '']
                    );
                }
            }
        }

        return data(result.rows[0]);
    }

    if (request.method === "DELETE") {
        await pool.query("DELETE FROM vehicle WHERE id = $1 AND organization_id = $2", [id, orgId]);
        return data({ success: true });
    }

    return data({ error: "Method not allowed" }, { status: 405 });
}
