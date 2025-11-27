import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://admin:admin123@localhost:5432/sgtl_db",
});

async function setup() {
    try {
        console.log("Setting up database...");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS transaction (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                type TEXT NOT NULL,
                description TEXT NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                currency TEXT DEFAULT 'BRL',
                date DATE NOT NULL,
                due_date DATE,
                payment_date DATE,
                status TEXT NOT NULL,
                payment_method TEXT,
                category TEXT,
                cost_center TEXT,
                accounting_classification TEXT,
                document_number TEXT,
                notes TEXT,
                organization_id TEXT NOT NULL,
                created_by TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log("Transaction table created successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Error setting up database:", error);
        process.exit(1);
    }
}

setup();
