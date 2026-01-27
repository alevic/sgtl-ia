import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { pool } from "@/lib/auth.server";
import { ReservationStatus, StatusTransacao, TipoTransacao, CategoriaReceita } from "@/types";

const verifySecret = (request: Request) => {
    const secret = request.headers.get('x-webhook-secret');
    const configuredSecret = process.env.WEBHOOK_SECRET || 'dev-secret-123';
    return secret === configuredSecret;
};

// GET /api/webhooks/pending-reservations
// GET /api/webhooks/viagens-disponiveis (Bot)
// GET /api/webhooks/resumo-financeiro (Bot)
export async function loader({ request, params }: LoaderFunctionArgs) {
    if (!verifySecret(request)) {
        return data({ error: "Unauthorized" }, { status: 401 });
    }

    const path = params["*"];

    if (path === "pending-reservations") {
        const result = await pool.query(
            "SELECT id, ticket_code, created_at, passenger_name, passenger_email FROM reservations WHERE status = $1",
            [ReservationStatus.PENDING]
        );
        return data(result.rows);
    }

    if (path === "viagens-disponiveis") {
        const result = await pool.query(
            "SELECT * FROM trips WHERE departure_date >= CURRENT_DATE AND status = 'SCHEDULED' LIMIT 5"
        );
        return data(result.rows);
    }

    // Default 404
    return data({ error: "Not found" }, { status: 404 });
}

// POST /api/webhooks/payment-confirmed
// POST /api/webhooks/cancel-reservation
export async function action({ request, params }: ActionFunctionArgs) {
    if (!verifySecret(request)) {
        return data({ error: "Unauthorized" }, { status: 401 });
    }

    const path = params["*"];
    const body = await request.json();

    if (path === "payment-confirmed") {
        const { reservation_id, amount, payment_method, transaction_id, payment_date } = body;

        if ((!reservation_id && !transaction_id) || !amount) {
            return data({ error: "Missing required fields" }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            await client.query("BEGIN");

            // 1. Get Reservation
            let resCheck = await client.query("SELECT * FROM reservations WHERE id = $1", [reservation_id]);

            if (resCheck.rows.length === 0 && transaction_id) {
                resCheck = await client.query("SELECT * FROM reservations WHERE external_payment_id = $1", [transaction_id]);
            }

            if (resCheck.rows.length === 0) {
                await client.query("ROLLBACK");
                return data({ error: "Reservation not found" }, { status: 404 });
            }

            const reservation = resCheck.rows[0];
            const currentPaid = Number(reservation.amount_paid || 0);
            const newTotalPaid = currentPaid + Number(amount);
            const newStatus = ReservationStatus.CONFIRMED;

            await client.query(
                `UPDATE reservations SET 
                    status = $1, amount_paid = $2, 
                    payment_method = COALESCE($3, payment_method),
                    updated_at = CURRENT_TIMESTAMP 
                WHERE id = $4`,
                [newStatus, newTotalPaid, payment_method, reservation.id]
            );

            // 2. Create Transaction
            await client.query(
                `INSERT INTO transaction (
                    type, description, amount, currency, date,
                    due_date, payment_date, status, payment_method, category,
                    organization_id, created_by, reservation_id, document_number, notes
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
                [
                    TipoTransacao.INCOME,
                    `Pagamento Digital - Reserva ${reservation.ticket_code}`,
                    amount, 'BRL',
                    new Date().toISOString(), // Emission
                    new Date().toISOString(), // Due
                    payment_date || new Date().toISOString(),
                    StatusTransacao.PAID,
                    payment_method || 'DIGITAL',
                    CategoriaReceita.VENDA_PASSAGEM,
                    reservation.organization_id,
                    reservation.created_by, // user creator
                    reservation.id,
                    transaction_id || null,
                    'Confirmação Automática via Webhook'
                ]
            );

            await client.query("COMMIT");
            return data({ success: true, message: "Processed" });

        } catch (e) {
            await client.query("ROLLBACK");
            console.error("Webhook Error", e);
            return data({ error: "Processing failed" }, { status: 500 });
        } finally {
            client.release();
        }
    }

    if (path === "cancel-reservation") {
        const { reservation_id, reason } = body;
        if (!reservation_id) return data({ error: "Missing ID" }, { status: 400 });

        const result = await pool.query(
            `UPDATE reservations 
             SET status = $1, notes = COALESCE(notes, '') || ' [Cancelado N8N: ' || COALESCE($2, 'Expirado') || ']', updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING id`,
            [ReservationStatus.CANCELLED, reason, reservation_id]
        );

        if (result.rows.length === 0) return data({ error: "Not found" }, { status: 404 });
        return data({ success: true });
    }

    return data({ error: "Not found" }, { status: 404 });
}
