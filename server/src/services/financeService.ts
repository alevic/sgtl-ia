import { db } from "../db/drizzle.js";
import { bankAccounts, costCenters, transactions, categories } from "../db/schema.js";
import { eq, and, sql } from "drizzle-orm";
import {
    TipoTransacao,
    StatusTransacao,
    CategoriaReceita,
    CategoriaDespesa,
    ClassificacaoContabil
} from "../types.js";

export class FinanceService {
    /**
     * Obtém o ID de um Centro de Custo pelo nome e organização.
     * Útil para mapear legados ou padrões (ADMINISTRATIVO, VENDAS, ESTOQUE).
     */
    static async getCostCenterIdByName(name: string, organizationId: string): Promise<string | null> {
        const [result] = await db.select({ id: costCenters.id })
            .from(costCenters)
            .where(and(
                eq(costCenters.name, name),
                eq(costCenters.organization_id, organizationId)
            ))
            .limit(1);
        return result?.id || null;
    }

    /**
     * Obtém o ID de uma Categoria pelo nome e organização.
     */
    static async getCategoryIdByName(name: string, organizationId: string): Promise<string | null> {
        const [result] = await db.select({ id: categories.id })
            .from(categories)
            .where(and(
                eq(categories.name, name),
                eq(categories.organization_id, organizationId)
            ))
            .limit(1);
        return result?.id || null;
    }

    /**
     * Garante que uma transação automática seja criada para uma Manutenção.
     */
    static async createMaintenanceTransaction(maintenance: any) {
        const {
            id: maintenance_id,
            type: maintenance_type,
            cost_parts,
            cost_labor,
            moeda,
            organization_id,
            created_by,
            description,
            scheduled_date
        } = maintenance;

        const totalAmount = (Number(cost_parts) || 0) + (Number(cost_labor) || 0);
        if (totalAmount <= 0) return null;

        // Buscar Centro de Custo ESTOQUE por padrão para manutenções
        const costCenterId = await this.getCostCenterIdByName('ESTOQUE', organization_id);
        const categoryId = await this.getCategoryIdByName('MANUTENCAO', organization_id);

        const [newTransaction] = await db.insert(transactions)
            .values({
                type: TipoTransacao.EXPENSE,
                description: `Manutenção Automática: ${description || maintenance_type}`,
                amount: totalAmount.toString(),
                currency: moeda || 'BRL',
                date: new Date(scheduled_date || new Date().toISOString()),
                status: StatusTransacao.PENDING,
                category: CategoriaDespesa.MANUTENCAO,
                category_id: categoryId,
                maintenance_id: maintenance_id,
                organization_id,
                created_by,
                cost_center_id: costCenterId,
                classificacao_contabil: ClassificacaoContabil.CUSTO_VARIAVEL
            })
            .returning();

        return newTransaction.id;
    }

    /**
     * Garante que uma transação automática seja criada para uma Reserva (Admin).
     */
    static async createReservationTransaction(reservation: any) {
        const {
            id: reservation_id,
            ticket_code,
            price,
            amount_paid,
            payment_method,
            organization_id,
            created_by,
            client_id,
            created_at
        } = reservation;

        if (!price || Number(price) <= 0) return null;

        const costCenterId = await this.getCostCenterIdByName('VENDAS', organization_id);

        const amount = Number(price);
        const paidAmount = Number(amount_paid || 0);
        const categoryId = await this.getCategoryIdByName('VENDA_PASSAGEM', organization_id);
        const isFullyPaid = paidAmount >= amount;

        const [newTransaction] = await db.insert(transactions)
            .values({
                type: TipoTransacao.INCOME,
                description: `Reserva: ${ticket_code}`,
                amount: amount.toString(),
                currency: 'BRL',
                date: new Date(created_at || new Date().toISOString()),
                status: isFullyPaid ? StatusTransacao.PAID : (paidAmount > 0 ? StatusTransacao.PARTIALLY_PAID : StatusTransacao.PENDING),
                category: CategoriaReceita.VENDA_PASSAGEM,
                category_id: categoryId,
                reservation_id: reservation_id,
                organization_id,
                created_by,
                client_id: client_id,
                payment_method: payment_method || null,
                cost_center_id: costCenterId,
                payment_date: isFullyPaid ? new Date(created_at || new Date().toISOString()) : null
            })
            .returning();

        return newTransaction.id;
    }

    /**
     * Atualiza o saldo de uma conta bancária com base nas transações liquidadas.
     */
    static async updateBankAccountBalance(bankAccountId: string, organizationId: string) {
        // Drizzle version for complex balance update
        const balanceSubquery = db.select({
            balance: sql<number>`SUM(CASE WHEN ${transactions.type} = 'INCOME' THEN ${transactions.amount} ELSE -${transactions.amount} END)`.as('balance')
        })
            .from(transactions)
            .where(and(
                eq(transactions.bank_account_id, bankAccountId),
                eq(transactions.status, 'PAID')
            ));

        await db.update(bankAccounts)
            .set({
                current_balance: sql`${bankAccounts.initial_balance} + COALESCE((${balanceSubquery}), 0)`,
                updated_at: new Date()
            })
            .where(and(
                eq(bankAccounts.id, bankAccountId),
                eq(bankAccounts.organization_id, organizationId)
            ));
    }
}
