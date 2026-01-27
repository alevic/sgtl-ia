import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { requireRole, pool } from "@/lib/auth.server";

// Helper for date validation
const isValidDateISO = (dateString: string) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime());
};

// GET /api/fleet/drivers - List drivers
export async function loader({ request }: LoaderFunctionArgs) {
    const session = await requireRole(request, ['admin', 'operacional']);
    const orgId = (session as any).session.activeOrganizationId;

    const result = await pool.query(
        `SELECT * FROM driver WHERE organization_id = $1 ORDER BY created_at DESC`,
        [orgId]
    );

    return data(result.rows);
}

// POST /api/fleet/drivers - Create driver
export async function action({ request }: ActionFunctionArgs) {
    const session = await requireRole(request, ['admin', 'operacional']);
    const orgId = (session as any).session.activeOrganizationId;
    const userId = session.user.id;

    if (request.method === "POST") {
        const body = await request.json();
        const {
            nome, cnh, categoria_cnh, validade_cnh, passaporte, validade_passaporte,
            telefone, email, endereco, cidade, estado, pais, status,
            data_contratacao, salario, anos_experiencia, viagens_internacionais,
            disponivel_internacional, observacoes
        } = body;

        // Validation
        if (!isValidDateISO(validade_cnh)) {
            return data({ error: "Data de validade da CNH inválida" }, { status: 400 });
        }
        if (validade_passaporte && !isValidDateISO(validade_passaporte)) {
            return data({ error: "Data de validade do passaporte inválida" }, { status: 400 });
        }
        if (data_contratacao && !isValidDateISO(data_contratacao)) {
            return data({ error: "Data de contratação inválida" }, { status: 400 });
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
                status || 'AVAILABLE', data_contratacao, salario || null, anos_experiencia || null, viagens_internacionais || 0,
                disponivel_internacional || false, observacoes || null,
                orgId, userId
            ]
        );

        return data(result.rows[0]);
    }

    return data({ error: "Method not allowed" }, { status: 405 });
}
