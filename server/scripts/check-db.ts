import { pool } from "../src/auth.js";

async function check() {
    try {
        console.log("Checking states...");
        const result = await pool.query("SELECT count(*) FROM states");
        console.log("States count:", result.rows[0].count);

        const states = await pool.query("SELECT * FROM states LIMIT 5");
        console.log("First 5 states:", states.rows);

        process.exit(0);
    } catch (error) {
        console.error("Error checking DB:", error);
        process.exit(1);
    }
}

check();
