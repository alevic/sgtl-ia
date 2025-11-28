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

// ===== FLEET MANAGEMENT ENDPOINTS =====

// GET all vehicles for organization
app.get("/api/fleet/vehicles", async (req, res) => {
    try {
        const session = await auth.api.getSession({ headers: req.headers as HeadersInit });
        if (!session || !session.session.activeOrganizationId) {
            return res.status(401).json({ error: "Unauthorized: No active organization" });
        }
        const orgId = session.session.activeOrganizationId;

        const result = await pool.query(
            `SELECT * FROM vehicle WHERE organization_id = $1 ORDER BY created_at DESC`,
            [orgId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching vehicles:", error);
        res.status(500).json({ error: "Failed to fetch vehicles" });
    }
});

// GET single vehicle by ID
app.get("/api/fleet/vehicles/:id", async (req, res) => {
    try {
        const session = await auth.api.getSession({ headers: req.headers as HeadersInit });
        if (!session || !session.session.activeOrganizationId) {
            return res.status(401).json({ error: "Unauthorized: No active organization" });
        }
        const orgId = session.session.activeOrganizationId;
        const { id } = req.params;

        const result = await pool.query(
            `SELECT * FROM vehicle WHERE id = $1 AND organization_id = $2`,
            [id, orgId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Vehicle not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching vehicle:", error);
        res.status(500).json({ error: "Failed to fetch vehicle" });
    }
});

// POST create new vehicle
app.post("/api/fleet/vehicles", async (req, res) => {
    try {
        const session = await auth.api.getSession({ headers: req.headers as HeadersInit });
        if (!session || !session.session.activeOrganizationId) {
            return res.status(401).json({ error: "Unauthorized: No active organization" });
        }
        const orgId = session.session.activeOrganizationId;
        const userId = session.user.id;

        const {
            placa, modelo, tipo, status, ano, km_atual, proxima_revisao_km,
            ultima_revisao, is_double_deck, capacidade_passageiros,
            capacidade_carga, observacoes, motorista_atual
        } = req.body;

        const result = await pool.query(
            `INSERT INTO vehicle (
                placa, modelo, tipo, status, ano, km_atual, proxima_revisao_km,
                ultima_revisao, is_double_deck, capacidade_passageiros,
                capacidade_carga, observacoes, motorista_atual,
                organization_id, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING *`,
            [
                placa, modelo, tipo, status, ano, km_atual || 0, proxima_revisao_km,
                ultima_revisao || null, is_double_deck || false, capacidade_passageiros || null,
                capacidade_carga || null, observacoes || null, motorista_atual || null,
                orgId, userId
            ]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error creating vehicle:", error);
        res.status(500).json({ error: "Failed to create vehicle" });
    }
});

// PUT update vehicle
app.put("/api/fleet/vehicles/:id", async (req, res) => {
    try {
        const session = await auth.api.getSession({ headers: req.headers as HeadersInit });
        if (!session || !session.session.activeOrganizationId) {
            return res.status(401).json({ error: "Unauthorized: No active organization" });
        }
        const orgId = session.session.activeOrganizationId;
        const { id } = req.params;

        const check = await pool.query(
            "SELECT id FROM vehicle WHERE id = $1 AND organization_id = $2",
            [id, orgId]
        );

        if (check.rows.length === 0) {
            return res.status(404).json({ error: "Vehicle not found" });
        }

        const {
            placa, modelo, tipo, status, ano, km_atual, proxima_revisao_km,
            ultima_revisao, is_double_deck, capacidade_passageiros,
            capacidade_carga, observacoes, motorista_atual
        } = req.body;

        const result = await pool.query(
            `UPDATE vehicle SET
                placa = $1, modelo = $2, tipo = $3, status = $4, ano = $5,
                km_atual = $6, proxima_revisao_km = $7, ultima_revisao = $8,
                is_double_deck = $9, capacidade_passageiros = $10,
                capacidade_carga = $11, observacoes = $12, motorista_atual = $13,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $14 AND organization_id = $15
            RETURNING *`,
            [
                placa, modelo, tipo, status, ano, km_atual, proxima_revisao_km,
                ultima_revisao || null, is_double_deck || false, capacidade_passageiros || null,
                capacidade_carga || null, observacoes || null, motorista_atual || null,
                id, orgId
            ]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating vehicle:", error);
        res.status(500).json({ error: "Failed to update vehicle" });
    }
});

// DELETE vehicle
app.delete("/api/fleet/vehicles/:id", async (req, res) => {
    try {
        const session = await auth.api.getSession({ headers: req.headers as HeadersInit });
        if (!session || !session.session.activeOrganizationId) {
            return res.status(401).json({ error: "Unauthorized: No active organization" });
        }
        const orgId = session.session.activeOrganizationId;
        const { id } = req.params;

        const check = await pool.query(
            "SELECT id FROM vehicle WHERE id = $1 AND organization_id = $2",
            [id, orgId]
        );

        if (check.rows.length === 0) {
            return res.status(404).json({ error: "Vehicle not found" });
        }

        await pool.query("DELETE FROM vehicle WHERE id = $1 AND organization_id = $2", [id, orgId]);

        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting vehicle:", error);
        res.status(500).json({ error: "Failed to delete vehicle" });
    }
});

// GET seats for a vehicle
app.get("/api/fleet/vehicles/:id/seats", async (req, res) => {
    try {
        const session = await auth.api.getSession({ headers: req.headers as HeadersInit });
        if (!session || !session.session.activeOrganizationId) {
            return res.status(401).json({ error: "Unauthorized: No active organization" });
        }
        const orgId = session.session.activeOrganizationId;
        const { id } = req.params;

        const vehicleCheck = await pool.query(
            "SELECT id FROM vehicle WHERE id = $1 AND organization_id = $2",
            [id, orgId]
        );

        if (vehicleCheck.rows.length === 0) {
            return res.status(404).json({ error: "Vehicle not found" });
        }

        const result = await pool.query(
            `SELECT * FROM seat WHERE vehicle_id = $1 ORDER BY andar, posicao_y, posicao_x`,
            [id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching seats:", error);
        res.status(500).json({ error: "Failed to fetch seats" });
    }
});

// POST save/update seat map configuration
app.post("/api/fleet/vehicles/:id/seats", async (req, res) => {
    try {
        const session = await auth.api.getSession({ headers: req.headers as HeadersInit });
        if (!session || !session.session.activeOrganizationId) {
            return res.status(401).json({ error: "Unauthorized: No active organization" });
        }
        const orgId = session.session.activeOrganizationId;
        const { id } = req.params;
        const { seats } = req.body;

        const vehicleCheck = await pool.query(
            "SELECT id FROM vehicle WHERE id = $1 AND organization_id = $2",
            [id, orgId]
        );

        if (vehicleCheck.rows.length === 0) {
            return res.status(404).json({ error: "Vehicle not found" });
        }

        await pool.query("BEGIN");

        try {
            await pool.query("DELETE FROM seat WHERE vehicle_id = $1", [id]);

            for (const seat of seats) {
                await pool.query(
                    `INSERT INTO seat (
                        vehicle_id, numero, andar, posicao_x, posicao_y, tipo, status, preco, disabled
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                    [
                        id, seat.numero, seat.andar, seat.posicao_x, seat.posicao_y,
                        seat.tipo, seat.status || 'LIVRE', seat.preco || null, seat.disabled || false
                    ]
                );
            }

            await pool.query(
                "UPDATE vehicle SET mapa_configurado = true WHERE id = $1",
                [id]
            );

            await pool.query("COMMIT");

            const result = await pool.query(
                "SELECT * FROM seat WHERE vehicle_id = $1 ORDER BY andar, posicao_y, posicao_x",
                [id]
            );

            res.json(result.rows);
        } catch (error) {
            await pool.query("ROLLBACK");
            throw error;
        }
    } catch (error) {
        console.error("Error saving seat map:", error);
        res.status(500).json({ error: "Failed to save seat map" });
    }
});

// PUT update individual seat
app.put("/api/fleet/vehicles/:vehicleId/seats/:seatId", async (req, res) => {
    try {
        const session = await auth.api.getSession({ headers: req.headers as HeadersInit });
        if (!session || !session.session.activeOrganizationId) {
            return res.status(401).json({ error: "Unauthorized: No active organization" });
        }
        const orgId = session.session.activeOrganizationId;
        const { vehicleId, seatId } = req.params;
        const { tipo, status, preco } = req.body;

        const vehicleCheck = await pool.query(
            "SELECT id FROM vehicle WHERE id = $1 AND organization_id = $2",
            [vehicleId, orgId]
        );

        if (vehicleCheck.rows.length === 0) {
            return res.status(404).json({ error: "Vehicle not found" });
        }

        const result = await pool.query(
            `UPDATE seat SET
                tipo = COALESCE($1, tipo),
                status = COALESCE($2, status),
                preco = COALESCE($3, preco),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $4 AND vehicle_id = $5
            RETURNING *`,
            [tipo || null, status || null, preco || null, seatId, vehicleId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Seat not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating seat:", error);
        res.status(500).json({ error: "Failed to update seat" });
    }
});

// DELETE all seats for a vehicle
app.delete("/api/fleet/vehicles/:id/seats", async (req, res) => {
    try {
        const session = await auth.api.getSession({ headers: req.headers as HeadersInit });
        if (!session || !session.session.activeOrganizationId) {
            return res.status(401).json({ error: "Unauthorized: No active organization" });
        }
        const orgId = session.session.activeOrganizationId;
        const { id } = req.params;

        const vehicleCheck = await pool.query(
            "SELECT id FROM vehicle WHERE id = $1 AND organization_id = $2",
            [id, orgId]
        );

        if (vehicleCheck.rows.length === 0) {
            return res.status(404).json({ error: "Vehicle not found" });
        }

        await pool.query("DELETE FROM seat WHERE vehicle_id = $1", [id]);

        await pool.query(
            "UPDATE vehicle SET mapa_configurado = false WHERE id = $1",
            [id]
        );

        res.json({ success: true });
    } catch (error) {
        console.error("Error clearing seat map:", error);
        res.status(500).json({ error: "Failed to clear seat map" });
    }
});

// ===== DRIVER MANAGEMENT ENDPOINTS =====
// GET all drivers for organization
app.get("/api/fleet/drivers", async (req, res) => {
    try {
        const session = await auth.api.getSession({ headers: req.headers as HeadersInit });
        if (!session || !session.session.activeOrganizationId) {
            return res.status(401).json({ error: "Unauthorized: No active organization" });
        }
        const orgId = session.session.activeOrganizationId;

        const result = await pool.query(
            `SELECT * FROM driver WHERE organization_id = $1 ORDER BY created_at DESC`,
            [orgId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching drivers:", error);
        res.status(500).json({ error: "Failed to fetch drivers" });
    }
});

// GET single driver by ID
app.get("/api/fleet/drivers/:id", async (req, res) => {
    try {
        const session = await auth.api.getSession({ headers: req.headers as HeadersInit });
        if (!session || !session.session.activeOrganizationId) {
            return res.status(401).json({ error: "Unauthorized: No active organization" });
        }
        const orgId = session.session.activeOrganizationId;
        const { id } = req.params;

        const result = await pool.query(
            `SELECT * FROM driver WHERE id = $1 AND organization_id = $2`,
            [id, orgId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Driver not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching driver:", error);
        res.status(500).json({ error: "Failed to fetch driver" });
    }
});

// POST create new driver
app.post("/api/fleet/drivers", async (req, res) => {
    try {
        const session = await auth.api.getSession({ headers: req.headers as HeadersInit });
        if (!session || !session.session.activeOrganizationId) {
            return res.status(401).json({ error: "Unauthorized: No active organization" });
        }
        const orgId = session.session.activeOrganizationId;
        const userId = session.user.id;

        const {
            nome, cnh, categoria_cnh, validade_cnh, passaporte, validade_passaporte,
            telefone, email, endereco, cidade, estado, pais, status,
            data_contratacao, salario, anos_experiencia, viagens_internacionais,
            disponivel_internacional, observacoes
        } = req.body;

        const result = await pool.query(
            `INSERT INTO driver (
                nome, cnh, categoria_cnh, validade_cnh, passaporte, validade_passaporte,
                telefone, email, endereco, cidade, estado, pais, status,
                data_contratacao, salario, anos_experiencia, viagens_internacionais,
                disponivel_internacional, observacoes,
                organization_id, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
            RETURNING *`,
            [
                nome, cnh, categoria_cnh, validade_cnh, passaporte || null, validade_passaporte || null,
                telefone || null, email || null, endereco || null, cidade || null, estado || null, pais || null,
                status, data_contratacao, salario || null, anos_experiencia || null, viagens_internacionais || 0,
                disponivel_internacional || false, observacoes || null,
                orgId, userId
            ]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error creating driver:", error);
        res.status(500).json({ error: "Failed to create driver" });
    }
});

// PUT update driver
app.put("/api/fleet/drivers/:id", async (req, res) => {
    try {
        const session = await auth.api.getSession({ headers: req.headers as HeadersInit });
        if (!session || !session.session.activeOrganizationId) {
            return res.status(401).json({ error: "Unauthorized: No active organization" });
        }
        const orgId = session.session.activeOrganizationId;
        const { id } = req.params;

        const check = await pool.query(
            "SELECT id FROM driver WHERE id = $1 AND organization_id = $2",
            [id, orgId]
        );

        if (check.rows.length === 0) {
            return res.status(404).json({ error: "Driver not found" });
        }

        const {
            nome, cnh, categoria_cnh, validade_cnh, passaporte, validade_passaporte,
            telefone, email, endereco, cidade, estado, pais, status,
            data_contratacao, salario, anos_experiencia, viagens_internacionais,
            disponivel_internacional, observacoes
        } = req.body;

        const result = await pool.query(
            `UPDATE driver SET
                nome = $1, cnh = $2, categoria_cnh = $3, validade_cnh = $4,
                passaporte = $5, validade_passaporte = $6, telefone = $7, email = $8,
                endereco = $9, cidade = $10, estado = $11, pais = $12, status = $13,
                data_contratacao = $14, salario = $15, anos_experiencia = $16,
                viagens_internacionais = $17, disponivel_internacional = $18, observacoes = $19,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $20 AND organization_id = $21
            RETURNING *`,
            [
                nome, cnh, categoria_cnh, validade_cnh, passaporte || null, validade_passaporte || null,
                telefone || null, email || null, endereco || null, cidade || null, estado || null, pais || null,
                status, data_contratacao, salario || null, anos_experiencia || null, viagens_internacionais || 0,
                disponivel_internacional || false, observacoes || null,
                id, orgId
            ]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error updating driver:", error);
        res.status(500).json({ error: "Failed to update driver" });
    }
});

// DELETE driver
app.delete("/api/fleet/drivers/:id", async (req, res) => {
    try {
        const session = await auth.api.getSession({ headers: req.headers as HeadersInit });
        if (!session || !session.session.activeOrganizationId) {
            return res.status(401).json({ error: "Unauthorized: No active organization" });
        }
        const orgId = session.session.activeOrganizationId;
        const { id } = req.params;

        const check = await pool.query(
            "SELECT id FROM driver WHERE id = $1 AND organization_id = $2",
            [id, orgId]
        );

        if (check.rows.length === 0) {
            return res.status(404).json({ error: "Driver not found" });
        }

        await pool.query("DELETE FROM driver WHERE id = $1 AND organization_id = $2", [id, orgId]);

        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting driver:", error);
        res.status(500).json({ error: "Failed to delete driver" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
