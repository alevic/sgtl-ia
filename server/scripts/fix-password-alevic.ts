import { pool } from './config';
import bcrypt from 'bcrypt';

/**
 * Fix password hash for user 'alevic'
 * This will properly hash the password using bcrypt
 */

async function fixPasswordHash() {
    const client = await pool.connect();

    try {
        console.log('🔐 Fixing password hash for user "alevic"...');

        // 1. Get user info
        const userResult = await client.query(
            'SELECT id, email, name, username FROM "user" WHERE username = $1',
            ['alevic']
        );

        if (userResult.rows.length === 0) {
            console.log('❌ User "alevic" not found');
            return;
        }

        const user = userResult.rows[0];
        console.log(`✅ Found user: ${user.name} (${user.email})`);

        // 2. Create new password hash
        const password = 'Senha@123';
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log('✅ Password hashed successfully');

        // 3. Update account table
        const updateResult = await client.query(
            `UPDATE account 
             SET password = $1, "updatedAt" = CURRENT_TIMESTAMP
             WHERE "userId" = $2 AND "providerId" = 'credential'`,
            [hashedPassword, user.id]
        );

        if (updateResult.rowCount === 0) {
            console.log('⚠️  No credential account found. Creating new one...');

            // Create new credential account
            await client.query(
                `INSERT INTO account (
                    id, "accountId", "providerId", "userId", 
                    password, "createdAt", "updatedAt"
                ) VALUES (
                    gen_random_uuid()::text, 
                    $1, 
                    'credential', 
                    $2, 
                    $3, 
                    CURRENT_TIMESTAMP, 
                    CURRENT_TIMESTAMP
                )`,
                [user.email, user.id, hashedPassword]
            );

            console.log('✅ Credential account created');
        } else {
            console.log('✅ Password hash updated');
        }

        console.log('');
        console.log('═══════════════════════════════════════');
        console.log('✅ Password fixed successfully!');
        console.log('');
        console.log('Login credentials:');
        console.log(`  Username: ${user.username}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Password: Senha@123`);
        console.log('');
        console.log('⚠️  IMPORTANT: Change this password after first login!');
        console.log('═══════════════════════════════════════');

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run fix
fixPasswordHash()
    .then(() => {
        console.log('✅ Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Failed:', error);
        process.exit(1);
    });
