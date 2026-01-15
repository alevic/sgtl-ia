import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://admin:admin123@localhost:5432/sgtl_db",
});

async function migrate() {
    console.log("Starting status migration to English...");
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Vehicle
        console.log("Migrating vehicle status...");
        await client.query(`UPDATE vehicle SET status = 'ACTIVE' WHERE status IN ('ATIVO', 'ACTIVE')`);
        await client.query(`UPDATE vehicle SET status = 'MAINTENANCE' WHERE status IN ('MANUTENCAO', 'MAINTENANCE')`);
        await client.query(`UPDATE vehicle SET status = 'IN_TRANSIT' WHERE status IN ('EM_VIAGEM', 'IN_TRANSIT')`);

        // 2. Seat
        console.log("Migrating seat status...");
        await client.query(`UPDATE seat SET status = 'AVAILABLE' WHERE status IN ('LIVRE', 'AVAILABLE')`);
        await client.query(`UPDATE seat SET status = 'OCCUPIED' WHERE status IN ('OCUPADO', 'OCCUPIED')`);
        await client.query(`UPDATE seat SET status = 'PENDING' WHERE status IN ('PENDENTE', 'PENDING')`);
        await client.query(`UPDATE seat SET status = 'BLOCKED' WHERE status IN ('BLOQUEADO', 'BLOCKED')`);

        // 3. Driver
        console.log("Migrating driver status...");
        await client.query(`UPDATE driver SET status = 'AVAILABLE' WHERE status IN ('DISPONIVEL', 'AVAILABLE')`);
        await client.query(`UPDATE driver SET status = 'IN_TRANSIT' WHERE status IN ('EM_VIAGEM', 'IN_TRANSIT')`);
        await client.query(`UPDATE driver SET status = 'ON_LEAVE' WHERE status IN ('FOLGA', 'ON_LEAVE')`);
        await client.query(`UPDATE driver SET status = 'AWAY' WHERE status IN ('AFASTADO', 'AWAY')`);

        // 4. Routes
        console.log("Migrating route type...");
        await client.query(`UPDATE routes SET type = 'OUTBOUND' WHERE type IN ('IDA', 'OUTBOUND')`);
        await client.query(`UPDATE routes SET type = 'INBOUND' WHERE type IN ('VOLTA', 'INBOUND')`);

        // 5. Trips
        console.log("Migrating trips status...");
        await client.query(`UPDATE trips SET status = 'SCHEDULED' WHERE status IN ('AGENDADA', 'SCHEDULED', 'CONFIRMADA', 'CONFIRMED')`);
        await client.query(`UPDATE trips SET status = 'BOARDING' WHERE status IN ('EMBARQUE', 'BOARDING')`);
        await client.query(`UPDATE trips SET status = 'IN_TRANSIT' WHERE status IN ('EM_CURSO', 'IN_TRANSIT')`);
        await client.query(`UPDATE trips SET status = 'COMPLETED' WHERE status IN ('FINALIZADA', 'COMPLETED')`);
        await client.query(`UPDATE trips SET status = 'CANCELLED' WHERE status IN ('CANCELADA', 'CANCELLED')`);
        await client.query(`UPDATE trips SET status = 'DELAYED' WHERE status IN ('ATRASADA', 'DELAYED')`);

        // 6. Reservations
        console.log("Migrating reservations status...");
        await client.query(`UPDATE reservations SET status = 'PENDING' WHERE status IN ('PENDENTE', 'PENDING')`);
        await client.query(`UPDATE reservations SET status = 'CONFIRMED' WHERE status IN ('CONFIRMADA', 'CONFIRMED')`);
        await client.query(`UPDATE reservations SET status = 'CANCELLED' WHERE status IN ('CANCELADA', 'CANCELLED')`);
        await client.query(`UPDATE reservations SET status = 'CHECKED_IN' WHERE status IN ('EMBARCADO', 'CHECKED_IN')`);
        await client.query(`UPDATE reservations SET status = 'USED' WHERE status IN ('UTILIZADA', 'USED')`);

        // 7. Parcel Orders (Encomendas)
        console.log("Migrating parcel_orders status...");
        await client.query(`UPDATE parcel_orders SET status = 'AWAITING' WHERE status IN ('AGUARDANDO', 'AWAITING', 'PENDING')`);
        await client.query(`UPDATE parcel_orders SET status = 'IN_TRANSIT' WHERE status IN ('EM_TRANSITO', 'IN_TRANSIT')`);
        await client.query(`UPDATE parcel_orders SET status = 'DELIVERED' WHERE status IN ('ENTREGUE', 'DELIVERED')`);
        await client.query(`UPDATE parcel_orders SET status = 'RETURNED' WHERE status IN ('DEVOLVIDA', 'RETURNED')`);

        // 8. Charter Requests (Fretamento)
        console.log("Migrating charter_requests status...");
        await client.query(`UPDATE charter_requests SET status = 'REQUEST' WHERE status IN ('SOLICITACAO', 'REQUEST', 'PENDING')`);
        await client.query(`UPDATE charter_requests SET status = 'QUOTED' WHERE status IN ('ORCAMENTO_ENVIADO', 'QUOTED')`);
        await client.query(`UPDATE charter_requests SET status = 'CONFIRMED' WHERE status IN ('CONFIRMADO', 'CONFIRMED', 'APPROVED')`);
        await client.query(`UPDATE charter_requests SET status = 'IN_PROGRESS' WHERE status IN ('EM_ANDAMENTO', 'IN_PROGRESS')`);
        await client.query(`UPDATE charter_requests SET status = 'COMPLETED' WHERE status IN ('CONCLUIDO', 'COMPLETED')`);
        await client.query(`UPDATE charter_requests SET status = 'CANCELLED' WHERE status IN ('CANCELADO', 'CANCELLED', 'REJECTED')`);

        // 9. Maintenance
        console.log("Migrating maintenance status...");
        await client.query(`UPDATE maintenance SET status = 'SCHEDULED' WHERE status IN ('AGENDADA', 'SCHEDULED')`);
        await client.query(`UPDATE maintenance SET status = 'IN_PROGRESS' WHERE status IN ('EM_ANDAMENTO', 'IN_PROGRESS')`);
        await client.query(`UPDATE maintenance SET status = 'COMPLETED' WHERE status IN ('CONCLUIDA', 'COMPLETED')`);
        await client.query(`UPDATE maintenance SET status = 'CANCELLED' WHERE status IN ('CANCELADA', 'CANCELLED')`);

        // 10. Transaction
        console.log("Migrating transaction status...");
        await client.query(`UPDATE transaction SET status = 'PENDING' WHERE status IN ('PENDENTE', 'PENDING')`);
        await client.query(`UPDATE transaction SET status = 'PAID' WHERE status IN ('PAGA', 'PAID')`);
        await client.query(`UPDATE transaction SET status = 'OVERDUE' WHERE status IN ('VENCIDA', 'OVERDUE')`);
        await client.query(`UPDATE transaction SET status = 'CANCELLED' WHERE status IN ('CANCELADA', 'CANCELLED')`);
        await client.query(`UPDATE transaction SET status = 'PARTIALLY_PAID' WHERE status IN ('PARCIALMENTE_PAGA', 'PARTIALLY_PAID')`);

        await client.query('COMMIT');
        console.log("Migration completed successfully!");
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Migration failed:", e);
        throw e;
    } finally {
        client.release();
    }
}

migrate().then(() => process.exit(0)).catch(() => process.exit(1));
