import { useQuery } from '@tanstack/react-query'
import { db, formatError } from '@/repositories/base.repository'
import type { PulseSurvey } from '@/types'

export const pulseKeys = {
    all: ['pulse'] as const,
    byOrg: (orgId: string) => [...pulseKeys.all, 'org', orgId] as const,
    active: (orgId: string) => [...pulseKeys.all, 'active', orgId] as const,
}

export function usePulseSurveys(organizationId: string) {
    return useQuery({
        queryKey: pulseKeys.byOrg(organizationId),
        queryFn: async () => {
            const { data, error } = await db
                .from('pulse_surveys')
                .select('*')
                .eq('organization_id', organizationId)
                .order('created_at', { ascending: false })
            return { data: (data as PulseSurvey[]) ?? [], error: formatError(error) }
        },
        enabled: !!organizationId,
        select: (res) => res.data,
    })
}

export function useActivePulseSurvey(organizationId: string) {
    return useQuery({
        queryKey: pulseKeys.active(organizationId),
        queryFn: async () => {
            const { data, error } = await db
                .from('pulse_surveys')
                .select('*')
                .eq('organization_id', organizationId)
                .eq('status', 'active')
                .order('opened_at', { ascending: false })
                .limit(1)
                .maybeSingle()
            return { data: data as PulseSurvey | null, error: formatError(error) }
        },
        enabled: !!organizationId,
        select: (res) => res.data,
    })
}
