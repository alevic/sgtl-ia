import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function addDisabledColumnToSeat() {
    try {
        console.log('Adding disabled column to seat table...');

        await pool.query(`
            ALTER TABLE seat 
            ADD COLUMN IF NOT EXISTS disabled BOOLEAN DEFAULT FALSE;
        `);

        console.log('✓ Successfully added disabled column to seat table');
    } catch (error) {
        console.error('Error adding disabled column:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

addDisabledColumnToSeat()
    .then(() => {
        console.log('Migration completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
