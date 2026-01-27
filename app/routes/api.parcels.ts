import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { requireRole, pool } from "@/lib/auth.server";
import { EncomendaStatus } from "@/types";
import crypto from "crypto";

// GET /api/parcels
export async function loader({ request }: LoaderFunctionArgs) {
    const session = await requireRole(request, ['admin', 'operacional', 'vendas']);
    const orgId = (session as any).session.activeOrganizationId;
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const tracking_code = url.searchParams.get("tracking_code");
    const sender_name = url.searchParams.get("sender_name");
    const recipient_name = url.searchParams.get("recipient_name");

    let query = `SELECT * FROM parcel_orders WHERE organization_id = $1`;
    const params: any[] = [orgId];
    let paramCount = 1;

    if (status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        params.push(status);
    }

    if (tracking_code) {
        paramCount++;
        query += ` AND tracking_code ILIKE $${paramCount}`;
        params.push(`%${tracking_code}%`);
    }

    if (sender_name) {
        paramCount++;
        query += ` AND sender_name ILIKE $${paramCount}`;
        params.push(`%${sender_name}%`);
    }

    if (recipient_name) {
        paramCount++;
        query += ` AND recipient_name ILIKE $${paramCount}`;
        params.push(`%${recipient_name}%`);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, params);
    return data(result.rows);
}

// POST /api/parcels
export async function action({ request }: ActionFunctionArgs) {
    if (request.method !== "POST") {
        return data({ error: "Method not allowed" }, { status: 405 });
    }

    const session = await requireRole(request, ['admin', 'operacional', 'vendas']);
    const orgId = (session as any).session.activeOrganizationId;
    const userId = (session.user as any).id;
    const body = await request.json();

    const {
        sender_name, sender_document, sender_phone,
        recipient_name, recipient_document, recipient_phone,
        origin_city, origin_state, destination_city, destination_state,
        description, weight, dimensions,
        price, client_id, notes, trip_id
    } = body;

    // Generate Tracking Code (e.g., P-123456)
    const tracking_code = 'P-' + crypto.randomBytes(3).toString('hex').toUpperCase();

    try {
        const result = await pool.query(
            `INSERT INTO parcel_orders (
                sender_name, sender_document, sender_phone,
                recipient_name, recipient_document, recipient_phone,
                origin_city, origin_state, destination_city, destination_state,
                description, weight, dimensions,
                status, tracking_code, price,
                trip_id, user_id, client_id, notes,
                organization_id, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
            RETURNING *`,
            [
                sender_name, sender_document, sender_phone,
                recipient_name, recipient_document, recipient_phone,
                origin_city, origin_state, destination_city, destination_state,
                description, weight || 0, dimensions || null,
                EncomendaStatus.PENDING, tracking_code, price,
                trip_id || null, null, client_id || null, notes || null,
                orgId, userId
            ]
        );

        return data(result.rows[0], { status: 201 });
    } catch (error: any) {
        console.error("Error creating parcel:", error);
        return data({ error: "Falha ao criar encomenda" }, { status: 500 });
    }
}
