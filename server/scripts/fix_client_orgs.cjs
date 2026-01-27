const { Pool } = require('pg');

const pool = new Pool({
    connectionString: "postgresql://admin:admin123@192.168.0.113:5433/sgtl_db",
});

async function migrate() {
    try {
        console.log('--- REFINED MIGRATION START ---');

        // 1. Check companies table
        const companiesRes = await pool.query("SELECT organization_id FROM companies");
        console.log('Companies in table:', companiesRes.rows);

        // 2. Fallback ORG ID from reservations
        const fallbackRes = await pool.query("SELECT organization_id FROM reservations WHERE organization_id IS NOT NULL LIMIT 1");
        const fallbackOrgId = fallbackRes.rows.length > 0 ? fallbackRes.rows[0].organization_id : 'aLvVr65eSYUod4z5pbUpyv5wJ9LoFh6D';
        console.log('Fallback Organization ID (from reservations or default):', fallbackOrgId);

        let defaultOrgId = companiesRes.rows.length > 0 ? companiesRes.rows[0].organization_id : fallbackOrgId;
        console.log(`Using primary Organization ID: ${defaultOrgId}`);

        // 3. Find clients with NULL organization_id
        const clientsRes = await pool.query("SELECT id, nome FROM clients WHERE organization_id IS NULL");
        console.log(`Found ${clientsRes.rows.length} clients without organization_id.`);

        for (const client of clientsRes.rows) {
            console.log(`Updating client: ${client.nome} (${client.id})`);

            // Try to find if they have reservations with an org_id
            const resRes = await pool.query("SELECT organization_id FROM reservations WHERE client_id = $1 AND organization_id IS NOT NULL LIMIT 1", [client.id]);

            let orgIdToUse = defaultOrgId;
            if (resRes.rows.length > 0) {
                orgIdToUse = resRes.rows[0].organization_id;
                console.log(`  Found organization from reservation: ${orgIdToUse}`);
            } else {
                console.log(`  No reservations found, using default organization: ${orgIdToUse}`);
            }

            await pool.query("UPDATE clients SET organization_id = $1 WHERE id = $2", [orgIdToUse, client.id]);
        }

        console.log('--- MIGRATION COMPLETED ---');
    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        await pool.end();
    }
}

migrate();
