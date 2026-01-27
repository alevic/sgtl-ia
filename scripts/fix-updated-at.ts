import { db } from '../app/db/db.server';
import { sql } from 'drizzle-orm';

async function fixUpdatedAtValues() {
    console.log('Fixing NULL updatedAt/updated_at values...');

    try {
        // These tables might have NULL values that need fixing
        const updates = [
            { table: 'member', column: 'updatedAt', createdCol: 'createdAt' },
            { table: 'trips', column: 'updated_at', createdCol: 'created_at' },
            { table: 'clients', column: 'updated_at', createdCol: 'created_at' },
            { table: 'driver', column: 'updated_at', createdCol: 'created_at' },
            { table: 'vehicle', column: 'updatedAt', createdCol: 'createdAt' },
            { table: 'routes', column: 'updated_at', createdCol: 'created_at' },
            { table: 'organization', column: 'updated_at', createdCol: 'created_at' },
        ];

        for (const { table, column, createdCol } of updates) {
            try {
                await db.execute(sql.raw(`UPDATE ${table} SET "${column}" = COALESCE("${column}", "${createdCol}", NOW()) WHERE "${column}" IS NULL`));
                console.log(`✓ Fixed ${table} table`);
            } catch (error: any) {
                if (error.code === '42703' || error.code === '42P01') {
                    console.log(`⊘ Skipped ${table} table (column or table doesn't exist)`);
                } else {
                    throw error;
                }
            }
        }

        console.log('\n✅ All NULL updated_at values fixed!');
        console.log('Now run: npm run db:push');
    } catch (error) {
        console.error('Error fixing updated_at values:', error);
        process.exit(1);
    }

    process.exit(0);
}

fixUpdatedAtValues();
