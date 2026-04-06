import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { documentService } from '@/services/document.service'
import { useAuth } from '@/hooks/useAuth'

export const documentKeys = {
    all: ['documents'] as const,
    byOrg: (orgId: string) => [...documentKeys.all, 'org', orgId] as const,
    byType: (orgId: string, type: string) => [...documentKeys.all, 'type', orgId, type] as const,
}

export function useDocuments(organizationId: string) {
    return useQuery({
        queryKey: documentKeys.byOrg(organizationId),
        queryFn: () => documentService.listByOrganization(organizationId),
        enabled: !!organizationId,
        select: (res) => res.data,
    })
}

export function useDocumentsByType(organizationId: string, type: string) {
    return useQuery({
        queryKey: documentKeys.byType(organizationId, type),
        queryFn: () => documentService.listByType(organizationId, type),
        enabled: !!organizationId && !!type,
        select: (res) => res.data,
    })
}

export function useUploadDocument() {
    const qc = useQueryClient()
    const { user } = useAuth()
    return useMutation({
        mutationFn: (params: { file: File; organizationId: string; type: string }) =>
            documentService.upload({ ...params, uploadedBy: user!.id }, user!.id),
        onSuccess: (_data: unknown, variables: { file: File; organizationId: string; type: string }) => {
            qc.invalidateQueries({ queryKey: documentKeys.byOrg(variables.organizationId) })
        },
    })
}

export function useRemoveDocument() {
    const qc = useQueryClient()
    const { user } = useAuth()
    return useMutation({
        mutationFn: (vars: { id: string; storagePath: string; organizationId: string }) =>
            documentService.remove(vars.id, vars.storagePath, vars.organizationId, user!.id),
        onSuccess: (_data: unknown, variables: { id: string; storagePath: string; organizationId: string }) => {
            qc.invalidateQueries({ queryKey: documentKeys.byOrg(variables.organizationId) })
        },
    })
}
