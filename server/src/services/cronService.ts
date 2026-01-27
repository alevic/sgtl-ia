import cron from 'node-cron';
import { pool } from '../auth';
import { ReservationStatus, TripStatus } from '../../../types.js';

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
            const query = `
                UPDATE reservations r
                SET status = $2, 
                    notes = COALESCE(r.notes, '') || ' [Cancelado Automaticamente por Expiração]',
                    updated_at = CURRENT_TIMESTAMP
                FROM organization o
                LEFT JOIN system_parameters sp ON sp.organization_id = o.id AND sp.key = 'reservation_expiration_minutes'
                WHERE r.organization_id = o.id
                  AND (r.status = $1 OR r.status = 'PENDING') 
                  AND r.created_at < NOW() - (COALESCE(sp.value, '5') || ' minutes')::INTERVAL
                RETURNING r.id
            `;
            const result = await client.query(query, [ReservationStatus.PENDING, ReservationStatus.CANCELLED]);
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
                SET status = $3,
                    updated_at = CURRENT_TIMESTAMP
                FROM trips t
                WHERE r.trip_id = t.id
                  AND t.departure_date < CURRENT_DATE
                  AND (r.status = $1 OR r.status = $2 OR r.status = 'CONFIRMED' OR r.status = 'CONFIRMADA' OR r.status = 'CHECKED_IN')
            `;
            await client.query(query, [ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN, ReservationStatus.COMPLETED]);
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
                SET status = $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE (status = $2 OR status = $3 OR status = 'SCHEDULED' OR status = 'BOARDING' OR status = 'AGENDADA')
                  AND (departure_date + departure_time) AT TIME ZONE 'America/Sao_Paulo' <= CURRENT_TIMESTAMP
                RETURNING id
            `;
            const startResult = await client.query(startQuery, [TripStatus.IN_TRANSIT, TripStatus.SCHEDULED, TripStatus.BOARDING]);
            if (startResult.rows.length > 0) {
                console.log(`✅ [CRON] Started ${startResult.rows.length} trips.`);
            }

            // 2. Auto-Complete Trips
            // Completes if arrival time passed OR if trip passed a safety margin since departure
            const completeQuery = `
                UPDATE trips t
                SET status = $1,
                    active = false,
                    updated_at = CURRENT_TIMESTAMP
                FROM organization o
                LEFT JOIN system_parameters sp ON sp.organization_id = o.id AND sp.key = 'trip_auto_complete_safety_margin_hours'
                WHERE t.organization_id = o.id
                  AND (t.status = $2 OR t.status = 'IN_TRANSIT' OR t.status = 'EM_CURSO')
                  AND (
                      -- Primary condition: Arrival time reached/passed
                      (t.arrival_date IS NOT NULL AND t.arrival_time IS NOT NULL AND (t.arrival_date + t.arrival_time) AT TIME ZONE 'America/Sao_Paulo' <= CURRENT_TIMESTAMP)
                      OR 
                      -- Fallback condition: Use safety margin (default 168h/7 days) if arrival info is missing
                      (
                          (t.arrival_date IS NULL OR t.arrival_time IS NULL)
                          AND 
                          (t.departure_date + t.departure_time) AT TIME ZONE 'America/Sao_Paulo' < NOW() - (COALESCE(sp.value, '168') || ' hours')::INTERVAL
                      )
                  )
                RETURNING t.id
            `;
            const completeResult = await client.query(completeQuery, [TripStatus.COMPLETED, TripStatus.IN_TRANSIT]);
            if (completeResult.rows && completeResult.rows.length > 0) {
                console.log(`✅ [CRON] Completed and Deactivated ${completeResult.rows.length} trips.`);
            }

            // 3. Deactivate already COMPLETED trips that are still active
            const cleanupQuery = `
                UPDATE trips
                SET active = false,
                    updated_at = CURRENT_TIMESTAMP
                WHERE (status = $1 OR status = 'COMPLETED' OR status = 'FINALIZADA') AND active = true
            `;
            const cleanupResult = await client.query(cleanupQuery, [TripStatus.COMPLETED]);
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
