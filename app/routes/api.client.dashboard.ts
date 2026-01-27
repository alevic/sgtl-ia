import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { requireAuth, pool } from "@/lib/auth.server";
import { ReservationStatus } from "@/types";

// GET /api/client/dashboard
export async function loader({ request }: LoaderFunctionArgs) {
    const session = await requireAuth(request);
    const userId = session.user.id;
    const orgId = session.session.activeOrganizationId;

    if (!orgId) {
        // Clients must belong to an organization context
        return data({ error: "No active organization context" }, { status: 400 });
    }

    try {
        // 1. Fetch Client Profile
        const clientResult = await pool.query(
            "SELECT * FROM clients WHERE user_id = $1",
            [userId]
        );

        let clientProfile = clientResult.rows[0];

        if (!clientProfile) {
            // Lazy Creation Logic
            console.log(`[DASHBOARD] Lazy-creating client profile for userId: ${userId}`);

            const userResult = await pool.query(
                'SELECT name, email, phone, cpf FROM "user" WHERE id = $1',
                [userId]
            );

            if (userResult.rows.length === 0) {
                return data({ error: "User not found" }, { status: 404 });
            }

            const user = userResult.rows[0];

            const newClientResult = await pool.query(
                `INSERT INTO clients (
                    tipo_cliente, nome, email, telefone, 
                    documento_tipo, documento,
                    organization_id, user_id,
                    data_cadastro, saldo_creditos
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, 0)
                RETURNING *`,
                [
                    'PESSOA_FISICA',
                    user.name,
                    user.email,
                    user.phone || null,
                    'CPF',
                    user.cpf || '',
                    orgId,
                    userId
                ]
            );

            clientProfile = newClientResult.rows[0];
        }

        const clientId = clientProfile.id;

        // 2. Fetch Future Reservations
        const reservationsResult = await pool.query(
            `SELECT r.*, 
                   t.departure_date, t.departure_time, t.title as trip_title,
                   route.name as route_name, route.origin_city, route.origin_state, 
                   route.destination_city, route.destination_state,
                   route.origin_neighborhood, route.destination_neighborhood,
                   route.stops as route_stops,
                   s.numero as seat_number, s.tipo as seat_type
            FROM reservations r
            JOIN trips t ON r.trip_id = t.id
            JOIN routes route ON t.route_id = route.id
            LEFT JOIN seat s ON r.seat_id = s.id
            WHERE r.client_id = $1 AND r.status != $2
            ORDER BY t.departure_date ASC, t.departure_time ASC`,
            [clientId, ReservationStatus.CANCELLED]
        );

        // 3. Fetch Recent Parcels
        // Using document to link parcels
        const parcelsResult = await pool.query(
            `SELECT * FROM parcel_orders 
             WHERE sender_document = $1 OR recipient_document = $1
             ORDER BY created_at DESC LIMIT 5`,
            [clientProfile.documento]
        );

        return data({
            profile: clientProfile,
            reservations: reservationsResult.rows,
            parcels: parcelsResult.rows
        });

    } catch (error) {
        console.error("Error fetching client dashboard:", error);
        return data({ error: "Failed to fetch dashboard data" }, { status: 500 });
    }
}
