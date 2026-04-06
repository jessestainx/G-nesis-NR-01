import { supabase } from '@/lib/supabase'
import { db, BaseRepository, formatError } from '@/repositories/base.repository'
import type { QueryResult, QueryListResult } from '@/repositories/base.repository'
import type { Profile, UserRole } from '@/types'

export class ProfileRepository extends BaseRepository<Profile> {
    constructor() {
        super('profiles')
    }

    async findByOrganization(organizationId: string): Promise<QueryListResult<Profile>> {
        const { data, error, count } = await db
            .from('profiles')
            .select('*', { count: 'exact' })
            .eq('organization_id', organizationId)
            .order('name')
        return { data: (data as Profile[]) ?? [], error: formatError(error), count }
    }

    async findByRole(role: UserRole): Promise<QueryListResult<Profile>> {
        const { data, error, count } = await db
            .from('profiles')
            .select('*', { count: 'exact' })
            .eq('role', role)
            .order('name')
        return { data: (data as Profile[]) ?? [], error: formatError(error), count }
    }

    async findByOrganizationAndRole(
        organizationId: string,
        role: UserRole,
    ): Promise<QueryListResult<Profile>> {
        const { data, error, count } = await db
            .from('profiles')
            .select('*', { count: 'exact' })
            .eq('organization_id', organizationId)
            .eq('role', role)
            .order('name')
        return { data: (data as Profile[]) ?? [], error: formatError(error), count }
    }

    async updateAvatar(id: string, avatarUrl: string): Promise<QueryResult<Profile>> {
        return this.update(id, { avatar_url: avatarUrl })
    }

    async inviteUser(params: {
        email: string
        name: string
        role: UserRole
        organizationId?: string
    }): Promise<{ error: string | null }> {
        const { error } = await supabase.auth.admin.inviteUserByEmail(params.email, {
            data: {
                name: params.name,
                role: params.role,
                organization_id: params.organizationId ?? null,
            },
        })
        return { error: error?.message ?? null }
    }
}

export const profileRepository = new ProfileRepository()
