import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { actionPlanService } from '@/services/action-plan.service'
import { useAuth } from '@/hooks/useAuth'
import type { ActionPlan, ActionItem } from '@/types'

export const actionPlanKeys = {
    all: ['action-plans'] as const,
    byOrg: (orgId: string) => [...actionPlanKeys.all, 'org', orgId] as const,
    items: (apId: string) => [...actionPlanKeys.all, 'items', apId] as const,
}

export function useActionPlans(organizationId: string) {
    return useQuery({
        queryKey: actionPlanKeys.byOrg(organizationId),
        queryFn: () => actionPlanService.listByOrganization(organizationId),
        enabled: !!organizationId,
        select: (res) => res.data,
    })
}

export function useActionPlanItems(actionPlanId: string) {
    return useQuery({
        queryKey: actionPlanKeys.items(actionPlanId),
        queryFn: () => actionPlanService.listItems(actionPlanId),
        enabled: !!actionPlanId,
        select: (res) => res.data,
    })
}

export function useCreateActionPlan() {
    const qc = useQueryClient()
    const { user } = useAuth()
    return useMutation({
        mutationFn: (payload: Omit<ActionPlan, 'id' | 'created_at' | 'updated_at'>) =>
            actionPlanService.create(payload, user!.id),
        onSuccess: (_data: unknown, variables: Omit<ActionPlan, 'id' | 'created_at' | 'updated_at'>) => {
            qc.invalidateQueries({ queryKey: actionPlanKeys.byOrg(variables.organization_id) })
            toast.success('Plano de ação criado com sucesso')
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : 'Erro ao criar plano de ação'),
    })
}

export function useUpdateActionPlan() {
    const qc = useQueryClient()
    const { user } = useAuth()
    return useMutation({
        mutationFn: (vars: {
            id: string
            organizationId: string
            payload: Partial<Omit<ActionPlan, 'id' | 'created_at'>>
        }) => actionPlanService.update(vars.id, vars.payload, user!.id),
        onSuccess: (_data: unknown, variables: { id: string; organizationId: string; payload: Partial<Omit<ActionPlan, 'id' | 'created_at'>> }) => {
            qc.invalidateQueries({ queryKey: actionPlanKeys.byOrg(variables.organizationId) })
            toast.success('Plano atualizado')
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : 'Erro ao atualizar plano'),
    })
}

export function useCreateActionItem() {
    const qc = useQueryClient()
    const { user } = useAuth()
    return useMutation({
        mutationFn: (payload: Omit<ActionItem, 'id' | 'created_at' | 'completed_at'>) =>
            actionPlanService.createItem(payload, user!.id),
        onSuccess: (_data: unknown, variables: Omit<ActionItem, 'id' | 'created_at' | 'completed_at'>) => {
            qc.invalidateQueries({ queryKey: actionPlanKeys.items(variables.action_plan_id) })
            toast.success('Item criado com sucesso')
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : 'Erro ao criar item'),
    })
}

export function useUpdateActionItem() {
    const qc = useQueryClient()
    const { user } = useAuth()
    return useMutation({
        mutationFn: (vars: {
            id: string
            actionPlanId: string
            payload: Partial<Omit<ActionItem, 'id' | 'created_at'>>
        }) => actionPlanService.updateItem(vars.id, vars.payload, user!.id),
        onSuccess: (_data: unknown, variables: { id: string; actionPlanId: string; payload: Partial<Omit<ActionItem, 'id' | 'created_at'>> }) => {
            qc.invalidateQueries({ queryKey: actionPlanKeys.items(variables.actionPlanId) })
            toast.success('Item atualizado')
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : 'Erro ao atualizar item'),
    })
}
