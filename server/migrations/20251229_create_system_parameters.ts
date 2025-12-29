import { pool } from "../auth";

export async function up() {
    console.log("Creating system_parameters table...");
    await pool.query(`
        CREATE TABLE IF NOT EXISTS system_parameters (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            organization_id TEXT NOT NULL,
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(organization_id, key)
        );
        CREATE INDEX IF NOT EXISTS idx_system_parameters_org ON system_parameters(organization_id);
    `);

    // Insert default parameter for existing organizations
    console.log("Inserting default trip safety margin parameter...");
    await pool.query(`
        INSERT INTO system_parameters (organization_id, key, value, description)
        SELECT id, 'trip_auto_complete_safety_margin_hours', '168', 'Margem de segurança para finalização automática de viagens (em horas)'
        FROM "organization"
        ON CONFLICT (organization_id, key) DO NOTHING;
    `);
}

export async function down() {
    await pool.query(`DROP TABLE IF EXISTS system_parameters;`);
}
