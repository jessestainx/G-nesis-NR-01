import type { ComponentType } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useOrganizations } from '@/hooks/queries/useOrganizations'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { Building2, ClipboardCheck, BadgeCheck } from 'lucide-react'
import type { Organization } from '@/types'

interface KpiCardProps {
    title: string
    value: number
    icon: ComponentType<{ className?: string }>
    color: 'indigo' | 'emerald' | 'amber'
}

const kpiColors = {
    indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400',
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
}

function KpiCard({ title, value, icon: Icon, color }: KpiCardProps) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
                </div>
                <div className={`rounded-lg p-2 ${kpiColors[color]}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    )
}

function OrgCard({ org }: { org: Organization }) {
    const isActive = org.status === 'active'
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-indigo-100 p-2 dark:bg-indigo-950">
                        <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{org.name}</p>
                        {org.employee_count != null && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {org.employee_count} colaboradores
                            </p>
                        )}
                    </div>
                </div>
                <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}
                >
                    {isActive ? 'Ativo' : org.status}
                </span>
            </div>
        </div>
    )
}

export function ProfessionalOverview() {
    const { profile } = useAuth()
    const orgsQuery = useOrganizations()

    if (orgsQuery.isLoading) return <SectionLoader />

    const orgs = orgsQuery.data ?? []
    const activeOrgs = orgs.filter((o) => o.status === 'active')

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Olá, {profile?.name ?? 'Profissional'}
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Visão geral das organizações sob sua gestão.
                </p>
            </div>

            {orgsQuery.error && (
                <ErrorMessage
                    message="Erro ao carregar organizações"
                    onRetry={() => orgsQuery.refetch()}
                />
            )}

            <div className="grid gap-4 sm:grid-cols-3">
                <KpiCard
                    title="Organizações"
                    value={orgs.length}
                    icon={Building2}
                    color="indigo"
                />
                <KpiCard
                    title="Ativas"
                    value={activeOrgs.length}
                    icon={ClipboardCheck}
                    color="emerald"
                />
                <KpiCard
                    title="Em acompanhamento"
                    value={activeOrgs.length}
                    icon={BadgeCheck}
                    color="amber"
                />
            </div>

            {orgs.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
                    <Building2 className="mx-auto mb-3 h-8 w-8 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Nenhuma organização atribuída.
                    </p>
                </div>
            ) : (
                <div>
                    <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                        Organizações ({orgs.length})
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {orgs.map((org) => (
                            <OrgCard key={org.id} org={org} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
