import express from "express";
import { pool, auth } from "../auth.js";
import { TripStatus, ReservationStatus, FretamentoStatus, EncomendaStatus } from "../types.js";
import { AuditService } from "../services/auditService.js";

const router = express.Router();

// Public Routes - No Authentication Required

// GET /public/routes - List active routes (for search dropdowns)
router.get("/routes", async (req, res) => {
    try {
        // Assuming we want to show routes from all organizations or filter by domain?
        // For now, let's return all active routes. 
        // In a multi-tenant app, we might need to know which org the portal belongs to.
        // Assuming single org for now or passed via query param?
        // Let's assume the frontend sends an organizationId or we return all.
        // Ideally, the portal URL determines the org.
        // For this MVP, let's just return all active routes.

        const result = await pool.query(
            "SELECT id, name, origin_city, origin_state, destination_city, destination_state FROM routes WHERE active = true ORDER BY name ASC"
        );
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching public routes:", error);
        res.status(500).json({ error: "Failed to fetch routes" });
    }
});

// GET /public/trips - Search trips
router.get("/trips", async (req, res) => {
    try {
        const { origin_city, destination_city, date } = req.query;

        let query = `
            SELECT t.id, t.departure_date, t.departure_time, t.arrival_date, t.arrival_time,
                   t.price_conventional, t.price_executive, t.price_semi_sleeper, t.price_sleeper,
                   t.seats_available, t.tags, t.cover_image, t.title, t.baggage_limit, t.alerts,
                   t.status, t.active,
                   r.name as route_name, r.origin_city, r.origin_state, r.destination_city, r.destination_state, 
                   r.origin_neighborhood, r.destination_neighborhood,
                    r.duration_minutes, r.stops as route_stops,
                    rr.stops as return_route_stops,
                    v.tipo as vehicle_type, v.modelo as vehicle_model, v.placa as vehicle_plate
            FROM trips t
            JOIN routes r ON t.route_id = r.id
            LEFT JOIN routes rr ON t.return_route_id = rr.id
            LEFT JOIN vehicle v ON t.vehicle_id = v.id
            WHERE t.status IN ($1, 'AGENDADA', 'CONFIRMADA', 'CONFIRMED') AND (t.active = true OR t.active IS NULL)
        `;
        const params: any[] = [TripStatus.SCHEDULED];
        let paramCount = 1;

        if (origin_city) {
            paramCount++;
            query += ` AND r.origin_city ILIKE $${paramCount}`;
            params.push(`%${origin_city}%`);
        }

        if (destination_city) {
            paramCount++;
            query += ` AND r.destination_city ILIKE $${paramCount}`;
            params.push(`%${destination_city}%`);
        }

        if (date) {
            paramCount++;
            query += ` AND t.departure_date = $${paramCount}`;
            params.push(date);
        }

        query += ` ORDER BY t.departure_date ASC, t.departure_time ASC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error("Error searching trips:", error);
        res.status(500).json({ error: "Failed to search trips" });
    }
});

// GET /public/trips/:id - Get single trip details publicly
router.get("/trips/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT t.*, 
                   r.name as route_name, r.origin_city, r.origin_state, r.destination_city, r.destination_state, 
                   r.origin_neighborhood, r.destination_neighborhood,
                    r.stops as route_stops,
                    rr.stops as return_route_stops,
                    v.placa as vehicle_plate, v.modelo as vehicle_model, v.tipo as vehicle_type, v.capacidade_passageiros, v.id as vehicle_id, v.is_double_deck as vehicle_is_double_deck
            FROM trips t
            JOIN routes r ON t.route_id = r.id
            LEFT JOIN routes rr ON t.return_route_id = rr.id
            LEFT JOIN vehicle v ON t.vehicle_id = v.id
            WHERE t.id = $1 AND (t.active = true OR t.active IS NULL)`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Trip not found" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching public trip:", error);
        res.status(500).json({ error: "Failed to fetch trip" });
    }
});

// GET /public/vehicles/:id - Get basic vehicle info publicly
router.get("/vehicles/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            "SELECT id, modelo, placa, ano, tipo, capacidade_passageiros, imagem, galeria, is_double_deck FROM vehicle WHERE id = $1",
            [id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: "Vehicle not found" });

        // Fetch features
        const features = await pool.query("SELECT label, category FROM vehicle_feature WHERE vehicle_id = $1", [id]);

        res.json({ ...result.rows[0], features: features.rows });
    } catch (error) {
        console.error("Error fetching public vehicle:", error);
        res.status(500).json({ error: "Failed to fetch vehicle" });
    }
});

