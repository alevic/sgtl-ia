import { pool } from "./auth";
import dotenv from "dotenv";

dotenv.config();

async function main() {
    try {
        console.log("Updating users to admin role...");
        const result = await pool.query('UPDATE "user" SET role = $1', ['admin']);
        console.log(`Updated ${result.rowCount} users.`);
    } catch (error) {
        console.error("Error updating users:", error);
    } finally {
        await pool.end();
    }
}

main();
