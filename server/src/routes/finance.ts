import express from "express";
import { auth } from "../auth.js";
import { Moeda } from "../types.js";
import { db } from "../db/drizzle.js";
import { bankAccounts, costCenters, categories, transactions } from "../db/schema.js";
import { eq, and, asc, desc } from "drizzle-orm";
import { FinanceService } from "../services/financeService.js";

const router = express.Router();

// Helper for authorization
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

// --- BANK ACCOUNTS ---

// GET all bank accounts
router.get("/accounts", authorize(['admin', 'financeiro']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;

        const results = await db.select()
            .from(bankAccounts)
            .where(eq(bankAccounts.organization_id, orgId))
            .orderBy(asc(bankAccounts.name));

        res.json(results);
    } catch (error) {
        console.error("Error fetching bank accounts:", error);
        res.status(500).json({ error: "Failed to fetch bank accounts" });
    }
});

// POST create bank account
router.post("/accounts", authorize(['admin', 'financeiro']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { name, bank_name, account_number, initial_balance, currency } = req.body;

        const [newAccount] = await db.insert(bankAccounts)
            .values({
                name,
                bank_name: bank_name || null,
                account_number: account_number || null,
                initial_balance: (initial_balance || 0).toString(),
                current_balance: (initial_balance || 0).toString(),
                currency: currency || Moeda.BRL,
                organization_id: orgId
            })
            .returning();

        res.json(newAccount);
    } catch (error) {
        console.error("Error creating bank account:", error);
        res.status(500).json({ error: "Failed to create bank account" });
    }
});

// PUT update bank account
router.put("/accounts/:id", authorize(['admin', 'financeiro']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { id } = req.params;
        const { name, bank_name, account_number, initial_balance, active } = req.body;

        const [updatedAccount] = await db.update(bankAccounts)
            .set({
                name: name !== undefined ? name : undefined,
                bank_name: bank_name !== undefined ? bank_name : undefined,
                account_number: account_number !== undefined ? account_number : undefined,
                initial_balance: initial_balance !== undefined ? initial_balance.toString() : undefined,
                active: active !== undefined ? active : undefined,
                updated_at: new Date()
            })
            .where(and(
                eq(bankAccounts.id, id),
                eq(bankAccounts.organization_id, orgId)
            ))
            .returning();

        if (!updatedAccount) {
            return res.status(404).json({ error: "Bank account not found" });
        }

        res.json(updatedAccount);
    } catch (error) {
        console.error("Error updating bank account:", error);
        res.status(500).json({ error: "Failed to update bank account" });
    }
});

// --- COST CENTERS ---

// GET all cost centers
router.get("/cost-centers", authorize(['admin', 'financeiro']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;

        const results = await db.select()
            .from(costCenters)
            .where(eq(costCenters.organization_id, orgId))
            .orderBy(asc(costCenters.name));

        res.json(results);
    } catch (error) {
        console.error("Error fetching cost centers:", error);
        res.status(500).json({ error: "Failed to fetch cost centers" });
    }
});

// POST create cost center
router.post("/cost-centers", authorize(['admin', 'financeiro']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { name, description } = req.body;

        const [newCenter] = await db.insert(costCenters)
            .values({
                name,
                description: description || null,
                organization_id: orgId
            })
            .returning();

        res.json(newCenter);
    } catch (error) {
        console.error("Error creating cost center:", error);
        res.status(500).json({ error: "Failed to create cost center" });
    }
});// PUT update cost center
router.put("/cost-centers/:id", authorize(['admin', 'financeiro']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { id } = req.params;
        const { name, description, active } = req.body;

        const [updatedCenter] = await db.update(costCenters)
            .set({
                name,
                description: description || null,
                active: active !== undefined ? active : true,
                updated_at: new Date()
            })
            .where(and(
                eq(costCenters.id, id),
                eq(costCenters.organization_id, orgId)
            ))
            .returning();

        if (!updatedCenter) {
            return res.status(404).json({ error: "Cost center not found" });
        }

        res.json(updatedCenter);
    } catch (error) {
        console.error("Error updating cost center:", error);
        res.status(500).json({ error: "Failed to update cost center" });
    }
});

