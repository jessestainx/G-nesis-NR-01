import { profileRepository } from '@/repositories/profile.repository'
import { auditRepository } from '@/repositories/audit.repository'
import type { Profile, UserRole } from '@/types'
import type { QueryListResult, QueryResult } from '@/repositories/base.repository'

export const profileService = {
    async get(id: string): Promise<QueryResult<Profile>> {
        return profileRepository.findById(id)
    },

    async listByOrganization(organizationId: string): Promise<QueryListResult<Profile>> {
        return profileRepository.findByOrganization(organizationId)
    },

    async listByRole(role: UserRole): Promise<QueryListResult<Profile>> {
        return profileRepository.findByRole(role)
    },

    async update(
        id: string,
        payload: Partial<Omit<Profile, 'id' | 'created_at'>>,
        actorId: string,
    ): Promise<QueryResult<Profile>> {
        const result = await profileRepository.update(id, payload)
        if (result.data) {
            await auditRepository.log({
                userId: actorId,
                action: 'profile.update',
                entityType: 'profiles',
                entityId: id,
            })
        }
        return result
    },

    async updateAvatar(
        id: string,
        avatarUrl: string,
        actorId: string,
    ): Promise<QueryResult<Profile>> {
        const result = await profileRepository.updateAvatar(id, avatarUrl)
        if (result.data) {
            await auditRepository.log({
                userId: actorId,
                action: 'profile.update_avatar',
                entityType: 'profiles',
                entityId: id,
            })
        }
        return result
    },

    async invite(params: {
        email: string
        name: string
        role: UserRole
        organizationId?: string
    }): Promise<{ error: string | null }> {
        return profileRepository.inviteUser(params)
    },
}

