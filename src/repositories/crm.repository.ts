import { db, BaseRepository, formatError } from '@/repositories/base.repository'
import type { QueryListResult } from '@/repositories/base.repository'
import type { CrmContact, Contract } from '@/types'

export class CrmRepository extends BaseRepository<CrmContact> {
    constructor() { super('crm_contacts') }

    async findByStage(stage: CrmContact['stage']): Promise<QueryListResult<CrmContact>> {
        const { data, error, count } = await db
            .from('crm_contacts').select('*', { count: 'exact' })
            .eq('stage', stage).order('updated_at', { ascending: false })
        return { data: (data as CrmContact[]) ?? [], error: formatError(error), count }
    }

    async findByAssignee(userId: string): Promise<QueryListResult<CrmContact>> {
        const { data, error, count } = await db
            .from('crm_contacts').select('*', { count: 'exact' })
            .eq('assigned_to', userId).order('updated_at', { ascending: false })
        return { data: (data as CrmContact[]) ?? [], error: formatError(error), count }
    }

    async search(query: string): Promise<QueryListResult<CrmContact>> {
        const { data, error, count } = await db
            .from('crm_contacts').select('*', { count: 'exact' })
            .or(`name.ilike.%${query}%,email.ilike.%${query}%,company.ilike.%${query}%`)
            .order('name')
        return { data: (data as CrmContact[]) ?? [], error: formatError(error), count }
    }
}

export class ContractRepository extends BaseRepository<Contract> {
    constructor() { super('contracts') }

    async findByOrganization(organizationId: string): Promise<QueryListResult<Contract>> {
        const { data, error, count } = await db
            .from('contracts').select('*', { count: 'exact' })
            .eq('organization_id', organizationId)
            .order('start_date', { ascending: false })
        return { data: (data as Contract[]) ?? [], error: formatError(error), count }
    }

    async findActive(): Promise<QueryListResult<Contract>> {
        const { data, error, count } = await db
            .from('contracts').select('*', { count: 'exact' })
            .eq('status', 'active').order('end_date', { ascending: true })
        return { data: (data as Contract[]) ?? [], error: formatError(error), count }
    }

    async findExpiringSoon(days = 30): Promise<QueryListResult<Contract>> {
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + days)
        const { data, error, count } = await db
            .from('contracts').select('*', { count: 'exact' })
            .eq('status', 'active')
            .lte('end_date', futureDate.toISOString().split('T')[0])
            .order('end_date')
        return { data: (data as Contract[]) ?? [], error: formatError(error), count }
    }
}

export const crmRepository = new CrmRepository()
export const contractRepository = new ContractRepository()
