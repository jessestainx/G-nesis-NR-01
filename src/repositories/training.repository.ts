import { db, BaseRepository, formatError } from '@/repositories/base.repository'
import type { QueryListResult, QueryResult } from '@/repositories/base.repository'
import type { Training } from '@/types'

export class TrainingRepository extends BaseRepository<Training> {
    constructor() { super('trainings') }

    async findByOrganization(organizationId: string): Promise<QueryListResult<Training>> {
        const { data, error, count } = await db
            .from('trainings').select('*', { count: 'exact' })
            .eq('organization_id', organizationId)
            .order('scheduled_date', { ascending: false })
        return { data: (data as Training[]) ?? [], error: formatError(error), count }
    }

    async createTraining(
        payload: Omit<Training, 'id' | 'created_at'>,
    ): Promise<QueryResult<Training>> {
        const { data, error } = await db
            .from('trainings').insert(payload).select().single()
        return { data: data as Training | null, error: formatError(error) }
    }
}

export const trainingRepository = new TrainingRepository()
