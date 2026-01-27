import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { requireRole, pool } from "@/lib/auth.server";

// Catch-all route for /api/organization/*
// Handles: members, parameters, details

export async function loader({ request, params }: LoaderFunctionArgs) {
    const session = await requireRole(request, ['admin']);
    const orgId = (session as any).session.activeOrganizationId;
    const path = params["*"] || "";
    const segments = path.split("/").filter(Boolean);

    try {
        // GET /api/organization/members
        if (segments[0] === "members" && segments.length === 1) {
            const result = await pool.query(
                `SELECT m.*, u.name, u.email, u.image, u.username
                 FROM member m
                 JOIN "user" u ON m."userId" = u.id
                 WHERE m."organizationId" = $1`,
                [orgId]
            );
            return data(result.rows);
        }

        // GET /api/organization/candidates
        if (segments[0] === "candidates" && segments.length === 1) {
            const result = await pool.query(
                `SELECT u.id, u.name, u.email, u.image, u.username
                 FROM "user" u
                 WHERE u.id NOT IN (
                     SELECT "userId" FROM member WHERE "organizationId" = $1
                 )`,
                [orgId]
            );
            return data(result.rows);
        }

        // GET /api/organization/:id/details
        if (segments.length === 2 && segments[1] === "details") {
            const id = segments[0];
            const result = await pool.query(
                `SELECT * FROM "organization" WHERE id = $1`,
                [id]
            );
            if (result.rows.length === 0) {
                throw new Response("Organization not found", { status: 404 });
            }
            return data(result.rows[0]);
        }

        // GET /api/organization/:id/parameters
        if (segments.length === 2 && segments[1] === "parameters") {
            const id = segments[0];
            const result = await pool.query(
                `SELECT * FROM system_parameters WHERE organization_id = $1`,
                [id]
            );
            return data(result.rows);
        }

        throw new Response("Not found", { status: 404 });

    } catch (error: any) {
        if (error instanceof Response) throw error;
        console.error("Error in organization API:", error);
        return data({ error: error.message }, { status: 500 });
    }
}

export async function action({ request, params }: ActionFunctionArgs) {
    const session = await requireRole(request, ['admin']);
    const orgId = (session as any).session.activeOrganizationId;
    const userId = session.user.id;
    const path = params["*"] || "";
    const segments = path.split("/").filter(Boolean);

    try {
        // POST /api/organization/members - Add member
        if (request.method === "POST" && segments[0] === "members" && segments.length === 1) {
            const body = await request.json();
            let { userId: newUserId, role, email } = body;

            if (!newUserId && email) {
                const userResult = await pool.query(
                    `SELECT id FROM "user" WHERE email = $1`,
                    [email]
                );

                if (userResult.rows.length === 0) {
                    return data({ error: "Usuário não encontrado com este email." }, { status: 404 });
                }
                newUserId = userResult.rows[0].id;
            }

            if (!newUserId) {
                return data({ error: "Email ou ID do usuário obrigatório." }, { status: 400 });
            }

            // Check if already a member
            const existingMember = await pool.query(
                `SELECT id FROM member WHERE "organizationId" = $1 AND "userId" = $2`,
                [orgId, newUserId]
            );

            if (existingMember.rows.length > 0) {
                return data({ error: "Usuário já é membro desta organização." }, { status: 409 });
            }

            await pool.query(
                `INSERT INTO member (id, "organizationId", "userId", role, "createdAt")
                 VALUES (gen_random_uuid(), $1, $2, $3, NOW())`,
                [orgId, newUserId, role || 'member']
            );

            return data({ success: true });
        }

        // PUT /api/organization/members/:userId - Update member role
        if (request.method === "PUT" && segments[0] === "members" && segments.length === 2) {
            const memberId = segments[1];
            const body = await request.json();
            const { role } = body;

            await pool.query(
                `UPDATE member SET role = $1 WHERE "userId" = $2 AND "organizationId" = $3`,
                [role, memberId, orgId]
            );

            return data({ success: true });
        }

        // DELETE /api/organization/members/:userId - Remove member
        if (request.method === "DELETE" && segments[0] === "members" && segments.length === 2) {
            const memberId = segments[1];

            await pool.query(
                `DELETE FROM member WHERE "userId" = $1 AND "organizationId" = $2`,
                [memberId, orgId]
            );

            return data({ success: true });
        }

        // PUT /api/organization/:id/details - Update organization
        if (request.method === "PUT" && segments.length === 2 && segments[1] === "details") {
            const id = segments[0];
            const body = await request.json();
            const { name, logo, metadata } = body;

            await pool.query(
                `UPDATE "organization" SET name = $1, logo = $2, metadata = $3 WHERE id = $4`,
                [name, logo || null, metadata || null, id]
            );

            return data({ success: true });
        }

        // POST /api/organization/:id/parameters - Create parameter
        if (request.method === "POST" && segments.length === 2 && segments[1] === "parameters") {
            const id = segments[0];
            const body = await request.json();
            const { key, value } = body;

            await pool.query(
                `INSERT INTO system_parameters (organization_id, key, value)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (organization_id, key) DO UPDATE SET value = $3`,
                [id, key, value]
            );

            return data({ success: true });
        }

        // POST /api/organization/:id/parameters/batch - Batch update parameters
        if (request.method === "POST" && segments.length === 3 && segments[1] === "parameters" && segments[2] === "batch") {
            const id = segments[0];
            const body = await request.json();
            const { parameters } = body;

            for (const param of parameters) {
                await pool.query(
                    `INSERT INTO system_parameters (organization_id, key, value)
                     VALUES ($1, $2, $3)
                     ON CONFLICT (organization_id, key) DO UPDATE SET value = $3`,
                    [id, param.key, param.value]
                );
            }

            return data({ success: true });
        }

        // DELETE /api/organization/:id/parameters/:paramId
        if (request.method === "DELETE" && segments.length === 3 && segments[1] === "parameters") {
            const paramId = segments[2];

            await pool.query(`DELETE FROM system_parameters WHERE id = $1`, [paramId]);

            return data({ success: true });
        }

        throw new Response("Not found", { status: 404 });

    } catch (error: any) {
        if (error instanceof Response) throw error;
        console.error("Error in organization API:", error);
        return data({ error: error.message }, { status: 500 });
    }
}
