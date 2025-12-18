import { Pool } from 'pg';
import fetch from 'node-fetch';

// CONFIG
const DB_PORT = 5432; // Matches .env file
const BASE_URL = 'http://localhost:4000/api/webhooks';
const SECRET = 'dev-secret-123';
const CONNECTION_STRING = `postgresql://admin:admin123@localhost:${DB_PORT}/sgtl_db`;

async function runTest() {
    console.log('🚀 Starting Integration Verification...');
    console.log(`🔌 Connecting to DB at localhost:${DB_PORT}...`);

    const pool = new Pool({
        connectionString: CONNECTION_STRING,
    });

    const client = await pool.connect();

    try {
        // 1. Setup: Create a Mock Reservation directly in DB
        console.log('\n📝 [Setup] Creating Mock Reservation directly in DB...');

        // Fetch a trip
        const tripRes = await client.query("SELECT id, organization_id FROM trips LIMIT 1");
        if (tripRes.rows.length === 0) throw new Error("No trips found. Please create a trip first.");

        const trip = tripRes.rows[0];
        const externalId = `pay_test_${Date.now()}`;
        const ticketCode = `TEST-${Date.now().toString().slice(-6)}`;

        const insertRes = await client.query(`
            INSERT INTO reservations (
                organization_id, trip_id, passenger_name, passenger_document, 
                status, ticket_code, price, external_payment_id, payment_method, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id
        `, [
            trip.organization_id, trip.id, 'Integration Test User', '12345678900',
            'PENDING', ticketCode, 150.00, externalId, 'DIGITAL', 'script-test'
        ]);

        const resId = insertRes.rows[0].id;
        console.log(`   -> Created Reservation ID: ${resId}`);
        console.log(`   -> External Payment ID: ${externalId}`);

        // 2. Test: Payment Confirmation Webhook
        console.log('\n🧪 [Test 1] Webhook: Payment Confirmation');
        console.log(`   -> POST /payment-confirmed`);

        const confirmRes = await fetch(`${BASE_URL}/payment-confirmed`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-webhook-secret': SECRET
            },
            body: JSON.stringify({
                transaction_id: externalId,
                amount: 150.00,
                payment_method: 'PIX'
            })
        });

        const confirmData = await confirmRes.json();
        console.log('   -> API Response:', confirmData);

        // Verify DB update
        const checkConfirm = await client.query("SELECT status, amount_paid FROM reservations WHERE id = $1", [resId]);
        const r1 = checkConfirm.rows[0];

        if (r1.status === 'CONFIRMED' && Number(r1.amount_paid) === 150) {
            console.log('   ✅ SUCCESS: Reservation status is CONFIRMED and amount matches.');
        } else {
            console.error('   ❌ FAILURE: Status/Amount mismatch.', r1);
        }

        // 3. Test: Cancel Reservation Webhook
        console.log('\n🧪 [Test 2] Webhook: Manual Cancellation (Simulating N8N flow)');
        console.log(`   -> POST /cancel-reservation`);

        const cancelRes = await fetch(`${BASE_URL}/cancel-reservation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-webhook-secret': SECRET
            },
            body: JSON.stringify({
                reservation_id: resId,
                reason: 'Verification Script Test'
            })
        });

        const cancelData = await cancelRes.json();
        console.log('   -> API Response:', cancelData);

        // Verify DB update
        const checkCancel = await client.query("SELECT status, notes FROM reservations WHERE id = $1", [resId]);
        const r2 = checkCancel.rows[0];

        if (r2.status === 'CANCELLED') {
            console.log('   ✅ SUCCESS: Reservation status is CANCELLED.');
        } else {
            console.error('   ❌ FAILURE: Status mismatch.', r2);
        }

    } catch (error) {
        console.error('🚨 Test Execution Failed:', error);
    } finally {
        client.release();
        await pool.end();
        console.log('\n🏁 Verification Complete.');
    }
}

runTest();
