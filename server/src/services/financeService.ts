import { db } from "../db/drizzle.js";
import { bankAccounts, costCenters, transactions, categories, tripTransactions } from "../db/schema.js";
import { eq, and, sql, desc } from "drizzle-orm";
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
            currency,
            organization_id,
            created_by,
            description,
            scheduled_date
        } = maintenance;

        const totalAmount = (Number(cost_parts) || 0) + (Number(cost_labor) || 0);
        if (totalAmount <= 0) return null;

        // Buscar Centro de Custo MANUTENÇÃO E OFICINA por padrão para manutenções
        const costCenterId = await this.getCostCenterIdByName('MANUTENÇÃO E OFICINA', organization_id);
        const categoryId = await this.getCategoryIdByName('Peças de Reposição', organization_id);

        const [newTransaction] = await db.insert(transactions)
            .values({
                type: TipoTransacao.EXPENSE,
                description: `Manutenção Automática: ${description || maintenance_type}`,
                amount: totalAmount.toString(),
                currency: currency || 'BRL',
                date: new Date(scheduled_date || new Date().toISOString()).toISOString().split('T')[0],
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
                date: new Date(created_at || new Date().toISOString()).toISOString().split('T')[0],
                status: isFullyPaid ? StatusTransacao.PAID : (paidAmount > 0 ? StatusTransacao.PARTIALLY_PAID : StatusTransacao.PENDING),
                category: CategoriaReceita.VENDA_PASSAGEM,
                category_id: categoryId,
                reservation_id: reservation_id,
                organization_id,
                created_by,
                client_id: client_id,
                payment_method: payment_method || null,
                cost_center_id: costCenterId,
                payment_date: isFullyPaid ? new Date(created_at || new Date().toISOString()).toISOString().split('T')[0] : null
            })
            .returning();

        // Vincular à viagem se houver trip_id
        if (reservation_id && reservation.trip_id) {
            await this.linkTransactionToTrip(newTransaction.id, reservation.trip_id, amount.toString(), `Automático: Reserva ${ticket_code}`);
        }

        return newTransaction.id;
    }

    /**
     * Garante que uma transação automática seja criada para uma Encomenda.
     */
    static async createParcelTransaction(parcel: any) {
        const {
            id: parcel_id,
            tracking_code,
            price,
            organization_id,
            created_by,
            client_id,
            trip_id,
            created_at
        } = parcel;

        if (!price || Number(price) <= 0) return null;

        const costCenterId = await this.getCostCenterIdByName('LOGÍSTICA E ALMOXARIFADO', organization_id);
        const categoryId = await this.getCategoryIdByName('Encomendas Expressas', organization_id);

        const [newTransaction] = await db.insert(transactions)
            .values({
                type: TipoTransacao.INCOME,
                description: `Encomenda: ${tracking_code}`,
                amount: price.toString(),
                currency: 'BRL',
                date: new Date(created_at || new Date().toISOString()).toISOString().split('T')[0],
                status: StatusTransacao.PAID,
                category_id: categoryId,
                parcel_id: parcel_id,
                organization_id,
                created_by,
                client_id: client_id,
                cost_center_id: costCenterId,
                payment_date: new Date(created_at || new Date().toISOString()).toISOString().split('T')[0]
            })
            .returning();

        if (trip_id) {
            await this.linkTransactionToTrip(newTransaction.id, trip_id, price.toString(), `Automático: Encomenda ${tracking_code}`);
        }

        return newTransaction.id;
    }

    /**
     * Vincula uma transação a uma viagem.
     */
    static async linkTransactionToTrip(transactionId: string, tripId: string, amountAllocated?: string, notes?: string) {
        await db.insert(tripTransactions)
            .values({
                transaction_id: transactionId,
                trip_id: tripId,
                amount_allocated: amountAllocated,
                notes: notes
            });
    }

    /**
     * Obtém o resumo financeiro de uma viagem detalhado (pago vs pendente).
     */
    static async getTripFinancialSummary(tripId: string) {
        const linkedTransactions = await db.select({
            type: transactions.type,
            status: transactions.status,
            amount: sql<string>`COALESCE(${tripTransactions.amount_allocated}, ${transactions.amount})`.as('amount')
        })
            .from(tripTransactions)
            .innerJoin(transactions, eq(tripTransactions.transaction_id, transactions.id))
            .where(eq(tripTransactions.trip_id, tripId));

        let totalIncome = 0;
        let paidIncome = 0;
        let pendingIncome = 0;

        let totalExpense = 0;
        let paidExpense = 0;
        let pendingExpense = 0;

        linkedTransactions.forEach(t => {
            const val = Number(t.amount) || 0;
            const isPaid = t.status === StatusTransacao.PAID;

            if (t.type === TipoTransacao.INCOME) {
                totalIncome += val;
                if (isPaid) paidIncome += val;
                else pendingIncome += val;
            } else if (t.type === TipoTransacao.EXPENSE) {
                totalExpense += val;
                if (isPaid) paidExpense += val;
                else pendingExpense += val;
            }
        });

        return {
            totalIncome,
            paidIncome,
            pendingIncome,
            totalExpense,
            paidExpense,
            pendingExpense,
            netProfit: paidIncome - paidExpense, // Lucro real (efetivado)
            estimatedProfit: totalIncome - totalExpense, // Lucro projetado
            transactionCount: linkedTransactions.length
        };
    }

    /**
     * Obtém a lista detalhada de transações vinculadas a uma viagem.
     */
    static async getTripTransactions(tripId: string) {
        return db.select({
            id: transactions.id,
            type: transactions.type,
            description: transactions.description,
            amount: sql<string>`COALESCE(${tripTransactions.amount_allocated}, ${transactions.amount})`.as('amount'),
            currency: transactions.currency,
            date: transactions.date,
            due_date: transactions.due_date,
            payment_date: transactions.payment_date,
            status: transactions.status,
            payment_method: transactions.payment_method,
            category_id: transactions.category_id,
            cost_center_id: transactions.cost_center_id,
            category_name: categories.name,
            cost_center_name: costCenters.name,
            classificacao_contabil: transactions.classificacao_contabil,
            notes: transactions.notes,
            trip_notes: tripTransactions.notes
        })
            .from(tripTransactions)
            .innerJoin(transactions, eq(tripTransactions.transaction_id, transactions.id))
            .leftJoin(categories, eq(transactions.category_id, categories.id))
            .leftJoin(costCenters, eq(transactions.cost_center_id, costCenters.id))
            .where(eq(tripTransactions.trip_id, tripId))
            .orderBy(desc(transactions.date));
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
