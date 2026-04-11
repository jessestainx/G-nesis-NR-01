import { useState } from 'react'
import { ClipboardList, PlayCircle, CheckCircle2, XCircle, ChevronDown, ChevronRight, Plus, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useActionPlans, useUpdateActionPlan, useActionPlanItems, useCreateActionItem, useUpdateActionItem } from '@/hooks/queries/useActionPlans'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { EmptyState } from '@/components/ui/EmptyState'
import { actionStatusLabel, formatDate, formatPercent } from '@/utils/format'
import type { ActionItem, ActionPlan } from '@/types'

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

// ─── Formulário inline para adicionar item ────────────────────────────────────

function AddItemForm({ planId }: { planId: string }) {
    const create = useCreateActionItem()
    const [title, setTitle] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [open, setOpen] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!title.trim()) return
        await create.mutateAsync({
            action_plan_id: planId,
            title: title.trim(),
            status: 'pending',
            due_date: dueDate || null,
            responsible_id: null,
        })
        setTitle('')
        setDueDate('')
        setOpen(false)
    }

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-400 hover:bg-gray-100 hover:text-[#00A898] dark:hover:bg-gray-700"
            >
                <Plus size={12} /> Adicionar item
            </button>
        )
    }

    return (
        <form onSubmit={(e) => void handleSubmit(e)} className="flex items-center gap-2">
            <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título do item…"
                className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#00A898] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#00A898] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            <button
                type="submit"
                disabled={create.isPending || !title.trim()}
                className="rounded bg-[#162136] px-2 py-1 text-xs text-white hover:bg-[#1E2F4A] disabled:opacity-50"
            >
                {create.isPending ? '…' : 'OK'}
            </button>
            <button
                type="button"
                onClick={() => { setOpen(false); setTitle(''); setDueDate('') }}
                className="rounded p-1 text-gray-400 hover:text-gray-600"
            >
                <X size={12} />
            </button>
        </form>
    )
}

// ─── Lista de itens do plano ──────────────────────────────────────────────────

function PlanItems({ planId }: { planId: string }) {
    const { data: items, isLoading } = useActionPlanItems(planId)
    const updateItem = useUpdateActionItem()

    if (isLoading) return <p className="px-6 py-3 text-xs text-gray-400 dark:text-gray-500">Carregando itens…</p>

    return (
        <div className="border-t border-gray-100 bg-gray-50 px-6 py-3 dark:border-gray-700 dark:bg-gray-800">
            {items && items.length > 0 && (
                <ul className="mb-2 space-y-2">
                    {items.map((item: ActionItem) => (
                        <li key={item.id} className="flex items-center gap-3 text-sm">
                            <input
                                type="checkbox"
                                checked={item.status === 'completed'}
                                onChange={(e) => {
                                    void updateItem.mutateAsync({
                                        id: item.id,
                                        actionPlanId: planId,
                                        payload: { status: e.target.checked ? 'completed' : 'in_progress' },
                                    })
                                }}
                                className="h-4 w-4 rounded border-gray-300 text-[#00A898] focus:ring-[#00A898]"
                            />
                            <span className={item.status === 'completed' ? 'line-through text-gray-400 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'}>
                                {item.title}
                            </span>
                            {item.due_date && (
                                <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">{formatDate(item.due_date)}</span>
                            )}
                        </li>
                    ))}
                </ul>
            )}
            {(!items || items.length === 0) && (
                <p className="mb-2 text-xs text-gray-400 dark:text-gray-500">Nenhum item ainda.</p>
            )}
            <AddItemForm planId={planId} />
        </div>
    )
}

// ─── Linha de plano expansível ────────────────────────────────────────────────

function PlanRow({ plan }: { plan: ActionPlan }) {
    const [expanded, setExpanded] = useState(false)
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
        <>
            <tr
                className="cursor-pointer border-b border-gray-100 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50"
                onClick={() => setExpanded((p) => !p)}
            >
                <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                        {expanded
                            ? <ChevronDown size={14} className="shrink-0 text-gray-400" />
                            : <ChevronRight size={14} className="shrink-0 text-gray-400" />}
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{plan.title}</span>
                    </div>
                </td>
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
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
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
            {expanded && (
                <tr>
                    <td colSpan={5} className="p-0">
                        <PlanItems planId={plan.id} />
                    </td>
                </tr>
            )}
        </>
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
                    Acompanhe o progresso dos planos de ação NR-01 da sua organização. Clique em um plano para ver e gerenciar os itens.
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
                <EmptyState icon={ClipboardList} title="Nenhum plano de ação" description="Planos de ação aparecerão aqui quando criados." />
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
