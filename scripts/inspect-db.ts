import { pool } from '../app/lib/auth.server';

async function inspect() {
    console.log("--- Inspecting DB ---");

    // 1. Check for 'companies' table
    const companiesCheck = await pool.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies'"
    );
    if (companiesCheck.rows.length > 0) {
        console.log("✅ Table 'companies' EXISTS.");
        const cols = await pool.query(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'companies'"
        );
        console.log("Columns:", cols.rows.map(r => r.column_name).join(', '));
    } else {
        console.log("❌ Table 'companies' DOES NOT EXIST.");
    }

    // 2. Check 'reservations' columns
    console.log("\n--- Checking 'reservations' columns ---");
    const resCols = await pool.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'reservations'" // Table name might be 'reservations' (legacy) or 'reservation' (drizzle default singular?)
        // Schema says: export const reservation = pgTable('reservation', ...)
        // Drizzle defaults to matching the name in pgTable first arg.
        // My schema has 'reservation'. Legacy had 'reservations'.
        // If legacy migration ran, it created 'reservations'.
        // I should check both.
    );
    if (resCols.rows.length === 0) {
        console.log("Checking for 'reservation' (singular)...");
        const resColsSingular = await pool.query(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'reservation'"
        );
        console.log("Columns (reservation):", resColsSingular.rows.map(r => r.column_name).join(', '));
    } else {
        console.log("Columns (reservations):", resCols.rows.map(r => r.column_name).join(', '));
    }

    // 3. Check 'organization' columns
    console.log("\n--- Checking 'organization' columns ---");
    const orgCols = await pool.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'organization'"
    );
    console.log("Columns:", orgCols.rows.map(r => r.column_name).join(', '));

    process.exit(0);
}

inspect().catch(console.error);
