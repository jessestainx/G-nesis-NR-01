import { useQuery } from '@tanstack/react-query'
import { auditRepository } from '@/repositories/audit.repository'
import { useAuth } from '@/hooks/useAuth'

export const auditKeys = {
    all: ['audit'] as const,
    byUser: (userId: string) => [...auditKeys.all, 'user', userId] as const,
    byOrg: (orgId: string) => [...auditKeys.all, 'org', orgId] as const,
}

export function useMyAuditLogs() {
    const { user } = useAuth()
    return useQuery({
        queryKey: auditKeys.byUser(user?.id ?? ''),
        queryFn: () => auditRepository.findByUser(user!.id),
        enabled: !!user?.id,
        select: (res) => res.data,
    })
}

export function useOrgAuditLogs(organizationId: string) {
    return useQuery({
        queryKey: auditKeys.byOrg(organizationId),
        queryFn: () => auditRepository.findByOrganization(organizationId),
        enabled: !!organizationId,
        select: (res) => res.data,
    })
}
