import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { requireRole, pool } from "@/lib/auth.server";
import crypto from "crypto";

// GET /api/admin/organizations
export async function loader({ request }: LoaderFunctionArgs) {
    await requireRole(request, ['admin']);

    const result = await pool.query('SELECT * FROM organization ORDER BY "createdAt" DESC');
    return data(result.rows);
}

// POST/DELETE /api/admin/organizations
export async function action({ request }: ActionFunctionArgs) {
    await requireRole(request, ['admin']);

    if (request.method === "POST") {
        const body = await request.json();
        const { name, slug, intent } = body;

        if (intent === "delete") {
            return data({ error: "Delete not supported on this endpoint. Use /api/admin/organizations/:id instead." }, { status: 400 });
        }

        // If pure POST creation
        const newId = crypto.randomUUID();
        const result = await pool.query(
            'INSERT INTO organization (id, name, slug, "createdAt") VALUES ($1, $2, $3, NOW()) RETURNING *',
            [newId, name, slug]
        );
        return data(result.rows[0], { status: 201 });
    }

    return data({ error: "Method not allowed" }, { status: 405 });
}