// DELETE cost center
router.delete("/cost-centers/:id", authorize(['admin', 'financeiro']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { id } = req.params;

        // Check for dependencies (transactions or categories)
        const categoriesCount = await db.select()
            .from(categories)
            .where(and(
                eq(categories.cost_center_id, id),
                eq(categories.organization_id, orgId)
            ));

        if (categoriesCount.length > 0) {
            return res.status(400).json({ error: "Cannot delete cost center with linked categories" });
        }

        const [deletedCenter] = await db.delete(costCenters)
            .where(and(
                eq(costCenters.id, id),
                eq(costCenters.organization_id, orgId)
            ))
            .returning();

        if (!deletedCenter) {
            return res.status(404).json({ error: "Cost center not found" });
        }

        res.json({ message: "Cost center deleted successfully" });
    } catch (error) {
        console.error("Error deleting cost center:", error);
        res.status(500).json({ error: "Failed to delete cost center" });
    }
});


// --- CATEGORIES ---

// GET all categories (optionally filtered by cost_center_id)
router.get("/categories", authorize(['admin', 'financeiro']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { cost_center_id } = req.query;

        let query = db.select()
            .from(categories)
            .where(eq(categories.organization_id, orgId))
            .orderBy(asc(categories.name));

        if (cost_center_id) {
            query = db.select()
                .from(categories)
                .where(and(
                    eq(categories.organization_id, orgId),
                    eq(categories.cost_center_id, cost_center_id as string)
                ))
                .orderBy(asc(categories.name)) as any;
        }

        const results = await query;
        res.json(results);
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ error: "Failed to fetch categories" });
    }
});

// POST create category
router.post("/categories", authorize(['admin', 'financeiro']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { name, type, cost_center_id } = req.body;

        const [newCategory] = await db.insert(categories)
            .values({
                name,
                type,
                cost_center_id,
                organization_id: orgId
            })
            .returning();

        res.json(newCategory);
    } catch (error) {
        console.error("Error creating category:", error);
        res.status(500).json({ error: "Failed to create category" });
    }
});

// PUT update category
router.put("/categories/:id", authorize(['admin', 'financeiro']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { id } = req.params;
        const { name, type, cost_center_id, active } = req.body;

        const [updatedCategory] = await db.update(categories)
            .set({
                name,
                type,
                cost_center_id,
                active,
                updated_at: new Date()
            })
            .where(and(
                eq(categories.id, id),
                eq(categories.organization_id, orgId)
            ))
            .returning();

        if (!updatedCategory) {
            return res.status(404).json({ error: "Category not found" });
        }

        res.json(updatedCategory);
    } catch (error) {
        console.error("Error updating category:", error);
        res.status(500).json({ error: "Failed to update category" });
    }
});

// DELETE category
router.delete("/categories/:id", authorize(['admin', 'financeiro']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { id } = req.params;

        const [deletedCategory] = await db.delete(categories)
            .where(and(
                eq(categories.id, id),
                eq(categories.organization_id, orgId)
            ))
            .returning();

        if (!deletedCategory) {
            return res.status(404).json({ error: "Category not found" });
        }

        res.json({ message: "Category deleted successfully" });
    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({ error: "Failed to delete category" });
    }
});

// --- TRANSACTIONS ---

// GET all transactions
router.get("/transactions", authorize(['admin', 'financeiro']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;

        const results = await db.select()
            .from(transactions)
            .where(eq(transactions.organization_id, orgId))
            .orderBy(desc(transactions.date), desc(transactions.created_at));

        res.json(results);
    } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ error: "Failed to fetch transactions" });
    }
});

// GET single transaction
router.get("/transactions/:id", authorize(['admin', 'financeiro']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { id } = req.params;

        const [transaction] = await db.select()
            .from(transactions)
            .where(and(
                eq(transactions.id, id),
                eq(transactions.organization_id, orgId)
            ))
            .limit(1);

        if (!transaction) {
            return res.status(404).json({ error: "Transaction not found" });
        }

        res.json(transaction);
    } catch (error) {
        console.error("Error fetching transaction:", error);
        res.status(500).json({ error: "Failed to fetch transaction" });
    }
});

