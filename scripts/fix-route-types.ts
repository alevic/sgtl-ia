import { db } from '../app/db/db.server';
import { routes } from '../app/db/schema';
import { eq, sql } from 'drizzle-orm';

async function fixRouteTypes() {
    console.log('Atualizando tipos de rotas...');

    try {
        // Mapear IDA -> OUTBOUND e VOLTA -> INBOUND
        await db.execute(sql`
            UPDATE routes
            SET type = CASE
                WHEN type = 'IDA' THEN 'OUTBOUND'
                WHEN type = 'VOLTA' THEN 'INBOUND'
                ELSE type
            END
            WHERE type IN ('IDA', 'VOLTA')
        `);

        console.log('✓ Tipos de rotas atualizados!');

        // Verificar resultado
        const result = await db.select().from(routes);
        console.log('\nRotas após atualização:');
        console.table(result.map(r => ({
            id: r.id.substring(0, 8),
            name: r.name,
            type: r.type,
            active: r.active
        })));
    } catch (error) {
        console.error('Erro ao atualizar tipos de rotas:', error);
        process.exit(1);
    }

    process.exit(0);
}

fixRouteTypes();
