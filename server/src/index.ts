import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import path from "path";
import { fileURLToPath } from "url";
import { auth, pool } from "./auth.js";
import { authorize } from "./middleware.js";
import { config } from "./config.js";
import {
    TipoTransacao, StatusTransacao, FormaPagamento,
    VeiculoStatus, AssentoStatus, DriverStatus
} from "./types.js";
import { isValidDateISO } from "./utils/validation.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import crypto from "crypto";
import clientsRouter from "./routes/clients.js";
import maintenanceRouter from "./routes/maintenance.js";
import tripsRouter from "./routes/trips.js";
import { routesRouter } from "./routes/routes.js";
import reservationsRouter from "./routes/reservations.js";
import parcelsRouter from "./routes/parcels.js";
import chartersRouter from "./routes/charters.js";
import publicRouter from "./routes/public.js";
import passwordRecoveryRouter from "./routes/passwordRecovery.js";
import usernameRouter from "./routes/username.js";
import usernameRecoveryRouter from "./routes/usernameRecovery.js";
import auditRouter from "./routes/audit.js";
import financeRouter from "./routes/finance.js";

import { setupDb } from "./db/setup.js";

const app = express();
const PORT = config.port;

// Run DB setup/migrations on startup
setupDb().catch(console.error);

// Initialize Cron Jobs
import { initCronJobs } from "./services/cronService.js";
initCronJobs();

app.use(cors({
    origin: config.clientUrls,
    credentials: true,
}));

import { AuditService } from "./services/auditService.js";
AuditService.logEvent({
    action: 'SYSTEM_STARTUP',
    entity: 'system',
    newData: { status: 'online', timestamp: new Date().toISOString() },
    ipAddress: '127.0.0.1',
    userAgent: 'Server'
}).catch(console.error);


app.use(express.json({ limit: '50mb' }));

app.use("/api/auth/sign-in/email", async (req, res, next) => {
    if (req.method === "POST" && req.body && req.body.email) {
        const identifier = req.body.email;

        // Simple regex patterns for CPF and Phone
        // CPF: XXX.XXX.XXX-XX or XXXXXXXXXXX
        const cpfPattern = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;
        // Phone: (XX) XXXXX-XXXX or XXXXXXXXXXX
        const phonePattern = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;

        if (cpfPattern.test(identifier) || phonePattern.test(identifier)) {
            try {
                // Remove formatting characters for database lookup
                const cleanIdentifier = identifier.replace(/\D/g, "");

                // Search for the user by CPF or Phone
                const result = await pool.query(
                    'SELECT email FROM "user" WHERE REPLACE(REPLACE(cpf, \'.\', \'\'), \'-\', \'\') = $1 OR REPLACE(REPLACE(REPLACE(REPLACE(phone, \'(\', \'\'), \')\', \'\'), \'-\', \'\'), \' \', \'\') = $1',
                    [cleanIdentifier]
                );

                if (result.rows.length > 0) {
                    console.log(`Mapping identifier ${identifier} to email ${result.rows[0].email}`);
                    req.body.email = result.rows[0].email;
                }
            } catch (error) {
                console.error("Error mapping identifier to email:", error);
            }
        }
    }
    next();
});

// ===== USERNAME AND RECOVERY ROUTES (MUST BE BEFORE BETTER AUTH) =====
console.log("🔧 Registering username routes...");
app.use("/api/auth", usernameRouter);
console.log("✅ Username router registered");
app.use("/api/auth", usernameRecoveryRouter);
console.log("✅ Username recovery router registered");
app.use("/api/auth", passwordRecoveryRouter);
console.log("✅ Password recovery router registered");

// Better Auth handler (catches all remaining /api/auth/* routes)
app.all("/api/auth/*", toNodeHandler(auth));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// TEMPORARY: Fix admin role (REMOVE AFTER USE)
app.get("/api/fix-admin-role", async (req, res) => {
    try {
        await pool.query('UPDATE "user" SET role = $1 WHERE username = $2', ['admin', 'admin']);
        const result = await pool.query('SELECT username, role FROM "user" WHERE username = $1', ['admin']);
        res.json({ success: true, user: result.rows[0] });
    } catch (error) {
        console.error("Error fixing admin role:", error);
        res.status(500).json({ error: "Failed to update role" });
    }
});

app.get("/api/users", authorize(['admin']), async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, name, email, phone, cpf, role, "createdAt" FROM "user"');
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

app.get("/api/users/:id", authorize(['admin']), async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT id, username, name, email, phone, cpf, birth_date, image, role, notes, is_active as "isActive", "createdAt" FROM "user" WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        const user = result.rows[0];
        console.log(`📅 GET /api/users/${id} - birth_date from DB:`, user.birth_date);

        res.json(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ error: "Failed to fetch user" });
    }
});

