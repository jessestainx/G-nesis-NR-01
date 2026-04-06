import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { profileService } from '@/services/profile.service'
import { useAuth } from '@/hooks/useAuth'
import type { Profile, UserRole } from '@/types'

export const profileKeys = {
    all: ['profiles'] as const,
    detail: (id: string) => [...profileKeys.all, 'detail', id] as const,
    byOrg: (orgId: string) => [...profileKeys.all, 'org', orgId] as const,
    byRole: (role: UserRole) => [...profileKeys.all, 'role', role] as const,
}

export function useProfile(id: string) {
    return useQuery({
        queryKey: profileKeys.detail(id),
        queryFn: () => profileService.get(id),
        enabled: !!id,
        select: (res) => res.data,
    })
}

export function useOrganizationProfiles(organizationId: string) {
    return useQuery({
        queryKey: profileKeys.byOrg(organizationId),
        queryFn: () => profileService.listByOrganization(organizationId),
        enabled: !!organizationId,
        select: (res) => res.data,
    })
}

export function useUpdateProfile() {
    const qc = useQueryClient()
    const { user, refreshProfile } = useAuth()
    return useMutation({
        mutationFn: (vars: { id: string; payload: Partial<Omit<Profile, 'id' | 'created_at'>> }) =>
            profileService.update(vars.id, vars.payload, user!.id),
        onSuccess: (_data: unknown, variables: { id: string; payload: Partial<Omit<Profile, 'id' | 'created_at'>> }) => {
            qc.invalidateQueries({ queryKey: profileKeys.detail(variables.id) })
            if (variables.id === user?.id) refreshProfile()
        },
    })
}

export function useInviteUser() {
    return useMutation({
        mutationFn: (params: {
            email: string
            name: string
            role: UserRole
            organizationId?: string
        }) => profileService.invite(params),
    })
}
