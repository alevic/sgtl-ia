import express from "express";
import { pool } from "../auth.js";
import { isValidDateISO } from "../utils/validation.js";

const router = express.Router();

import { auth } from "../auth.js";
import {
    StatusManutencao, StatusTransacao, VeiculoStatus,
    TipoTransacao, CategoriaDespesa, CentroCusto, ClassificacaoContabil
} from "../types.js";
import { AuditService } from "../services/auditService.js";
import { FinanceService } from "../services/financeService.js";


const authorize = (allowedRoles: string[]) => {
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            const session = await auth.api.getSession({ headers: req.headers as HeadersInit });
            if (!session) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            if (!session.session.activeOrganizationId) {
                return res.status(401).json({ error: "Unauthorized: No active organization" });
            }

            const userRole = (session.user as any).role || 'user';

            if (!allowedRoles.includes(userRole)) {
                return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
            }

            (req as any).session = session;
            next();
        } catch (error) {
            console.error("Auth middleware error:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    };
};

// GET all maintenances
router.get("/", authorize(['admin', 'operacional', 'financeiro']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { vehicle_id } = req.query;

        let query = `SELECT m.*, v.placa, v.modelo 
                     FROM maintenance m
                     JOIN vehicle v ON m.vehicle_id = v.id
                     WHERE m.organization_id = $1`;
        const params: any[] = [orgId];

        if (vehicle_id) {
            query += ` AND m.vehicle_id = $2`;
            params.push(vehicle_id);
        }

        query += ` ORDER BY m.scheduled_date DESC, m.created_at DESC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching maintenances:", error);
        res.status(500).json({ error: "Failed to fetch maintenances" });
    }
});

// GET single maintenance
router.get("/:id", authorize(['admin', 'operacional', 'financeiro']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { id } = req.params;

        const result = await pool.query(
            `SELECT m.*, v.placa, v.modelo, v.tipo as vehicle_type, t.id as transaction_id, t.status as transaction_status
             FROM maintenance m
             JOIN vehicle v ON m.vehicle_id = v.id
             LEFT JOIN transaction t ON t.maintenance_id = m.id
             WHERE m.id = $1 AND m.organization_id = $2`,
            [id, orgId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Maintenance not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching maintenance:", error);
        res.status(500).json({ error: "Failed to fetch maintenance" });
    }
});

// POST create maintenance
router.post("/", authorize(['admin', 'operacional']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const userId = session.user.id;

        const {
            vehicle_id, tipo, status, data_agendada, data_inicio, data_conclusao,
            km_veiculo, descricao, custo_pecas, custo_mao_de_obra, moeda,
            oficina, responsavel, observacoes
        } = req.body;

        const result = await pool.query(
            `INSERT INTO maintenance (
                vehicle_id, type, status, scheduled_date, start_date, completion_date,
                km_veiculo, description, cost_parts, cost_labor, moeda,
                workshop, responsible, notes, organization_id, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING *`,
            [
                vehicle_id, tipo, status, data_agendada, data_inicio || null, data_conclusao || null,
                km_veiculo, descricao, custo_pecas || 0, custo_mao_de_obra || 0, moeda || 'BRL',
                oficina || null, responsavel || null, observacoes || null, orgId, userId
            ]
        );

        // Update vehicle status and KM if maintenance is in progress or completed
        if (status === StatusManutencao.IN_PROGRESS || status === 'EM_ANDAMENTO') {
            await pool.query(
                `UPDATE vehicle SET status = $1, km_atual = GREATEST(km_atual, $2) WHERE id = $3 AND organization_id = $4`,
                [VeiculoStatus.MAINTENANCE, km_veiculo || 0, vehicle_id, orgId]
            );
        } else if (status === StatusManutencao.COMPLETED || status === 'CONCLUIDA') {
            await pool.query(
                `UPDATE vehicle SET status = $1, km_atual = GREATEST(km_atual, $2) WHERE id = $3 AND organization_id = $4`,
                [VeiculoStatus.ACTIVE, km_veiculo || 0, vehicle_id, orgId]
            );
        } else {
            // Even if scheduled, update KM if provided
            await pool.query(
                `UPDATE vehicle SET km_atual = GREATEST(km_atual, $1) WHERE id = $2 AND organization_id = $3`,
                [km_veiculo || 0, vehicle_id, orgId]
            );
        }


        const newMaintenance = result.rows[0];

        // Create Financial Transaction automatically
        FinanceService.createMaintenanceTransaction(newMaintenance).catch(err => {
            console.error("Error creating automatic financial transaction for maintenance:", err);
        });

        // Audit Log
        AuditService.logEvent({
            userId: userId as string,
            organizationId: orgId as string,
            action: 'MAINTENANCE_CREATE',
            entity: 'maintenance',
            entityId: newMaintenance.id,
            newData: newMaintenance,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        }).catch(console.error);

        res.json(newMaintenance);

    } catch (error) {
        console.error("Error creating maintenance:", error);
        res.status(500).json({ error: "Failed to create maintenance" });
    }
});

// PUT update maintenance
router.put("/:id", authorize(['admin', 'operacional']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { id } = req.params;

        const {
            vehicle_id, tipo, status, data_agendada, data_inicio, data_conclusao,
            km_veiculo, descricao, custo_pecas, custo_mao_de_obra, moeda,
            oficina, responsavel, observacoes
        } = req.body;

        const check = await pool.query(
            "SELECT * FROM maintenance WHERE id = $1 AND organization_id = $2",
            [id, orgId]
        );

        if (check.rows.length === 0) {
            return res.status(404).json({ error: "Maintenance not found" });
        }

        const oldMaintenance = check.rows[0];

        const result = await pool.query(
            `UPDATE maintenance SET
                vehicle_id = $1, type = $2, status = $3, scheduled_date = $4,
                start_date = $5, completion_date = $6, km_veiculo = $7,
                description = $8, cost_parts = $9, cost_labor = $10,
                moeda = $11, workshop = $12, responsible = $13, notes = $14,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $15 AND organization_id = $16
            RETURNING *`,
            [
                vehicle_id, tipo, status, data_agendada, data_inicio || null, data_conclusao || null,
                km_veiculo, descricao, custo_pecas || 0, custo_mao_de_obra || 0, moeda || 'BRL',
                oficina || null, responsavel || null, observacoes || null, id, orgId
            ]
        );

        // Update transaction amount/description if it exists and is not cancelled/paid
        if (status !== StatusManutencao.CANCELLED && status !== 'CANCELADA') {
            const custoTotal = (Number(custo_pecas) || 0) + (Number(custo_mao_de_obra) || 0);
            if (custoTotal > 0) {
                await pool.query(
                    `UPDATE transaction SET 
                        amount = $1, 
                        description = 'Manutenção ' || COALESCE((SELECT placa FROM vehicle WHERE id = $6), 'Veículo') || ' - ' || $2,
                        date = $3
                      WHERE maintenance_id = $4 AND organization_id = $5 AND (status = $7 OR status = 'PENDENTE')`,
                    [custoTotal, tipo, data_agendada, id, orgId, vehicle_id, StatusTransacao.PENDING]
                );
            }
        }

        // Update vehicle status and KM logic
        if (status === StatusManutencao.IN_PROGRESS || status === 'EM_ANDAMENTO') {
            await pool.query(
                `UPDATE vehicle SET status = $1, km_atual = GREATEST(km_atual, $2) WHERE id = $3 AND organization_id = $4`,
                [VeiculoStatus.MAINTENANCE, km_veiculo || 0, vehicle_id, orgId]
            );
        } else if (status === StatusManutencao.COMPLETED || status === 'CONCLUIDA') {
            // Set back to ATIVO and update KM
            await pool.query(
                `UPDATE vehicle SET status = $1, km_atual = GREATEST(km_atual, $2) WHERE id = $3 AND organization_id = $4`,
                [VeiculoStatus.ACTIVE, km_veiculo || 0, vehicle_id, orgId]
            );

            // Update linked transaction to PAID if it is PENDING
            await pool.query(
                `UPDATE transaction SET status = $1, payment_date = CURRENT_DATE 
                 WHERE maintenance_id = $2 AND organization_id = $3 AND (status = $4 OR status = 'PENDENTE')`,
                [StatusTransacao.PAID, id, orgId, StatusTransacao.PENDING]
            );
        } else if (status === StatusManutencao.CANCELLED || status === 'CANCELADA') {
            // Cancel linked transaction if exists
            await pool.query(
                `UPDATE transaction SET status = $1 WHERE maintenance_id = $2 AND organization_id = $3`,
                [StatusTransacao.CANCELLED, id, orgId]
            );
        } else {
            // For other statuses (like SCHEDULED), still update KM if it's higher
            await pool.query(
                `UPDATE vehicle SET km_atual = GREATEST(km_atual, $1) WHERE id = $2 AND organization_id = $3`,
                [km_veiculo || 0, vehicle_id, orgId]
            );
        }

        const updatedMaintenance = result.rows[0];

        // Audit Log
        AuditService.logEvent({
            userId: (req as any).session.user.id,
            organizationId: orgId as string,
            action: 'MAINTENANCE_UPDATE',
            entity: 'maintenance',
            entityId: updatedMaintenance.id,
            oldData: oldMaintenance,
            newData: updatedMaintenance,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        }).catch(console.error);

        res.json(updatedMaintenance);

    } catch (error) {
        console.error("Error updating maintenance:", error);
        res.status(500).json({ error: "Failed to update maintenance" });
    }
});

// DELETE maintenance
router.delete("/:id", authorize(['admin', 'operacional']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { id } = req.params;

        const check = await pool.query(
            "SELECT id FROM maintenance WHERE id = $1 AND organization_id = $2",
            [id, orgId]
        );

        if (check.rows.length === 0) {
            return res.status(404).json({ error: "Maintenance not found" });
        }

        await pool.query("DELETE FROM maintenance WHERE id = $1", [id]);
        // Audit Log
        AuditService.logEvent({
            userId: (req as any).session.user.id,
            organizationId: orgId as string,
            action: 'MAINTENANCE_DELETE',
            entity: 'maintenance',
            entityId: id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        }).catch(console.error);

        res.json({ success: true });

    } catch (error) {
        console.error("Error deleting maintenance:", error);
        res.status(500).json({ error: "Failed to delete maintenance" });
    }
});

export default router;
