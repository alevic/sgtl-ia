import { pool } from "../src/auth.js";
import dotenv from "dotenv";

dotenv.config();

async function migrate() {
    const client = await pool.connect();
    try {
        console.log("Starting migration for reservations table...");

        await client.query("BEGIN");

        const queries = [
            "ALTER TABLE reservations ADD COLUMN IF NOT EXISTS boarding_point TEXT",
            "ALTER TABLE reservations ADD COLUMN IF NOT EXISTS dropoff_point TEXT",
            "ALTER TABLE reservations ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10, 2) DEFAULT 0",
            "ALTER TABLE reservations ADD COLUMN IF NOT EXISTS payment_method TEXT",
            "ALTER TABLE reservations ADD COLUMN IF NOT EXISTS external_payment_id TEXT",
            "ALTER TABLE reservations ADD COLUMN IF NOT EXISTS credits_used DECIMAL(10, 2) DEFAULT 0",
            "ALTER TABLE reservations ADD COLUMN IF NOT EXISTS is_partial BOOLEAN DEFAULT FALSE"
        ];

        for (const query of queries) {
            console.log(`Executing: ${query}`);
            await client.query(query);
        }

        await client.query("COMMIT");
        console.log("Migration completed successfully!");
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Migration failed:", error);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
