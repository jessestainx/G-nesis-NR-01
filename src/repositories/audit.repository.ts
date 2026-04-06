import { db, BaseRepository, formatError } from '@/repositories/base.repository'
import type { QueryListResult } from '@/repositories/base.repository'
import type { AuditLog } from '@/types'

export class AuditRepository extends BaseRepository<AuditLog> {
    constructor() { super('audit_logs') }

    async log(params: {
        userId: string
        action: string
        entityType: string
        entityId?: string
        organizationId?: string
        metadata?: Record<string, unknown>
    }): Promise<void> {
        const { error } = await db.from('audit_logs').insert({
            user_id: params.userId,
            action: params.action,
            entity_type: params.entityType,
            entity_id: params.entityId ?? null,
            organization_id: params.organizationId ?? null,
            metadata: params.metadata ?? null,
        })
        if (error) console.error('[Audit] Falha ao registrar log:', error.message)
    }

    async findByUser(userId: string, limit = 50): Promise<QueryListResult<AuditLog>> {
        const { data, error, count } = await db
            .from('audit_logs').select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false }).limit(limit)
        return { data: (data as AuditLog[]) ?? [], error: formatError(error), count }
    }

    async findByOrganization(organizationId: string, limit = 100): Promise<QueryListResult<AuditLog>> {
        const { data, error, count } = await db
            .from('audit_logs').select('*', { count: 'exact' })
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false }).limit(limit)
        return { data: (data as AuditLog[]) ?? [], error: formatError(error), count }
    }

    async findByEntity(entityType: string, entityId: string): Promise<QueryListResult<AuditLog>> {
        const { data, error, count } = await db
            .from('audit_logs').select('*', { count: 'exact' })
            .eq('entity_type', entityType).eq('entity_id', entityId)
            .order('created_at', { ascending: false })
        return { data: (data as AuditLog[]) ?? [], error: formatError(error), count }
    }
}

export const auditRepository = new AuditRepository()
