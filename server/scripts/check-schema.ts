import { Pool } from "pg";

const pool = new Pool({
    connectionString: "postgresql://admin:admin123@localhost:5432/sgtl_db"
});

async function checkSchema() {
    try {
        const res = await pool.query(`
            SELECT column_name, is_nullable, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'transaction';
        `);
        console.table(res.rows);
    } catch (error) {
        console.error(error);
    } finally {
        await pool.end();
    }
}

checkSchema();
