import { Router } from "express";
import { db } from "../db/drizzle.js";
import { auditLogs, user } from "../db/schema.js";
import { desc, eq, and, sql } from "drizzle-orm";
import { authorize } from "../middleware.js";

const router = Router();

// Middleware de autorização para admin
router.use(authorize(['admin']));

router.get("/", async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = (page - 1) * limit;

        const logs = await db.select({
            id: auditLogs.id,
            action: auditLogs.action,
            entity: auditLogs.entity,
            entityId: auditLogs.entity_id,
            oldData: auditLogs.old_data,
            newData: auditLogs.new_data,
            ipAddress: auditLogs.ip_address,
            userAgent: auditLogs.user_agent,
            createdAt: auditLogs.created_at,
            userName: user.name,
            userEmail: user.email,
            username: user.username,
        })
            .from(auditLogs)
            .leftJoin(user, eq(auditLogs.userId, user.id))
            .where(eq(auditLogs.organization_id, orgId))
            .orderBy(desc(auditLogs.created_at))
            .limit(limit)
            .offset(offset);

        // Get total count
        const [countResult] = await db.select({
            count: sql<number>`count(*)`
        })
            .from(auditLogs)
            .where(eq(auditLogs.organization_id, orgId));

        res.json({
            data: logs,
            pagination: {
                page,
                limit,
                total: Number(countResult.count),
                totalPages: Math.ceil(Number(countResult.count) / limit)
            }
        });
    } catch (error) {
        console.error("[AuditRoute] Failed to fetch logs:", error);
        res.status(500).json({ error: "Erro interno ao buscar logs de auditoria" });
    }
});

export default router;
