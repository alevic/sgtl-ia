import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { requireRole, pool } from "@/lib/auth.server";

// GET /api/fleet/vehicles - List vehicles
export async function loader({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const q = url.searchParams.get("q");

    const session = await requireRole(request, ['admin', 'operacional']);
    const orgId = (session as any).session.activeOrganizationId;

    let query = `SELECT * FROM vehicle WHERE organization_id = $1`;
    const params: any[] = [orgId];

    if (q) {
        query += ` AND (placa ILIKE $2 OR modelo ILIKE $2)`;
        params.push(`%${q}%`);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, params);

    // Fetch seats for each vehicle
    const vehiclesWithSeats = await Promise.all(
        result.rows.map(async (vehicle) => {
            const seatsResult = await pool.query(
                `SELECT * FROM seat WHERE vehicle_id = $1 ORDER BY numero ASC`,
                [vehicle.id]
            );
            return { ...vehicle, seats: seatsResult.rows };
        })
    );

    return data(vehiclesWithSeats);
}

// POST /api/fleet/vehicles - Create vehicle
export async function action({ request }: ActionFunctionArgs) {
    const session = await requireRole(request, ['admin', 'operacional']);
    const orgId = (session as any).session.activeOrganizationId;
    const userId = session.user.id;

    if (request.method === "POST") {
        const body = await request.json();
        const {
            placa, modelo, tipo, capacidade_passageiros, ano, renavam, chassi,
            status, imagem, galeria, cor, is_double_deck
        } = body;

        const result = await pool.query(
            `INSERT INTO vehicle (
                placa, modelo, tipo, capacidade_passageiros, ano, renavam, chassi,
                status, imagem, galeria, cor, is_double_deck,
                organization_id, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *`,
            [
                placa, modelo, tipo, capacidade_passageiros || 0, ano || null, renavam || null, chassi || null,
                status || 'AVAILABLE', imagem || null, galeria || null, cor || null, is_double_deck || false,
                orgId, userId
            ]
        );

        return data(result.rows[0]);
    }

    return data({ error: "Method not allowed" }, { status: 405 });
}
