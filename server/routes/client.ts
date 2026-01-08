import express from "express";
import { pool } from "../auth";
import { clientAuthorize } from "../middleware";

const router = express.Router();

/**
 * GET /api/client/dashboard
 * Retorna dados unificados para o dashboard do cliente (Reservas + Encomendas + Perfil)
 */
router.get("/dashboard", clientAuthorize(), async (req, res) => {
    try {
        const session = (req as any).session;
        const userId = session.user.id;
        const phone = session.user.phoneNumber;

        // --- LAZY LINKING LOGIC ---
        if (phone) {
            let cleanPhone = phone.replace(/\D/g, '');
            const phoneSuffix = cleanPhone.startsWith('55') ? cleanPhone.substring(2) : cleanPhone;

            const orphanClients = await pool.query(
                `SELECT id FROM clients 
                 WHERE user_id IS NULL 
                 AND regexp_replace(telefone, '\\D', '', 'g') LIKE $1`,
                [`%${phoneSuffix}`]
            );

            if (orphanClients.rows.length > 0) {
                for (const client of orphanClients.rows) {
                    const clientId = client.id;
                    await pool.query(`UPDATE clients SET user_id = $1 WHERE id = $2`, [userId, clientId]);
                    await pool.query(`UPDATE reservations SET user_id = $1 WHERE client_id = $2 AND user_id IS NULL`, [userId, clientId]);
                    await pool.query(`UPDATE parcel_orders SET user_id = $1 WHERE client_id = $2 AND user_id IS NULL`, [userId, clientId]);
                }
            }
        }
        // --- END LAZY LINKING ---

        // 1. Buscar Reservas (JJê Turismo)
        const reservationsResult = await pool.query(
            `SELECT r.*, t.departure_date, t.departure_time, t.title as trip_title,
                    rt.origin_city, rt.origin_state, rt.destination_city, rt.destination_state,
                    rt.origin_neighborhood, rt.destination_neighborhood, rt.stops as route_stops,
                    s.numero as seat_number, s.tipo as seat_type,
                    r.boarding_point, r.dropoff_point
             FROM reservations r
             JOIN trips t ON r.trip_id = t.id
             JOIN routes rt ON t.route_id = rt.id
             LEFT JOIN seat s ON r.seat_id = s.id
             WHERE r.user_id = $1
             ORDER BY t.departure_date DESC, t.departure_time DESC`,
            [userId]
        );

        // 2. Buscar Encomendas (JJê Express + Extras de Turismo)
        const parcelsResult = await pool.query(
            `SELECT * FROM parcel_orders 
             WHERE user_id = $1
             ORDER BY created_at DESC`,
            [userId]
        );

        // 3. Buscar Perfil do Cliente (Pode haver mais de um registro se for multi-org)
        const clientsResult = await pool.query(
            `SELECT * FROM clients WHERE user_id = $1`,
            [userId]
        );

        // Consolidar saldo (se houver múltiplos registros, somar ou pegar o principal)
        const totalCredits = clientsResult.rows.reduce((acc, client) => acc + Number(client.saldo_creditos || 0), 0);

        res.json({
            profile: {
                name: session.user.name,
                email: session.user.email,
                saldo_creditos: totalCredits,
                // Podemos incluir outros dados do primeiro registro encontrado
                ...(clientsResult.rows[0] || {})
            },
            reservations: reservationsResult.rows,
            parcels: parcelsResult.rows
        });

    } catch (error) {
        console.error("Error fetching client dashboard:", error);
        res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
});

/**
 * GET /api/client/reservations/:id
 * Detalhes de uma reserva específica
 */
router.get("/reservations/:id", clientAuthorize(), async (req, res) => {
    try {
        const session = (req as any).session;
        const userId = session.user.id;
        const { id } = req.params;

        const result = await pool.query(
            `SELECT r.*, t.departure_date, t.departure_time, t.title as trip_title,
                    rt.origin_city, rt.origin_state, rt.destination_city, rt.destination_state, 
                    rt.origin_neighborhood, rt.destination_neighborhood, rt.stops as route_stops,
                    v.placa as vehicle_plate, v.modelo as vehicle_model, v.tipo as vehicle_type,
                    s.numero as seat_number, s.tipo as seat_type,
                    r.boarding_point, r.dropoff_point
             FROM reservations r
             JOIN trips t ON r.trip_id = t.id
             JOIN routes rt ON t.route_id = rt.id
             LEFT JOIN vehicle v ON t.vehicle_id = v.id
             LEFT JOIN seat s ON r.seat_id = s.id
             WHERE r.id = $1 AND r.user_id = $2`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Reserva não encontrada" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching client reservation details:", error);
        res.status(500).json({ error: "Failed to fetch reservation details" });
    }
});

/**
 * GET /api/client/parcels/:id
 * Detalhes de uma encomenda específica
 */
router.get("/parcels/:id", clientAuthorize(), async (req, res) => {
    try {
        const session = (req as any).session;
        const userId = session.user.id;
        const { id } = req.params;

        const result = await pool.query(
            `SELECT p.*, t.departure_date, t.departure_time,
                    rt.origin_city as trip_origin, rt.destination_city as trip_dest
             FROM parcel_orders p
             LEFT JOIN trips t ON p.trip_id = t.id
             LEFT JOIN routes rt ON t.route_id = rt.id
             WHERE p.id = $1 AND p.user_id = $2`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Encomenda não encontrada" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching client parcel details:", error);
        res.status(500).json({ error: "Failed to fetch parcel details" });
    }
});

export default router;
