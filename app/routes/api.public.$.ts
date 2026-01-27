import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { pool, auth } from "@/lib/auth.server";
import crypto from "crypto";

// Catch-all route for /api/public/*
// This handles: routes, trips, vehicles, tags, settings, client auth, etc.

export async function loader({ request, params }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const path = params["*"] || "";
    const segments = path.split("/").filter(Boolean);

    try {
        // GET /api/public/routes
        if (segments[0] === "routes" && segments.length === 1) {
            const result = await pool.query(
                "SELECT id, name, origin_city, origin_state, destination_city, destination_state FROM routes WHERE active = true ORDER BY name ASC"
            );
            return data(result.rows);
        }

        // GET /api/public/trips
        if (segments[0] === "trips" && segments.length === 1) {
            const origin_city = url.searchParams.get("origin_city");
            const destination_city = url.searchParams.get("destination_city");
            const date = url.searchParams.get("date");

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
                WHERE t.status IN ('SCHEDULED', 'AGENDADA', 'CONFIRMADA', 'CONFIRMED') AND (t.active = true OR t.active IS NULL)
            `;
            const params: any[] = [];
            let paramCount = 0;

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
            return data(result.rows);
        }

        // GET /api/public/trips/:id
        if (segments[0] === "trips" && segments.length === 2) {
            const id = segments[1];
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
                throw new Response("Trip not found", { status: 404 });
            }
            return data(result.rows[0]);
        }

        // GET /api/public/trips/:id/reserved-seats
        if (segments[0] === "trips" && segments.length === 3 && segments[2] === "reserved-seats") {
            const id = segments[1];
            const result = await pool.query(
                `SELECT s.numero as seat_number 
                 FROM reservations r
                 JOIN seat s ON r.seat_id = s.id
                 WHERE r.trip_id = $1 AND r.status != 'CANCELLED'`,
                [id]
            );
            return data(result.rows.map((r: any) => r.seat_number));
        }

        // GET /api/public/vehicles/:id
        if (segments[0] === "vehicles" && segments.length === 2) {
            const id = segments[1];
            const result = await pool.query(
                "SELECT id, modelo, placa, ano, tipo, capacidade_passageiros, imagem, galeria, is_double_deck FROM vehicle WHERE id = $1",
                [id]
            );
            if (result.rows.length === 0) {
                throw new Response("Vehicle not found", { status: 404 });
            }
            const features = await pool.query("SELECT label, category FROM vehicle_feature WHERE vehicle_id = $1", [id]);
            return data({ ...result.rows[0], features: features.rows });
        }

        // GET /api/public/vehicles/:id/seats
        if (segments[0] === "vehicles" && segments.length === 3 && segments[2] === "seats") {
            const id = segments[1];
            const result = await pool.query(
                "SELECT * FROM seat WHERE vehicle_id = $1 ORDER BY andar, posicao_y, posicao_x",
                [id]
            );
            return data(result.rows);
        }

        // GET /api/public/tags
        if (segments[0] === "tags" && segments.length === 1) {
            const result = await pool.query("SELECT * FROM trip_tags ORDER BY nome ASC");
            return data(result.rows);
        }

        // GET /api/public/settings
        if (segments[0] === "settings" && segments.length === 1) {
            let orgId = url.searchParams.get("organization_id");

            if (!orgId) {
                const orgResult = await pool.query('SELECT id FROM "organization" LIMIT 1');
                if (orgResult.rows.length === 0) {
                    throw new Response("No organization found", { status: 404 });
                }
                orgId = orgResult.rows[0].id;
            }

            const whitelistedKeys = [
                'portal_logo_text', 'portal_header_slogan', 'portal_hero_title',
                'portal_hero_subtitle', 'portal_footer_description', 'portal_contact_phone',
                'portal_contact_email', 'portal_contact_address', 'portal_social_instagram',
                'portal_social_facebook', 'portal_copyright'
            ];

            const result = await pool.query(
                "SELECT key, value FROM system_parameters WHERE organization_id = $1 AND key = ANY($2)",
                [orgId, whitelistedKeys]
            );

            const settings = result.rows.reduce((acc: any, row: any) => {
                acc[row.key] = row.value;
                return acc;
            }, {});

            return data(settings);
        }

        // GET /api/public/parameters
        if (segments[0] === "parameters" && segments.length === 1) {
            const orgId = url.searchParams.get("organizationId");

            let query = "SELECT key, value FROM system_parameters";
            const params: any[] = [];

            if (orgId) {
                query += " WHERE organization_id = $1";
                params.push(orgId);
            }

            const result = await pool.query(query, params);
            return data(result.rows);
        }

        // GET /api/public/resolve-identifier
        if (segments[0] === "resolve-identifier" && segments.length === 1) {
            const identifier = url.searchParams.get("identifier");
            if (!identifier) {
                return data({ error: "Identifier is required" }, { status: 400 });
            }

            const usernameResult = await pool.query(
                'SELECT email FROM "user" WHERE LOWER(username) = LOWER($1) AND role = $2 LIMIT 1',
                [identifier, 'client']
            );

            if (usernameResult.rows.length > 0) {
                return data({ email: usernameResult.rows[0].email });
            }

            const clientResult = await pool.query(
                `SELECT email FROM clients 
                 WHERE documento ILIKE $1 
                    OR telefone ILIKE $1 
                    OR email ILIKE $1 
                 LIMIT 1`,
                [`%${identifier}%`]
            );

            if (clientResult.rows.length === 0) {
                throw new Response("Identificador não encontrado", { status: 404 });
            }

            return data({ email: clientResult.rows[0].email });
        }

        throw new Response("Not found", { status: 404 });

    } catch (error: any) {
        console.error("Error in public API:", error);
        if (error instanceof Response) throw error;
        return data({ error: error.message || "Internal server error" }, { status: 500 });
    }
}

export async function action({ request, params }: ActionFunctionArgs) {
    const path = params["*"] || "";
    const segments = path.split("/").filter(Boolean);

    try {
        // POST /api/public/client/login
        if (segments[0] === "client" && segments[1] === "login") {
            const body = await request.json();
            const { identifier, password } = body;

            if (!identifier || !password) {
                return data({ error: "Identificador e senha são obrigatórios" }, { status: 400 });
            }

            let email: string | null = null;
            let username: string | null = null;

            if (identifier.includes('@')) {
                email = identifier;
            } else {
                const usernameResult = await pool.query(
                    'SELECT email, username FROM "user" WHERE LOWER(username) = LOWER($1)',
                    [identifier]
                );

                if (usernameResult.rows.length > 0) {
                    email = usernameResult.rows[0].email;
                    username = usernameResult.rows[0].username;
                } else {
                    const clientResult = await pool.query(
                        `SELECT c.email, u.username 
                         FROM clients c
                         JOIN "user" u ON c.user_id = u.id
                         WHERE c.documento ILIKE $1
                         LIMIT 1`,
                        [`%${identifier}%`]
                    );

                    if (clientResult.rows.length === 0) {
                        return data({ error: "Identificador não encontrado" }, { status: 404 });
                    }

                    email = clientResult.rows[0].email;
                    username = clientResult.rows[0].username;
                }
            }

            if (!email) {
                return data({ error: "Usuário não possui email cadastrado" }, { status: 400 });
            }

            const authResponse = await auth.api.signInEmail({
                body: { email, password },
                asResponse: true
            });

            if (!authResponse.ok) {
                return data({ error: "Credenciais incorretas" }, { status: 401 });
            }

            const authData = await authResponse.json();

            // Return with cookies
            const headers = new Headers();
            authResponse.headers.forEach((value, key) => {
                if (key.toLowerCase() === 'set-cookie') {
                    headers.append(key, value);
                }
            });

            return new Response(JSON.stringify({
                success: true,
                user: authData.user,
                session: authData.session
            }), {
                headers: {
                    ...Object.fromEntries(headers),
                    'Content-Type': 'application/json'
                }
            });
        }

        // POST /api/public/client/signup
        if (segments[0] === "client" && segments[1] === "signup") {
            const body = await request.json();
            const {
                tipo_cliente, name, username, email, password, phone,
                documento_tipo, documento, razao_social, nome_fantasia, cnpj, organization_id
            } = body;

            if (!email || !password || !name || !username) {
                return data({ error: "Nome, username, email e senha são obrigatórios" }, { status: 400 });
            }

            if (username.length < 3) {
                return data({ error: "Username deve ter no mínimo 3 caracteres" }, { status: 400 });
            }

            if (password.length < 8) {
                return data({ error: "Senha deve ter no mínimo 8 caracteres" }, { status: 400 });
            }

            // Check uniqueness
            const usernameCheck = await pool.query(
                'SELECT id FROM "user" WHERE LOWER(username) = LOWER($1)',
                [username]
            );
            if (usernameCheck.rows.length > 0) {
                return data({ error: "Username já está em uso" }, { status: 400 });
            }

            const emailCheck = await pool.query(
                'SELECT id FROM "user" WHERE LOWER(email) = LOWER($1)',
                [email]
            );
            if (emailCheck.rows.length > 0) {
                return data({ error: "Email já está cadastrado" }, { status: 400 });
            }

            // Create user via Better Auth
            const authResponse = await auth.api.signUpEmail({
                body: { email, password, name }
            }) as any;

            if (!authResponse || !authResponse.user) {
                return data({ error: "Falha ao criar conta" }, { status: 500 });
            }

            const userId = authResponse.user.id;

            // Update user fields
            await pool.query(
                `UPDATE "user" SET role = $1, documento_tipo = $2, documento = $3, phone = $4, username = $5 WHERE id = $6`,
                ['client', documento_tipo || 'CPF', documento || null, phone || null, username, userId]
            );

            await pool.query(
                `UPDATE account SET "accountId" = $1 WHERE "userId" = $2 AND "providerId" = 'credential'`,
                [username, userId]
            );

            // Create client profile
            await pool.query(
                `INSERT INTO clients (
                    tipo_cliente, nome, email, telefone, documento_tipo, documento,
                    razao_social, nome_fantasia, cnpj,
                    organization_id, user_id, data_cadastro, saldo_creditos
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, 0)`,
                [
                    tipo_cliente || 'PESSOA_FISICA', name, email, phone || null,
                    documento_tipo || 'CPF', documento || null,
                    razao_social || null, nome_fantasia || null, cnpj || null,
                    organization_id || null, userId
                ]
            );

            return data({ success: true, user: authResponse.user, session: authResponse.session });
        }

        // POST /api/public/charters
        if (segments[0] === "charters" && segments.length === 1) {
            const body = await request.json();
            const {
                contact_name, contact_email, contact_phone, company_name,
                origin_city, origin_state, destination_city, destination_state,
                departure_date, departure_time, return_date, return_time,
                passenger_count, vehicle_type_requested, description, organization_id
            } = body;

            if (!organization_id) {
                return data({ error: "Organization ID is required" }, { status: 400 });
            }

            const result = await pool.query(
                `INSERT INTO charter_requests (
                    contact_name, contact_email, contact_phone, company_name,
                    origin_city, origin_state, destination_city, destination_state,
                    departure_date, departure_time, return_date, return_time,
                    passenger_count, vehicle_type_requested, description, status, organization_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                RETURNING id`,
                [
                    contact_name, contact_email, contact_phone, company_name || null,
                    origin_city, origin_state, destination_city, destination_state,
                    departure_date, departure_time || null, return_date || null, return_time || null,
                    passenger_count, vehicle_type_requested || null, description || null,
                    'REQUEST', organization_id
                ]
            );

            return data({ success: true, id: result.rows[0].id }, { status: 201 });
        }

        // POST /api/public/parcels
        if (segments[0] === "parcels" && segments.length === 1) {
            const body = await request.json();
            const {
                sender_name, sender_document, sender_phone,
                recipient_name, recipient_document, recipient_phone,
                origin_city, origin_state, destination_city, destination_state,
                description, weight, dimensions, organization_id
            } = body;

            if (!organization_id) {
                return data({ error: "Organization ID is required" }, { status: 400 });
            }

            const tracking_code = 'REQ-' + crypto.randomBytes(3).toString('hex').toUpperCase();

            const result = await pool.query(
                `INSERT INTO parcel_orders (
                    sender_name, sender_document, sender_phone,
                    recipient_name, recipient_document, recipient_phone,
                    origin_city, origin_state, destination_city, destination_state,
                    description, weight, dimensions, status, tracking_code, price, organization_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                RETURNING id, tracking_code`,
                [
                    sender_name, sender_document, sender_phone,
                    recipient_name, recipient_document, recipient_phone,
                    origin_city, origin_state, destination_city, destination_state,
                    description, weight || 0, dimensions || null,
                    'AWAITING', tracking_code, 0, organization_id
                ]
            );

            return data({ success: true, id: result.rows[0].id, tracking_code: result.rows[0].tracking_code }, { status: 201 });
        }

        throw new Response("Not found", { status: 404 });

    } catch (error: any) {
        console.error("Error in public API action:", error);
        if (error instanceof Response) throw error;
        return data({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