app.post("/api/users", authorize(['admin']), async (req, res) => {
    try {
        const { username, name, email, phone, cpf, birthDate, role, password, notes, isActive } = req.body;

        // 1. Initial Validation
        if (!username || !name || !password) {
            return res.status(400).json({ error: "Username, nome e senha são obrigatórios" });
        }

        // 2. Uniqueness Checks
        const check = await pool.query(
            'SELECT id FROM "user" WHERE LOWER(username) = LOWER($1) OR (email IS NOT NULL AND LOWER(email) = LOWER($2)) OR (phone IS NOT NULL AND phone = $3)',
            [username, email || '', phone || '']
        );

        if (check.rows.length > 0) {
            return res.status(400).json({ error: "Username, email ou telefone já estão em uso" });
        }

        // 3. Create User via Better Auth (Initial Insert)
        const authResponse = await auth.api.signUpEmail({
            body: {
                email: email || `${username}@sgtl-internal.com`, // Robust fallback for email
                password,
                name
            }
        }) as any;

        if (!authResponse || !authResponse.user) {
            return res.status(500).json({ error: "Falha ao criar usuário na base de autenticação" });
        }

        const userId = authResponse.user.id;

        // 4. Atomic Update of Custom Fields
        await pool.query(
            `UPDATE "user" 
             SET username = $1, phone = $2, cpf = $3, birth_date = $4, role = $5, notes = $6, is_active = $7, "updatedAt" = CURRENT_TIMESTAMP
             WHERE id = $8`,
            [username, phone || null, cpf || null, birthDate || null, role || 'user', notes || null, isActive !== false, userId]
        );

        // 5. Standardize accountId to username
        await pool.query(
            `UPDATE account 
             SET "accountId" = $1, "updatedAt" = CURRENT_TIMESTAMP
             WHERE "userId" = $2 AND "providerId" = 'credential'`,
            [username, userId]
        );

        // 6. Create Client Profile if any of the roles is 'client'
        const roles = (role || 'user').split(',').map((r: string) => r.trim());
        if (roles.includes('client')) {
            const orgId = (req as any).session.session.activeOrganizationId;
            console.log(`[ADMIN] Creating client profile for user ${username} in org ${orgId}`);
            await pool.query(
                `INSERT INTO clients (
                    tipo_cliente, nome, email, telefone, 
                    documento_tipo, documento,
                    organization_id, user_id,
                    data_cadastro, saldo_creditos
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, 0)
                ON CONFLICT (user_id) DO NOTHING`,
                [
                    'PESSOA_FISICA',
                    name,
                    email || null,
                    phone || null,
                    'CPF',
                    cpf || null,
                    orgId,
                    userId
                ]
            );
        }

        const newUserResult = await pool.query('SELECT * FROM "user" WHERE id = $1', [userId]);
        const newUser = newUserResult.rows[0];

        // Audit Log
        AuditService.logEvent({
            userId: (req as any).session.user.id,
            organizationId: (req as any).session.session.activeOrganizationId as string,
            action: 'USER_CREATE',
            entity: 'user',
            entityId: userId,
            newData: newUser,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        }).catch(console.error);

        console.log(`[ADMIN] User created: ${username} (ID: ${userId})`);
        res.json({ success: true, userId });

    } catch (error: any) {
        console.error("Error creating user:", error);
        res.status(500).json({ error: error.message || "Erro ao criar usuário" });
    }
});

app.put("/api/users/:id", authorize(['admin']), async (req, res) => {
    const { id } = req.params;
    try {
        const { username, name, email, phone, cpf, birthDate, image, role, notes, isActive } = req.body;

        if (!name || !phone) {
            return res.status(400).json({ error: "Nome e telefone são obrigatórios" });
        }

        // Uniqueness checks (excluding current user)
        const check = await pool.query(
            'SELECT id FROM "user" WHERE (LOWER(username) = LOWER($1) OR (email IS NOT NULL AND LOWER(email) = LOWER($2)) OR (phone IS NOT NULL AND phone = $3)) AND id != $4',
            [username || '', email || '', phone || '', id]
        );

        if (check.rows.length > 0) {
            return res.status(400).json({ error: "Username, email ou telefone já estão em uso por outro usuário" });
        }

        // Update user
        await pool.query(
            `UPDATE "user" 
             SET username = $1, name = $2, email = $3, phone = $4, cpf = $5, birth_date = $6, image = $7, role = $8, notes = $9, is_active = $10, "updatedAt" = CURRENT_TIMESTAMP
             WHERE id = $11`,
            [username, name, email || null, phone, cpf || null, birthDate || null, image || null, role, notes || null, isActive !== false, id]
        );

        // Sync accountId if username changed
        if (username) {
            await pool.query(
                `UPDATE account SET "accountId" = $1 WHERE "userId" = $2 AND "providerId" = 'credential'`,
                [username, id]
            );
        }

        const updatedUserRes = await pool.query('SELECT * FROM "user" WHERE id = $1', [id]);
        const updatedUser = updatedUserRes.rows[0];

        // Audit Log
        AuditService.logEvent({
            userId: (req as any).session.user.id,
            organizationId: (req as any).session.session.activeOrganizationId as string,
            action: 'USER_UPDATE',
            entity: 'user',
            entityId: id,
            newData: updatedUser,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        }).catch(console.error);

        console.log(`[ADMIN] User updated: ${id} (Username: ${username})`);
        res.json({ success: true });

    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ error: "Erro ao atualizar usuário" });
    }
});