// GET /public/vehicles/:id/seats - Get seats publicly
router.get("/vehicles/:id/seats", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            "SELECT * FROM seat WHERE vehicle_id = $1 ORDER BY andar, posicao_y, posicao_x",
            [id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching public seats:", error);
        res.status(500).json({ error: "Failed to fetch seats" });
    }
});

// GET /public/trips/:id/reserved-seats - Get reserved seats for a trip
router.get("/trips/:id/reserved-seats", async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT s.numero as seat_number 
             FROM reservations r
             JOIN seat s ON r.seat_id = s.id
             WHERE r.trip_id = $1 AND r.status != $2`,
            [id, ReservationStatus.CANCELLED]
        );
        res.json(result.rows.map(r => r.seat_number));
    } catch (error) {
        console.error("Error fetching reserved seats:", error);
        res.status(500).json({ error: "Failed to fetch reserved seats" });
    }
});

// POST /public/charters - Request a charter quote
router.post("/charters", async (req, res) => {
    try {
        const {
            contact_name, contact_email, contact_phone, company_name,
            origin_city, origin_state, destination_city, destination_state,
            departure_date, departure_time, return_date, return_time,
            passenger_count, vehicle_type_requested,
            description, organization_id // Frontend must send this
        } = req.body;

        if (!organization_id) {
            return res.status(400).json({ error: "Organization ID is required" });
        }

        const result = await pool.query(
            `INSERT INTO charter_requests (
                contact_name, contact_email, contact_phone, company_name,
                origin_city, origin_state, destination_city, destination_state,
                departure_date, departure_time, return_date, return_time,
                passenger_count, vehicle_type_requested,
                description, status,
                organization_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            RETURNING id`,
            [
                contact_name, contact_email, contact_phone, company_name || null,
                origin_city, origin_state, destination_city, destination_state,
                departure_date, departure_time || null, return_date || null, return_time || null,
                passenger_count, vehicle_type_requested || null,
                description || null, FretamentoStatus.REQUEST, organization_id
            ]
        );

        res.status(201).json({ success: true, id: result.rows[0].id });
    } catch (error) {
        console.error("Error submitting charter request:", error);
        res.status(500).json({ error: "Failed to submit charter request" });
    }
});

// POST /public/parcels - Request parcel shipping
router.post("/parcels", async (req, res) => {
    try {
        const {
            sender_name, sender_document, sender_phone,
            recipient_name, recipient_document, recipient_phone,
            origin_city, origin_state, destination_city, destination_state,
            description, weight, dimensions,
            organization_id // Frontend must send this
        } = req.body;

        if (!organization_id) {
            return res.status(400).json({ error: "Organization ID is required" });
        }

        // Generate temporary tracking code
        const crypto = await import("crypto");
        const tracking_code = 'REQ-' + crypto.randomBytes(3).toString('hex').toUpperCase();

        const result = await pool.query(
            `INSERT INTO parcel_orders (
                sender_name, sender_document, sender_phone,
                recipient_name, recipient_document, recipient_phone,
                origin_city, origin_state, destination_city, destination_state,
                description, weight, dimensions,
                status, tracking_code, price,
                organization_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            RETURNING id, tracking_code`,
            [
                sender_name, sender_document, sender_phone,
                recipient_name, recipient_document, recipient_phone,
                origin_city, origin_state, destination_city, destination_state,
                description, weight || 0, dimensions || null,
                EncomendaStatus.AWAITING, tracking_code, 0, organization_id
            ]
        );

        res.status(201).json({ success: true, id: result.rows[0].id, tracking_code: result.rows[0].tracking_code });
    } catch (error) {
        console.error("Error submitting parcel request:", error);
        res.status(500).json({ error: "Failed to submit parcel request" });
    }
});

// POST /public/client/login - Custom login endpoint that accepts username/CPF/phone
router.post("/client/login", async (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ error: "Identificador e senha são obrigatórios" });
        }

        let email: string | null = null;
        let username: string | null = null;

        // If identifier contains @, it's an email
        if (identifier.includes('@')) {
            email = identifier;
        } else {
            // Try to find user by username first
            const usernameResult = await pool.query(
                'SELECT email, username FROM "user" WHERE LOWER(username) = LOWER($1)',
                [identifier]
            );

            if (usernameResult.rows.length > 0) {
                email = usernameResult.rows[0].email;
                username = usernameResult.rows[0].username;
            } else {
                // If not found by username, search by CPF in clients table
                const clientResult = await pool.query(
                    `SELECT c.email, u.username 
                     FROM clients c
                     JOIN "user" u ON c.user_id = u.id
                     WHERE c.documento ILIKE $1
                     LIMIT 1`,
                    [`%${identifier}%`]
                );

                if (clientResult.rows.length === 0) {
                    return res.status(404).json({ error: "Identificador não encontrado" });
                }

                email = clientResult.rows[0].email;
                username = clientResult.rows[0].username;
            }
        }

        // If email is null or empty, we can't authenticate
        if (!email) {
            return res.status(400).json({ error: "Usuário não possui email cadastrado. Entre em contato com o suporte." });
        }

        console.log(`[CLIENT LOGIN] Attempting authentication for email: ${email}, username: ${username || 'N/A'}`);

        // Debug: Check if account exists in database
        const accountDebug = await pool.query(
            `SELECT a.id, a."providerId", a."accountId", u.email as user_email, u.username
             FROM account a
             JOIN "user" u ON a."userId" = u.id
             WHERE u.email = $1 OR u.username = $2`,
            [email, username || '']
        );

        if (accountDebug.rows.length > 0) {
            console.log('[CLIENT LOGIN] Found accounts:', accountDebug.rows.map(a => ({
                provider: a.providerId,
                accountId: a.accountId,
                userEmail: a.user_email,
                username: a.username
            })));
        } else {
            console.log('[CLIENT LOGIN] No accounts found for this user in database');
        }

        // Now authenticate using better-auth with the resolved email
        // We use asResponse: true to get the full response with Set-Cookie headers
        const authResponse = await auth.api.signInEmail({
            body: {
                email,
                password
            },
            asResponse: true
        });

        if (!authResponse.ok) {
            const errorData = await authResponse.json();
            console.error('[CLIENT LOGIN] Auth error:', errorData.error);

            // Check if it's a credential not found error
            if (errorData.error?.message?.includes('Credential account not found')) {
                return res.status(401).json({
                    error: "Este usuário não possui senha cadastrada. Use o login via WhatsApp ou redefina sua senha."
                });
            }

            return res.status(401).json({ error: "Credenciais incorretas" });
        }

        // Copy Set-Cookie and other important headers to Express response
        authResponse.headers.forEach((value, key) => {
            if (key.toLowerCase() === 'set-cookie') {
                res.append(key, value);
            } else if (key.toLowerCase() === 'content-type') {
                // Skip content-type as we will set it via res.json
            } else {
                res.setHeader(key, value);
            }
        });

        const data = await authResponse.json();
        console.log(`[CLIENT LOGIN] Success! User: ${username || email}`);

        res.json({
            success: true,
            user: data.user,
            session: data.session
        });

    } catch (error: any) {
        console.error("Error in client login:", error);
        res.status(500).json({ error: "Erro ao realizar login" });
    }
});

// POST /public/client/signup - Register a new client
router.post("/client/signup", async (req, res) => {
    try {
        const {
            tipo_cliente, name, username, email, password, phone,
            documento_tipo, documento,
            razao_social, nome_fantasia, cnpj,
            organization_id
        } = req.body;

        // 1. Validate Required Fields
        if (!email || !password || !name || !username) {
            return res.status(400).json({ error: "Nome, username, email e senha são obrigatórios" });
        }

        if (username.length < 3) {
            return res.status(400).json({ error: "Username deve ter no mínimo 3 caracteres" });
        }

        // 2. Validate Username Format (alphanumeric + underscore only)
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return res.status(400).json({ error: "Username deve conter apenas letras, números e underscore" });
        }

        // 3. Validate Password Strength
        if (password.length < 8) {
            return res.status(400).json({ error: "Senha deve ter no mínimo 8 caracteres" });
        }

        // 4. Check Username Uniqueness
        const usernameCheck = await pool.query(
            'SELECT id FROM "user" WHERE LOWER(username) = LOWER($1)',
            [username]
        );
        if (usernameCheck.rows.length > 0) {
            return res.status(400).json({ error: "Username já está em uso" });
        }

        // 5. Check Email Uniqueness
        const emailCheck = await pool.query(
            'SELECT id FROM "user" WHERE LOWER(email) = LOWER($1)',
            [email]
        );
        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ error: "Email já está cadastrado" });
        }

        // 6. Validate Corporate Fields (if PJ)
        if (tipo_cliente === 'PESSOA_JURIDICA') {
            if (!razao_social || !cnpj) {
                return res.status(400).json({ error: "Razão Social e CNPJ são obrigatórios para Pessoa Jurídica" });
            }

            // Validate CNPJ format
            const cleanCNPJ = cnpj.replace(/\D/g, '');
            if (cleanCNPJ.length !== 14) {
                return res.status(400).json({ error: "CNPJ inválido" });
            }
        }

        // 7. Create User in Better Auth
        const authResponse = await auth.api.signUpEmail({
            body: {
                email,
                password,
                name
            }
        }) as any;

        if (!authResponse || !authResponse.user) {
            return res.status(500).json({ error: "Falha ao criar conta de autenticação" });
        }

        const userId = authResponse.user.id;

        // 8. Atomic Update of Custom Fields (Standardize accountId to username)
        await pool.query(
            `UPDATE "user" SET role = $1, documento_tipo = $2, documento = $3, phone = $4, username = $5 WHERE id = $6`,
            ['client', documento_tipo || 'CPF', documento || null, phone || null, username, userId]
        );

        await pool.query(
            `UPDATE account SET "accountId" = $1 WHERE "userId" = $2 AND "providerId" = 'credential'`,
            [username, userId]
        );

        // 9. Create Client Profile
        await pool.query(
            `INSERT INTO clients (
                tipo_cliente, nome, email, telefone, 
                documento_tipo, documento,
                razao_social, nome_fantasia, cnpj,
                organization_id, user_id,
                data_cadastro, saldo_creditos
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, 0)`,
            [
                tipo_cliente || 'PESSOA_FISICA',
                name,
                email,
                phone || null,
                documento_tipo || 'CPF',
                documento || null,
                razao_social || null,
                nome_fantasia || null,
                cnpj || null,
                organization_id || null,
                userId
            ]
        );

        // Audit Log
        AuditService.logEvent({
            userId: userId,
            organizationId: organization_id as string,
            action: 'USER_CREATE',
            entity: 'user',
            entityId: userId,
            newData: { username, email, name, role: 'client' },
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
        }).catch(console.error);

        console.log(`[CLIENT SIGNUP] Success: ${username} (${email})`);
        res.json({ success: true, user: authResponse.user, session: authResponse.session });


    } catch (error: any) {
        console.error("Error signing up client:", error);

        // Handle better-auth specific errors
        if (error.body?.message) {
            return res.status(400).json({ error: error.body.message });
        }

        res.status(500).json({ error: error.message || "Falha ao realizar cadastro" });
    }
});

// GET /public/settings - Get portal public settings (logo, title, etc)
router.get("/settings", async (req, res) => {
    try {
        // We can pass an organization_id via query or use a default one
        // For now, let's allow fetching by organization_id
        const { organization_id } = req.query;
        let orgId = organization_id as string;

        if (!orgId) {
            // If no org specified, try to find the first organization
            const orgResult = await pool.query('SELECT id FROM "organization" LIMIT 1');
            if (orgResult.rows.length === 0) {
                return res.status(404).json({ error: "No organization found" });
            }
            orgId = orgResult.rows[0].id;
        }

        const whitelistedKeys = [
            'portal_logo_text',
            'portal_header_slogan',
            'portal_hero_title',
            'portal_hero_subtitle',
            'portal_footer_description',
            'portal_contact_phone',
            'portal_contact_email',
            'portal_contact_address',
            'portal_social_instagram',
            'portal_social_facebook',
            'portal_copyright'
        ];

        const result = await pool.query(
            "SELECT key, value FROM system_parameters WHERE organization_id = $1 AND key = ANY($2)",
            [orgId, whitelistedKeys]
        );

        // Convert rows to an object
        const settings = result.rows.reduce((acc: any, row) => {
            acc[row.key] = row.value;
            return acc;
        }, {});

        res.json(settings);
    } catch (error) {
        console.error("Error fetching public settings:", error);
        res.status(500).json({ error: "Failed to fetch settings" });
    }
});

// GET /public/tags - List trip tags publicly
router.get("/tags", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM trip_tags ORDER BY nome ASC"
        );
        res.json(result.rows);
    } catch (error) {
        console.error("Error fetching public tags:", error);
        res.status(500).json({ error: "Failed to fetch tags" });
    }
});

// GET /public/resolve-identifier - Find email by CPF, Phone, or Username
router.get("/resolve-identifier", async (req, res) => {
    try {
        const { identifier } = req.query;
        if (!identifier) return res.status(400).json({ error: "Identifier is required" });

        const searchTerm = identifier as string;

        // First, try to find by username in user table
        const usernameResult = await pool.query(
            'SELECT email FROM "user" WHERE LOWER(username) = LOWER($1) AND role = $2 LIMIT 1',
            [searchTerm, 'client']
        );

        if (usernameResult.rows.length > 0) {
            return res.json({ email: usernameResult.rows[0].email });
        }

        // If not found by username, search by CPF, phone, or email in clients table
        const clientResult = await pool.query(
            `SELECT email FROM clients 
             WHERE documento ILIKE $1 
                OR telefone ILIKE $1 
                OR email ILIKE $1 
             LIMIT 1`,
            [`%${searchTerm}%`]
        );

        if (clientResult.rows.length === 0) {
            return res.status(404).json({ error: "Identificador não encontrado" });
        }

        res.json({ email: clientResult.rows[0].email });
    } catch (error) {
        console.error("Error resolving identifier:", error);
        res.status(500).json({ error: "Failed to resolve identifier" });
    }
});

export default router;
