import { pool } from "../src/auth.js";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    try {
        console.log("Creating parcel_orders table...");

        // Create Parcels Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS parcel_orders (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id TEXT NOT NULL,
                
                sender_name TEXT NOT NULL,
                sender_document TEXT NOT NULL,
                sender_phone TEXT NOT NULL,
                
                recipient_name TEXT NOT NULL,
                recipient_document TEXT NOT NULL,
                recipient_phone TEXT NOT NULL,
                
                origin_city TEXT NOT NULL,
                origin_state TEXT NOT NULL,
                destination_city TEXT NOT NULL,
                destination_state TEXT NOT NULL,
                
                description TEXT NOT NULL,
                weight DECIMAL(10, 2),
                dimensions TEXT,
                
                status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RECEIVED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED')),
                tracking_code TEXT NOT NULL UNIQUE,
                price DECIMAL(10, 2) NOT NULL,
                
                trip_id UUID REFERENCES trips(id),
                user_id TEXT,
                client_id UUID REFERENCES clients(id),
                
                notes TEXT,
                created_by TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_parcels_org ON parcel_orders(organization_id);
            CREATE INDEX IF NOT EXISTS idx_parcels_status ON parcel_orders(status);
            CREATE INDEX IF NOT EXISTS idx_parcels_tracking ON parcel_orders(tracking_code);
        `);
        console.log("Parcels table created successfully.");

    } catch (error) {
        console.error("Error creating tables:", error);
    } finally {
        await pool.end();
    }
}

main();
