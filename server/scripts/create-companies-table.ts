import { pool } from "./auth";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    try {
        console.log("Creating companies table...");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS companies (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id TEXT NOT NULL UNIQUE,
                legal_name TEXT,
                cnpj TEXT,
                address TEXT,
                contact_email TEXT,
                phone TEXT,
                website TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log("Companies table created successfully.");
    } catch (error) {
        console.error("Error creating companies table:", error);
    } finally {
        await pool.end();
    }
}

main();
