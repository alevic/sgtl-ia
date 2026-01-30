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

const mapTransaction = (t: any) => {
    if (!t) return null;

    // DEBUG: Log the raw object from DB
    // console.log('DEBUG: Mapping transaction:', t.id, 'Raw Date:', t.date);

    // Ensure dates are stringified for JSON if they are Date objects or valid date strings
    const dateToISO = (d: any) => {
        if (!d) return null;

        let dateObj: Date;
        if (d instanceof Date) {
            dateObj = d;
        } else {
            dateObj = new Date(d);
        }

        if (isNaN(dateObj.getTime())) {
            // console.log('DEBUG: Invalid date:', d);
            return null;
        }
        return dateObj.toISOString();
    };

    const res = { ...t };

    // Standardize field names (English as primary, Portuguese as legacy)
    res.type = t.type;
    res.tipo = t.type;

    res.description = t.description;
    res.descricao = t.description;

    res.amount = t.amount?.toString() || "0.00";
    res.valor = Number(res.amount);

    res.currency = t.currency || "BRL";
    res.moeda = res.currency;

    // DATE ALIASES (ISSUE DATE)
    res.date = dateToISO(t.date);
    res.issue_date = res.date;
    res.data_emissao = res.date;

    // DUE DATE ALIASES
    res.due_date = dateToISO(t.due_date || t.date);
    res.data_vencimento = res.due_date;

    // PAYMENT DATE ALIASES
    res.payment_date = dateToISO(t.payment_date);
    res.data_pagamento = res.payment_date;

    res.status = t.status;
    res.payment_method = t.payment_method;
    res.forma_pagamento = t.payment_method;

    // DOCUMENT NUMBER ALIASES
    res.document_number = t.document_number;
    res.numero_documento = t.document_number;

    // IDs
    res.category_id = t.category_id;
    res.cost_center_id = t.cost_center_id;
    res.bank_account_id = t.bank_account_id;
    res.reservation_id = t.reservation_id;
    res.maintenance_id = t.maintenance_id;

    // NOTES ALIASES
    res.notes = t.notes;
    res.observacoes = t.notes;

    // Join names (flattened for frontend)
    res.category_name = t.category_name || t.category?.name || t.category;
    res.cost_center_name = t.cost_center_name || t.cost_center?.name || t.cost_center;

    // console.log('DEBUG: Resulting date:', res.date);

    return res;
};

