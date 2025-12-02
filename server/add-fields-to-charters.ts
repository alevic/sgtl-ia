import { pool } from "./auth";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    try {
        console.log("Adding fields to charter_requests table...");

        await pool.query(`
            ALTER TABLE charter_requests 
            ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES vehicle(id),
            ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES driver(id),
            ADD COLUMN IF NOT EXISTS rota_ida_id UUID REFERENCES routes(id),
            ADD COLUMN IF NOT EXISTS rota_volta_id UUID REFERENCES routes(id);
        `);

        console.log("Fields added successfully.");

    } catch (error) {
        console.error("Error altering table:", error);
    } finally {
        await pool.end();
    }
}

main();
