import express from "express";
import { pool } from "../auth";

const router = express.Router();

// Middleware to verify webhook secret
const verifyWebhookSecret = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const secret = req.headers['x-webhook-secret'];
    const configuredSecret = process.env.WEBHOOK_SECRET || 'dev-secret-123';

    if (secret !== configuredSecret) {
        return res.status(401).json({ error: "Unauthorized: Invalid Secret" });
    }
    next();
};

router.post("/payment-confirmed", verifyWebhookSecret, async (req, res) => {
    const client = await pool.connect();

    try {
        const {
            reservation_id,
            amount,
            payment_method,
            transaction_id, // Optional external transaction ID (Asaas ID)
            payment_date // Optional
        } = req.body;

        if ((!reservation_id && !transaction_id) || !amount) {
            return res.status(400).json({ error: "Missing required fields: (reservation_id OR transaction_id), amount" });
        }

        await client.query("BEGIN");

        // 1. Get Reservation
        // Try getting by reservation_id first, then external_payment_id (transaction_id)
        let resCheck = await client.query(
            "SELECT * FROM reservations WHERE id = $1",
            [reservation_id]
        );

        if (resCheck.rows.length === 0 && transaction_id) {
            console.log(`Reservation ${reservation_id} not found, trying lookup by external_payment_id: ${transaction_id}`);
            resCheck = await client.query(
                "SELECT * FROM reservations WHERE external_payment_id = $1",
                [transaction_id]
            );
        }

        if (resCheck.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Reservation not found" });
        }

        const reservation = resCheck.rows[0];

        // 2. Update Reservation (Status & Amount)
        // Check if amount covers the total price (or logic for partial?)
        // For now, we assume if N8N confirms, it's a valid payment that CONFIRMS the reservation.
        // We accumulate the amount paid.
        const currentPaid = Number(reservation.amount_paid || 0);
        const newTotalPaid = currentPaid + Number(amount);

        // Determine status: If it covers total or if it's explicitly confirmed
        // Simple logic: If we receive a confirmation webhook, we set to CONFIRMED.
        const newStatus = 'CONFIRMED';

        await client.query(
            `UPDATE reservations SET 
                status = $1, 
                amount_paid = $2, 
                payment_method = COALESCE($3, payment_method),
                updated_at = CURRENT_TIMESTAMP 
            WHERE id = $4`,
            [newStatus, newTotalPaid, payment_method, reservation_id]
        );

        // 3. Create Financial Transaction (Receita)
        // We need organization_id from the reservation
        const orgId = reservation.organization_id;

        // Use a system user or the user who created the reservation as the 'creator' of the transaction?
        // Or null/system. Let's send 'System' or CreatedBy of reservation.
        const userId = reservation.created_by; // Fallback to reservation creator

        await client.query(
            `INSERT INTO transaction (
                type, description, amount, currency, date,
                due_date, payment_date, status, payment_method, category,
                organization_id, created_by, reservation_id, document_number, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
            [
                'RECEITA',
                `Pagamento Digital - Reserva ${reservation.ticket_code}`,
                amount,
                'BRL',
                new Date().toISOString(), // Emission
                new Date().toISOString(), // Due
                payment_date || new Date().toISOString(), // Payment Date
                'PAGA',
                payment_method || 'DIGITAL',
                'VENDA_PASSAGEM',
                orgId,
                userId,
                reservation_id,
                transaction_id || null, // Document Number = Asaas ID
                'Confirmação Automática via Webhook (N8N)'
            ]
        );

        await client.query("COMMIT");

        console.log(`Webhook: Payment confirmed for reservation ${reservation.ticket_code}`);
        res.json({ success: true, message: "Reservation updated and transaction created" });

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Webhook Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    } finally {
        client.release();
    }
});

// ==========================================
// EXAMPLES FOR FUTURE ENDPOINTS (N8N)
// ==========================================

/*
// 1. WhatsApp Bot (Chatwoot/N8N) - Check Available Trips
// GET /api/webhooks/viagens-disponiveis
router.get("/viagens-disponiveis", verifyWebhookSecret, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM trips WHERE departure_date >= CURRENT_DATE AND status = 'SCHEDULED' LIMIT 5"
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: "Error fetching trips" });
    }
});

// 2. Telegram Bot (Admin) - Daily Financial Summary
// GET /api/webhooks/resumo-financeiro
router.get("/resumo-financeiro", verifyWebhookSecret, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT SUM(amount) as total FROM transaction WHERE type = 'RECEITA' AND date = CURRENT_DATE"
        );
        res.json({ total_sales_today: result.rows[0].total || 0 });
    } catch (error) {
        res.status(500).json({ error: "Error fetching financial summary" });
    }
});

// 3. Create Reservation via Chat
// POST /api/webhooks/nova-reserva
router.post("/nova-reserva", verifyWebhookSecret, async (req, res) => {
    // Logic to create reservation using received JSON payload (passenger info, trip_id)
    // Reuse reservationsService.create logic here
});
*/

export default router;
