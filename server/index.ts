import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth, pool } from "./auth";
import { authorize } from "./middleware";
import dotenv from "dotenv";
import crypto from "crypto";
import clientsRouter from "./routes/clients";
import maintenanceRouter from "./routes/maintenance";
import tripsRouter from "./routes/trips";
import { routesRouter } from "./routes/routes";
import reservationsRouter from "./routes/reservations";
import parcelsRouter from "./routes/parcels";
import chartersRouter from "./routes/charters";
import publicRouter from "./routes/public";

import { setupDb } from "./setup-db";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Run DB setup/migrations on startup
setupDb().catch(console.error);

app.use(cors({
    origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",") : ["http://localhost:3000", "http://localhost:8080"],
    credentials: true,
}));

app.use(express.json({ limit: '50mb' }));

app.all("/api/auth/*", toNodeHandler(auth));

app.get("/api/users", authorize(['admin']), async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, email, role, "createdAt" FROM "user"');
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

app.get("/api/users/:id", authorize(['admin']), async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT id, name, email, role, "createdAt" FROM "user" WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ error: "Failed to fetch user" });
    }
});

app.delete("/api/users/:id", authorize(['admin']), async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM "user" WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ error: "Failed to delete user" });
    }
});

app.put("/api/users/:id", authorize(['admin']), async (req, res) => {
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

// Clients Routes
app.use("/api/clients", clientsRouter);

// Maintenance Routes
app.use("/api/maintenance", maintenanceRouter);

// Trips & Routes
import { locationsRouter } from "./routes/locations";

app.use("/api", tripsRouter);
app.use("/api/routes", routesRouter);
app.use("/api/locations", locationsRouter);

// Reservations
app.use("/api/reservations", reservationsRouter);

// Parcels
app.use("/api/parcels", parcelsRouter);

// Charters
app.use("/api/charters", chartersRouter);

// Public Routes (Portal)
app.use("/api/public", publicRouter);

// Webhook Routes
import webhooksRouter from "./routes/webhooks";
app.use("/api/webhooks", webhooksRouter);

// Finance Endpoints
app.get("/api/finance/transactions", authorize(['admin', 'financeiro']), async (req, res) => {
    try {
        const session = (req as any).session;
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

app.post("/api/finance/transactions", authorize(['admin', 'financeiro']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const userId = session.user.id;

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
                organization_id, created_by, maintenance_id, reservation_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
            [
                tipo, descricao, valor, moeda || 'BRL', data_emissao,
                data_vencimento, data_pagamento || null, status, forma_pagamento || null, (category || null),
                centro_custo || null, classificacao_contabil || null, numero_documento || null, observacoes || null,
                orgId, userId, req.body.maintenance_id || null, req.body.reserva_id || null
            ]
        );

        res.json({ success: true });
    } catch (error) {
        console.error("Error creating transaction:", error);
        res.status(500).json({ error: "Failed to create transaction" });
    }
});

app.delete("/api/finance/transactions/:id", authorize(['admin', 'financeiro']), async (req, res) => {
    try {
        const session = (req as any).session;
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

app.put("/api/finance/transactions/:id", authorize(['admin', 'financeiro']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { id } = req.params;
        const {
            tipo, descricao, valor, moeda, data_emissao,
            data_vencimento, data_pagamento, status, forma_pagamento,
            categoria_receita, categoria_despesa, centro_custo,
            classificacao_contabil, numero_documento, observacoes
        } = req.body;

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
app.get("/api/fleet/vehicles", authorize(['admin', 'operacional']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { q } = req.query;

        let query = `SELECT * FROM vehicle WHERE organization_id = $1`;
        const params: any[] = [orgId];

        if (q && typeof q === 'string') {
            query += ` AND (placa ILIKE $2 OR modelo ILIKE $2)`;
            params.push(`%${q}%`);
        }

        query += ` ORDER BY created_at DESC`;

        const result = await pool.query(query, params);

        // Fetch seats for each vehicle
        const vehiclesWithSeats = await Promise.all(
            result.rows.map(async (vehicle) => {
                const seatsResult = await pool.query(
                    `SELECT * FROM seat WHERE vehicle_id = $1 ORDER BY numero ASC`,
                    [vehicle.id]
                );
                return {
                    ...vehicle,
                    mapa_assentos: seatsResult.rows
                };
            })
        );

        res.json(vehiclesWithSeats);
    } catch (error) {
        console.error("Error fetching vehicles:", error);
        res.status(500).json({ error: "Failed to fetch vehicles" });
    }
});

// GET single vehicle by ID
app.get("/api/fleet/vehicles/:id", authorize(['admin', 'operacional']), async (req, res) => {
    try {
        const session = (req as any).session;
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
app.post("/api/fleet/vehicles", authorize(['admin', 'operacional']), async (req, res) => {
    try {
        const session = (req as any).session;
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
app.put("/api/fleet/vehicles/:id", authorize(['admin', 'operacional']), async (req, res) => {
    try {
        const session = (req as any).session;
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
app.delete("/api/fleet/vehicles/:id", authorize(['admin', 'operacional']), async (req, res) => {
    try {
        const session = (req as any).session;
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
app.get("/api/fleet/vehicles/:id/seats", authorize(['admin', 'operacional']), async (req, res) => {
    try {
        const session = (req as any).session;
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
app.post("/api/fleet/vehicles/:id/seats", authorize(['admin', 'operacional']), async (req, res) => {
    let client;
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { id } = req.params;
        const { seats } = req.body;

        client = await pool.connect();

        const vehicleCheck = await client.query(
            "SELECT id FROM vehicle WHERE id = $1 AND organization_id = $2",
            [id, orgId]
        );

        if (vehicleCheck.rows.length === 0) {
            return res.status(404).json({ error: "Vehicle not found" });
        }

        await client.query("BEGIN");

        try {
            // 1. Get existing seats
            const existingSeatsResult = await client.query(
                "SELECT * FROM seat WHERE vehicle_id = $1",
                [id]
            );
            const existingSeatsMap = new Map(); // Map<numero, seat>
            existingSeatsResult.rows.forEach(seat => {
                existingSeatsMap.set(seat.numero, seat);
            });

            // 2. Process new seats (Upsert)
            const processedNumeros = new Set();

            for (const seat of seats) {
                processedNumeros.add(seat.numero);
                const existingSeat = existingSeatsMap.get(seat.numero);

                if (existingSeat) {
                    // Update existing
                    await client.query(
                        `UPDATE seat SET
                            andar = $1, posicao_x = $2, posicao_y = $3, 
                            tipo = $4, status = $5, preco = $6, disabled = $7,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = $8`,
                        [
                            seat.andar, seat.posicao_x, seat.posicao_y,
                            seat.tipo, seat.status || 'LIVRE', seat.preco || null, seat.disabled || false,
                            existingSeat.id
                        ]
                    );
                } else {
                    // Insert new
                    await client.query(
                        `INSERT INTO seat (
                            vehicle_id, numero, andar, posicao_x, posicao_y, tipo, status, preco, disabled
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                        [
                            id, seat.numero, seat.andar, seat.posicao_x, seat.posicao_y,
                            seat.tipo, seat.status || 'LIVRE', seat.preco || null, seat.disabled || false
                        ]
                    );
                }
            }

            // 3. Delete or Disable removed seats
            const warnings: string[] = [];
            for (const [numero, existingSeat] of existingSeatsMap.entries()) {
                if (!processedNumeros.has(numero)) {
                    try {
                        // Create a savepoint before attempting delete
                        await client.query("SAVEPOINT seat_delete");
                        await client.query("DELETE FROM seat WHERE id = $1", [existingSeat.id]);
                        await client.query("RELEASE SAVEPOINT seat_delete");
                    } catch (deleteError: any) {
                        // Rollback to savepoint if delete fails
                        await client.query("ROLLBACK TO SAVEPOINT seat_delete");

                        // specialized error handling for foreign key violation
                        if (deleteError.code === '23503') {
                            const msg = `O assento ${numero} não pode ser excluído pois possui reservas vinculadas. Ele foi mantido mas marcado como desabilitado.`;
                            console.warn(msg);
                            warnings.push(msg);

                            await client.query(
                                "UPDATE seat SET disabled = true, status = 'BLOQUEADO', posicao_x = -1, posicao_y = -1 WHERE id = $1",
                                [existingSeat.id]
                            );
                        } else {
                            throw deleteError;
                        }
                    }
                }
            }

            await client.query(
                "UPDATE vehicle SET mapa_configurado = true WHERE id = $1",
                [id]
            );

            await client.query("COMMIT");

            const result = await client.query(
                "SELECT * FROM seat WHERE vehicle_id = $1 AND disabled = false ORDER BY andar, posicao_y, posicao_x",
                [id]
            );

            res.json({
                seats: result.rows,
                warnings: warnings
            });
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        }
    } catch (error) {
        console.error("Error saving seat map:", error);
        res.status(500).json({ error: "Failed to save seat map" });
    } finally {
        if (client) {
            client.release();
        }
    }
});

// PUT update individual seat
app.put("/api/fleet/vehicles/:vehicleId/seats/:seatId", authorize(['admin', 'operacional']), async (req, res) => {
    try {
        const session = (req as any).session;
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
app.delete("/api/fleet/vehicles/:id/seats", authorize(['admin', 'operacional']), async (req, res) => {
    try {
        const session = (req as any).session;
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
app.get("/api/fleet/drivers", authorize(['admin', 'operacional']), async (req, res) => {
    try {
        const session = (req as any).session;
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
app.get("/api/fleet/drivers/:id", authorize(['admin', 'operacional']), async (req, res) => {
    try {
        const session = (req as any).session;
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
app.post("/api/fleet/drivers", authorize(['admin', 'operacional']), async (req, res) => {
    try {
        const session = (req as any).session;
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
app.put("/api/fleet/drivers/:id", authorize(['admin', 'operacional']), async (req, res) => {
    try {
        const session = (req as any).session;
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
app.delete("/api/fleet/drivers/:id", authorize(['admin', 'operacional']), async (req, res) => {
    try {
        const session = (req as any).session;
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

// ===== ORGANIZATION MEMBERS MANAGEMENT =====

// GET members of active organization
app.get("/api/organization/members", authorize(['admin']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;

        const result = await pool.query(
            `SELECT u.id, u.name, u.email, m.role, m."createdAt" as "joinedAt"
             FROM "member" m
             JOIN "user" u ON m."userId" = u.id
             WHERE m."organizationId" = $1`,
            [orgId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching members:", error);
        res.status(500).json({ error: "Failed to fetch members" });
    }
});

// GET search users to add to organization
app.get("/api/organization/candidates", authorize(['admin']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { q } = req.query;

        if (!q || typeof q !== 'string' || q.length < 2) {
            return res.json([]);
        }

        // Find users matching query who are NOT already members of this org
        const result = await pool.query(
            `SELECT id, name, email FROM "user"
             WHERE (LOWER(name) LIKE LOWER($1) OR LOWER(email) LIKE LOWER($1))
             AND id NOT IN (SELECT "userId" FROM "member" WHERE "organizationId" = $2)
             LIMIT 5`,
            [`%${q}%`, orgId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Error searching candidates:", error);
        res.status(500).json({ error: "Failed to search candidates" });
    }
});

// POST add member to organization (by email)
app.post("/api/organization/members", authorize(['admin']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { email, role } = req.body;

        // 1. Find user by email
        const userResult = await pool.query('SELECT id FROM "user" WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "User not found with this email" });
        }
        const userId = userResult.rows[0].id;

        // 2. Check if already a member
        const memberCheck = await pool.query(
            'SELECT id FROM "member" WHERE "userId" = $1 AND "organizationId" = $2',
            [userId, orgId]
        );

        if (memberCheck.rows.length > 0) {
            return res.status(400).json({ error: "User is already a member of this organization" });
        }

        // 3. Add to organization
        const memberId = crypto.randomUUID();
        await pool.query(
            `INSERT INTO "member" (id, "userId", "organizationId", role, "createdAt")
             VALUES ($1, $2, $3, $4, NOW())`,
            [memberId, userId, orgId, role || 'user']
        );

        res.json({ success: true });
    } catch (error) {
        console.error("Error adding member:", error);
        res.status(500).json({ error: "Failed to add member" });
    }
});

// DELETE remove member from organization
app.delete("/api/organization/members/:userId", authorize(['admin']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { userId } = req.params;

        // Prevent removing yourself (optional but recommended)
        if (userId === session.user.id) {
            return res.status(400).json({ error: "You cannot remove yourself from the organization" });
        }

        await pool.query(
            'DELETE FROM "member" WHERE "userId" = $1 AND "organizationId" = $2',
            [userId, orgId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error("Error removing member:", error);
        res.status(500).json({ error: "Failed to remove member" });
    }
});

// PUT update member role
app.put("/api/organization/members/:userId", authorize(['admin']), async (req, res) => {
    try {
        const session = (req as any).session;
        const orgId = session.session.activeOrganizationId;
        const { userId } = req.params;
        const { role } = req.body;

        await pool.query(
            'UPDATE "member" SET role = $1 WHERE "userId" = $2 AND "organizationId" = $3',
            [role, userId, orgId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error("Error updating member role:", error);
        res.status(500).json({ error: "Failed to update member role" });
    }
});

// Get organization details (Company Info)
app.get("/api/organization/:id/details", authorize(['admin', 'user']), async (req, res) => {
    const { id } = req.params;
    try {
        const session = (req as any).session;
        if (session.session.activeOrganizationId !== id) {
            return res.status(403).json({ error: "You can only view details of the active organization" });
        }

        // Fetch organization basic info + company details
        const orgResult = await pool.query('SELECT id, name, slug FROM "organization" WHERE id = $1', [id]);
        if (orgResult.rows.length === 0) {
            return res.status(404).json({ error: "Organization not found" });
        }

        const companyResult = await pool.query('SELECT * FROM "companies" WHERE organization_id = $1', [id]);

        // Combine info
        const org = orgResult.rows[0];
        const company = companyResult.rows[0] || {};

        res.json({
            id: org.id,
            name: org.name,
            slug: org.slug,
            legal_name: company.legal_name,
            cnpj: company.cnpj,
            address: company.address,
            contact_email: company.contact_email,
            phone: company.phone,
            website: company.website
        });
    } catch (error) {
        console.error("Error fetching organization details:", error);
        res.status(500).json({ error: "Failed to fetch organization details" });
    }
});

// Update organization details (Company Info)
app.put("/api/organization/:id/details", authorize(['admin', 'user']), async (req, res) => {
    const { id } = req.params;
    const { legal_name, cnpj, address, contact_email, phone, website } = req.body;

    try {
        const session = (req as any).session;
        if (session.session.activeOrganizationId !== id) {
            return res.status(403).json({ error: "You can only update the active organization" });
        }

        // Upsert company details
        await pool.query(
            `INSERT INTO "companies" (organization_id, legal_name, cnpj, address, contact_email, phone, website, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
             ON CONFLICT (organization_id) 
             DO UPDATE SET 
                legal_name = EXCLUDED.legal_name,
                cnpj = EXCLUDED.cnpj,
                address = EXCLUDED.address,
                contact_email = EXCLUDED.contact_email,
                phone = EXCLUDED.phone,
                website = EXCLUDED.website,
                updated_at = NOW()`,
            [id, legal_name, cnpj, address, contact_email, phone, website]
        );

        res.json({ success: true });
    } catch (error) {
        console.error("Error updating organization details:", error);
        res.status(500).json({ error: "Failed to update organization details" });
    }
});

import { setupDb } from "./setup-db";

// Start server
const startServer = async () => {
    try {
        await setupDb();
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

startServer();
