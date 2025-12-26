const pg = require('pg');
const { Pool } = pg;

const pool = new Pool({
    connectionString: "postgresql://admin:admin123@192.168.0.113:5433/sgtl_db",
    connectionTimeoutMillis: 5000,
});

async function verify() {
    try {
        console.log('--- VERIFICATION START ---');

        // Test with JJê Turismo
        const orgIdTurismo = 'aLvVr65eSYUod4z5pbUpyv5wJ9LoFh6D';
        // Test with JJê Express (which has NO reservations yet)
        const orgIdExpress = 'fMTCgTp1KMuMHYYxIknqdfRO3YvqAgIT';

        async function getClientData(orgId, label) {
            console.log(`\nTesting Org: ${label} (${orgId})`);
            const res = await pool.query(`
                SELECT c.nome,
                (
                    SELECT COALESCE(COUNT(*), 0)
                    FROM reservations r 
                    WHERE r.client_id = c.id 
                    AND r.status IN ('CONFIRMED', 'USED', 'CHECKED_IN')
                    AND r.organization_id = $1
                )::int as historico_viagens,
                (
                    SELECT COALESCE(SUM(r.amount_paid), 0)
                    FROM reservations r 
                    WHERE r.client_id = c.id 
                    AND r.status != 'CANCELLED'
                    AND r.organization_id = $1
                )::float as valor_total_gasto
                FROM clients c 
                WHERE c.nome ILIKE '%Maria%'
            `, [orgId]);
            console.log(res.rows);
        }

        await getClientData(orgIdTurismo, 'JJê Turismo');
        await getClientData(orgIdExpress, 'JJê Express');

        console.log('\n--- VERIFICATION END ---');
    } catch (err) {
        console.error('Verification error:', err);
    } finally {
        await pool.end();
    }
}

verify();
