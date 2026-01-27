import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { requireRole, pool } from "@/lib/auth.server";

// GET /api/trips - List trips with filtering
export async function loader({ request }: LoaderFunctionArgs) {
    const session = await requireRole(request, ['admin', 'operacional', 'vendas']);
    const orgId = (session as any).session.activeOrganizationId;
    const url = new URL(request.url);
    const start_date = url.searchParams.get("start_date");
    const end_date = url.searchParams.get("end_date");
    const route_id = url.searchParams.get("route_id");
    const status = url.searchParams.get("status");
    const active = url.searchParams.get("active");

    let query = `
        SELECT t.*, 
               r.name as route_name, r.origin_city, r.destination_city, r.stops as route_stops,
               rr.name as return_route_name, rr.stops as return_route_stops,
               v.placa as vehicle_plate, v.modelo as vehicle_model,
               d.nome as driver_name
        FROM trips t
        JOIN routes r ON t.route_id = r.id
        LEFT JOIN routes rr ON t.return_route_id = rr.id
        LEFT JOIN vehicle v ON t.vehicle_id = v.id
        LEFT JOIN driver d ON t.driver_id = d.id
        WHERE t.organization_id = $1
    `;
    const params: any[] = [orgId];
    let paramCount = 1;

    if (start_date) {
        paramCount++;
        query += ` AND t.departure_date >= $${paramCount}`;
        params.push(start_date);
    }

    if (end_date) {
        paramCount++;
        query += ` AND t.departure_date <= $${paramCount}`;
        params.push(end_date);
    }

    if (route_id) {
        paramCount++;
        query += ` AND t.route_id = $${paramCount}`;
        params.push(route_id);
    }

    if (status) {
        paramCount++;
        query += ` AND t.status = $${paramCount}`;
        params.push(status);
    }

    if (active) {
        paramCount++;
        query += ` AND t.active = $${paramCount}`;
        params.push(active === 'true');
    }

    query += ` ORDER BY t.departure_date ASC, t.departure_time ASC`;

    const result = await pool.query(query, params);
    return data(result.rows);
}

// POST /api/trips - Create trip
export async function action({ request }: ActionFunctionArgs) {
    const session = await requireRole(request, ['admin', 'operacional']);
    const orgId = (session as any).session.activeOrganizationId;
    const userId = session.user.id;

    if (request.method === "POST") {
        const body = await request.json();
        const {
            route_id, return_route_id, vehicle_id, driver_id,
            departure_date, departure_time, arrival_date, arrival_time,
            price_conventional, price_executive, price_semi_sleeper, price_sleeper, price_bed, price_master_bed,
            seats_available, notes,
            title, tags, cover_image, gallery, baggage_limit, alerts
        } = body;

        // If vehicle is selected, get its capacity for seats_available if not provided
        let finalSeats = seats_available;
        if (!finalSeats && vehicle_id) {
            const vehicle = await pool.query("SELECT capacidade_passageiros FROM vehicle WHERE id = $1", [vehicle_id]);
            if (vehicle.rows.length > 0) {
                finalSeats = vehicle.rows[0].capacidade_passageiros;
            }
        }

        const result = await pool.query(
            `INSERT INTO trips (
                route_id, return_route_id, vehicle_id, driver_id,
                departure_date, departure_time, arrival_date, arrival_time,
                price_conventional, price_executive, price_semi_sleeper, price_sleeper, price_bed, price_master_bed,
                seats_available, status, notes, organization_id, created_by,
                title, tags, cover_image, gallery, baggage_limit, alerts
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
            RETURNING *`,
            [
                route_id, return_route_id || null, vehicle_id || null, driver_id || null,
                departure_date, departure_time, arrival_date || null, arrival_time || null,
                price_conventional || null, price_executive || null, price_semi_sleeper || null, price_sleeper || null, price_bed || null, price_master_bed || null,
                finalSeats || 0, 'SCHEDULED', notes || null, orgId, userId,
                title || null, tags || [], cover_image || null, JSON.stringify(gallery || []), baggage_limit || null, alerts || null
            ]
        );

        return data(result.rows[0], { status: 201 });
    }

    return data({ error: "Method not allowed" }, { status: 405 });
}
