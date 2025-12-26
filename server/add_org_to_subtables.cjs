const pg = require('pg');
const { Pool } = pg;

const pool = new Pool({
    connectionString: "postgresql://admin:admin123@192.168.0.113:5433/sgtl_db",
    connectionTimeoutMillis: 5000,
});

async function migrate() {
    try {
        console.log('--- Migrating Sub-tables with organization_id ---');

        await pool.query(`
            ALTER TABLE client_interactions 
            ADD COLUMN IF NOT EXISTS organization_id TEXT;
        `);
        console.log('Added organization_id to client_interactions');

        await pool.query(`
            ALTER TABLE client_notes 
            ADD COLUMN IF NOT EXISTS organization_id TEXT;
        `);
        console.log('Added organization_id to client_notes');

        // Optional: Create indexes
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_client_interactions_org ON client_interactions(organization_id);
            CREATE INDEX IF NOT EXISTS idx_client_notes_org ON client_notes(organization_id);
        `);
        console.log('Created indexes for organization_id');

    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        await pool.end();
    }
}

migrate();
