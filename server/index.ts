import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth, pool } from "./auth";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:8080"],
    credentials: true,
}));

app.use(express.json());

app.all("/api/auth/*", toNodeHandler(auth));

app.get("/api/users", async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, email, role, "createdAt" FROM "user"');
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

app.delete("/api/users/:id", async (req, res) => {
    const { id } = req.params;
    try {
        // Optional: Check if the requester is an admin (requires parsing session cookie)
        // For now, we'll assume the frontend protection is enough for this MVP step
        // but in production you MUST verify the session here.

        await pool.query('DELETE FROM "user" WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ error: "Failed to delete user" });
    }
});

app.put("/api/users/:id", async (req, res) => {
    const { id } = req.params;
    const { name, role } = req.body;
    try {
        await pool.query('UPDATE "user" SET name = $1, role = $2 WHERE id = $3', [name, role, id]);
        res.json({ success: true });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ error: "Failed to update user" });
    }
});

// Finance Endpoints
// Finance Endpoints
app.get("/api/finance/transactions", async (req, res) => {
    try {
        const session = await auth.api.getSession({ headers: req.headers as HeadersInit });
        if (!session || !session.session.activeOrganizationId) {
            return res.status(401).json({ error: "Unauthorized: No active organization" });
        }
        const orgId = session.session.activeOrganizationId;

        const result = await pool.query(
            `SELECT 
                id,
                type as tipo,
                description as descricao,
                amount as valor,
                currency as moeda,
                date as data_emissao,
                due_date as data_vencimento,
                payment_date as data_pagamento,
                status,
                payment_method as forma_pagamento,
                category as categoria_despesa, -- We map category to both for simplicity, frontend handles type check
                category as categoria_receita,
                cost_center as centro_custo,
                accounting_classification as classificacao_contabil,
                document_number as numero_documento,
                notes as observacoes,
                created_by as criado_por,
                created_at as criado_em
            FROM transaction 
            WHERE organization_id = $1 
            ORDER BY date DESC, created_at DESC`,
            [orgId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ error: "Failed to fetch transactions" });
    }
});

app.post("/api/finance/transactions", async (req, res) => {
    try {
        console.log("POST /api/finance/transactions called");
        console.log("Request body:", req.body);

        const session = await auth.api.getSession({ headers: req.headers as HeadersInit });
        console.log("Session found:", !!session);

        if (!session || !session.session.activeOrganizationId) {
            console.error("Unauthorized: No active organization");
            return res.status(401).json({ error: "Unauthorized: No active organization" });
        }
        const orgId = session.session.activeOrganizationId;
        const userId = session.user.id;
        console.log("OrgID:", orgId, "UserID:", userId);

        const {
            tipo, descricao, valor, moeda, data_emissao,
            data_vencimento, data_pagamento, status, forma_pagamento,
            categoria_receita, categoria_despesa, centro_custo,
            classificacao_contabil, numero_documento, observacoes
        } = req.body;

        // Determine category based on type
        const category = tipo === 'RECEITA' ? categoria_receita : categoria_despesa;

        await pool.query(
            `INSERT INTO transaction (
                type, description, amount, currency, date,
                due_date, payment_date, status, payment_method, category,
                cost_center, accounting_classification, document_number, notes,
                organization_id, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
            [
                tipo, descricao, valor, moeda || 'BRL', data_emissao,
                data_vencimento, data_pagamento || null, status, forma_pagamento || null, (category || null),
                centro_custo || null, classificacao_contabil || null, numero_documento || null, observacoes || null,
                orgId, userId
            ]
        );

        console.log("Transaction inserted successfully");
        res.json({ success: true });
    } catch (error) {
        console.error("Error creating transaction:", error);
        res.status(500).json({ error: "Failed to create transaction" });
    }
});

app.delete("/api/finance/transactions/:id", async (req, res) => {
    try {
        const session = await auth.api.getSession({ headers: req.headers as HeadersInit });
        if (!session || !session.session.activeOrganizationId) {
            return res.status(401).json({ error: "Unauthorized: No active organization" });
        }
        const orgId = session.session.activeOrganizationId;
        const { id } = req.params;

        // Verify transaction belongs to organization
        const check = await pool.query(
            "SELECT id FROM transaction WHERE id = $1 AND organization_id = $2",
            [id, orgId]
        );

        if (check.rows.length === 0) {
            return res.status(404).json({ error: "Transaction not found" });
        }

        await pool.query("DELETE FROM transaction WHERE id = $1", [id]);
        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting transaction:", error);
        res.status(500).json({ error: "Failed to delete transaction" });
    }
});

app.put("/api/finance/transactions/:id", async (req, res) => {
    try {
        const session = await auth.api.getSession({ headers: req.headers as HeadersInit });
        if (!session || !session.session.activeOrganizationId) {
            return res.status(401).json({ error: "Unauthorized: No active organization" });
        }
        const orgId = session.session.activeOrganizationId;
        const { id } = req.params;
        const {
            tipo, descricao, valor, moeda, data_emissao,
            data_vencimento, data_pagamento, status, forma_pagamento,
            categoria_receita, categoria_despesa, centro_custo,
            classificacao_contabil, numero_documento, observacoes
        } = req.body;

        console.log("PUT /api/finance/transactions/:id called");
        console.log("ID:", id);
        console.log("Body:", req.body);

        // Verify transaction belongs to organization
        const check = await pool.query(
            "SELECT id FROM transaction WHERE id = $1 AND organization_id = $2",
            [id, orgId]
        );

        if (check.rows.length === 0) {
            return res.status(404).json({ error: "Transaction not found" });
        }

        const category = tipo === 'RECEITA' ? categoria_receita : categoria_despesa;

        await pool.query(
            `UPDATE transaction SET
                type = $1, description = $2, amount = $3, currency = $4, date = $5,
                due_date = $6, payment_date = $7, status = $8, payment_method = $9, category = $10,
                cost_center = $11, accounting_classification = $12, document_number = $13, notes = $14
            WHERE id = $15 AND organization_id = $16`,
            [
                tipo, descricao, valor, moeda || 'BRL', data_emissao,
                data_vencimento, data_pagamento || null, status, forma_pagamento || null, (category || null),
                centro_custo || null, classificacao_contabil || null, numero_documento || null, observacoes || null,
                id, orgId
            ]
        );

        res.json({ success: true });
    } catch (error) {
        console.error("Error updating transaction:", error);
        res.status(500).json({ error: "Failed to update transaction" });
    }
});

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
