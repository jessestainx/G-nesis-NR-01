import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { crmService } from '@/services/crm.service'
import { financeService } from '@/services/finance.service'
import { useAuth } from '@/hooks/useAuth'
import type { CrmContact, Contract, FinancialTransaction } from '@/types'

// ─── Query key factories ───────────────────────────────────────────────────────

export const crmKeys = {
    all: ['crm'] as const,
    list: () => [...crmKeys.all, 'list'] as const,
    byStage: (stage: string) => [...crmKeys.all, 'stage', stage] as const,
    detail: (id: string) => [...crmKeys.all, 'detail', id] as const,
    contracts: {
        all: ['contracts'] as const,
        active: () => ['contracts', 'active'] as const,
        byOrg: (orgId: string) => ['contracts', 'org', orgId] as const,
        expiring: (days: number) => ['contracts', 'expiring', days] as const,
    },
}

export const financeKeys = {
    all: ['finance'] as const,
    summary: (from: string, to: string) => [...financeKeys.all, 'summary', from, to] as const,
    period: (from: string, to: string) => [...financeKeys.all, 'period', from, to] as const,
    byOrg: (orgId: string) => [...financeKeys.all, 'org', orgId] as const,
}

// ─── CRM Contacts ─────────────────────────────────────────────────────────────

export function useCrmContacts() {
    return useQuery({
        queryKey: crmKeys.list(),
        queryFn: () => crmService.listAll(),
        select: (res) => res.data,
    })
}

export function useCrmContactsByStage(stage: CrmContact['stage']) {
    return useQuery({
        queryKey: crmKeys.byStage(stage),
        queryFn: () => crmService.listByStage(stage),
        enabled: !!stage,
        select: (res) => res.data,
    })
}

export function useCreateCrmContact() {
    const qc = useQueryClient()
    const { user } = useAuth()
    return useMutation({
        mutationFn: (payload: Omit<CrmContact, 'id' | 'created_at' | 'updated_at'>) =>
            crmService.create(payload, user!.id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: crmKeys.list() })
        },
    })
}

export function useUpdateCrmContact() {
    const qc = useQueryClient()
    const { user } = useAuth()
    return useMutation({
        mutationFn: ({ id, stage }: { id: string; stage: CrmContact['stage'] }) =>
            crmService.advanceStage(id, stage, user!.id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: crmKeys.all })
        },
    })
}

// ─── Contracts ────────────────────────────────────────────────────────────────

export function useActiveContracts() {
    return useQuery({
        queryKey: crmKeys.contracts.active(),
        queryFn: () => crmService.listActive(),
        select: (res) => res.data,
    })
}

export function useExpiringContracts(days = 30) {
    return useQuery({
        queryKey: crmKeys.contracts.expiring(days),
        queryFn: () => crmService.listExpiringSoon(days),
        select: (res) => res.data,
    })
}

export function useCreateContract() {
    const qc = useQueryClient()
    const { user } = useAuth()
    return useMutation({
        mutationFn: (payload: Omit<Contract, 'id' | 'created_at' | 'updated_at'>) =>
            crmService.createContract(payload, user!.id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: crmKeys.contracts.all })
        },
    })
}

// ─── Finance ──────────────────────────────────────────────────────────────────

export function useFinanceSummary(from: string, to: string) {
    return useQuery({
        queryKey: financeKeys.summary(from, to),
        queryFn: () => financeService.getSummary(from, to),
        enabled: !!from && !!to,
    })
}

export function useFinanceTransactions(from: string, to: string) {
    return useQuery({
        queryKey: financeKeys.period(from, to),
        queryFn: () => financeService.listByPeriod(from, to),
        enabled: !!from && !!to,
        select: (res) => res.data,
    })
}

export function useCreateTransaction() {
    const qc = useQueryClient()
    const { user } = useAuth()
    return useMutation({
        mutationFn: (payload: Omit<FinancialTransaction, 'id' | 'created_at'>) =>
            financeService.create(payload, user!.id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: financeKeys.all })
        },
    })
}
