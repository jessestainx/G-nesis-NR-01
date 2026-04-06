import { useMemo, type ComponentType } from 'react'
import {
    useFinanceSummary,
    useCrmContacts,
    useActiveContracts,
} from '@/hooks/queries/useFinance'
import { useOrganizations } from '@/hooks/queries/useOrganizations'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { formatCurrency } from '@/utils/format'
import { Building2, Users, FileCheck2, TrendingUp } from 'lucide-react'

interface StatCardProps {
    title: string
    value: string | number
    badge?: string
    badgeColor?: 'indigo' | 'emerald' | 'amber' | 'rose'
    icon: ComponentType<{ className?: string }>
}

function StatCard({ title, value, badge, badgeColor = 'indigo', icon: Icon }: StatCardProps) {
    const colors = {
        indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400',
        emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
        amber: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
        rose: 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400',
    }

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
                    {badge && (
                        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[badgeColor]}`}>
                            {badge}
                        </span>
                    )}
                </div>
                <div className={`rounded-lg p-2 ${colors[badgeColor]}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    )
}

const CRM_STAGE_LABELS: Record<string, string> = {
    lead: 'Lead',
    prospect: 'Prospecto',
    proposal: 'Proposta',
    negotiation: 'Negociação',
    closed_won: 'Fechado (ganho)',
    closed_lost: 'Fechado (perdido)',
}

const ORG_STATUS_LABELS: Record<string, string> = {
    active: 'Ativo',
    suspended: 'Suspenso',
    inactive: 'Inativo',
}

export function GenesisOverview() {
    const today = new Date()
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
    const todayStr = today.toISOString().split('T')[0]

    const financeSummary = useFinanceSummary(monthStart, todayStr)
    const contactsQuery = useCrmContacts()
    const contractsQuery = useActiveContracts()
    const orgsQuery = useOrganizations()

    const isLoading =
        financeSummary.isLoading ||
        contactsQuery.isLoading ||
        contractsQuery.isLoading ||
        orgsQuery.isLoading

    const contacts = contactsQuery.data ?? []
    const contracts = contractsQuery.data ?? []
    const organizations = orgsQuery.data ?? []
    const summary = financeSummary.data

    // ─── Derived stats ────────────────────────────────────────────────────────
    const activeOrgs = organizations.filter((o) => o.status === 'active').length
    const orgsByStatus = useMemo(() => {
        const map: Record<string, number> = {}
        for (const org of organizations) {
            map[org.status] = (map[org.status] ?? 0) + 1
        }
        return map
    }, [organizations])

    const contactsByStage = useMemo(() => {
        const map: Record<string, number> = {}
        for (const c of contacts) {
            map[c.stage] = (map[c.stage] ?? 0) + 1
        }
        return map
    }, [contacts])

    if (isLoading) return <SectionLoader />

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Visão geral — Gênesis
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Gestão centralizada de todas as organizações clientes.
                </p>
            </div>

            {/* Error states */}
            {financeSummary.error && (
                <ErrorMessage
                    message="Erro ao carregar dados financeiros"
                    onRetry={() => financeSummary.refetch()}
                />
            )}

            {/* KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Organizações ativas"
                    value={activeOrgs}
                    badge={`${organizations.length} total`}
                    badgeColor="indigo"
                    icon={Building2}
                />
                <StatCard
                    title="Contatos no pipeline"
                    value={contacts.length}
                    badgeColor="emerald"
                    icon={Users}
                />
                <StatCard
                    title="Contratos ativos"
                    value={contracts.length}
                    badgeColor="amber"
                    icon={FileCheck2}
                />
                <StatCard
                    title="Receita do mês"
                    value={formatCurrency(summary?.revenue)}
                    badge={`Líquido: ${formatCurrency(summary?.net)}`}
                    badgeColor={summary && summary.net >= 0 ? 'emerald' : 'rose'}
                    icon={TrendingUp}
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Org breakdown */}
                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                    <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
                        Organizações por status
                    </h2>
                    <ul className="space-y-2">
                        {Object.entries(ORG_STATUS_LABELS).map(([status, label]) => {
                            const count = orgsByStatus[status] ?? 0
                            const pct = organizations.length ? Math.round((count / organizations.length) * 100) : 0
                            return (
                                <li key={status} className="flex items-center gap-3">
                                    <span className="w-24 text-xs text-gray-500">{label}</span>
                                    <div className="flex-1 rounded-full bg-gray-200 dark:bg-gray-700">
                                        <div
                                            className="h-2 rounded-full bg-indigo-500"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <span className="w-8 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                                        {count}
                                    </span>
                                </li>
                            )
                        })}
                    </ul>
                </div>

                {/* CRM pipeline */}
                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                    <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
                        Pipeline CRM
                    </h2>
                    <ul className="space-y-2">
                        {Object.entries(CRM_STAGE_LABELS).map(([stage, label]) => {
                            const count = contactsByStage[stage] ?? 0
                            const pct = contacts.length ? Math.round((count / contacts.length) * 100) : 0
                            return (
                                <li key={stage} className="flex items-center gap-3">
                                    <span className="w-24 text-xs text-gray-500">{label}</span>
                                    <div className="flex-1 rounded-full bg-gray-200 dark:bg-gray-700">
                                        <div
                                            className="h-2 rounded-full bg-emerald-500"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <span className="w-8 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                                        {count}
                                    </span>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            </div>
        </div>
    )
}
