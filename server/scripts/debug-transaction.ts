import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://admin:admin123@localhost:5432/sgtl_db",
});

async function debugTransaction() {
    try {
        console.log("Attempting to insert debug transaction...");

        const query = `
            INSERT INTO transaction (
                type, description, amount, currency, date,
                due_date, payment_date, status, payment_method, category,
                cost_center, accounting_classification, document_number, notes,
                organization_id, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING *;
        `;

        const values = [
            'DESPESA', 'Debug Transaction', 10.00, 'BRL', '2024-11-27',
            '2024-11-27', null, 'PENDENTE', 'DINHEIRO', 'OUTROS',
            'ADMINISTRATIVO', 'DESPESA_VARIAVEL', 'DEBUG-001', 'Debug notes',
            'org_123', 'user_123'
        ];

        const result = await pool.query(query, values);

        console.log("Transaction inserted successfully:", result.rows[0]);
        process.exit(0);
    } catch (error) {
        console.error("Error inserting transaction:", error);
        process.exit(1);
    }
}

debugTransaction();
