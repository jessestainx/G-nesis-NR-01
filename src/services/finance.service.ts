import { financeRepository } from '@/repositories/finance.repository'
import { auditRepository } from '@/repositories/audit.repository'
import type { FinancialTransaction } from '@/types'
import type { QueryListResult, QueryResult } from '@/repositories/base.repository'

type FinanceSummary = {
    revenue: number
    expenses: number
    commissions: number
    net: number
    error: string | null
}

export const financeService = {
    async getSummary(from: string, to: string): Promise<FinanceSummary> {
        return financeRepository.getSummary(from, to)
    },

    async listByPeriod(from: string, to: string): Promise<QueryListResult<FinancialTransaction>> {
        return financeRepository.findByPeriod(from, to)
    },

    async listByOrganization(organizationId: string): Promise<QueryListResult<FinancialTransaction>> {
        return financeRepository.findByOrganization(organizationId)
    },

    async listByType(
        type: FinancialTransaction['type'],
    ): Promise<QueryListResult<FinancialTransaction>> {
        return financeRepository.findByType(type)
    },

    async create(
        payload: Omit<FinancialTransaction, 'id' | 'created_at'>,
        actorId: string,
    ): Promise<QueryResult<FinancialTransaction>> {
        const result = await financeRepository.create(payload)
        if (result.data) {
            await auditRepository.log({
                userId: actorId,
                action: 'finance.transaction.create',
                entityType: 'financial_transactions',
                entityId: result.data.id,
                organizationId: result.data.organization_id ?? undefined,
                metadata: { type: result.data.type, amount: result.data.amount },
            })
        }
        return result
    },
}
