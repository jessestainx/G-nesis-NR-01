import { db, BaseRepository, formatError } from '@/repositories/base.repository'
import type { QueryListResult, QueryResult } from '@/repositories/base.repository'
import type { PulseSurvey, PulseResponse } from '@/types'

export class PulseRepository extends BaseRepository<PulseSurvey> {
    constructor() { super('pulse_surveys') }

    async findAll(): Promise<QueryListResult<PulseSurvey>> {
        const { data, error, count } = await db
            .from('pulse_surveys').select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
        return { data: (data as PulseSurvey[]) ?? [], error: formatError(error), count }
    }

    async findByOrganization(orgId: string): Promise<QueryListResult<PulseSurvey>> {
        const { data, error, count } = await db
            .from('pulse_surveys').select('*', { count: 'exact' })
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false })
        return { data: (data as PulseSurvey[]) ?? [], error: formatError(error), count }
    }

    async findActive(orgId: string): Promise<QueryResult<PulseSurvey>> {
        const { data, error } = await db
            .from('pulse_surveys').select('*')
            .eq('organization_id', orgId).eq('status', 'active')
            .order('opened_at', { ascending: false }).limit(1).maybeSingle()
        return { data: data as PulseSurvey | null, error: formatError(error) }
    }

    async createSurvey(
        payload: Omit<PulseSurvey, 'id' | 'created_at' | 'opened_at' | 'closed_at' | 'total_invited' | 'total_responded'>,
    ): Promise<QueryResult<PulseSurvey>> {
        const { data, error } = await db
            .from('pulse_surveys')
            .insert({ ...payload, total_invited: 0, total_responded: 0 })
            .select().single()
        return { data: data as PulseSurvey | null, error: formatError(error) }
    }

    async updateStatus(
        id: string,
        status: 'active' | 'closed',
    ): Promise<QueryResult<PulseSurvey>> {
        const patch: Record<string, unknown> = { status }
        if (status === 'active') patch.opened_at = new Date().toISOString()
        if (status === 'closed') patch.closed_at = new Date().toISOString()
        const { data, error } = await db
            .from('pulse_surveys').update(patch).eq('id', id).select().single()
        return { data: data as PulseSurvey | null, error: formatError(error) }
    }

    async createResponse(
        payload: Omit<PulseResponse, 'id' | 'submitted_at'>,
    ): Promise<QueryResult<PulseResponse>> {
        const { data, error } = await db
            .from('pulse_responses').insert(payload).select().single()
        if (!error) {
            await db.rpc('increment_total_responded', { survey_id: payload.survey_id }).maybeSingle()
        }
        return { data: data as PulseResponse | null, error: formatError(error) }
    }

    async hasResponded(surveyId: string, uid: string): Promise<boolean> {
        const { data } = await db
            .from('pulse_responses').select('id')
            .eq('survey_id', surveyId).eq('respondent_id', uid).maybeSingle()
        return !!data
    }

    async findResponses(surveyId: string): Promise<QueryListResult<PulseResponse>> {
        const { data, error, count } = await db
            .from('pulse_responses').select('*', { count: 'exact' })
            .eq('survey_id', surveyId).order('submitted_at', { ascending: false })
        return { data: (data as PulseResponse[]) ?? [], error: formatError(error), count }
    }
}

export const pulseRepository = new PulseRepository()
