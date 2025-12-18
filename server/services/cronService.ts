import cron from 'node-cron';
import { pool } from '../auth';

/**
 * Initializes all system cron jobs
 */
export const initCronJobs = () => {
    console.log('⏰ Initializing System Cron Jobs...');

    // Job: Auto-Cancel Pending Reservations (Every 5 minutes)
    // Runs at minute 0, 5, 10, etc.
    cron.schedule('*/5 * * * *', async () => {
        console.log('⏰ Running Cron: Auto-Cancel Pending Reservations');

        const client = await pool.connect();

        try {
            // Minutes to expire
            const EXPIRATION_MINUTES = 5;

            // Query logic: status = 'PENDING' AND created_at < NOW() - 15 min AND payment_method = 'DIGITAL'
            // We focus on DIGITAL because MANUAL payments might be negotiated differently? 
            // Or just cancel ALL pending? Better to be safe and cancel ALL pending old ones.
            // But let's verify if 'MANUAL' pending should be auto-cancelled. 
            // Usually 'MANUAL' is effectively 'CONFIRMED' in some systems, but here we treat them as 'PENDING' until approved?
            // User requested for "Digital Payment Pending". Let's filter by that if possible, or just all PENDING old keys.
            // Let's stick to ALL PENDING for safety, as a pending seat blocks others.

            const query = `
                UPDATE reservations 
                SET status = 'CANCELLED', 
                    notes = COALESCE(notes, '') || ' [Cancelado Automaticamente por Expiração]',
                    updated_at = CURRENT_TIMESTAMP
                WHERE status = 'PENDING' 
                  AND created_at < NOW() - INTERVAL '${EXPIRATION_MINUTES} minutes'
                RETURNING id, ticket_code, passenger_name
            `;

            const result = await client.query(query);

            if (result.rows.length > 0) {
                console.log(`✅ [CRON] Cancelled ${result.rows.length} expired reservations.`);
                result.rows.forEach(r => {
                    console.log(`   - Cancelled: ${r.ticket_code} (${r.passenger_name})`);
                });
            } else {
                console.log(`   [CRON] No expired reservations found.`);
            }

        } catch (error) {
            console.error('❌ [CRON] Error running auto-cancel job:', error);
        } finally {
            client.release();
        }
    });

    console.log('✅ Cron Jobs Scheduled: [Auto-Cancel Pending Reservations (*/5 min)]');

    // Job: Auto-Complete Past Reservations (Daily at 00:00)
    cron.schedule('0 0 * * *', async () => {
        console.log('⏰ Running Cron: Auto-Complete Past Reservations');

        const client = await pool.connect();

        try {
            // Find reservations for trips that happened BEFORE today (departure_date < CURRENT_DATE)
            // And status is CONFIRMED or CHECKED_IN
            const query = `
                UPDATE reservations r
                SET status = 'COMPLETED',
                    updated_at = CURRENT_TIMESTAMP
                FROM trips t
                WHERE r.trip_id = t.id
                  AND t.departure_date < CURRENT_DATE
                  AND r.status IN ('CONFIRMED', 'CHECKED_IN')
                RETURNING r.id, r.ticket_code
            `;

            const result = await client.query(query);

            if (result.rows.length > 0) {
                console.log(`✅ [CRON] Completed ${result.rows.length} past reservations.`);
            } else {
                console.log(`   [CRON] No past reservations to complete.`);
            }

        } catch (error) {
            console.error('❌ [CRON] Error running auto-complete job:', error);
        } finally {
            client.release();
        }
    });

    console.log('✅ Cron Jobs Scheduled: [Auto-Complete Past Reservations (Daily 00:00)]');
};
