import { pool } from "../auth";

export async function up() {
    console.log("Adding boarding_point and dropoff_point to reservations table...");
    try {
        await pool.query(`
            ALTER TABLE reservations ADD COLUMN IF NOT EXISTS boarding_point text;
            ALTER TABLE reservations ADD COLUMN IF NOT EXISTS dropoff_point text;
        `);
        console.log("Columns added successfully.");
    } catch (error) {
        console.error("Error adding columns to reservations:", error);
    }
}

export async function down() {
    console.log("Removing boarding_point and dropoff_point from reservations table...");
    try {
        await pool.query(`
            ALTER TABLE reservations DROP COLUMN IF EXISTS boarding_point;
            ALTER TABLE reservations DROP COLUMN IF EXISTS dropoff_point;
        `);
        console.log("Columns removed successfully.");
    } catch (error) {
        console.error("Error removing columns from reservations:", error);
    }
}
