import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://admin:admin123@localhost:5432/sgtl_db",
});

async function testMapping() {
    const testCases = [
        "123.456.789-01",
        "12345678901",
        "(11) 98765-4321",
        "11987654321",
    ];

    for (const identifier of testCases) {
        const cleanIdentifier = identifier.replace(/\D/g, "");
        console.log(`Testing identifier: ${identifier} -> Clean: ${cleanIdentifier}`);

        try {
            const result = await pool.query(
                `SELECT email FROM "user" 
                 WHERE REPLACE(REPLACE(cpf, '.', ''), '-', '') = $1 
                 OR REPLACE(REPLACE(REPLACE(REPLACE(phone, '(', ''), ')', ''), '-', ''), ' ', '') = $1`,
                [cleanIdentifier]
            );

            if (result.rows.length > 0) {
                console.log(`Match found: ${result.rows[0].email}`);
            } else {
                console.log("No match found.");
            }
        } catch (error) {
            console.error("Query failed:", error);
        }
    }
    await pool.end();
}

testMapping();
