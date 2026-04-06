import { db, BaseRepository, formatError } from '@/repositories/base.repository'
import type { QueryListResult } from '@/repositories/base.repository'
import type { FinancialTransaction } from '@/types'

export class FinanceRepository extends BaseRepository<FinancialTransaction> {
    constructor() { super('financial_transactions') }

    async findByPeriod(from: string, to: string): Promise<QueryListResult<FinancialTransaction>> {
        const { data, error, count } = await db
            .from('financial_transactions').select('*', { count: 'exact' })
            .gte('reference_date', from).lte('reference_date', to)
            .order('reference_date', { ascending: false })
        return { data: (data as FinancialTransaction[]) ?? [], error: formatError(error), count }
    }

    async findByType(type: FinancialTransaction['type']): Promise<QueryListResult<FinancialTransaction>> {
        const { data, error, count } = await db
            .from('financial_transactions').select('*', { count: 'exact' })
            .eq('type', type).order('reference_date', { ascending: false })
        return { data: (data as FinancialTransaction[]) ?? [], error: formatError(error), count }
    }

    async findByOrganization(organizationId: string): Promise<QueryListResult<FinancialTransaction>> {
        const { data, error, count } = await db
            .from('financial_transactions').select('*', { count: 'exact' })
            .eq('organization_id', organizationId)
            .order('reference_date', { ascending: false })
        return { data: (data as FinancialTransaction[]) ?? [], error: formatError(error), count }
    }

    async getSummary(
        from: string,
        to: string,
    ): Promise<{ revenue: number; expenses: number; commissions: number; net: number; error: string | null }> {
        const { data, error } = await db
            .from('financial_transactions').select('type, amount')
            .gte('reference_date', from).lte('reference_date', to)

        if (error) return { revenue: 0, expenses: 0, commissions: 0, net: 0, error: formatError(error) }

        const sum = (type: string) =>
            (data ?? [])
                .filter((t: { type: string; amount: number }) => t.type === type)
                .reduce((s: number, t: { type: string; amount: number }) => s + Number(t.amount), 0)

        const revenue = sum('revenue')
        const expenses = sum('expense')
        const commissions = sum('commission')

        return { revenue, expenses, commissions, net: revenue - expenses - commissions, error: null }
    }
}

export const financeRepository = new FinanceRepository()
