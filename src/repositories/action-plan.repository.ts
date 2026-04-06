import { db, BaseRepository, formatError } from '@/repositories/base.repository'
import type { QueryResult, QueryListResult } from '@/repositories/base.repository'
import type { ActionPlan, ActionItem } from '@/types'

export class ActionPlanRepository extends BaseRepository<ActionPlan> {
    constructor() { super('action_plans') }

    async findByOrganization(organizationId: string): Promise<QueryListResult<ActionPlan>> {
        const { data, error, count } = await db
            .from('action_plans').select('*', { count: 'exact' })
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false })
        return { data: (data as ActionPlan[]) ?? [], error: formatError(error), count }
    }

    async findByStatus(
        organizationId: string,
        status: ActionPlan['status'],
    ): Promise<QueryListResult<ActionPlan>> {
        const { data, error, count } = await db
            .from('action_plans').select('*', { count: 'exact' })
            .eq('organization_id', organizationId).eq('status', status)
            .order('due_date', { ascending: true })
        return { data: (data as ActionPlan[]) ?? [], error: formatError(error), count }
    }

    async findOverdue(organizationId: string): Promise<QueryListResult<ActionPlan>> {
        const today = new Date().toISOString().split('T')[0]
        const { data, error, count } = await db
            .from('action_plans').select('*', { count: 'exact' })
            .eq('organization_id', organizationId)
            .neq('status', 'completed').neq('status', 'cancelled')
            .lt('due_date', today)
        return { data: (data as ActionPlan[]) ?? [], error: formatError(error), count }
    }

    async findItems(actionPlanId: string): Promise<QueryListResult<ActionItem>> {
        const { data, error, count } = await db
            .from('action_items').select('*', { count: 'exact' })
            .eq('action_plan_id', actionPlanId).order('created_at')
        return { data: (data as ActionItem[]) ?? [], error: formatError(error), count }
    }

    async createItem(
        payload: Omit<ActionItem, 'id' | 'created_at' | 'completed_at'>,
    ): Promise<QueryResult<ActionItem>> {
        const { data, error } = await db
            .from('action_items').insert(payload).select().single()
        return { data: data as ActionItem | null, error: formatError(error) }
    }

    async updateItem(
        id: string,
        payload: Partial<Omit<ActionItem, 'id' | 'created_at'>>,
    ): Promise<QueryResult<ActionItem>> {
        const updates = {
            ...payload,
            ...(payload.status === 'completed' ? { completed_at: new Date().toISOString() } : {}),
        }
        const { data, error } = await db
            .from('action_items').update(updates).eq('id', id).select().single()
        return { data: data as ActionItem | null, error: formatError(error) }
    }

    async recalculateProgress(actionPlanId: string): Promise<{ error: string | null }> {
        const { data: items, error } = await db
            .from('action_items').select('status').eq('action_plan_id', actionPlanId)
        if (error) return { error: formatError(error) }
        const total = items?.length ?? 0
        const completed = items?.filter((i: { status: string }) => i.status === 'completed').length ?? 0
        const progressPct = total === 0 ? 0 : Math.round((completed / total) * 100)
        const { error: updateError } = await db
            .from('action_plans').update({ progress_pct: progressPct }).eq('id', actionPlanId)
        return { error: formatError(updateError) }
    }
}

export const actionPlanRepository = new ActionPlanRepository()
