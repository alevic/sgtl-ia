const { Pool } = require('pg');

const pool = new Pool({
    connectionString: "postgresql://admin:admin123@192.168.0.113:5433/sgtl_db",
    connectionTimeoutMillis: 5000,
});

async function diagnose() {
    try {
        console.log('--- DIAGNOSTIC START ---');

        // 1. Get Client Info
        const clientRes = await pool.query("SELECT id, nome, organization_id FROM clients WHERE nome ILIKE '%Maria%'");
        console.log('Clients:', clientRes.rows);

        if (clientRes.rows.length > 0) {
            const clientId = clientRes.rows[0].id;
            const clientOrgId = clientRes.rows[0].organization_id;

            // 2. Get Reservations for this client
            const resRes = await pool.query("SELECT * FROM reservations WHERE client_id = $1", [clientId]);
            console.log('Reservations for Client:', resRes.rows.map(r => ({
                id: r.id,
                code: r.ticket_code,
                name: r.passenger_name,
                status: r.status,
                org: r.organization_id,
                trip: r.trip_id
            })));

            if (resRes.rows.length > 0) {
                const tripIds = resRes.rows.map(r => r.trip_id).filter(Boolean);

                // 3. Check if Trips exist
                const tripsRes = await pool.query("SELECT id, title, organization_id FROM trips WHERE id = ANY($1)", [tripIds]);
                console.log('Trips found:', tripsRes.rows);
            }
        }

        console.log('--- DIAGNOSTIC END ---');
    } catch (err) {
        console.error('Diagnostic error:', err);
    } finally {
        await pool.end();
    }
}

diagnose();
