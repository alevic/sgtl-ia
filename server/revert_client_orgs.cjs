const pg = require('pg');
const { Pool } = pg;

const pool = new Pool({
    connectionString: "postgresql://admin:admin123@192.168.0.113:5433/sgtl_db",
    connectionTimeoutMillis: 5000,
});

async function revert() {
    try {
        console.log('--- Reverting Client Organizations ---');

        const res = await pool.query(`
            UPDATE clients 
            SET organization_id = NULL 
            WHERE organization_id IS NOT NULL
        `);

        console.log(`Successfully cleared organization_id for ${res.rowCount} clients.`);

    } catch (err) {
        console.error('Error during revert:', err);
    } finally {
        await pool.end();
    }
}

revert();
