import { ClipboardList, PlayCircle, CheckCircle2, XCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useActionPlans, useUpdateActionPlan } from '@/hooks/queries/useActionPlans'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { EmptyState } from '@/components/ui/EmptyState'
import { actionStatusLabel, formatDate, formatPercent } from '@/utils/format'
import type { ActionPlan } from '@/types'

const STATUS_NEXT: Partial<Record<string, string>> = {
    pending: 'in_progress',
    in_progress: 'completed',
}
const NEXT_LABEL: Partial<Record<string, string>> = {
    pending: 'Iniciar',
    in_progress: 'Concluir',
}

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
    const update = useUpdateActionPlan()
    const next = STATUS_NEXT[plan.status]
    const isActive = plan.status === 'pending' || plan.status === 'in_progress'

    function handleAdvance(e: React.MouseEvent) {
        e.stopPropagation()
        if (!next) return
        void update.mutate({ id: plan.id, organizationId: plan.organization_id, payload: { status: next as ActionPlan['status'] } })
    }

    function handleCancel(e: React.MouseEvent) {
        e.stopPropagation()
        if (!window.confirm('Tem certeza que deseja cancelar este plano? Esta ação não pode ser desfeita.')) return
        void update.mutate({ id: plan.id, organizationId: plan.organization_id, payload: { status: 'cancelled' } })
    }

    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{plan.title}</td>
            <td className="px-4 py-3">
                <StatusBadge status={plan.status} />
            </td>
            <td className="hidden px-4 py-3 sm:table-cell">
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
            <td className="hidden px-4 py-3 text-sm text-gray-500 dark:text-gray-400 md:table-cell">
                {formatDate(plan.due_date)}
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                    {next && (
                        <button
                            onClick={handleAdvance}
                            disabled={update.isPending}
                            title={NEXT_LABEL[plan.status]}
                            className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors disabled:opacity-40 ${
                                plan.status === 'pending'
                                    ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                    : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                        >
                            {plan.status === 'pending' ? <PlayCircle size={13} /> : <CheckCircle2 size={13} />}
                            <span className="hidden sm:inline">{NEXT_LABEL[plan.status]}</span>
                        </button>
                    )}
                    {isActive && (
                        <button
                            onClick={handleCancel}
                            disabled={update.isPending}
                            title="Cancelar plano"
                            className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-40 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400"
                        >
                            <XCircle size={13} />
                            <span className="hidden sm:inline">Cancelar</span>
                        </button>
                    )}
                </div>
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
                <EmptyState icon={ClipboardList} title="Nenhum plano de ação" description="Planos de ação aparecerão aqui quando criados." />) : (
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
                                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 sm:table-cell">
                                    Progresso
                                </th>
                                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 md:table-cell">
                                    Prazo
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                    Ações
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
