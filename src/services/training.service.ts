import { trainingRepository } from '@/repositories/training.repository'
import { auditRepository } from '@/repositories/audit.repository'
import type { Training } from '@/types'
import type { QueryListResult, QueryResult } from '@/repositories/base.repository'

export const trainingService = {
    async listByOrganization(organizationId: string): Promise<QueryListResult<Training>> {
        return trainingRepository.findByOrganization(organizationId)
    },

    async create(
        payload: Omit<Training, 'id' | 'created_at'>,
        actorId: string,
    ): Promise<QueryResult<Training>> {
        const result = await trainingRepository.createTraining(payload)
        if (result.data) {
            await auditRepository.log({
                userId: actorId,
                action: 'training.create',
                entityType: 'trainings',
                entityId: result.data.id,
                organizationId: payload.organization_id,
                metadata: { title: payload.title },
            })
        }
        return result
    },
}
