import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://admin:admin123@localhost:5432/sgtl_db",
});

async function migrate() {
    try {
        console.log("Running migration: Add maintenance_id to transaction table...");

        await pool.query(`
            ALTER TABLE transaction 
            ADD COLUMN IF NOT EXISTS maintenance_id UUID REFERENCES maintenance(id) ON DELETE SET NULL;
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_transaction_maintenance ON transaction(maintenance_id);
        `);

        console.log("Migration completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Error running migration:", error);
        process.exit(1);
    }
}

migrate();