app.post("/api/users/:id/reset-password", authorize(['admin']), async (req, res) => {
    const { id } = req.params;
    try {
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ error: "A senha deve ter no mínimo 8 caracteres" });
        }

        const userCheck = await pool.query('SELECT username FROM "user" WHERE id = $1', [id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }

        const bcrypt = await import('bcrypt');
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password AND ensure accountId is standardized to username
        await pool.query(
            `UPDATE account 
             SET password = $1, "accountId" = $2, "updatedAt" = CURRENT_TIMESTAMP
             WHERE "userId" = $3 AND "providerId" = 'credential'`,
            [hashedPassword, userCheck.rows[0].username, id]
        );

        console.log(`[ADMIN] Password reset for user: ${userCheck.rows[0].username}`);
        res.json({ success: true });
    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ error: "Erro ao redefinir senha" });
    }
});

// Profile Management Endpoints
import { upload, processAvatar } from './middleware/upload.js';

// Get current user profile
app.get("/api/profile", async (req, res) => {
    try {
        const session = await auth.api.getSession({ headers: req.headers as any });
        if (!session) {
            return res.status(401).json({ error: "Não autenticado" });
        }

        const result = await pool.query(
            'SELECT id, username, name, email, phone, cpf, birth_date, role, image FROM "user" WHERE id = $1',
            [session.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }

        const user = result.rows[0];
        console.log(`📅 GET /api/profile - birth_date from DB:`, user.birth_date);

        res.json(user);
    } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ error: "Erro ao buscar perfil" });
    }
});

// Update current user profile
app.put("/api/profile", async (req, res) => {
    try {
        const session = await auth.api.getSession({ headers: req.headers as any });
        if (!session) {
            return res.status(401).json({ error: "Não autenticado" });
        }

        const { name, email, phone, cpf, birthDate, image } = req.body;

        // Validate required fields
        if (!name || !phone) {
            return res.status(400).json({ error: "Nome e telefone são obrigatórios" });
        }

        // Check if email is already in use by another user
        if (email) {
            const emailCheck = await pool.query('SELECT id FROM "user" WHERE email = $1 AND id != $2', [email, session.user.id]);
            if (emailCheck.rows.length > 0) {
                return res.status(400).json({ error: "Email já está em uso" });
            }
        }

        // Check if phone is already in use by another user
        const phoneCheck = await pool.query('SELECT id FROM "user" WHERE phone = $1 AND id != $2', [phone, session.user.id]);
        if (phoneCheck.rows.length > 0) {
            return res.status(400).json({ error: "Telefone já está em uso" });
        }

        // Check if CPF is already in use by another user
        if (cpf) {
            const cpfCheck = await pool.query('SELECT id FROM "user" WHERE cpf = $1 AND id != $2', [cpf, session.user.id]);
            if (cpfCheck.rows.length > 0) {
                return res.status(400).json({ error: "CPF já está em uso" });
            }
        }

        // Update profile (including image if provided)
        console.log(`📅 PUT /api/profile - birthDate to save:`, birthDate);
        console.log(`🖼️ PUT /api/profile - image to save:`, image);

        // Build dynamic query based on what fields are provided
        const updateFields = [];
        const updateValues = [];
        let paramCounter = 1;

        updateFields.push(`name = $${paramCounter++}`);
        updateValues.push(name);

        updateFields.push(`email = $${paramCounter++}`);
        updateValues.push(email || null);

        updateFields.push(`phone = $${paramCounter++}`);
        updateValues.push(phone);

        updateFields.push(`cpf = $${paramCounter++}`);
        updateValues.push(cpf || null);

        updateFields.push(`birth_date = $${paramCounter++}`);
        updateValues.push(birthDate || null);

        // Only update image if explicitly provided (including null to remove)
        if (image !== undefined) {
            updateFields.push(`image = $${paramCounter++}`);
            updateValues.push(image);
        }

        updateFields.push(`"updatedAt" = CURRENT_TIMESTAMP`);
        updateValues.push(session.user.id);

        await pool.query(
            `UPDATE "user" SET ${updateFields.join(', ')} WHERE id = $${paramCounter}`,
            updateValues
        );

        console.log(`✅ Profile updated: ${session.user.id}`);

        const updatedProfileRes = await pool.query('SELECT * FROM "user" WHERE id = $1', [session.user.id]);
        const updatedProfile = updatedProfileRes.rows[0];

        // Audit Log
        AuditService.logEvent({
            userId: session.user.id,
            organizationId: (session.session as any).activeOrganizationId as string,
            action: 'USER_UPDATE',
            entity: 'user',
            entityId: session.user.id,
            newData: updatedProfile,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        }).catch(console.error);

        res.json({ success: true });

    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ error: "Erro ao atualizar perfil" });
    }
});

