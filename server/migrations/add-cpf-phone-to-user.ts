import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://admin:admin123@localhost:5432/sgtl_db",
});

async function migrate() {
    try {
        console.log("Starting migration: Adding cpf and phone to 'user' table...");
        
        await pool.query(`
            ALTER TABLE "user" 
            ADD COLUMN IF NOT EXISTS cpf TEXT UNIQUE,
            ADD COLUMN IF NOT EXISTS phone TEXT UNIQUE;
        `);

        console.log("Migration completed successfully.");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await pool.end();
    }
}

migrate();
