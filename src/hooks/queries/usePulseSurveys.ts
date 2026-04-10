import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { pulseService } from '@/services/pulse.service'
import { useAuth } from '@/hooks/useAuth'
import type { PulseSurvey, PulseResponse } from '@/types'

export const pulseKeys = {
    all: ['pulse_surveys'] as const,
    list: () => [...pulseKeys.all, 'list'] as const,
    byOrg: (orgId: string) => [...pulseKeys.all, 'org', orgId] as const,
    active: (orgId: string) => [...pulseKeys.all, 'active', orgId] as const,
    responses: (surveyId: string) => [...pulseKeys.all, 'responses', surveyId] as const,
    hasResponded: (surveyId: string, uid: string) => [...pulseKeys.all, 'hasResponded', surveyId, uid] as const,
}

/** Genesis — todas as surveys */
export function useAllPulseSurveys() {
    return useQuery({
        queryKey: pulseKeys.list(),
        queryFn: async () => {
            const { data, error } = await pulseService.listAll()
            if (error) throw new Error(error)
            return data
        },
        refetchInterval: 30_000,
    })
}

/** Por organização (client_executive ou genesis filtrando org) */
export function usePulseSurveys(organizationId: string) {
    return useQuery({
        queryKey: pulseKeys.byOrg(organizationId),
        queryFn: async () => {
            const { data, error } = await pulseService.listByOrganization(organizationId)
            if (error) throw new Error(error)
            return data
        },
        enabled: !!organizationId,
        refetchInterval: 30_000,
    })
}

/** Survey ativa de uma organização (collaborator) */
export function useActivePulseSurvey(organizationId: string) {
    return useQuery({
        queryKey: pulseKeys.active(organizationId),
        queryFn: async () => {
            const { data, error } = await pulseService.getActive(organizationId)
            if (error) throw new Error(error)
            return data
        },
        enabled: !!organizationId,
        refetchInterval: 30_000,
    })
}

/** Verificar se o usuário já respondeu */
export function useHasResponded(surveyId: string, uid: string) {
    return useQuery({
        queryKey: pulseKeys.hasResponded(surveyId, uid),
        queryFn: () => pulseService.hasResponded(surveyId, uid),
        enabled: !!surveyId && !!uid,
    })
}

/** Respostas de uma survey (genesis/client_executive) */
export function usePulseResponses(surveyId: string) {
    return useQuery({
        queryKey: pulseKeys.responses(surveyId),
        queryFn: async () => {
            const { data, error } = await pulseService.listResponses(surveyId)
            if (error) throw new Error(error)
            return data
        },
        enabled: !!surveyId,
    })
}

/** Criar nova survey */
export function useCreatePulseSurvey() {
    const qc = useQueryClient()
    const { user } = useAuth()
    return useMutation({
        mutationFn: (payload: Omit<PulseSurvey, 'id' | 'created_at' | 'opened_at' | 'closed_at' | 'total_invited' | 'total_responded'>) =>
            pulseService.create(payload, user!.id),
        onSuccess: (_data, variables) => {
            void qc.invalidateQueries({ queryKey: pulseKeys.list() })
            void qc.invalidateQueries({ queryKey: pulseKeys.byOrg(variables.organization_id) })
            toast.success('Pesquisa criada com sucesso')
        },
        onError: (e: Error) => toast.error(e.message || 'Erro ao criar pesquisa'),
    })
}

/** Abrir ou fechar survey */
export function useUpdateSurveyStatus() {
    const qc = useQueryClient()
    const { user } = useAuth()
    return useMutation({
        mutationFn: (vars: { id: string; status: 'active' | 'closed'; orgId: string }) =>
            pulseService.updateStatus(vars.id, vars.status, vars.orgId, user!.id),
        onSuccess: (_data, variables) => {
            void qc.invalidateQueries({ queryKey: pulseKeys.list() })
            void qc.invalidateQueries({ queryKey: pulseKeys.byOrg(variables.orgId) })
            void qc.invalidateQueries({ queryKey: pulseKeys.active(variables.orgId) })
            toast.success(variables.status === 'active' ? 'Pesquisa aberta com sucesso' : 'Pesquisa encerrada')
        },
        onError: (e: Error) => toast.error(e.message || 'Erro ao atualizar pesquisa'),
    })
}

/** Submeter resposta do colaborador */
export function useSubmitPulseResponse() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (payload: Omit<PulseResponse, 'id' | 'submitted_at'>) =>
            pulseService.submitResponse(payload),
        onSuccess: (_data, variables) => {
            void qc.invalidateQueries({ queryKey: pulseKeys.responses(variables.survey_id) })
            toast.success('Resposta enviada com sucesso!')
        },
        onError: (e: Error) => toast.error(e.message || 'Erro ao enviar resposta'),
    })
}
