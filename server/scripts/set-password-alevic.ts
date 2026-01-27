import { pool } from '../src/config.js';
import { auth } from '../src/auth.js';

/**
 * Migration: Set password for user 'alevic'
 * This creates a credential account in Better Auth for the user
 */

async function setPasswordForAlevic() {
    const client = await pool.connect();

    try {
        console.log('🔐 Setting password for user "alevic"...');

        // 1. Get user info
        const userResult = await client.query(
            'SELECT id, email, name FROM "user" WHERE username = $1',
            ['alevic']
        );

        if (userResult.rows.length === 0) {
            console.log('❌ User "alevic" not found');
            return;
        }

        const user = userResult.rows[0];
        console.log(`✅ Found user: ${user.name} (${user.email})`);

        // 2. Check if credential account already exists
        const accountCheck = await client.query(
            'SELECT id FROM account WHERE "userId" = $1 AND "providerId" = $2',
            [user.id, 'credential']
        );

        if (accountCheck.rows.length > 0) {
            console.log('⚠️  Credential account already exists. Updating password...');

            // Update existing password using Better Auth
            const password = 'Senha@123'; // Temporary password

            // Use Better Auth to hash and update password
            const updateResult = await auth.api.changePassword({
                body: {
                    currentPassword: '', // Not needed for admin update
                    newPassword: password,
                    revokeOtherSessions: false
                },
                headers: {
                    authorization: `Bearer ${user.id}` // Simulate user context
                }
            }) as any;

            console.log('✅ Password updated successfully!');
        } else {
            console.log('📝 Creating new credential account...');

            // Create credential account using Better Auth
            const password = 'Senha@123'; // Temporary password

            // We need to manually create the account entry with hashed password
            const bcrypt = require('bcrypt');
            const hashedPassword = await bcrypt.hash(password, 10);

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

            console.log('✅ Credential account created successfully!');
        }

        console.log('');
        console.log('═══════════════════════════════════════');
        console.log('✅ Password set successfully!');
        console.log('');
        console.log('Login credentials:');
        console.log(`  Username: alevic`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Password: Senha@123`);
        console.log('');
        console.log('⚠️  IMPORTANT: Change this password after first login!');
        console.log('═══════════════════════════════════════');

    } catch (error) {
        console.error('❌ Migration error:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run migration
setPasswordForAlevic()
    .then(() => {
        console.log('✅ Migration completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    });
