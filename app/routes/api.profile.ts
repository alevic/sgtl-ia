import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { requireAuth, pool } from "@/lib/auth.server";

// GET /api/profile - Get current user profile
export async function loader({ request }: LoaderFunctionArgs) {
    const session = await requireAuth(request);

    const result = await pool.query(
        'SELECT id, username, name, email, phone, cpf, birth_date, role, image FROM "user" WHERE id = $1',
        [session.user.id]
    );

    if (result.rows.length === 0) {
        throw new Response("Usuário não encontrado", { status: 404 });
    }

    return data(result.rows[0]);
}

// PUT /api/profile - Update current user profile
export async function action({ request }: ActionFunctionArgs) {
    const session = await requireAuth(request);

    if (request.method === "PUT") {
        const body = await request.json();
        const { name, email, phone, cpf, birthDate, image } = body;

        // Validate required fields
        if (!name || !phone) {
            return data({ error: "Nome e telefone são obrigatórios" }, { status: 400 });
        }

        // Check if email is already in use by another user
        if (email) {
            const emailCheck = await pool.query(
                'SELECT id FROM "user" WHERE email = $1 AND id != $2',
                [email, session.user.id]
            );
            if (emailCheck.rows.length > 0) {
                return data({ error: "Email já está em uso" }, { status: 400 });
            }
        }

        // Check if phone is already in use by another user
        const phoneCheck = await pool.query(
            'SELECT id FROM "user" WHERE phone = $1 AND id != $2',
            [phone, session.user.id]
        );
        if (phoneCheck.rows.length > 0) {
            return data({ error: "Telefone já está em uso" }, { status: 400 });
        }

        // Check if CPF is already in use by another user
        if (cpf) {
            const cpfCheck = await pool.query(
                'SELECT id FROM "user" WHERE cpf = $1 AND id != $2',
                [cpf, session.user.id]
            );
            if (cpfCheck.rows.length > 0) {
                return data({ error: "CPF já está em uso" }, { status: 400 });
            }
        }

        // Build dynamic query
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

        return data({ success: true });
    }

    return data({ error: "Method not allowed" }, { status: 405 });
}
