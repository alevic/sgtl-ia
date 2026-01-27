import { db } from '../app/db/db.server';
import { routes } from '../app/db/schema';

async function checkRoutes() {
    const result = await db.select().from(routes);
    console.log('Total de rotas:', result.length);
    console.table(result.map(r => ({
        id: r.id.substring(0, 8),
        name: r.name,
        type: r.type,
        active: r.active
    })));
    process.exit(0);
}

checkRoutes();
