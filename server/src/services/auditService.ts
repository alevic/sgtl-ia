import { db } from "../db/drizzle.js";
import { auditLogs } from "../db/schema.js";

export interface AuditEvent {
    userId?: string;
    organizationId?: string;
    action: string;
    entity: string;
    entityId?: string;
    oldData?: any;
    newData?: any;
    ipAddress?: string;
    userAgent?: string;
}

export class AuditService {
    static async logEvent(event: AuditEvent) {
        try {
            console.log(`[AuditService] Attempting to log: ${event.action} on ${event.entity}`);

            await db.insert(auditLogs).values({
                userId: event.userId,
                organization_id: event.organizationId,
                action: event.action,
                entity: event.entity,
                entity_id: event.entityId,
                old_data: event.oldData ? JSON.stringify(event.oldData) : null,
                new_data: event.newData ? JSON.stringify(event.newData) : null,
                ip_address: event.ipAddress,
                user_agent: event.userAgent,
                created_at: new Date(),
            });

            console.log(`[AuditService] Successfully logged: ${event.action}`);
        } catch (error) {
            console.error("[AuditService] Failed to log event:", error);
            // We don't throw here to avoid breaking the main operation
        }
    }
}
