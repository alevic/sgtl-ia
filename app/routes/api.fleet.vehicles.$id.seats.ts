import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { requireRole, pool } from "@/lib/auth.server";

// GET /api/fleet/vehicles/:id/seats
export async function loader({ request, params }: LoaderFunctionArgs) {
    const session = await requireRole(request, ['admin', 'operacional']);
    const orgId = (session as any).session.activeOrganizationId;
    const { id } = params;

    const vehicleCheck = await pool.query(
        "SELECT id FROM vehicle WHERE id = $1 AND organization_id = $2",
        [id, orgId]
    );

    if (vehicleCheck.rows.length === 0) {
        throw new Response("Vehicle not found", { status: 404 });
    }

    const result = await pool.query(
        `SELECT * FROM seat WHERE vehicle_id = $1 ORDER BY andar, posicao_y, posicao_x`,
        [id]
    );

    return data(result.rows);
}

// POST /api/fleet/vehicles/:id/seats (Upsert logic)
// DELETE /api/fleet/vehicles/:id/seats (Clear all)
export async function action({ request, params }: ActionFunctionArgs) {
    const session = await requireRole(request, ['admin', 'operacional']);
    const orgId = (session as any).session.activeOrganizationId;
    const { id } = params;

    const vehicleCheck = await pool.query(
        "SELECT id FROM vehicle WHERE id = $1 AND organization_id = $2",
        [id, orgId]
    );

    if (vehicleCheck.rows.length === 0) {
        return data({ error: "Vehicle not found" }, { status: 404 });
    }

    if (request.method === "POST") {
        let client;
        try {
            const body = await request.json();
            const { seats } = body;

            client = await pool.connect();
            await client.query("BEGIN");

            // 1. Get existing seats
            const existingSeatsResult = await client.query(
                "SELECT * FROM seat WHERE vehicle_id = $1",
                [id]
            );
            const existingSeatsMap = new Map();
            existingSeatsResult.rows.forEach(seat => {
                existingSeatsMap.set(seat.numero, seat);
            });

            // 2. Process new seats (Upsert)
            const processedIds = new Set();
            const processedNumeros = new Set();

            for (const seat of seats) {
                processedNumeros.add(seat.numero);
                const existingSeat = existingSeatsMap.get(seat.numero);

                if (existingSeat) {
                    processedIds.add(existingSeat.id);
                    // Update existing
                    await client.query(
                        `UPDATE seat SET
                            andar = $1, posicao_x = $2, posicao_y = $3, 
                            tipo = $4, status = $5, preco = $6, disabled = $7,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = $8`,
                        [
                            seat.andar, seat.posicao_x, seat.posicao_y,
                            seat.tipo, seat.status || 'AVAILABLE', seat.preco || null, seat.disabled || false,
                            existingSeat.id
                        ]
                    );
                } else {
                    // Check if there is already a seat at this coordinate
                    const coordKey = `${seat.andar}-${seat.posicao_x}-${seat.posicao_y}`;
                    const existingAtCoord = existingSeatsResult.rows.find((s: any) => `${s.andar}-${s.posicao_x}-${s.posicao_y}` === coordKey);

                    if (existingAtCoord) {
                        processedIds.add(existingAtCoord.id);
                        // Update existing seat at this coordinate with new number
                        await client.query(
                            `UPDATE seat SET
                                numero = $1, tipo = $2, status = $3, preco = $4, disabled = $5,
                                updated_at = CURRENT_TIMESTAMP
                            WHERE id = $6`,
                            [
                                seat.numero, seat.tipo, seat.status || 'AVAILABLE',
                                seat.preco || null, seat.disabled || false,
                                existingAtCoord.id
                            ]
                        );
                    } else {
                        // Insert new
                        const insertResult = await client.query(
                            `INSERT INTO seat (
                                vehicle_id, numero, andar, posicao_x, posicao_y, tipo, status, preco, disabled
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
                            [
                                id, seat.numero, seat.andar, seat.posicao_x, seat.posicao_y,
                                seat.tipo, seat.status || 'AVAILABLE', seat.preco || null, seat.disabled || false
                            ]
                        );
                        processedIds.add(insertResult.rows[0].id);
                    }
                }
            }

            // 3. Delete or Disable removed seats
            const warnings: string[] = [];
            for (const existingSeat of existingSeatsResult.rows) {
                if (!processedIds.has(existingSeat.id)) {
                    try {
                        await client.query("SAVEPOINT seat_delete");
                        await client.query("DELETE FROM seat WHERE id = $1", [existingSeat.id]);
                        await client.query("RELEASE SAVEPOINT seat_delete");
                    } catch (deleteError: any) {
                        await client.query("ROLLBACK TO SAVEPOINT seat_delete");

                        if (deleteError.code === '23503') { // Foreign key violation
                            const msg = `O assento ${existingSeat.numero} não pode ser excluído pois possui reservas vinculadas. Ele foi mantido mas marcado como desabilitado.`;
                            console.warn(msg);
                            warnings.push(msg);

                            await client.query(
                                "UPDATE seat SET disabled = true, status = $1, posicao_x = -1, posicao_y = -1 WHERE id = $2",
                                ['BLOCKED', existingSeat.id]
                            );
                        } else {
                            throw deleteError;
                        }
                    }
                }
            }

            await client.query(
                "UPDATE vehicle SET mapa_configurado = true WHERE id = $1",
                [id]
            );

            await client.query("COMMIT");

            const result = await client.query(
                "SELECT * FROM seat WHERE vehicle_id = $1 AND disabled = false ORDER BY andar, posicao_y, posicao_x",
                [id]
            );

            return data({
                seats: result.rows,
                warnings: warnings
            });

        } catch (error: any) {
            if (client) await client.query("ROLLBACK");
            console.error("Error saving seat map:", error);
            return data({ error: "Failed to save seat map" }, { status: 500 });
        } finally {
            if (client) client.release();
        }
    }

    if (request.method === "DELETE") {
        try {
            await pool.query("DELETE FROM seat WHERE vehicle_id = $1", [id]);
            await pool.query("UPDATE vehicle SET mapa_configurado = false WHERE id = $1", [id]);
            return data({ success: true });
        } catch (error) {
            console.error("Error clearing seat map:", error);
            return data({ error: "Failed to clear seat map" }, { status: 500 });
        }
    }

    return data({ error: "Method not allowed" }, { status: 405 });
}
