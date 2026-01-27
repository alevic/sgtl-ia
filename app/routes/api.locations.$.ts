import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { requireAuth, pool } from "@/lib/auth.server";

// Handles:
// GET /api/locations/states
// GET /api/locations/cities/:stateId
// GET /api/locations/neighborhoods/:cityId
export async function loader({ request, params }: LoaderFunctionArgs) {
    await requireAuth(request);
    const path = params["*"];

    if (path === "states") {
        const result = await pool.query("SELECT * FROM state ORDER BY name ASC");
        return data(result.rows);
    }

    if (path?.startsWith("cities/")) {
        const stateId = path.split("/")[1];
        if (stateId) {
            const result = await pool.query("SELECT * FROM city WHERE state_id = $1 ORDER BY name ASC", [stateId]);
            return data(result.rows);
        }
    }

    if (path?.startsWith("neighborhoods/")) {
        const cityId = path.split("/")[1];
        if (cityId) {
            const result = await pool.query("SELECT * FROM neighborhood WHERE city_id = $1 ORDER BY name ASC", [cityId]);
            return data(result.rows);
        }
    }

    return data({ error: "Route not found" }, { status: 404 });
}

// Handles POST/PUT/DELETE for cities and neighborhoods
export async function action({ request, params }: ActionFunctionArgs) {
    await requireAuth(request);
    const path = params["*"]; // e.g. "cities", "cities/123"

    // Helper to get ID from path "entities/ID"
    const getId = () => path?.split("/")[1];

    if (request.method === "POST") {
        const body = await request.json();

        if (path === "cities") {
            const { name, stateId } = body;
            if (!name || !stateId) return data({ error: "Name and State ID required" }, { status: 400 });
            try {
                const result = await pool.query("INSERT INTO city (name, state_id) VALUES ($1, $2) RETURNING *", [name, stateId]);
                return data(result.rows[0], { status: 201 });
            } catch (e: any) {
                if (e.code === '23505') return data({ error: "City already exists" }, { status: 409 });
                throw e;
            }
        }

        if (path === "neighborhoods") {
            const { name, cityId } = body;
            if (!name || !cityId) return data({ error: "Name and City ID required" }, { status: 400 });
            try {
                const result = await pool.query("INSERT INTO neighborhood (name, city_id) VALUES ($1, $2) RETURNING *", [name, cityId]);
                return data(result.rows[0], { status: 201 });
            } catch (e: any) {
                if (e.code === '23505') return data({ error: "Neighborhood already exists" }, { status: 409 });
                throw e;
            }
        }
    }

    if (request.method === "PUT") {
        const id = getId();
        if (!id) return data({ error: "ID required" }, { status: 400 });
        const body = await request.json();
        const { name } = body;

        if (path?.startsWith("cities/")) {
            try {
                const result = await pool.query("UPDATE city SET name = $1 WHERE id = $2 RETURNING *", [name, id]);
                if (result.rows.length === 0) return data({ error: "Not found" }, { status: 404 });
                return data(result.rows[0]);
            } catch (e: any) {
                if (e.code === '23505') return data({ error: "Duplicate name" }, { status: 409 });
                throw e;
            }
        }

        if (path?.startsWith("neighborhoods/")) {
            try {
                const result = await pool.query("UPDATE neighborhood SET name = $1 WHERE id = $2 RETURNING *", [name, id]);
                if (result.rows.length === 0) return data({ error: "Not found" }, { status: 404 });
                return data(result.rows[0]);
            } catch (e: any) {
                if (e.code === '23505') return data({ error: "Duplicate name" }, { status: 409 });
                throw e;
            }
        }
    }

    if (request.method === "DELETE") {
        const id = getId();
        if (!id) return data({ error: "ID required" }, { status: 400 });

        if (path?.startsWith("cities/")) {
            // Check deps
            const check = await pool.query("SELECT count(*) FROM neighborhood WHERE city_id = $1", [id]);
            if (parseInt(check.rows[0].count) > 0) return data({ error: "Has dependencies" }, { status: 400 });

            const result = await pool.query("DELETE FROM city WHERE id = $1 RETURNING *", [id]);
            if (result.rows.length === 0) return data({ error: "Not found" }, { status: 404 });
            return data({ success: true });
        }

        if (path?.startsWith("neighborhoods/")) {
            const result = await pool.query("DELETE FROM neighborhood WHERE id = $1 RETURNING *", [id]);
            if (result.rows.length === 0) return data({ error: "Not found" }, { status: 404 });
            return data({ success: true });
        }
    }

    return data({ error: "Route/Method not found" }, { status: 404 });
}
