import type { ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useOrganization } from '@/hooks/queries/useOrganizations'
import { useDiagnoses } from '@/hooks/queries/useDiagnosis'
import { useActionPlans } from '@/hooks/queries/useActionPlans'
import { useDocuments } from '@/hooks/queries/useDocuments'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { Building2, ClipboardCheck, BadgeCheck, FileText } from 'lucide-react'

interface KpiCardProps {
    title: string
    value: string | number
    subtitle?: string
    icon: ComponentType<{ className?: string }>
    color: 'indigo' | 'emerald' | 'amber' | 'rose'
    to?: string
}

const kpiColors = {
    indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400',
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
    rose: 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400',
}

function KpiCard({ title, value, subtitle, icon: Icon, color, to }: KpiCardProps) {
    const inner = (
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
                    {subtitle && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
                    )}
                </div>
                <div className={`rounded-lg p-2 ${kpiColors[color]}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    )
    return to ? <Link to={to}>{inner}</Link> : inner
}

export function ClientOverview() {
    const { profile } = useAuth()
    const orgId = profile?.organization_id ?? ''

    const orgQuery = useOrganization(orgId)
    const diagnosesQuery = useDiagnoses(orgId)
    const plansQuery = useActionPlans(orgId)
    const docsQuery = useDocuments(orgId)

    const isLoading =
        orgQuery.isLoading || diagnosesQuery.isLoading || plansQuery.isLoading || docsQuery.isLoading

    if (isLoading) return <SectionLoader />

    const org = orgQuery.data
    const diagnoses = diagnosesQuery.data ?? []
    const plans = plansQuery.data ?? []
    const docs = docsQuery.data ?? []

    const activeDiagnoses = diagnoses.filter((d) => d.status === 'in_progress').length
    const pendingPlans = plans.filter((p) => p.status === 'pending' || p.status === 'in_progress').length
    const completedPlans = plans.filter((p) => p.status === 'completed').length

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {org?.name ?? 'Dashboard'}
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Visão geral da conformidade NR-01 da sua organização.
                </p>
            </div>

            {orgQuery.error && (
                <ErrorMessage message="Erro ao carregar organização" onRetry={() => orgQuery.refetch()} />
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    title="Diagnósticos"
                    value={diagnoses.length}
                    subtitle={activeDiagnoses > 0 ? `${activeDiagnoses} em andamento` : undefined}
                    icon={ClipboardCheck}
                    color="indigo"
                    to="/dashboard/client/diagnosis"
                />
                <KpiCard
                    title="Planos de ação"
                    value={plans.length}
                    subtitle={pendingPlans > 0 ? `${pendingPlans} pendentes` : `${completedPlans} concluídos`}
                    icon={BadgeCheck}
                    color="amber"
                    to="/dashboard/client/action-plans"
                />
                <KpiCard
                    title="Documentos"
                    value={docs.length}
                    icon={FileText}
                    color="emerald"
                    to="/dashboard/client/documents"
                />
                <KpiCard
                    title="Colaboradores"
                    value={org?.employee_count ?? '—'}
                    icon={Building2}
                    color="rose"
                />
            </div>

            {org && (
                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                    <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                        <Building2 className="h-4 w-4" /> Informações da organização
                    </h2>
                    <dl className="grid gap-3 sm:grid-cols-2">
                        {org.cnpj && (
                            <div>
                                <dt className="text-xs text-gray-500 dark:text-gray-400">CNPJ</dt>
                                <dd className="text-sm font-medium text-gray-900 dark:text-white">{org.cnpj}</dd>
                            </div>
                        )}
                        {org.industry && (
                            <div>
                                <dt className="text-xs text-gray-500 dark:text-gray-400">Setor</dt>
                                <dd className="text-sm font-medium text-gray-900 dark:text-white">{org.industry}</dd>
                            </div>
                        )}
                        {org.responsible_name && (
                            <div>
                                <dt className="text-xs text-gray-500 dark:text-gray-400">Responsável</dt>
                                <dd className="text-sm font-medium text-gray-900 dark:text-white">{org.responsible_name}</dd>
                            </div>
                        )}
                        {org.responsible_email && (
                            <div>
                                <dt className="text-xs text-gray-500 dark:text-gray-400">E-mail do responsável</dt>
                                <dd className="text-sm font-medium text-gray-900 dark:text-white">{org.responsible_email}</dd>
                            </div>
                        )}
                    </dl>
                </div>
            )}

            {plans.filter((p) => p.status === 'in_progress').length > 0 && (
                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                    <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
                        Planos de ação em andamento
                    </h2>
                    <ul className="space-y-3">
                        {plans
                            .filter((p) => p.status === 'in_progress')
                            .map((plan) => (
                                <li key={plan.id} className="flex items-center justify-between gap-4">
                                    <span className="truncate text-sm text-gray-700 dark:text-gray-300">{plan.title}</span>
                                    <div className="flex shrink-0 items-center gap-2">
                                        <div className="h-1.5 w-24 rounded-full bg-gray-200 dark:bg-gray-700">
                                            <div
                                                className="h-1.5 rounded-full bg-indigo-500"
                                                style={{ width: `${plan.progress_pct}%` }}
                                            />
                                        </div>
                                        <span className="w-8 text-right text-xs text-gray-500">{plan.progress_pct}%</span>
                                    </div>
                                </li>
                            ))}
                    </ul>
                </div>
            )}
        </div>
    )
}
