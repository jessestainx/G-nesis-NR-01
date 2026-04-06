import { documentRepository } from '@/repositories/document.repository'
import { auditRepository } from '@/repositories/audit.repository'
import type { Document } from '@/types'
import type { QueryListResult, QueryResult } from '@/repositories/base.repository'

export const documentService = {
    async listByOrganization(organizationId: string): Promise<QueryListResult<Document>> {
        return documentRepository.findByOrganization(organizationId)
    },

    async listByType(organizationId: string, type: string): Promise<QueryListResult<Document>> {
        return documentRepository.findByType(organizationId, type)
    },

    async upload(
        params: {
            file: File
            organizationId: string
            type: string
            uploadedBy: string
        },
        actorId: string,
    ): Promise<QueryResult<Document>> {
        const result = await documentRepository.upload(params)
        if (result.data) {
            await auditRepository.log({
                userId: actorId,
                action: 'document.upload',
                entityType: 'documents',
                entityId: result.data.id,
                organizationId: params.organizationId,
                metadata: { type: params.type, name: params.file.name },
            })
        }
        return result
    },

    async getDownloadUrl(
        storagePath: string,
    ): Promise<{ url: string | null; error: string | null }> {
        return documentRepository.getDownloadUrl(storagePath)
    },

    async remove(
        id: string,
        storagePath: string,
        organizationId: string,
        actorId: string,
    ): Promise<{ error: string | null }> {
        const result = await documentRepository.remove(id, storagePath)
        if (!result.error) {
            await auditRepository.log({
                userId: actorId,
                action: 'document.remove',
                entityType: 'documents',
                entityId: id,
                organizationId,
            })
        }
        return result
    },
}

