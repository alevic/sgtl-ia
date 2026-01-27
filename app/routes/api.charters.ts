import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { requireRole, pool } from "@/lib/auth.server";
import { FretamentoStatus } from "@/types";

// GET /api/charters
export async function loader({ request }: LoaderFunctionArgs) {
    const session = await requireRole(request, ['admin', 'operacional', 'vendas']);
    const orgId = (session as any).session.activeOrganizationId;
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const contact_name = url.searchParams.get("contact_name");
    const start_date = url.searchParams.get("start_date");
    const end_date = url.searchParams.get("end_date");

    let query = `SELECT * FROM charter_requests WHERE organization_id = $1`;
    const params: any[] = [orgId];
    let paramCount = 1;

    if (status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        params.push(status);
    }

    if (contact_name) {
        paramCount++;
        query += ` AND contact_name ILIKE $${paramCount}`;
        params.push(`%${contact_name}%`);
    }

    if (start_date) {
        paramCount++;
        query += ` AND departure_date >= $${paramCount}`;
        params.push(start_date);
    }

    if (end_date) {
        paramCount++;
        query += ` AND departure_date <= $${paramCount}`;
        params.push(end_date);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, params);
    return data(result.rows);
}

// POST /api/charters
export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== "POST") {
        return data({ error: "Method not allowed" }, { status: 405 });
    }

    const session = await requireRole(request, ['admin', 'operacional', 'vendas']);
    const orgId = (session as any).session.activeOrganizationId;
    const userId = (session.user as any).id;
    const body = await request.json();

    const {
        contact_name, contact_email, contact_phone, company_name,
        origin_city, origin_state, destination_city, destination_state,
        departure_date, departure_time, return_date, return_time,
        passenger_count, vehicle_type_requested,
        description, client_id, notes,
        vehicle_id, driver_id, rota_ida_id, rota_volta_id
    } = body;

    try {
        const result = await pool.query(
            `INSERT INTO charter_requests (
                contact_name, contact_email, contact_phone, company_name,
                origin_city, origin_state, destination_city, destination_state,
                departure_date, departure_time, return_date, return_time,
                passenger_count, vehicle_type_requested,
                description, status,
                user_id, client_id, notes,
                organization_id, created_by,
                vehicle_id, driver_id, rota_ida_id, rota_volta_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
            RETURNING *`,
            [
                contact_name, contact_email, contact_phone, company_name || null,
                origin_city, origin_state, destination_city, destination_state,
                departure_date, departure_time || null, return_date || null, return_time || null,
                passenger_count, vehicle_type_requested || null,
                description || null, FretamentoStatus.REQUEST,
                null, client_id || null, notes || null,
                orgId, userId,
                vehicle_id || null, driver_id || null, rota_ida_id || null, rota_volta_id || null
            ]
        );

        return data(result.rows[0], { status: 201 });
    } catch (error: any) {
        console.error("Error creating charter request:", error);
        return data({ error: "Falha ao criar solicitação de fretamento" }, { status: 500 });
    }
}
