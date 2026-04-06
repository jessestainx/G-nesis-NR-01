import { organizationRepository } from '@/repositories/organization.repository'
import { auditRepository } from '@/repositories/audit.repository'
import type { Organization, OrganizationUnit } from '@/types'
import type { QueryListResult, QueryResult } from '@/repositories/base.repository'

export const organizationService = {
    async list(): Promise<QueryListResult<Organization>> {
        return organizationRepository.findAllActive()
    },

    async listByStatus(status: Organization['status']): Promise<QueryListResult<Organization>> {
        return organizationRepository.findByStatus(status)
    },

    async get(id: string): Promise<QueryResult<Organization>> {
        return organizationRepository.findById(id)
    },

    async create(
        payload: Omit<Organization, 'id' | 'created_at' | 'updated_at'>,
        actorId: string,
    ): Promise<QueryResult<Organization>> {
        const result = await organizationRepository.create(payload)
        if (result.data) {
            await auditRepository.log({
                userId: actorId,
                action: 'organization.create',
                entityType: 'organizations',
                entityId: result.data.id,
            })
        }
        return result
    },

    async update(
        id: string,
        payload: Partial<Omit<Organization, 'id' | 'created_at'>>,
        actorId: string,
    ): Promise<QueryResult<Organization>> {
        const result = await organizationRepository.update(id, payload)
        if (result.data) {
            await auditRepository.log({
                userId: actorId,
                action: 'organization.update',
                entityType: 'organizations',
                entityId: id,
            })
        }
        return result
    },

    async listUnits(organizationId: string): Promise<QueryListResult<OrganizationUnit>> {
        return organizationRepository.findUnits(organizationId)
    },

    async createUnit(
        payload: Omit<OrganizationUnit, 'id' | 'created_at'>,
    ): Promise<QueryResult<OrganizationUnit>> {
        return organizationRepository.createUnit(payload)
    },

    async updateUnit(
        id: string,
        payload: Partial<Omit<OrganizationUnit, 'id' | 'created_at'>>,
    ): Promise<QueryResult<OrganizationUnit>> {
        return organizationRepository.updateUnit(id, payload)
    },

    async deleteUnit(id: string): Promise<{ error: string | null }> {
        return organizationRepository.deleteUnit(id)
    },
}
