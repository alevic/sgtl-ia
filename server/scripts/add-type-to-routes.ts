import { pool } from "../src/auth.js";
import dotenv from "dotenv";

dotenv.config();

async function migrate() {
    try {
        console.log("Adding type column to routes table...");

        await pool.query(`
            ALTER TABLE routes 
            ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'IDA' CHECK (type IN ('IDA', 'VOLTA'));
        `);

        console.log("Migration completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();
