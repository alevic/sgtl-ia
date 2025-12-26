const { Pool } = require('pg');

const pool = new Pool({
    connectionString: "postgresql://admin:admin123@192.168.0.113:5433/sgtl_db",
});

async function diagnose() {
    try {
        console.log('--- SIMULATED QUERY START ---');

        const orgId = 'aLvVr65eSYUod4z5pbUpyv5wJ9LoFh6D';
        const clientId = 'e0fa4428-a13d-4606-96c1-09d7d8af7245';

        // Exact query from reservations.ts
        let query = `
            SELECT r.*, 
                   t.departure_date, t.departure_time, t.title as trip_title,
                   route.name as route_name,
                   s.numero as seat_number, s.tipo as seat_type
            FROM reservations r
            JOIN trips t ON r.trip_id = t.id
            JOIN routes route ON t.route_id = route.id
            LEFT JOIN seat s ON r.seat_id = s.id
            WHERE r.organization_id = $1
        `;
        const params = [orgId];
        let paramCount = 1;

        // Adding client_id filter
        paramCount++;
        query += ` AND r.client_id = $${paramCount}`;
        params.push(clientId);

        console.log('Running query:', query);
        console.log('With params:', params);

        const res = await pool.query(query, params);
        console.log('Results found:', res.rows.length);
        console.log('Rows:', res.rows);

        console.log('--- SIMULATED QUERY END ---');
    } catch (err) {
        console.error('Diagnostic error:', err);
    } finally {
        await pool.end();
    }
}

diagnose();
