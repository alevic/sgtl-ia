import { pool } from "./auth";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    try {
        console.log("Creating charter_requests table...");

        // Create Charters Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS charter_requests (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id TEXT NOT NULL,
                
                contact_name TEXT NOT NULL,
                contact_email TEXT NOT NULL,
                contact_phone TEXT NOT NULL,
                company_name TEXT,
                
                origin_city TEXT NOT NULL,
                origin_state TEXT NOT NULL,
                destination_city TEXT NOT NULL,
                destination_state TEXT NOT NULL,
                
                departure_date DATE NOT NULL,
                departure_time TIME,
                return_date DATE,
                return_time TIME,
                
                passenger_count INTEGER NOT NULL,
                vehicle_type_requested TEXT,
                
                description TEXT,
                status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'QUOTED', 'APPROVED', 'REJECTED', 'COMPLETED')),
                
                quote_price DECIMAL(10, 2),
                
                user_id TEXT,
                client_id UUID REFERENCES clients(id),
                
                notes TEXT,
                created_by TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_charters_org ON charter_requests(organization_id);
            CREATE INDEX IF NOT EXISTS idx_charters_status ON charter_requests(status);
        `);
        console.log("Charters table created successfully.");

    } catch (error) {
        console.error("Error creating tables:", error);
    } finally {
        await pool.end();
    }
}

main();
