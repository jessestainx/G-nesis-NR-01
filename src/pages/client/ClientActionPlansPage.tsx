import { useAuth } from '@/hooks/useAuth'
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

export function ClientActionPlansPage() {
    const { profile } = useAuth()
    const orgId = profile?.organization_id ?? ''
    const { data: plans, isLoading, error, refetch } = useActionPlans(orgId)

    if (isLoading) return <SectionLoader />
    if (error) return <ErrorMessage message="Erro ao carregar planos de ação" onRetry={refetch} />

    const active = plans?.filter((p) => p.status === 'in_progress').length ?? 0
    const completed = plans?.filter((p) => p.status === 'completed').length ?? 0

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Planos de Ação</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Acompanhe o progresso dos planos de ação NR-01 da sua organização.
                </p>
            </div>

            <div className="flex gap-4 text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                    {plans?.length ?? 0} total
                </span>
                <span className="text-indigo-600 dark:text-indigo-400">{active} em andamento</span>
                <span className="text-emerald-600 dark:text-emerald-400">{completed} concluídos</span>
            </div>

            {!plans || plans.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Nenhum plano de ação disponível.
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                    Plano
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                    Progresso
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                    Prazo
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {plans.map((plan) => (
                                <PlanRow key={plan.id} plan={plan} />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