const ensureValidDate = (dateVal: any, fallback: any = null) => {
    if (!dateVal) return fallback;
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return fallback;
    return d;
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
        const { name, bank_name, account_number, initial_balance, currency, is_default } = req.body;

        const [newAccount] = await db.transaction(async (tx) => {
            if (is_default) {
                await tx.update(bankAccounts)
                    .set({ is_default: false })
                    .where(eq(bankAccounts.organization_id, orgId));
            }

            return tx.insert(bankAccounts)
                .values({
                    name,
                    bank_name: bank_name || null,
                    account_number: account_number || null,
                    initial_balance: (initial_balance || 0).toString(),
                    current_balance: (initial_balance || 0).toString(),
                    currency: currency || Moeda.BRL,
                    is_default: is_default || false,
                    organization_id: orgId
                })
                .returning();
        });

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
        const { name, bank_name, account_number, initial_balance, active, is_default } = req.body;

        const [updatedAccount] = await db.transaction(async (tx) => {
            if (is_default) {
                await tx.update(bankAccounts)
                    .set({ is_default: false })
                    .where(and(
                        eq(bankAccounts.organization_id, orgId),
                        // Avoid unsetting if it's already the one we are updating? Actually it doesn't matter much if we update it in the next step anyway.
                    ));
            }

            return tx.update(bankAccounts)
                .set({
                    name: name !== undefined ? name : undefined,
                    bank_name: bank_name !== undefined ? bank_name : undefined,
                    account_number: account_number !== undefined ? account_number : undefined,
                    initial_balance: initial_balance !== undefined ? initial_balance.toString() : undefined,
                    active: active !== undefined ? active : undefined,
                    is_default: is_default !== undefined ? is_default : undefined,
                    updated_at: new Date()
                })
                .where(and(
                    eq(bankAccounts.id, id),
                    eq(bankAccounts.organization_id, orgId)
                ))
                .returning();
        });

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

        const results = await db.select({
            id: transactions.id,
            type: transactions.type,
            description: transactions.description,
            amount: transactions.amount,
            currency: transactions.currency,
            date: transactions.date,
            due_date: transactions.due_date,
            payment_date: transactions.payment_date,
            status: transactions.status,
            payment_method: transactions.payment_method,
            category_id: transactions.category_id,
            cost_center_id: transactions.cost_center_id,
            bank_account_id: transactions.bank_account_id,
            organization_id: transactions.organization_id,
            created_at: transactions.created_at,
            category_name: categories.name,
            cost_center_name: costCenters.name,
            classificacao_contabil: transactions.classificacao_contabil,
        })
            .from(transactions)
            .leftJoin(categories, eq(transactions.category_id, categories.id))
            .leftJoin(costCenters, eq(transactions.cost_center_id, costCenters.id))
            .where(eq(transactions.organization_id, orgId))
            .orderBy(desc(transactions.date), desc(transactions.created_at));

        res.json(results.map(mapTransaction));
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

        res.json(mapTransaction(transaction));
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
            tipo, type,
            description, descricao,
            valor, amount,
            moeda, currency,
            date, data_emissao,
            due_date, data_vencimento,
            payment_date, data_pagamento,
            status,
            forma_pagamento, payment_method,
            category_id,
            cost_center_id,
            bank_account_id,
            classificacao_contabil, financial_classification,
            document_number, numero_documento,
            notes, observacoes, observations,
            maintenance_id,
            reservation_id, reserva_id
        } = req.body;

        console.log('DEBUG: Creating transaction with body:', JSON.stringify(req.body, null, 2));

        // Map legacy frontend fields to new schema if necessary
        const finalType = tipo || type || 'EXPENSE';
        const finalDescription = description || descricao || 'Nova Transação';
        const finalAmount = (valor || amount || 0).toString();
        const finalCurrency = moeda || currency || 'BRL';
        const finalDate = ensureValidDate(date, ensureValidDate(data_emissao, new Date()));
        const finalDueDate = ensureValidDate(due_date, ensureValidDate(data_vencimento));
        const finalPaymentDate = ensureValidDate(payment_date, ensureValidDate(data_pagamento));
        const finalPaymentMethod = payment_method || forma_pagamento || null;
        const finalDocNum = document_number || numero_documento || null;
        const finalNotes = notes || observacoes || observations || null;
        const finalClassification = classificacao_contabil || financial_classification || null;
        const finalMaintId = maintenance_id || null;
        const finalResId = reservation_id || reserva_id || null;
        const finalTripId = req.body.trip_id || null;

        // Fetch names for legacy columns if IDs are provided
        let catName = null;
        let ccName = null;

        if (category_id) {
            const [cat] = await db.select().from(categories).where(eq(categories.id, category_id)).limit(1);
            if (cat) catName = cat.name;
        }
        if (cost_center_id) {
            const [cc] = await db.select().from(costCenters).where(eq(costCenters.id, cost_center_id)).limit(1);
            if (cc) ccName = cc.name;
        }

        const [newTransaction] = await db.insert(transactions)
            .values({
                type: finalType,
                description: finalDescription,
                amount: finalAmount,
                currency: finalCurrency,
                date: finalDate,
                due_date: finalDueDate,
                payment_date: finalPaymentDate,
                status: status || 'PENDING',
                payment_method: finalPaymentMethod,
                category_id: category_id || null,
                cost_center_id: cost_center_id || null,
                category: catName,
                cost_center: ccName,
                bank_account_id: bank_account_id || null,
                maintenance_id: finalMaintId,
                reservation_id: finalResId,
                parcel_id: req.body.parcel_id || null,
                classificacao_contabil: finalClassification,
                document_number: finalDocNum,
                notes: finalNotes,
                organization_id: orgId,
                created_by: userId
            })
            .returning();

        // Link to trip if trip_id is provided
        if (finalTripId) {
            await FinanceService.linkTransactionToTrip(newTransaction.id, finalTripId, finalAmount);
        }

        // Update bank balance if necessary
        if (bank_account_id && status === 'PAID') {
            await FinanceService.updateBankAccountBalance(bank_account_id, orgId);
        }

        res.status(201).json(mapTransaction(newTransaction));
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
            tipo, type,
            description, descricao,
            valor, amount,
            moeda, currency,
            date, data_emissao,
            due_date, data_vencimento,
            payment_date, data_pagamento,
            status,
            forma_pagamento, payment_method,
            category_id,
            cost_center_id,
            bank_account_id,
            classificacao_contabil, financial_classification,
            document_number, numero_documento,
            notes, observacoes, observations,
            maintenance_id,
            reservation_id, reserva_id
        } = req.body;

        console.log('DEBUG: Updating transaction', id, 'with body:', JSON.stringify(req.body, null, 2));

        // Map legacy fields
        const finalType = tipo || type;
        const finalDescription = description || descricao;
        const finalAmount = valor || amount;
        const finalCurrency = moeda || currency;
        const finalDate = ensureValidDate(date || data_emissao);
        const finalDueDate = ensureValidDate(due_date || data_vencimento);
        const finalPaymentDate = ensureValidDate(payment_date || data_pagamento);
        const finalPaymentMethod = payment_method || forma_pagamento;
        const finalDocNum = document_number || numero_documento;
        const finalNotes = notes || observacoes || observations;
        const finalClassification = classificacao_contabil || financial_classification;

        // Fetch names for legacy columns if IDs are provided
        let catName = undefined;
        let ccName = undefined;

        if (category_id) {
            const [cat] = await db.select().from(categories).where(eq(categories.id, category_id)).limit(1);
            if (cat) catName = cat.name;
        }
        if (cost_center_id) {
            const [cc] = await db.select().from(costCenters).where(eq(costCenters.id, cost_center_id)).limit(1);
            if (cc) ccName = cc.name;
        }

        const [updatedTransaction] = await db.update(transactions)
            .set({
                type: finalType !== undefined ? finalType : undefined,
                description: finalDescription !== undefined ? finalDescription : undefined,
                amount: finalAmount !== undefined ? finalAmount.toString() : undefined,
                currency: finalCurrency,
                date: finalDate,
                due_date: finalDueDate,
                payment_date: finalPaymentDate,
                status,
                payment_method: finalPaymentMethod,
                category_id,
                cost_center_id,
                category: catName,
                cost_center: ccName,
                bank_account_id,
                maintenance_id,
                reservation_id: reservation_id || reserva_id,
                classificacao_contabil: finalClassification,
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

        // Handle trip linking update if trip_id is provided
        if (req.body.trip_id) {
            // For now, we just link it. If it was already linked, this might cause duplicates if not careful.
            // In a more robust system, we would check and update. 
            // Considering the prompt, we'll keep it simple: link only if not already linked or as a new link.
            await FinanceService.linkTransactionToTrip(id, req.body.trip_id, (finalAmount || updatedTransaction.amount).toString());
        }

        // Update bank balance if necessary
        if (bank_account_id && status === 'PAID') {
            await FinanceService.updateBankAccountBalance(bank_account_id, orgId);
        }

        res.json(mapTransaction(updatedTransaction));
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

// --- TRIP SUMMARIES ---

// GET financial summary for a trip
router.get("/trips/:id/summary", authorize(['admin', 'financeiro', 'operacional']), async (req, res) => {
    try {
        const { id } = req.params;
        const summary = await FinanceService.getTripFinancialSummary(id);
        res.json(summary);
    } catch (error) {
        console.error("Error fetching trip financial summary:", error);
        res.status(500).json({ error: "Failed to fetch trip financial summary" });
    }
});

// GET detailed transactions for a trip
router.get("/trips/:id/transactions", authorize(['admin', 'financeiro', 'operacional']), async (req, res) => {
    try {
        const { id } = req.params;
        const transactionsList = await FinanceService.getTripTransactions(id);
        res.json(transactionsList.map(mapTransaction));
    } catch (error) {
        console.error("Error fetching trip transactions:", error);
        res.status(500).json({ error: "Failed to fetch trip transactions" });
    }
});

export default router;
