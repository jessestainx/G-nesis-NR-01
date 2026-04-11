import { pulseRepository } from '@/repositories/pulse.repository'
import { auditRepository } from '@/repositories/audit.repository'
import type { PulseSurvey, PulseResponse } from '@/types'
import type { QueryListResult, QueryResult } from '@/repositories/base.repository'

export const pulseService = {
    async listAll(): Promise<QueryListResult<PulseSurvey>> {
        return pulseRepository.findAll()
    },

    async listByOrganization(orgId: string): Promise<QueryListResult<PulseSurvey>> {
        return pulseRepository.findByOrganization(orgId)
    },

    async getActive(orgId: string): Promise<QueryResult<PulseSurvey>> {
        return pulseRepository.findActive(orgId)
    },

    async create(
        payload: Omit<PulseSurvey, 'id' | 'created_at' | 'opened_at' | 'closed_at' | 'total_invited' | 'total_responded'>,
        actorId: string,
    ): Promise<QueryResult<PulseSurvey>> {
        const result = await pulseRepository.createSurvey(payload)
        if (result.data) {
            await auditRepository.log({
                userId: actorId,
                action: 'pulse_survey.create',
                entityType: 'pulse_surveys',
                entityId: result.data.id,
                organizationId: payload.organization_id,
                metadata: { title: payload.title },
            })
        }
        return result
    },

    async updateStatus(
        id: string,
        status: 'active' | 'closed',
        orgId: string,
        actorId: string,
    ): Promise<QueryResult<PulseSurvey>> {
        const result = await pulseRepository.updateStatus(id, status)
        if (result.data) {
            await auditRepository.log({
                userId: actorId,
                action: `pulse_survey.${status}`,
                entityType: 'pulse_surveys',
                entityId: id,
                organizationId: orgId,
                metadata: { status },
            })
        }
        return result
    },

    async submitResponse(
        payload: Omit<PulseResponse, 'id' | 'submitted_at'>,
    ): Promise<QueryResult<PulseResponse>> {
        return pulseRepository.createResponse(payload)
    },

    async hasResponded(surveyId: string, uid: string): Promise<boolean> {
        return pulseRepository.hasResponded(surveyId, uid)
    },

    async listResponses(surveyId: string): Promise<QueryListResult<PulseResponse>> {
        return pulseRepository.findResponses(surveyId)
    },

    async deleteSurvey(
        id: string,
        orgId: string,
        actorId: string,
    ): Promise<{ error: string | null }> {
        const result = await pulseRepository.deleteSurvey(id)
        if (!result.error) {
            await auditRepository.log({
                userId: actorId,
                action: 'pulse_survey.delete',
                entityType: 'pulse_surveys',
                entityId: id,
                organizationId: orgId,
            })
        }
        return result
    },
}
