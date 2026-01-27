import { pool } from "./auth";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    try {
        console.log("Creating routes and trips tables...");

        // Create Routes Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS routes (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id TEXT NOT NULL,
                name TEXT NOT NULL,
                origin_city TEXT NOT NULL,
                origin_state TEXT NOT NULL,
                destination_city TEXT NOT NULL,
                destination_state TEXT NOT NULL,
                distance_km DECIMAL(10, 2),
                duration_minutes INTEGER,
                stops JSONB DEFAULT '[]',
                active BOOLEAN DEFAULT TRUE,
                created_by TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_routes_org ON routes(organization_id);
        `);
        console.log("Routes table created successfully.");

        // Create Trips Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS trips (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                organization_id TEXT NOT NULL,
                route_id UUID NOT NULL REFERENCES routes(id),
                vehicle_id UUID REFERENCES vehicle(id),
                driver_id UUID REFERENCES driver(id),
                departure_date DATE NOT NULL,
                departure_time TIME NOT NULL,
                arrival_date DATE,
                arrival_time TIME,
                status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'BOARDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED', 'DELAYED')),
                price_conventional DECIMAL(10, 2),
                price_executive DECIMAL(10, 2),
                price_semi_sleeper DECIMAL(10, 2),
                price_sleeper DECIMAL(10, 2),
                seats_available INTEGER,
                notes TEXT,
                created_by TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_trips_org ON trips(organization_id);
            CREATE INDEX IF NOT EXISTS idx_trips_route ON trips(route_id);
            CREATE INDEX IF NOT EXISTS idx_trips_date ON trips(departure_date);
        `);
        console.log("Trips table created successfully.");

    } catch (error) {
        console.error("Error creating tables:", error);
    } finally {
        await pool.end();
    }
}

main();
