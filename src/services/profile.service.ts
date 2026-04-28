import { profileRepository } from '@/repositories/profile.repository'
import { auditRepository } from '@/repositories/audit.repository'
import type { PendingInvite, Profile, UserRole } from '@/types'
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
        message?: string
        actorId: string
    }): Promise<{ error: string | null }> {
        const result = await profileRepository.inviteUser(params)
        if (!result.error) {
            await auditRepository.log({
                userId: params.actorId,
                action: 'user.invite',
                entityType: 'profiles',
                organizationId: params.organizationId,
                metadata: { email: params.email, role: params.role },
            })
        }
        return result
    },

    async listPendingInvites(organizationId: string): Promise<QueryListResult<PendingInvite>> {
        return profileRepository.findPendingInvites(organizationId)
    },

    async deactivate(
        userId: string,
        actorId: string,
    ): Promise<{ error: string | null }> {
        const result = await profileRepository.deactivate(userId)
        if (!result.error) {
            await auditRepository.log({
                userId: actorId,
                action: 'user.deactivate',
                entityType: 'profiles',
                entityId: userId,
            })
        }
        return result
    },

    async reactivate(
        userId: string,
        actorId: string,
    ): Promise<{ error: string | null }> {
        const result = await profileRepository.reactivate(userId)
        if (!result.error) {
            await auditRepository.log({
                userId: actorId,
                action: 'user.reactivate',
                entityType: 'profiles',
                entityId: userId,
            })
        }
        return result
    },
}
