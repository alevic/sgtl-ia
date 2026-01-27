import type { ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { requireRole, pool } from "@/lib/auth.server";

// DELETE/PUT /api/admin/organizations/:id
export async function action({ request, params }: ActionFunctionArgs) {
    await requireRole(request, ['admin']);
    const { id } = params;

    if (request.method === "DELETE") {
        const result = await pool.query('DELETE FROM organization WHERE id = $1 RETURNING id', [id]);
        if (result.rowCount === 0) {
            return data({ error: "Not found" }, { status: 404 });
        }
        return data({ success: true });
    }

    if (request.method === "PUT") {
        const body = await request.json();
        const { name, slug } = body;
        const result = await pool.query(
            'UPDATE organization SET name = $1, slug = $2, "updatedAt" = NOW() WHERE id = $3 RETURNING *',
            [name, slug, id]
        );
        return data(result.rows[0]);
    }

    return data({ error: "Method not allowed" }, { status: 405 });
}