// Upload avatar
app.post("/api/profile/avatar", upload.single('avatar'), async (req, res) => {
    try {
        const session = await auth.api.getSession({ headers: req.headers as any });
        if (!session) {
            return res.status(401).json({ error: "Não autenticado" });
        }

        if (!req.file) {
            return res.status(400).json({ error: "Nenhuma imagem foi enviada" });
        }

        // Process and save avatar
        const imageUrl = await processAvatar(req.file.buffer, session.user.id);
        console.log(`🖼️ Avatar processed, imageUrl:`, imageUrl);

        // Update user image in database
        await pool.query(
            'UPDATE "user" SET image = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2',
            [imageUrl, session.user.id]
        );

        console.log(`✅ Avatar uploaded: ${session.user.id}`);

        res.json({ success: true, imageUrl });
    } catch (error) {
        console.error("Error uploading avatar:", error);
        res.status(500).json({ error: "Erro ao fazer upload da imagem" });
    }
});

// Upload avatar for any user (admin)
app.post("/api/users/:id/avatar", authorize(['admin']), upload.single('avatar'), async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({ error: "Nenhuma imagem foi enviada" });
        }

        // Check if user exists
        const userCheck = await pool.query('SELECT id FROM "user" WHERE id = $1', [id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }

        // Process and save avatar
        const imageUrl = await processAvatar(req.file.buffer, id);

        // Update user image in database
        await pool.query(
            'UPDATE "user" SET image = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2',
            [imageUrl, id]
        );

        console.log(`✅ Avatar uploaded for user: ${id}`);

        res.json({ success: true, imageUrl });
    } catch (error) {
        console.error("Error uploading avatar:", error);
        res.status(500).json({ error: "Erro ao fazer upload da imagem" });
    }
});

// Change password
app.post("/api/profile/change-password", async (req, res) => {
    try {
        const session = await auth.api.getSession({ headers: req.headers as any });
        if (!session) {
            return res.status(401).json({ error: "Não autenticado" });
        }

        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: "Senhas são obrigatórias" });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: "A nova senha deve ter no mínimo 8 caracteres" });
        }

        const accountResult = await pool.query(
            'SELECT password, "accountId" FROM account WHERE "userId" = $1 AND "providerId" = \'credential\'',
            [session.user.id]
        );

        if (accountResult.rows.length === 0) {
            return res.status(404).json({ error: "Conta não encontrada" });
        }

        const bcrypt = await import('bcrypt');
        const isValid = await bcrypt.compare(currentPassword, accountResult.rows[0].password);

        if (!isValid) {
            return res.status(400).json({ error: "Senha atual incorreta" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password AND ensure accountId is current username
        const userResult = await pool.query('SELECT username FROM "user" WHERE id = $1', [session.user.id]);
        const username = userResult.rows[0]?.username || session.user.email;

        await pool.query(
            'UPDATE account SET password = $1, "accountId" = $2, "updatedAt" = CURRENT_TIMESTAMP WHERE "userId" = $3 AND "providerId" = \'credential\'',
            [hashedPassword, username, session.user.id]
        );

        console.log(`[PROFILE] Password changed for user: ${username}`);
        res.json({ success: true });
    } catch (error) {
        console.error("Error changing password:", error);
        res.status(500).json({ error: "Erro ao alterar senha" });
    }
});

app.delete("/api/users/:id", authorize(['admin']), async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM "user" WHERE id = $1', [id]);
        // Audit Log
        AuditService.logEvent({
            userId: (req as any).session.user.id,
            organizationId: (req as any).session.session.activeOrganizationId as string,
            action: 'USER_DELETE',
            entity: 'user',
            entityId: id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        }).catch(console.error);

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
        const updatedUserRes = await pool.query('SELECT * FROM "user" WHERE id = $1', [id]);
        const updatedUser = updatedUserRes.rows[0];

        // Audit Log
        AuditService.logEvent({
            userId: (req as any).session.user.id,
            organizationId: (req as any).session.session.activeOrganizationId as string,
            action: 'USER_UPDATE',
            entity: 'user',
            entityId: id,
            newData: updatedUser,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        }).catch(console.error);

        res.json({ success: true });

    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ error: "Failed to update user" });
    }
});

