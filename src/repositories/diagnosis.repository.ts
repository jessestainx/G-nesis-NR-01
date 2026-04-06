import { db, BaseRepository, formatError } from '@/repositories/base.repository'
import type { QueryListResult } from '@/repositories/base.repository'
import type { PsychosocialDiagnosis, PsychosocialRisk } from '@/types'

export class DiagnosisRepository extends BaseRepository<PsychosocialDiagnosis> {
    constructor() { super('psychosocial_diagnosis') }

    async findByOrganization(organizationId: string): Promise<QueryListResult<PsychosocialDiagnosis>> {
        const { data, error, count } = await db
            .from('psychosocial_diagnosis')
            .select('*', { count: 'exact' })
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false })
        return { data: (data as PsychosocialDiagnosis[]) ?? [], error: formatError(error), count }
    }

    async findActive(organizationId: string): Promise<QueryListResult<PsychosocialDiagnosis>> {
        const { data, error, count } = await db
            .from('psychosocial_diagnosis')
            .select('*', { count: 'exact' })
            .eq('organization_id', organizationId)
            .in('status', ['draft', 'in_progress'])
            .order('created_at', { ascending: false })
        return { data: (data as PsychosocialDiagnosis[]) ?? [], error: formatError(error), count }
    }
}

export class RiskRepository extends BaseRepository<PsychosocialRisk> {
    constructor() { super('psychosocial_risks') }

    async findByOrganization(organizationId: string): Promise<QueryListResult<PsychosocialRisk>> {
        const { data, error, count } = await db
            .from('psychosocial_risks')
            .select('*', { count: 'exact' })
            .eq('organization_id', organizationId)
            .order('level', { ascending: false })
        return { data: (data as PsychosocialRisk[]) ?? [], error: formatError(error), count }
    }

    async findByDiagnosis(diagnosisId: string): Promise<QueryListResult<PsychosocialRisk>> {
        const { data, error, count } = await db
            .from('psychosocial_risks')
            .select('*', { count: 'exact' })
            .eq('diagnosis_id', diagnosisId)
            .order('level', { ascending: false })
        return { data: (data as PsychosocialRisk[]) ?? [], error: formatError(error), count }
    }

    async findByLevel(
        organizationId: string,
        level: PsychosocialRisk['level'],
    ): Promise<QueryListResult<PsychosocialRisk>> {
        const { data, error, count } = await db
            .from('psychosocial_risks')
            .select('*', { count: 'exact' })
            .eq('organization_id', organizationId)
            .eq('level', level)
        return { data: (data as PsychosocialRisk[]) ?? [], error: formatError(error), count }
    }
}

export const diagnosisRepository = new DiagnosisRepository()
export const riskRepository = new RiskRepository()
