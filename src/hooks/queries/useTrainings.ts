import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { trainingService } from '@/services/training.service'
import { useAuth } from '@/hooks/useAuth'
import type { Training } from '@/types'

export const trainingKeys = {
    all: ['trainings'] as const,
    byOrg: (orgId: string) => [...trainingKeys.all, 'org', orgId] as const,
}

export function useTrainings(organizationId: string) {
    return useQuery({
        queryKey: trainingKeys.byOrg(organizationId),
        queryFn: async () => {
            const { data, error } = await trainingService.listByOrganization(organizationId)
            if (error) throw new Error(error)
            return data
        },
        enabled: !!organizationId,
    })
}

export function useCreateTraining() {
    const qc = useQueryClient()
    const { user } = useAuth()
    return useMutation({
        mutationFn: (payload: Omit<Training, 'id' | 'created_at'>) =>
            trainingService.create(payload, user!.id),
        onSuccess: (_data, variables) => {
            void qc.invalidateQueries({ queryKey: trainingKeys.byOrg(variables.organization_id) })
            toast.success('Treinamento criado com sucesso')
        },
        onError: (e: Error) => toast.error(e.message || 'Erro ao criar treinamento'),
    })
}

export function useUpdateTrainingStatus() {
    const qc = useQueryClient()
    const { user } = useAuth()
    return useMutation({
        mutationFn: (vars: {
            id: string
            organizationId: string
            status: Training['status']
        }) => trainingService.updateStatus(vars.id, vars.organizationId, vars.status, user!.id),
        onSuccess: (_data, variables) => {
            void qc.invalidateQueries({ queryKey: trainingKeys.byOrg(variables.organizationId) })
            toast.success('Status atualizado')
        },
        onError: (e: Error) => toast.error(e.message || 'Erro ao atualizar status'),
    })
}
