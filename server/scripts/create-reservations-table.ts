import { pool } from "./auth";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    try {
        console.log("Creating reservations table...");

        // Create Reservations Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS reservations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id TEXT NOT NULL,
                trip_id UUID NOT NULL REFERENCES trips(id),
                seat_id UUID REFERENCES seat(id),
                
                passenger_name TEXT NOT NULL,
                passenger_document TEXT NOT NULL,
                passenger_email TEXT,
                passenger_phone TEXT,
                
                status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'CHECKED_IN', 'NO_SHOW')),
                ticket_code TEXT NOT NULL UNIQUE,
                price DECIMAL(10, 2) NOT NULL,
                
                user_id TEXT,
                client_id UUID REFERENCES clients(id),
                
                notes TEXT,
                created_by TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_reservations_org ON reservations(organization_id);
            CREATE INDEX IF NOT EXISTS idx_reservations_trip ON reservations(trip_id);
            CREATE INDEX IF NOT EXISTS idx_reservations_code ON reservations(ticket_code);
            CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
        `);
        console.log("Reservations table created successfully.");

    } catch (error) {
        console.error("Error creating tables:", error);
    } finally {
        await pool.end();
    }
}

main();
