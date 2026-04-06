import { db, BaseRepository, formatError } from '@/repositories/base.repository'
import type { QueryResult, QueryListResult } from '@/repositories/base.repository'
import type { Organization, OrganizationUnit } from '@/types'

export class OrganizationRepository extends BaseRepository<Organization> {
    constructor() {
        super('organizations')
    }

    async findAllActive(): Promise<QueryListResult<Organization>> {
        const { data, error, count } = await db
            .from('organizations')
            .select('*', { count: 'exact' })
            .eq('status', 'active')
            .order('name')
        return { data: (data as Organization[]) ?? [], error: formatError(error), count }
    }

    async findByStatus(status: Organization['status']): Promise<QueryListResult<Organization>> {
        const { data, error, count } = await db
            .from('organizations')
            .select('*', { count: 'exact' })
            .eq('status', status)
            .order('name')
        return { data: (data as Organization[]) ?? [], error: formatError(error), count }
    }

    async findUnits(organizationId: string): Promise<QueryListResult<OrganizationUnit>> {
        const { data, error, count } = await db
            .from('organization_units')
            .select('*', { count: 'exact' })
            .eq('organization_id', organizationId)
            .order('name')
        return { data: (data as OrganizationUnit[]) ?? [], error: formatError(error), count }
    }

    async createUnit(
        payload: Omit<OrganizationUnit, 'id' | 'created_at'>,
    ): Promise<QueryResult<OrganizationUnit>> {
        const { data, error } = await db
            .from('organization_units')
            .insert(payload)
            .select()
            .single()
        return { data: data as OrganizationUnit | null, error: formatError(error) }
    }

    async updateUnit(
        id: string,
        payload: Partial<Omit<OrganizationUnit, 'id' | 'created_at'>>,
    ): Promise<QueryResult<OrganizationUnit>> {
        const { data, error } = await db
            .from('organization_units')
            .update(payload)
            .eq('id', id)
            .select()
            .single()
        return { data: data as OrganizationUnit | null, error: formatError(error) }
    }

    async deleteUnit(id: string): Promise<{ error: string | null }> {
        const { error } = await db.from('organization_units').delete().eq('id', id)
        return { error: formatError(error) }
    }
}

export const organizationRepository = new OrganizationRepository()
