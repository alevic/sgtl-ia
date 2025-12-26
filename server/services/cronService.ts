import cron from 'node-cron';
import { pool } from '../auth';

/**
 * Initializes all system cron jobs
 */
export const initCronJobs = () => {
    console.log('⏰ Initializing System Cron Jobs...');

    // Job: Auto-Cancel Pending Reservations (Every 5 minutes)
    cron.schedule('*/5 * * * *', async () => {
        console.log('⏰ Running Cron: Auto-Cancel Pending Reservations');
        const client = await pool.connect();
        try {
            const EXPIRATION_MINUTES = 5;
            const query = `
                UPDATE reservations 
                SET status = 'CANCELLED', 
                    notes = COALESCE(notes, '') || ' [Cancelado Automaticamente por Expiração]',
                    updated_at = CURRENT_TIMESTAMP
                WHERE status = 'PENDING' 
                  AND created_at < NOW() - INTERVAL '${EXPIRATION_MINUTES} minutes'
                RETURNING id
            `;
            const result = await client.query(query);
            if (result.rows.length > 0) {
                console.log(`✅ [CRON] Cancelled ${result.rows.length} expired reservations.`);
            }
        } catch (error) {
            console.error('❌ [CRON] Error running auto-cancel job:', error);
        } finally {
            client.release();
        }
    });

    // Job: Auto-Complete Past Reservations (Daily at 00:00)
    cron.schedule('0 0 * * *', async () => {
        console.log('⏰ Running Cron: Auto-Complete Past Reservations');
        const client = await pool.connect();
        try {
            const query = `
                UPDATE reservations r
                SET status = 'COMPLETED',
                    updated_at = CURRENT_TIMESTAMP
                FROM trips t
                WHERE r.trip_id = t.id
                  AND t.departure_date < CURRENT_DATE
                  AND r.status IN ('CONFIRMED', 'CHECKED_IN')
            `;
            await client.query(query);
        } catch (error) {
            console.error('❌ [CRON] Error running reservation auto-complete job:', error);
        } finally {
            client.release();
        }
    });

    // Unified Trip Management Job (Every 5 minutes)
    // Handles both Starting (SCHEDULED -> IN_TRANSIT) and Completing (IN_TRANSIT -> COMPLETED)
    cron.schedule('*/5 * * * *', async () => {
        console.log('⏰ Running Cron: Trip Lifecycle Management');
        const client = await pool.connect();
        try {
            // 1. Auto-Start Trips
            const startQuery = `
                UPDATE trips
                SET status = 'IN_TRANSIT',
                    updated_at = CURRENT_TIMESTAMP
                WHERE status IN ('SCHEDULED', 'BOARDING')
                  AND (departure_date + departure_time) AT TIME ZONE 'America/Sao_Paulo' <= CURRENT_TIMESTAMP
                RETURNING id
            `;
            const startResult = await client.query(startQuery);
            if (startResult.rows.length > 0) {
                console.log(`✅ [CRON] Started ${startResult.rows.length} trips.`);
            }

            // 2. Auto-Complete Trips
            // Completes if arrival time passed OR if trip is older than 24h as a fallback
            const completeQuery = `
                UPDATE trips
                SET status = 'COMPLETED',
                    active = false,
                    updated_at = CURRENT_TIMESTAMP
                WHERE status IN ('IN_TRANSIT')
                  AND (
                      (arrival_date IS NOT NULL AND arrival_time IS NOT NULL AND (arrival_date + arrival_time) AT TIME ZONE 'America/Sao_Paulo' <= CURRENT_TIMESTAMP)
                      OR 
                      (departure_date + departure_time) AT TIME ZONE 'America/Sao_Paulo' < NOW() - INTERVAL '24 hours'
                  )
                RETURNING id
            `;
            const completeResult = await client.query(completeQuery);
            if (completeResult.rows.length > 0) {
                console.log(`✅ [CRON] Completed and Deactivated ${completeResult.rows.length} trips.`);
            }

            // 3. Deactivate already COMPLETED trips that are still active
            const cleanupQuery = `
                UPDATE trips
                SET active = false,
                    updated_at = CURRENT_TIMESTAMP
                WHERE status = 'COMPLETED' AND active = true
            `;
            const cleanupResult = await client.query(cleanupQuery);
            if (cleanupResult.rowCount > 0) {
                console.log(`✅ [CRON] Deactivated ${cleanupResult.rowCount} already completed trips.`);
            }

        } catch (error) {
            console.error('❌ [CRON] Error in Trip Lifecycle job:', error);
        } finally {
            client.release();
        }
    });

    console.log('✅ Cron Jobs Scheduled: [Reservations, Trip Lifecycle (Start/Complete)]');
};
