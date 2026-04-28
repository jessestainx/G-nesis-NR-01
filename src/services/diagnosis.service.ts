import { diagnosisRepository, riskRepository } from '@/repositories/diagnosis.repository'
import { auditRepository } from '@/repositories/audit.repository'
import type { PsychosocialDiagnosis, PsychosocialRisk } from '@/types'
import type { QueryListResult, QueryResult } from '@/repositories/base.repository'

export const diagnosisService = {
    async listByOrganization(
        organizationId: string,
    ): Promise<QueryListResult<PsychosocialDiagnosis>> {
        return diagnosisRepository.findByOrganization(organizationId)
    },

    async listAll(): Promise<QueryListResult<PsychosocialDiagnosis>> {
        return diagnosisRepository.findAll()
    },

    async listActive(organizationId: string): Promise<QueryListResult<PsychosocialDiagnosis>> {
        return diagnosisRepository.findActive(organizationId)
    },

    async get(id: string): Promise<QueryResult<PsychosocialDiagnosis>> {
        return diagnosisRepository.findById(id)
    },

    async create(
        payload: Omit<PsychosocialDiagnosis, 'id' | 'created_at' | 'updated_at'>,
        actorId: string,
    ): Promise<QueryResult<PsychosocialDiagnosis>> {
        const result = await diagnosisRepository.create(payload)
        if (result.data) {
            await auditRepository.log({
                userId: actorId,
                action: 'diagnosis.create',
                entityType: 'diagnoses',
                entityId: result.data.id,
                organizationId: result.data.organization_id,
            })
        }
        return result
    },

    async update(
        id: string,
        payload: Partial<Omit<PsychosocialDiagnosis, 'id' | 'created_at'>>,
        actorId: string,
    ): Promise<QueryResult<PsychosocialDiagnosis>> {
        const result = await diagnosisRepository.update(id, payload)
        if (result.data) {
            await auditRepository.log({
                userId: actorId,
                action: 'diagnosis.update',
                entityType: 'diagnoses',
                entityId: id,
                organizationId: result.data.organization_id,
            })
        }
        return result
    },

    // Risks
    async listRisks(organizationId: string): Promise<QueryListResult<PsychosocialRisk>> {
        return riskRepository.findByOrganization(organizationId)
    },

    async listRisksByDiagnosis(
        diagnosisId: string,
    ): Promise<QueryListResult<PsychosocialRisk>> {
        return riskRepository.findByDiagnosis(diagnosisId)
    },

    async createRisk(
        payload: Omit<PsychosocialRisk, 'id' | 'created_at' | 'updated_at'>,
        actorId: string,
    ): Promise<QueryResult<PsychosocialRisk>> {
        const result = await riskRepository.create(payload)
        if (result.data) {
            await auditRepository.log({
                userId: actorId,
                action: 'diagnosis.risk.create',
                entityType: 'psychosocial_risks',
                entityId: result.data.id,
                organizationId: result.data.organization_id,
                metadata: { level: result.data.level },
            })
        }
        return result
    },

    async deleteDiagnosis(
        id: string,
        organizationId: string,
        actorId: string,
    ): Promise<{ error: string | null }> {
        const result = await diagnosisRepository.delete(id)
        if (!result.error) {
            await auditRepository.log({
                userId: actorId,
                action: 'diagnosis.delete',
                entityType: 'diagnoses',
                entityId: id,
                organizationId,
            })
        }
        return result
    },

    async deleteRisk(
        id: string,
        organizationId: string,
        actorId: string,
    ): Promise<{ error: string | null }> {
        const result = await riskRepository.delete(id)
        if (!result.error) {
            await auditRepository.log({
                userId: actorId,
                action: 'diagnosis.risk.delete',
                entityType: 'psychosocial_risks',
                entityId: id,
                organizationId,
            })
        }
        return result
    },
}
