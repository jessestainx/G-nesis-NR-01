import { useOrganizations } from '@/hooks/queries/useOrganizations'
import { useActionPlans } from '@/hooks/queries/useActionPlans'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { actionStatusLabel, formatDate, formatPercent } from '@/utils/format'
import type { ActionPlan } from '@/types'

function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        pending: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
        in_progress: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
        completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
        cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
    }
    return (
        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? colors['pending']}`}>
            {actionStatusLabel[status] ?? status}
        </span>
    )
}

function PlanRow({ plan }: { plan: ActionPlan }) {
    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{plan.title}</td>
            <td className="px-4 py-3">
                <StatusBadge status={plan.status} />
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                            className="h-1.5 rounded-full bg-indigo-500"
                            style={{ width: `${plan.progress_pct}%` }}
                        />
                    </div>
                    <span className="w-8 text-right text-xs text-gray-500">
                        {formatPercent(plan.progress_pct)}
                    </span>
                </div>
            </td>
            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                {formatDate(plan.due_date)}
            </td>
        </tr>
    )
}

function OrgPlansBlock({ orgId, orgName }: { orgId: string; orgName: string }) {
    const { data: plans, isLoading, error, refetch } = useActionPlans(orgId)

    if (isLoading) return <SectionLoader />
    if (error)
        return <ErrorMessage message={`Erro ao carregar planos de ${orgName}`} onRetry={refetch} />
    if (!plans || plans.length === 0) return null

    return (
        <div className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{orgName}</h2>
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Plano</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Progresso</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Prazo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {plans.map((plan) => (
                            <PlanRow key={plan.id} plan={plan} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export function ProfessionalActionPlansPage() {
    const orgsQuery = useOrganizations()

    if (orgsQuery.isLoading) return <SectionLoader />
    if (orgsQuery.error)
        return (
            <ErrorMessage
                message="Erro ao carregar organizações"
                onRetry={() => orgsQuery.refetch()}
            />
        )

    const orgs = orgsQuery.data ?? []

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Planos de Ação</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Planos de ação das organizações sob sua gestão.
                </p>
            </div>

            {orgs.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Nenhuma organização atribuída.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {orgs.map((org) => (
                        <OrgPlansBlock key={org.id} orgId={org.id} orgName={org.name} />
                    ))}
                </div>
            )}
        </div>
    )
}
