import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { organizationService } from '@/services/organization.service'
import { useAuth } from '@/hooks/useAuth'
import type { Organization, OrganizationUnit } from '@/types'

// ─── Query key factory ────────────────────────────────────────────────────────

export const orgKeys = {
    all: ['organizations'] as const,
    lists: () => [...orgKeys.all, 'list'] as const,
    list: (status?: string) => [...orgKeys.lists(), { status }] as const,
    detail: (id: string) => [...orgKeys.all, 'detail', id] as const,
    units: (orgId: string) => [...orgKeys.all, 'units', orgId] as const,
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useOrganizations() {
    return useQuery({
        queryKey: orgKeys.list(),
        queryFn: () => organizationService.list(),
        select: (res) => res.data,
    })
}

export function useOrganization(id: string) {
    return useQuery({
        queryKey: orgKeys.detail(id),
        queryFn: () => organizationService.get(id),
        enabled: !!id,
        select: (res) => res.data,
    })
}

export function useOrganizationUnits(organizationId: string) {
    return useQuery({
        queryKey: orgKeys.units(organizationId),
        queryFn: () => organizationService.listUnits(organizationId),
        enabled: !!organizationId,
        select: (res) => res.data,
    })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateOrganization() {
    const qc = useQueryClient()
    const { user } = useAuth()
    return useMutation({
        mutationFn: (payload: Omit<Organization, 'id' | 'created_at' | 'updated_at'>) =>
            organizationService.create(payload, user!.id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: orgKeys.lists() })
            toast.success('Organização criada com sucesso')
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : 'Erro ao criar organização'),
    })
}

export function useUpdateOrganization() {
    const qc = useQueryClient()
    const { user } = useAuth()
    return useMutation({
        mutationFn: (vars: { id: string; payload: Partial<Omit<Organization, 'id' | 'created_at'>> }) =>
            organizationService.update(vars.id, vars.payload, user!.id),
        onSuccess: (_data: unknown, variables: { id: string; payload: Partial<Omit<Organization, 'id' | 'created_at'>> }) => {
            qc.invalidateQueries({ queryKey: orgKeys.detail(variables.id) })
            qc.invalidateQueries({ queryKey: orgKeys.lists() })
            toast.success('Organização atualizada com sucesso')
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : 'Erro ao atualizar organização'),
    })
}

export function useCreateUnit() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (payload: Omit<OrganizationUnit, 'id' | 'created_at'>) =>
            organizationService.createUnit(payload),
        onSuccess: (_data: unknown, variables: Omit<OrganizationUnit, 'id' | 'created_at'>) => {
            qc.invalidateQueries({ queryKey: orgKeys.units(variables.organization_id) })
            toast.success('Unidade criada com sucesso')
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : 'Erro ao criar unidade'),
    })
}

export function useDeleteUnit() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (vars: { id: string; organizationId: string }) =>
            organizationService.deleteUnit(vars.id),
        onSuccess: (_data: unknown, variables: { id: string; organizationId: string }) => {
            qc.invalidateQueries({ queryKey: orgKeys.units(variables.organizationId) })
            toast.success('Unidade excluída')
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : 'Erro ao excluir unidade'),
    })
}

export function useDeleteOrganization() {
    const qc = useQueryClient()
    const { user } = useAuth()
    return useMutation({
        mutationFn: (id: string) => organizationService.remove(id, user!.id),
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: orgKeys.lists() })
            toast.success('Organização excluída com sucesso')
        },
        onError: (e: Error) => toast.error(e.message || 'Erro ao excluir organização'),
    })
}
