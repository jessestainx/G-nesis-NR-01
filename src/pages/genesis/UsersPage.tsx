import type { Profile, UserRole } from '@/types'
import { useOrganizationProfiles } from '@/hooks/queries/useProfiles'
import { useOrganizations } from '@/hooks/queries/useOrganizations'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { formatDate, roleLabel } from '@/utils/format'

const roleColor: Record<UserRole, string> = {
    genesis: 'bg-purple-100 text-purple-700',
    client_executive: 'bg-blue-100 text-blue-700',
    collaborator: 'bg-green-100 text-green-700',
    professional: 'bg-orange-100 text-orange-700',
}

function UserRow({ profile }: { profile: Profile }) {
    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50">
            <td className="px-4 py-3 text-sm font-medium text-gray-900">{profile.name}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{profile.email}</td>
            <td className="px-4 py-3">
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${roleColor[profile.role]}`}>
                    {roleLabel[profile.role] ?? profile.role}
                </span>
            </td>
            <td className="px-4 py-3 text-sm text-gray-500">{formatDate(profile.created_at)}</td>
        </tr>
    )
}

function OrgUsersBlock({ orgId, orgName }: { orgId: string; orgName: string }) {
    const { data: profiles, isLoading, error, refetch } = useOrganizationProfiles(orgId)

    if (isLoading) return <SectionLoader />
    if (error) {
        return (
            <ErrorMessage
                message={error instanceof Error ? error.message : 'Erro ao carregar usuários'}
                onRetry={() => void refetch()}
            />
        )
    }
    if (!profiles || profiles.length === 0) return null

    return (
        <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-4 py-3">
                <h2 className="text-sm font-semibold text-gray-700">{orgName}</h2>
                <p className="text-xs text-gray-400">{profiles.length} usuário(s)</p>
            </div>
            <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                        <th className="px-4 py-2">Nome</th>
                        <th className="px-4 py-2">E-mail</th>
                        <th className="px-4 py-2">Papel</th>
                        <th className="px-4 py-2">Criado em</th>
                    </tr>
                </thead>
                <tbody>
                    {profiles.map((p) => <UserRow key={p.id} profile={p} />)}
                </tbody>
            </table>
        </div>
    )
}

export function UsersPage() {
    const { data: orgs, isLoading, error, refetch } = useOrganizations()

    if (isLoading) return <SectionLoader />
    if (error) {
        return (
            <ErrorMessage
                message={error instanceof Error ? error.message : 'Erro ao carregar organizações'}
                onRetry={() => void refetch()}
            />
        )
    }

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
                <p className="mt-1 text-sm text-gray-500">Usuários agrupados por organização</p>
            </div>
            {!orgs || orgs.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center">
                    <p className="text-sm text-gray-500">Nenhuma organização cadastrada.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orgs.map((org) => (
                        <OrgUsersBlock key={org.id} orgId={org.id} orgName={org.name} />
                    ))}
                </div>
            )}
        </div>
    )
}