// Clients Routes
app.use("/api/clients", clientsRouter);
app.use("/api/finance", financeRouter);

// Maintenance Routes
app.use("/api/maintenance", maintenanceRouter);

// Trips & Routes
import { locationsRouter } from "./routes/locations.js";

app.use("/api", tripsRouter);
app.use("/api/routes", routesRouter);
app.use("/api/locations", locationsRouter);

// Reservations
app.use("/api/reservations", reservationsRouter);

// Parcels
app.use("/api/parcels", parcelsRouter);

// Charters
app.use("/api/charters", chartersRouter);
app.use("/api/admin/audit-logs", auditRouter);


// Public Routes (Portal)
app.use("/api/public", publicRouter);

// DEBUG ROUTE - REMOVE AFTER FIXING VISIBILITY ISSUE
app.get("/api/debug/reservations", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT r.id, r.ticket_code, r.passenger_name, r.organization_id, r.status, r.created_at,
                   t.id as trip_id, t.organization_id as trip_org_id, t.title as trip_title
            FROM reservations r
            LEFT JOIN trips t ON r.trip_id = t.id
            ORDER BY r.created_at DESC
            LIMIT 20
        `);
        res.json(result.rows);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Client Portal Routes (Authenticated)
import clientRouter from "./routes/client.js";
app.use("/api/client", clientRouter);

// Webhook Routes
import webhooksRouter from "./routes/webhooks.js";
app.use("/api/webhooks", webhooksRouter);

// Redundant transaction routes removed - moved to routes/finance.ts


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

        const vehicle = result.rows[0];

        // Fetch features
        const featuresResult = await pool.query(
            `SELECT id, category, label, value FROM vehicle_feature WHERE vehicle_id = $1`,
            [id]
        );

        res.json({
            ...vehicle,
            features: featuresResult.rows
        });
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
            capacidade_carga, observacoes, motorista_atual, features, imagem, galeria
        } = req.body;

        const result = await pool.query(
            `INSERT INTO vehicle (
                placa, modelo, tipo, status, ano, km_atual, proxima_revisao_km,
                ultima_revisao, is_double_deck, capacidade_passageiros,
                capacidade_carga, observacoes, motorista_atual, imagem, galeria,
                organization_id, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            RETURNING *`,
            [
                placa, modelo, tipo, status || VeiculoStatus.ACTIVE, ano, km_atual || 0, proxima_revisao_km,
                ultima_revisao || null, is_double_deck || false, capacidade_passageiros || null,
                capacidade_carga || null, observacoes || null, motorista_atual || null,
                imagem || null, galeria ? JSON.stringify(galeria) : null,
                orgId, userId
            ]
        );

        const createdVehicle = result.rows[0];

        // Save features if provided
        if (Array.isArray(features) && features.length > 0) {
            for (const feature of features) {
                if (feature.label) {
                    await pool.query(
                        `INSERT INTO vehicle_feature (vehicle_id, category, label, value) VALUES ($1, $2, $3, $4)`,
                        [createdVehicle.id, feature.category || null, feature.label, feature.value || '']
                    );
                }
            }
        }

        // Audit Log
        AuditService.logEvent({
            userId: userId as string,
            organizationId: orgId as string,
            action: 'VEHICLE_CREATE',
            entity: 'vehicle',
            entityId: createdVehicle.id,
            newData: createdVehicle,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        }).catch(console.error);

        res.json(createdVehicle);

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
        const userId = session.user.id;

        const { id } = req.params;

        const check = await pool.query(
            "SELECT * FROM vehicle WHERE id = $1 AND organization_id = $2",
            [id, orgId]
        );

        if (check.rows.length === 0) {
            return res.status(404).json({ error: "Vehicle not found" });
        }

        const oldVehicle = check.rows[0];

        const {
            placa, modelo, tipo, status, ano, km_atual, proxima_revisao_km,
            ultima_revisao, is_double_deck, capacidade_passageiros,
            capacidade_carga, observacoes, motorista_atual, features, imagem, galeria
        } = req.body;

        const result = await pool.query(
            `UPDATE vehicle SET
                placa = $1, modelo = $2, tipo = $3, status = $4, ano = $5,
                km_atual = $6, proxima_revisao_km = $7, ultima_revisao = $8,
                is_double_deck = $9, capacidade_passageiros = $10,
                capacidade_carga = $11, observacoes = $12, motorista_atual = $13,
                imagem = $14, galeria = $15,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $16 AND organization_id = $17
            RETURNING *`,
            [
                placa, modelo, tipo, status || VeiculoStatus.ACTIVE, ano, km_atual, proxima_revisao_km,
                ultima_revisao || null, is_double_deck || false, capacidade_passageiros || null,
                capacidade_carga || null, observacoes || null, motorista_atual || null,
                imagem || null, galeria ? JSON.stringify(galeria) : null,
                id, orgId
            ]
        );

        // Update features (Sync)
        if (Array.isArray(features)) {
            // Simply clear and re-insert for simplicity in this case
            await pool.query(`DELETE FROM vehicle_feature WHERE vehicle_id = $1`, [id]);
            for (const feature of features) {
                if (feature.label) {
                    await pool.query(
                        `INSERT INTO vehicle_feature (vehicle_id, category, label, value) VALUES ($1, $2, $3, $4)`,
                        [id, feature.category || null, feature.label, feature.value || '']
                    );
                }
            }
        }

        const updatedVehicle = result.rows[0];

        // Audit Log
        AuditService.logEvent({
            userId: userId as string,
            organizationId: orgId as string,
            action: 'VEHICLE_UPDATE',
            entity: 'vehicle',
            entityId: updatedVehicle.id,
            oldData: oldVehicle,
            newData: updatedVehicle,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        }).catch(console.error);

        res.json(updatedVehicle);

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

        // Audit Log
        AuditService.logEvent({
            userId: session.user.id,
            organizationId: orgId as string,
            action: 'VEHICLE_DELETE',
            entity: 'vehicle',
            entityId: id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        }).catch(console.error);

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
            const processedIds = new Set();
            const processedNumeros = new Set();

            for (const seat of seats) {
                processedNumeros.add(seat.numero);
                const existingSeat = existingSeatsMap.get(seat.numero);

                if (existingSeat) {
                    processedIds.add(existingSeat.id);
                    // Update existing
                    await client.query(
                        `UPDATE seat SET
                            andar = $1, posicao_x = $2, posicao_y = $3, 
                            tipo = $4, status = $5, preco = $6, disabled = $7,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = $8`,
                        [
                            seat.andar, seat.posicao_x, seat.posicao_y,
                            seat.tipo, seat.status || AssentoStatus.AVAILABLE, seat.preco || null, seat.disabled || false,
                            existingSeat.id
                        ]
                    );
                } else {
                    // Check if there is already a seat at this coordinate for this vehicle
                    const coordKey = `${seat.andar}-${seat.posicao_x}-${seat.posicao_y}`;
                    const existingAtCoord = existingSeatsResult.rows.find(s => `${s.andar}-${s.posicao_x}-${s.posicao_y}` === coordKey);

                    if (existingAtCoord) {
                        processedIds.add(existingAtCoord.id);
                        // Update existing seat at this coordinate with new number
                        await client.query(
                            `UPDATE seat SET
                                numero = $1, tipo = $2, status = $3, preco = $4, disabled = $5,
                                updated_at = CURRENT_TIMESTAMP
                            WHERE id = $6`,
                            [
                                seat.numero, seat.tipo, seat.status || AssentoStatus.AVAILABLE,
                                seat.preco || null, seat.disabled || false,
                                existingAtCoord.id
                            ]
                        );
                    } else {
                        // Insert new
                        const insertResult = await client.query(
                            `INSERT INTO seat (
                                vehicle_id, numero, andar, posicao_x, posicao_y, tipo, status, preco, disabled
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
                            [
                                id, seat.numero, seat.andar, seat.posicao_x, seat.posicao_y,
                                seat.tipo, seat.status || AssentoStatus.AVAILABLE, seat.preco || null, seat.disabled || false
                            ]
                        );
                        processedIds.add(insertResult.rows[0].id);
                    }
                }
            }

            // 3. Delete or Disable removed seats
            const warnings: string[] = [];
            for (const existingSeat of existingSeatsResult.rows) {
                if (!processedIds.has(existingSeat.id)) {
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
                            const msg = `O assento ${existingSeat.numero} não pode ser excluído pois possui reservas vinculadas. Ele foi mantido mas marcado como desabilitado.`;
                            console.warn(msg);
                            warnings.push(msg);

                            await client.query(
                                "UPDATE seat SET disabled = true, status = $1, posicao_x = -1, posicao_y = -1 WHERE id = $2",
                                [AssentoStatus.BLOCKED, existingSeat.id]
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

            // Audit Log
            AuditService.logEvent({
                userId: session.user.id,
                organizationId: orgId as string,
                action: 'SEAT_MAP_UPDATE',
                entity: 'vehicle_seats',
                entityId: id,
                newData: { seatCount: processedIds.size, warnings },
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            }).catch(console.error);

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

        const updatedSeat = result.rows[0];

        // Audit Log
        AuditService.logEvent({
            userId: session.user.id,
            organizationId: orgId as string,
            action: 'SEAT_UPDATE',
            entity: 'seat',
            entityId: seatId,
            newData: updatedSeat,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        }).catch(console.error);

        res.json(updatedSeat);
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

        // Audit Log
        AuditService.logEvent({
            userId: session.user.id,
            organizationId: orgId as string,
            action: 'SEAT_MAP_DELETE',
            entity: 'vehicle_seats',
            entityId: id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        }).catch(console.error);

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

        // Date Validation
        if (!isValidDateISO(validade_cnh)) {
            return res.status(400).json({ error: "Data de validade da CNH inválida" });
        }
        if (validade_passaporte && !isValidDateISO(validade_passaporte)) {
            return res.status(400).json({ error: "Data de validade do passaporte inválida" });
        }
        if (data_contratacao && !isValidDateISO(data_contratacao)) {
            return res.status(400).json({ error: "Data de contratação inválida" });
        }

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
                status || DriverStatus.AVAILABLE, data_contratacao, salario || null, anos_experiencia || null, viagens_internacionais || 0,
                disponivel_internacional || false, observacoes || null,
                orgId, userId
            ]
        );

        const newDriver = result.rows[0];

        // Audit Log
        AuditService.logEvent({
            userId: userId as string,
            organizationId: orgId as string,
            action: 'DRIVER_CREATE',
            entity: 'driver',
            entityId: newDriver.id,
            newData: newDriver,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        }).catch(console.error);

        res.json(newDriver);

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
            "SELECT * FROM driver WHERE id = $1 AND organization_id = $2",
            [id, orgId]
        );

        if (check.rows.length === 0) {
            return res.status(404).json({ error: "Driver not found" });
        }

        const oldDriver = check.rows[0];

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
                status || DriverStatus.AVAILABLE, data_contratacao, salario || null, anos_experiencia || null, viagens_internacionais || 0,
                disponivel_internacional || false, observacoes || null,
                id, orgId
            ]
        );

        const updatedDriver = result.rows[0];

        // Audit Log
        AuditService.logEvent({
            userId: session.user.id,
            organizationId: orgId as string,
            action: 'DRIVER_UPDATE',
            entity: 'driver',
            entityId: updatedDriver.id,
            oldData: oldDriver,
            newData: updatedDriver,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        }).catch(console.error);

        res.json(updatedDriver);

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

        // Audit Log
        AuditService.logEvent({
            userId: session.user.id,
            organizationId: orgId as string,
            action: 'DRIVER_DELETE',
            entity: 'driver',
            entityId: id,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        }).catch(console.error);

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

        // Audit Log
        AuditService.logEvent({
            userId: session.user.id,
            organizationId: orgId as string,
            action: 'MEMBER_ADD',
            entity: 'member',
            entityId: userId,
            newData: { role: role || 'user' },
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        }).catch(console.error);

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

        // Audit Log
        AuditService.logEvent({
            userId: session.user.id,
            organizationId: orgId as string,
            action: 'MEMBER_REMOVE',
            entity: 'member',
            entityId: userId,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        }).catch(console.error);

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

        // Audit Log
        AuditService.logEvent({
            userId: session.user.id,
            organizationId: orgId as string,
            action: 'MEMBER_ROLE_UPDATE',
            entity: 'member',
            entityId: userId,
            newData: { role },
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        }).catch(console.error);

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

        // Audit Log
        AuditService.logEvent({
            userId: session.user.id,
            organizationId: id,
            action: 'COMPANY_UPDATE',
            entity: 'company',
            entityId: id,
            newData: { legal_name, cnpj, address, contact_email, phone, website },
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        }).catch(console.error);

        res.json({ success: true });
    } catch (error) {
        console.error("Error updating organization details:", error);
        res.status(500).json({ error: "Failed to update organization details" });
    }
});

