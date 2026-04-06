import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { diagnosisService } from '@/services/diagnosis.service'
import { useAuth } from '@/hooks/useAuth'
import type { PsychosocialDiagnosis, PsychosocialRisk } from '@/types'

export const diagnosisKeys = {
    all: ['diagnoses'] as const,
    byOrg: (orgId: string) => [...diagnosisKeys.all, 'org', orgId] as const,
    detail: (id: string) => [...diagnosisKeys.all, 'detail', id] as const,
    risks: (orgId: string) => ['risks', 'org', orgId] as const,
}

export function useDiagnoses(organizationId: string) {
    return useQuery({
        queryKey: diagnosisKeys.byOrg(organizationId),
        queryFn: () => diagnosisService.listByOrganization(organizationId),
        enabled: !!organizationId,
        select: (res) => res.data,
    })
}

export function useDiagnosis(id: string) {
    return useQuery({
        queryKey: diagnosisKeys.detail(id),
        queryFn: () => diagnosisService.get(id),
        enabled: !!id,
        select: (res) => res.data,
    })
}

export function useRisks(organizationId: string) {
    return useQuery({
        queryKey: diagnosisKeys.risks(organizationId),
        queryFn: () => diagnosisService.listRisks(organizationId),
        enabled: !!organizationId,
        select: (res) => res.data,
    })
}

export function useCreateDiagnosis() {
    const qc = useQueryClient()
    const { user } = useAuth()
    return useMutation({
        mutationFn: (payload: Omit<PsychosocialDiagnosis, 'id' | 'created_at' | 'updated_at'>) =>
            diagnosisService.create(payload, user!.id),
        onSuccess: (_data: unknown, variables: Omit<PsychosocialDiagnosis, 'id' | 'created_at' | 'updated_at'>) => {
            qc.invalidateQueries({ queryKey: diagnosisKeys.byOrg(variables.organization_id) })
        },
    })
}

export function useUpdateDiagnosis() {
    const qc = useQueryClient()
    const { user } = useAuth()
    return useMutation({
        mutationFn: (vars: {
            id: string
            organizationId: string
            payload: Partial<Omit<PsychosocialDiagnosis, 'id' | 'created_at'>>
        }) => diagnosisService.update(vars.id, vars.payload, user!.id),
        onSuccess: (_data: unknown, variables: { id: string; organizationId: string; payload: Partial<Omit<PsychosocialDiagnosis, 'id' | 'created_at'>> }) => {
            qc.invalidateQueries({ queryKey: diagnosisKeys.byOrg(variables.organizationId) })
            qc.invalidateQueries({ queryKey: diagnosisKeys.detail(variables.id) })
        },
    })
}

export function useCreateRisk() {
    const qc = useQueryClient()
    const { user } = useAuth()
    return useMutation({
        mutationFn: (payload: Omit<PsychosocialRisk, 'id' | 'created_at' | 'updated_at'>) =>
            diagnosisService.createRisk(payload, user!.id),
        onSuccess: (_data: unknown, variables: Omit<PsychosocialRisk, 'id' | 'created_at' | 'updated_at'>) => {
            qc.invalidateQueries({ queryKey: diagnosisKeys.risks(variables.organization_id) })
        },
    })
}
