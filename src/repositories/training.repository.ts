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

    async updateStatus(
        id: string,
        status: Training['status'],
        completedDate?: string | null,
    ): Promise<QueryResult<Training>> {
        const patch: Partial<Training> = { status }
        if (completedDate !== undefined) patch.completed_date = completedDate
        const { data, error } = await db
            .from('trainings').update(patch).eq('id', id).select().single()
        return { data: data as Training | null, error: formatError(error) }
    }
}

export const trainingRepository = new TrainingRepository()
