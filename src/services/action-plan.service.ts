import { actionPlanRepository } from '@/repositories/action-plan.repository'
import { auditRepository } from '@/repositories/audit.repository'
import type { ActionPlan, ActionItem } from '@/types'
import type { QueryListResult, QueryResult } from '@/repositories/base.repository'

export const actionPlanService = {
    async listByOrganization(organizationId: string): Promise<QueryListResult<ActionPlan>> {
        return actionPlanRepository.findByOrganization(organizationId)
    },

    async listByStatus(
        organizationId: string,
        status: ActionPlan['status'],
    ): Promise<QueryListResult<ActionPlan>> {
        return actionPlanRepository.findByStatus(organizationId, status)
    },

    async listOverdue(organizationId: string): Promise<QueryListResult<ActionPlan>> {
        return actionPlanRepository.findOverdue(organizationId)
    },

    async create(
        payload: Omit<ActionPlan, 'id' | 'created_at' | 'updated_at'>,
        actorId: string,
    ): Promise<QueryResult<ActionPlan>> {
        const result = await actionPlanRepository.create(payload)
        if (result.data) {
            await auditRepository.log({
                userId: actorId,
                action: 'action_plan.create',
                entityType: 'action_plans',
                entityId: result.data.id,
                organizationId: result.data.organization_id,
            })
        }
        return result
    },

    async update(
        id: string,
        payload: Partial<Omit<ActionPlan, 'id' | 'created_at'>>,
        actorId: string,
    ): Promise<QueryResult<ActionPlan>> {
        const result = await actionPlanRepository.update(id, payload)
        if (result.data) {
            await auditRepository.log({
                userId: actorId,
                action: 'action_plan.update',
                entityType: 'action_plans',
                entityId: id,
                organizationId: result.data.organization_id,
            })
        }
        return result
    },

    async listItems(actionPlanId: string): Promise<QueryListResult<ActionItem>> {
        return actionPlanRepository.findItems(actionPlanId)
    },

    async createItem(
        payload: Omit<ActionItem, 'id' | 'created_at' | 'completed_at'>,
        actorId: string,
    ): Promise<QueryResult<ActionItem>> {
        const result = await actionPlanRepository.createItem(payload)
        if (result.data) {
            await auditRepository.log({
                userId: actorId,
                action: 'action_plan.item.create',
                entityType: 'action_items',
                entityId: result.data.id,
                metadata: { actionPlanId: result.data.action_plan_id },
            })
            await actionPlanRepository.recalculateProgress(result.data.action_plan_id)
        }
        return result
    },

    async updateItem(
        id: string,
        payload: Partial<Omit<ActionItem, 'id' | 'created_at'>>,
        actorId: string,
    ): Promise<QueryResult<ActionItem>> {
        const result = await actionPlanRepository.updateItem(id, payload)
        if (result.data) {
            await auditRepository.log({
                userId: actorId,
                action: 'action_plan.item.update',
                entityType: 'action_items',
                entityId: id,
                metadata: { status: result.data.status },
            })
            await actionPlanRepository.recalculateProgress(result.data.action_plan_id)
        }
        return result
    },
}


