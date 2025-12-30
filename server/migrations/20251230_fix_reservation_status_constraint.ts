import { pool } from "../auth";

export async function up() {
    console.log("Updating reservations status check constraint...");
    // We drop the constraint first (ignoring errors if it doesn't exist)
    // and then add it back with the new values.
    try {
        await pool.query(`
            ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_status_check;
            ALTER TABLE reservations ADD CONSTRAINT reservations_status_check 
            CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'CHECKED_IN', 'NO_SHOW', 'USED', 'COMPLETED'));
        `);
    } catch (error) {
        console.error("Error updating reservations status constraint:", error);
    }

    console.log("Updating trips status check constraint...");
    try {
        await pool.query(`
            ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_status_check;
            ALTER TABLE trips ADD CONSTRAINT trips_status_check
            CHECK (status IN ('SCHEDULED', 'BOARDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED', 'DELAYED', 'AGENDADA', 'CONFIRMADA', 'EM_CURSO', 'FINALIZADA', 'CONFIRMED'));
        `);
    } catch (error) {
        console.error("Error updating trips status constraint:", error);
    }
}

export async function down() {
    // Reverting to original constraints (this might fail if existing data uses new statuses)
    console.log("Reverting status constraints...");
    await pool.query(`
        ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_status_check;
        ALTER TABLE reservations ADD CONSTRAINT reservations_status_check 
        CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'CHECKED_IN', 'NO_SHOW'));

        ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_status_check;
        ALTER TABLE trips ADD CONSTRAINT trips_status_check
        CHECK (status IN ('SCHEDULED', 'BOARDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED', 'DELAYED'));
    `);
}
