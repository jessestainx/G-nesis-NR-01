import type { Organization } from '@/types'
import { useOrganizations } from '@/hooks/queries/useOrganizations'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { formatDate, formatCnpj } from '@/utils/format'

const statusLabel: Record<Organization['status'], string> = {
    active: 'Ativo',
    suspended: 'Suspenso',
    inactive: 'Inativo',
}

const statusColor: Record<Organization['status'], string> = {
    active: 'bg-green-100 text-green-700',
    suspended: 'bg-yellow-100 text-yellow-700',
    inactive: 'bg-gray-100 text-gray-500',
}

const planLabel: Record<string, string> = {
    basic: 'Básico',
    standard: 'Standard',
    premium: 'Premium',
}

function OrgRow({ org }: { org: Organization }) {
    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50">
            <td className="px-4 py-3 text-sm font-medium text-gray-900">{org.name}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{formatCnpj(org.cnpj)}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{org.industry ?? '—'}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{org.employee_count ?? '—'}</td>
            <td className="px-4 py-3 text-sm text-gray-600">
                {org.plan ? planLabel[org.plan] : '—'}
            </td>
            <td className="px-4 py-3">
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[org.status]}`}>
                    {statusLabel[org.status]}
                </span>
            </td>
            <td className="px-4 py-3 text-sm text-gray-500">{formatDate(org.created_at)}</td>
        </tr>
    )
}

export function OrganizationsPage() {
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Organizações</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {orgs?.length ?? 0} organização(ões) cadastrada(s)
                    </p>
                </div>
            </div>

            {!orgs || orgs.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center">
                    <p className="text-sm text-gray-500">Nenhuma organização cadastrada ainda.</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                    <table className="w-full text-left">
                        <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-4 py-3">Nome</th>
                                <th className="px-4 py-3">CNPJ</th>
                                <th className="px-4 py-3">Setor</th>
                                <th className="px-4 py-3">Funcionários</th>
                                <th className="px-4 py-3">Plano</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Criado em</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orgs.map((org) => (
                                <OrgRow key={org.id} org={org} />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
