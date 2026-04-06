import type { ActionPlan } from '@/types'
import { useOrganizations } from '@/hooks/queries/useOrganizations'
import { useActionPlans } from '@/hooks/queries/useActionPlans'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { formatDate, actionStatusLabel, formatPercent } from '@/utils/format'

const statusColor: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-600',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-600',
}

function PlanRow({ plan }: { plan: ActionPlan }) {
    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50">
            <td className="px-4 py-3 text-sm font-medium text-gray-900">{plan.title}</td>
            <td className="px-4 py-3">
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[plan.status] ?? ''}`}>
                    {actionStatusLabel[plan.status] ?? plan.status}
                </span>
            </td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-200">
                        <div
                            className="h-full rounded-full bg-indigo-500"
                            style={{ width: `${plan.progress_pct}%` }}
                        />
                    </div>
                    <span className="text-xs text-gray-500">{formatPercent(plan.progress_pct)}</span>
                </div>
            </td>
            <td className="px-4 py-3 text-sm text-gray-500">{formatDate(plan.due_date)}</td>
            <td className="px-4 py-3 text-sm text-gray-500">{formatDate(plan.created_at)}</td>
        </tr>
    )
}

function OrgActionPlansBlock({ orgId, orgName }: { orgId: string; orgName: string }) {
    const { data: plans, isLoading, error, refetch } = useActionPlans(orgId)

    if (isLoading) return <SectionLoader />
    if (error) return <ErrorMessage message={error instanceof Error ? error.message : 'Erro'} onRetry={() => void refetch()} />
    if (!plans || plans.length === 0) return null

    const active = plans.filter((p) => p.status !== 'completed' && p.status !== 'cancelled')
    const done = plans.filter((p) => p.status === 'completed' || p.status === 'cancelled')

    return (
        <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-4 py-3">
                <h2 className="text-sm font-semibold text-gray-700">{orgName}</h2>
                <p className="text-xs text-gray-400">
                    {active.length} ativo(s) · {done.length} concluído(s)
                </p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-2">Título</th>
                            <th className="px-4 py-2">Status</th>
                            <th className="px-4 py-2">Progresso</th>
                            <th className="px-4 py-2">Prazo</th>
                            <th className="px-4 py-2">Criado em</th>
                        </tr>
                    </thead>
                    <tbody>
                        {plans.map((plan) => <PlanRow key={plan.id} plan={plan} />)}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export function ActionPlansPage() {
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
                <h1 className="text-2xl font-bold text-gray-900">Planos de Ação</h1>
                <p className="mt-1 text-sm text-gray-500">Planos de ação por organização</p>
            </div>
            {!orgs || orgs.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center">
                    <p className="text-sm text-gray-500">Nenhuma organização cadastrada.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orgs.map((org) => (
                        <OrgActionPlansBlock key={org.id} orgId={org.id} orgName={org.name} />
                    ))}
                </div>
            )}
        </div>
    )
}