// POST create transaction
router.post("/transactions", authorize(['admin', 'financeiro']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const userId = session.user.id;

        const {
            tipo, description, valor, amount, moeda, currency, date, data_emissao,
            due_date, data_vencimento, payment_date, data_pagamento, status, forma_pagamento, payment_method,
            category_id, cost_center_id, bank_account_id,
            classificacao_contabil, document_number, numero_documento, notes, observacoes,
            maintenance_id, reservation_id, reserva_id
        } = req.body;

        // Map legacy frontend fields to new schema if necessary
        const finalAmount = (valor || amount || 0).toString();
        const finalCurrency = moeda || currency || 'BRL';
        const finalDate = date ? new Date(date) : (data_emissao ? new Date(data_emissao) : new Date());
        const finalDueDate = due_date ? new Date(due_date) : (data_vencimento ? new Date(data_vencimento) : null);
        const finalPaymentDate = payment_date ? new Date(payment_date) : (data_pagamento ? new Date(data_pagamento) : null);
        const finalPaymentMethod = payment_method || forma_pagamento || null;
        const finalDocNum = document_number || numero_documento || null;
        const finalNotes = notes || observacoes || null;
        const finalMaintId = maintenance_id || null;
        const finalResId = reservation_id || reserva_id || null;

        const [newTransaction] = await db.insert(transactions)
            .values({
                type: tipo || 'EXPENSE',
                description: description || req.body.descricao || 'Nova Transação',
                amount: finalAmount,
                currency: finalCurrency,
                date: finalDate,
                due_date: finalDueDate,
                payment_date: finalPaymentDate,
                status: status || 'PENDING',
                payment_method: finalPaymentMethod,
                category_id: category_id || null,
                cost_center_id: cost_center_id || null,
                bank_account_id: bank_account_id || null,
                maintenance_id: finalMaintId,
                reservation_id: finalResId,
                classificacao_contabil: classificacao_contabil || null,
                document_number: finalDocNum,
                notes: finalNotes,
                organization_id: orgId,
                created_by: userId
            })
            .returning();

        // Update bank balance if necessary
        if (bank_account_id && status === 'PAID') {
            await FinanceService.updateBankAccountBalance(bank_account_id, orgId);
        }

        res.status(201).json(newTransaction);
    } catch (error) {
        console.error("Error creating transaction:", error);
        res.status(500).json({ error: "Failed to create transaction" });
    }
});

// PUT update transaction
router.put("/transactions/:id", authorize(['admin', 'financeiro']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { id } = req.params;

        const {
            tipo, description, valor, amount, moeda, currency, date, data_emissao,
            due_date, data_vencimento, payment_date, data_pagamento, status, forma_pagamento, payment_method,
            category_id, cost_center_id, bank_account_id,
            classificacao_contabil, document_number, numero_documento, notes, observacoes,
            maintenance_id, reservation_id, reserva_id
        } = req.body;

        // Map legacy fields
        const finalAmount = valor || amount;
        const finalCurrency = moeda || currency;
        const finalDate = date || data_emissao;
        const finalDueDate = due_date || data_vencimento;
        const finalPaymentDate = payment_date || data_pagamento;
        const finalPaymentMethod = payment_method || forma_pagamento;
        const finalDocNum = document_number || numero_documento;
        const finalNotes = notes || observacoes;

        const [updatedTransaction] = await db.update(transactions)
            .set({
                type: tipo,
                description: description || req.body.descricao,
                amount: finalAmount ? finalAmount.toString() : undefined,
                currency: finalCurrency,
                date: finalDate ? new Date(finalDate) : undefined,
                due_date: finalDueDate ? new Date(finalDueDate) : undefined,
                payment_date: finalPaymentDate ? new Date(finalPaymentDate) : undefined,
                status,
                payment_method: finalPaymentMethod,
                category_id,
                cost_center_id,
                bank_account_id,
                maintenance_id,
                reservation_id: reservation_id || reserva_id,
                classificacao_contabil,
                document_number: finalDocNum,
                notes: finalNotes,
                updated_at: new Date()
            })
            .where(and(
                eq(transactions.id, id),
                eq(transactions.organization_id, orgId)
            ))
            .returning();

        if (!updatedTransaction) {
            return res.status(404).json({ error: "Transaction not found" });
        }

        // Update bank balance if necessary
        if (bank_account_id && status === 'PAID') {
            await FinanceService.updateBankAccountBalance(bank_account_id, orgId);
        }

        res.json(updatedTransaction);
    } catch (error) {
        console.error("Error updating transaction:", error);
        res.status(500).json({ error: "Failed to update transaction" });
    }
});

// DELETE transaction
router.delete("/transactions/:id", authorize(['admin', 'financeiro']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { id } = req.params;

        const [deletedTransaction] = await db.delete(transactions)
            .where(and(
                eq(transactions.id, id),
                eq(transactions.organization_id, orgId)
            ))
            .returning();

        if (!deletedTransaction) {
            return res.status(404).json({ error: "Transaction not found" });
        }

        // Update bank balance if it was linked to an account
        if (deletedTransaction.bank_account_id && deletedTransaction.status === 'PAID') {
            await FinanceService.updateBankAccountBalance(deletedTransaction.bank_account_id, orgId);
        }

        res.json({ message: "Transaction deleted successfully" });
    } catch (error) {
        console.error("Error deleting transaction:", error);
        res.status(500).json({ error: "Failed to delete transaction" });
    }
});

export default router;