// ===== SYSTEM PARAMETERS ROUTES =====

// GET public settings (no auth required for logo, system name, footer, etc.)
app.get("/api/public/parameters", async (req, res) => {
    const { organizationId } = req.query;
    try {
        const publicKeys = [
            'system_name', 'system_slogan', 'system_display_version', 'system_footer_text',
            'portal_logo_text', 'portal_header_slogan', 'portal_copyright'
        ];

        let query = "SELECT key, value FROM system_parameters WHERE key = ANY($1)";
        const params: any[] = [publicKeys];

        if (organizationId) {
            query += " AND organization_id = $2";
            params.push(organizationId);
        } else {
            query += " AND organization_id IN (SELECT id FROM organization LIMIT 1)";
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching public parameters:", error);
        res.status(500).json({ error: "Failed to fetch public settings" });
    }
});
// GET all parameters for an organization
app.get("/api/organization/:id/parameters", authorize(['admin', 'operacional']), async (req, res) => {
    const { id } = req.params;
    try {
        const session = (req as any).session;
        if (session.session.activeOrganizationId !== id) {
            return res.status(403).json({ error: "You can only view parameters of the active organization" });
        }

        const result = await pool.query(
            "SELECT * FROM system_parameters WHERE organization_id = $1 ORDER BY key ASC",
            [id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching system parameters:", error);
        res.status(500).json({ error: "Failed to fetch system parameters" });
    }
});

// POST/PUT upsert a parameter
app.post("/api/organization/:id/parameters", authorize(['admin', 'operacional']), async (req, res) => {
    const { id } = req.params;
    const { key, value, description, group_name } = req.body;

    try {
        const session = (req as any).session;
        if (session.session.activeOrganizationId !== id) {
            return res.status(403).json({ error: "You can only manage parameters of the active organization" });
        }

        const result = await pool.query(
            `INSERT INTO system_parameters (organization_id, key, value, description, group_name)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (organization_id, key) 
             DO UPDATE SET 
                value = EXCLUDED.value,
                description = COALESCE(EXCLUDED.description, system_parameters.description),
                group_name = COALESCE(EXCLUDED.group_name, system_parameters.group_name),
                updated_at = NOW()
             RETURNING *`,
            [id, key, value, description, group_name || null]
        );

        const savedParam = result.rows[0];

        // Audit Log
        AuditService.logEvent({
            userId: session.user.id,
            organizationId: id,
            action: 'PARAM_UPDATE',
            entity: 'system_parameter',
            entityId: savedParam.id,
            newData: savedParam,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        }).catch(console.error);

        res.json(savedParam);
    } catch (error) {
        console.error("Error upserting system parameter:", error);
        res.status(500).json({ error: "Failed to save system parameter" });
    }
});

// POST/PUT upsert multiple parameters
app.post("/api/organization/:id/parameters/batch", authorize(['admin', 'operacional']), async (req, res) => {
    const { id } = req.params;
    const { parameters } = req.body; // Expects array of { key, value, description }

    if (!Array.isArray(parameters)) {
        return res.status(400).json({ error: "Parameters must be an array" });
    }

    const client = await pool.connect();
    try {
        const session = (req as any).session;
        if (session.session.activeOrganizationId !== id) {
            return res.status(403).json({ error: "You can only manage parameters of the active organization" });
        }

        await client.query('BEGIN');

        const results = [];
        for (const param of parameters) {
            const { key, value, description, group_name } = param;
            const result = await client.query(
                `INSERT INTO system_parameters (organization_id, key, value, description, group_name)
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT (organization_id, key) 
                 DO UPDATE SET 
                    value = EXCLUDED.value,
                    description = COALESCE(EXCLUDED.description, system_parameters.description),
                    group_name = COALESCE(EXCLUDED.group_name, system_parameters.group_name),
                    updated_at = NOW()
                 RETURNING *`,
                [id, key, value, description, group_name || null]
            );
            results.push(result.rows[0]);
        }

        await client.query('COMMIT');
        // Audit Log
        AuditService.logEvent({
            userId: (req as any).session.user.id,
            organizationId: id,
            action: 'PARAM_BATCH_UPDATE',
            entity: 'system_parameter',
            entityId: 'multiple',
            newData: results,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        }).catch(console.error);

        res.json(results);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error batch upserting system parameters:", error);
        res.status(500).json({ error: "Failed to save system parameters" });
    } finally {
        client.release();
    }
});

// DELETE a parameter
app.delete("/api/organization/:id/parameters/:paramId", authorize(['admin']), async (req, res) => {
    const { id, paramId } = req.params;

    try {
        const session = (req as any).session;
        if (session.session.activeOrganizationId !== id) {
            return res.status(403).json({ error: "You can only manage parameters of the active organization" });
        }

        const result = await pool.query(
            "DELETE FROM system_parameters WHERE id = $1 AND organization_id = $2 RETURNING id",
            [paramId, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Parameter not found" });
        }

        // Audit Log
        AuditService.logEvent({
            userId: session.user.id,
            organizationId: id,
            action: 'PARAM_DELETE',
            entity: 'system_parameter',
            entityId: paramId,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        }).catch(console.error);

        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting system parameter:", error);
        res.status(500).json({ error: "Failed to delete system parameter" });
    }
});

// Global Error Handler (MUST BE LAST)
import { errorHandler } from "./middleware/errorHandler.js";
app.use(errorHandler);

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
