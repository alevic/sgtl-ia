
import { pool } from '../src/config.js';
import bcrypt from 'bcrypt';

async function createAlevic() {
    const client = await pool.connect();

    try {
        console.log("Creating user alevic...");

        const hashedPassword = await bcrypt.hash('Senha@123', 10);

        // 1. Check if user exists
        let userRes = await client.query('SELECT id FROM "user" WHERE username = $1', ['alevic']);
        let userId;

        if (userRes.rows.length === 0) {
            console.log("User 'alevic' does not exist. Creating...");
            userId = 'user_alevic_' + Date.now();
            await client.query(`
                INSERT INTO "user" (id, name, email, username, role, is_active, phone)
                VALUES ($1, 'Alessandro Victor', 'alessandro@sgtl.com.br', 'alevic', 'admin', true, '5548999999999')
            `, [userId]);
        } else {
            console.log("User 'alevic' already exists.");
            userId = userRes.rows[0].id;
            // Ensure is_active and role
            await client.query(`UPDATE "user" SET role='admin', is_active=true WHERE id=$1`, [userId]);
        }

        // 2. Check/Create Account
        const accountRes = await client.query(
            'SELECT id FROM account WHERE "userId" = $1 AND "providerId" = $2',
            [userId, 'credential']
        );

        if (accountRes.rows.length === 0) {
            console.log("Account does not exist. Creating...");
            await client.query(`
                INSERT INTO account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
                VALUES (gen_random_uuid(), 'alevic', 'credential', $1, $2, NOW(), NOW())
            `, [userId, hashedPassword]);
        } else {
            console.log("Account exists. Updating password...");
            await client.query(`
                UPDATE account SET password = $1, "accountId" = 'alevic'
                WHERE "userId" = $2 AND "providerId" = 'credential'
             `, [hashedPassword, userId]);
        }

        console.log("✅ User 'alevic' ready.");
        console.log("Login: alevic / Senha@123");

    } catch (e) {
        console.error("Error creating user:", e);
    } finally {
        client.release();
    }
}

createAlevic().then(() => process.exit(0));
