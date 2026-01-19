import { pool } from './config';

/**
 * Migration: Add flexible document types and corporate client support
 * 
 * Changes:
 * 1. Add documento_tipo to clients and user tables
 * 2. Rename documento_numero to documento (more generic)
 * 3. Add tipo_cliente field (PESSOA_FISICA or PESSOA_JURIDICA)
 * 4. Add corporate fields: razao_social, nome_fantasia, cnpj
 */

async function migrate() {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        console.log('🔄 Starting migration: Flexible document types and corporate clients...');

        // ============================================
        // 1. CLIENTS TABLE
        // ============================================

        console.log('📝 Updating clients table...');

        // Add documento_tipo column
        await client.query(`
            ALTER TABLE clients 
            ADD COLUMN IF NOT EXISTS documento_tipo VARCHAR(20) DEFAULT 'CPF'
        `);
        console.log('  ✅ Added documento_tipo column');

        // Rename documento_numero to documento
        const hasDocumentoNumero = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'clients' AND column_name = 'documento_numero'
        `);

        if (hasDocumentoNumero.rows.length > 0) {
            await client.query(`
                ALTER TABLE clients 
                RENAME COLUMN documento_numero TO documento
            `);
            console.log('  ✅ Renamed documento_numero to documento');
        } else {
            console.log('  ℹ️  Column already renamed or does not exist');
        }

        // Add tipo_cliente column
        await client.query(`
            ALTER TABLE clients 
            ADD COLUMN IF NOT EXISTS tipo_cliente VARCHAR(20) DEFAULT 'PESSOA_FISICA'
        `);
        console.log('  ✅ Added tipo_cliente column');

        // Add corporate fields
        await client.query(`
            ALTER TABLE clients 
            ADD COLUMN IF NOT EXISTS razao_social VARCHAR(255),
            ADD COLUMN IF NOT EXISTS nome_fantasia VARCHAR(255),
            ADD COLUMN IF NOT EXISTS cnpj VARCHAR(18)
        `);
        console.log('  ✅ Added corporate fields (razao_social, nome_fantasia, cnpj)');

        // Create indexes
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_clients_tipo ON clients(tipo_cliente)
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_clients_cnpj ON clients(cnpj) WHERE cnpj IS NOT NULL
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_clients_documento ON clients(documento_tipo, documento)
        `);
        console.log('  ✅ Created indexes');

        // Add constraint for PJ required fields
        await client.query(`
            DO $$ 
            BEGIN
                ALTER TABLE clients 
                ADD CONSTRAINT check_pj_required_fields 
                CHECK (
                    tipo_cliente = 'PESSOA_FISICA' OR 
                    (tipo_cliente = 'PESSOA_JURIDICA' AND razao_social IS NOT NULL AND cnpj IS NOT NULL)
                );
            EXCEPTION
                WHEN duplicate_object THEN 
                    NULL;
            END $$;
        `);
        console.log('  ✅ Added constraint for PJ required fields');

        // Update existing records
        await client.query(`
            UPDATE clients 
            SET documento_tipo = 'CPF' 
            WHERE documento IS NOT NULL AND documento_tipo IS NULL
        `);
        console.log('  ✅ Updated existing records with CPF as default');

        // ============================================
        // 2. USER TABLE
        // ============================================

        console.log('📝 Updating user table...');

        // Add documento_tipo column
        await client.query(`
            ALTER TABLE "user" 
            ADD COLUMN IF NOT EXISTS documento_tipo VARCHAR(20) DEFAULT 'CPF'
        `);
        console.log('  ✅ Added documento_tipo column');

        // Rename cpf to documento
        const hasCpfColumn = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'user' AND column_name = 'cpf'
        `);

        if (hasCpfColumn.rows.length > 0) {
            await client.query(`
                ALTER TABLE "user" 
                RENAME COLUMN cpf TO documento
            `);
            console.log('  ✅ Renamed cpf to documento');
        } else {
            console.log('  ℹ️  Column already renamed or does not exist');
        }

        // Update existing records
        await client.query(`
            UPDATE "user" 
            SET documento_tipo = 'CPF' 
            WHERE documento IS NOT NULL AND documento_tipo IS NULL
        `);
        console.log('  ✅ Updated existing user records with CPF as default');

        // ============================================
        // 3. CREATE ENUMS (for reference)
        // ============================================

        console.log('📝 Creating type enums...');

        await client.query(`
            DO $$ 
            BEGIN
                CREATE TYPE tipo_cliente_enum AS ENUM ('PESSOA_FISICA', 'PESSOA_JURIDICA');
            EXCEPTION
                WHEN duplicate_object THEN 
                    NULL;
            END $$;
        `);

        await client.query(`
            DO $$ 
            BEGIN
                CREATE TYPE tipo_documento_enum AS ENUM ('CPF', 'RG', 'CNH', 'PASSAPORTE', 'RNE', 'CNPJ', 'OUTRO');
            EXCEPTION
                WHEN duplicate_object THEN 
                    NULL;
            END $$;
        `);
        console.log('  ✅ Created enums (tipo_cliente_enum, tipo_documento_enum)');

        await client.query('COMMIT');

        console.log('✅ Migration completed successfully!');
        console.log('');
        console.log('Summary:');
        console.log('  - Added documento_tipo to clients and user tables');
        console.log('  - Renamed documento_numero → documento');
        console.log('  - Added tipo_cliente field');
        console.log('  - Added corporate fields: razao_social, nome_fantasia, cnpj');
        console.log('  - Created indexes and constraints');
        console.log('  - Updated existing records with default values');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run migration
migrate()
    .then(() => {
        console.log('✅ All done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Migration error:', error);
        process.exit(1);
    });
