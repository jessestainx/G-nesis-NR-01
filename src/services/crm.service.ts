import { crmRepository, contractRepository } from '@/repositories/crm.repository'
import { auditRepository } from '@/repositories/audit.repository'
import type { CrmContact, Contract } from '@/types'
import type { QueryListResult, QueryResult } from '@/repositories/base.repository'

export const crmService = {
    // ── Contacts ──────────────────────────────────────────────────────────────

    async listAll(): Promise<QueryListResult<CrmContact>> {
        return crmRepository.findAll()
    },

    async listByStage(stage: CrmContact['stage']): Promise<QueryListResult<CrmContact>> {
        return crmRepository.findByStage(stage)
    },

    async listByAssignee(userId: string): Promise<QueryListResult<CrmContact>> {
        return crmRepository.findByAssignee(userId)
    },

    async search(query: string): Promise<QueryListResult<CrmContact>> {
        return crmRepository.search(query)
    },

    async get(id: string): Promise<QueryResult<CrmContact>> {
        return crmRepository.findById(id)
    },

    async create(
        payload: Omit<CrmContact, 'id' | 'created_at' | 'updated_at'>,
        actorId: string,
    ): Promise<QueryResult<CrmContact>> {
        const result = await crmRepository.create(payload)
        if (result.data) {
            await auditRepository.log({
                userId: actorId,
                action: 'crm.contact.create',
                entityType: 'crm_contacts',
                entityId: result.data.id,
                metadata: { company: result.data.company },
            })
        }
        return result
    },

    async advanceStage(
        id: string,
        stage: CrmContact['stage'],
        actorId: string,
    ): Promise<QueryResult<CrmContact>> {
        const result = await crmRepository.update(id, { stage })
        if (result.data) {
            await auditRepository.log({
                userId: actorId,
                action: 'crm.contact.advance_stage',
                entityType: 'crm_contacts',
                entityId: id,
                metadata: { stage },
            })
        }
        return result
    },

    // ── Contracts ─────────────────────────────────────────────────────────────

    async listActive(): Promise<QueryListResult<Contract>> {
        return contractRepository.findActive()
    },

    async listByOrganization(organizationId: string): Promise<QueryListResult<Contract>> {
        return contractRepository.findByOrganization(organizationId)
    },

    async listExpiringSoon(days = 30): Promise<QueryListResult<Contract>> {
        return contractRepository.findExpiringSoon(days)
    },

    async createContract(
        payload: Omit<Contract, 'id' | 'created_at' | 'updated_at'>,
        actorId: string,
    ): Promise<QueryResult<Contract>> {
        const result = await contractRepository.create(payload)
        if (result.data) {
            await auditRepository.log({
                userId: actorId,
                action: 'contract.create',
                entityType: 'contracts',
                entityId: result.data.id,
                organizationId: result.data.organization_id,
            })
        }
        return result
    },

    async updateContractStatus(
        id: string,
        status: Contract['status'],
        actorId: string,
    ): Promise<QueryResult<Contract>> {
        const result = await contractRepository.update(id, { status })
        if (result.data) {
            await auditRepository.log({
                userId: actorId,
                action: 'contract.update_status',
                entityType: 'contracts',
                entityId: id,
                organizationId: result.data.organization_id,
                metadata: { status },
            })
        }
        return result
    },
}
