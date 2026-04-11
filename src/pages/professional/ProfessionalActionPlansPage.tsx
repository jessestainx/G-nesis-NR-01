import { useState } from 'react'
import { Plus, X, ListChecks, ChevronDown, ChevronRight, PlayCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import {
    useActionPlans, useActionPlanItems,
    useCreateActionPlan, useUpdateActionPlan,
    useCreateActionItem, useUpdateActionItem,
} from '@/hooks/queries/useActionPlans'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { EmptyState } from '@/components/ui/EmptyState'
import { actionStatusLabel, formatDate, formatPercent } from '@/utils/format'
import type { ActionPlan, ActionItem } from '@/types'

const statusColors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    in_progress: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
}

const STATUS_NEXT: Partial<Record<ActionPlan['status'], ActionPlan['status']>> = {
    pending: 'in_progress',
    in_progress: 'completed',
}
const NEXT_LABEL: Partial<Record<ActionPlan['status'], string>> = {
    pending: 'Iniciar',
    in_progress: 'Concluir',
}

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
            <button onClick={() => setOpen(true)}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-400 hover:bg-gray-100 hover:text-[#00A898] dark:hover:bg-gray-700">
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
                className="flex-1 rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#00A898] dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
            <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#00A898] dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
            <button type="submit" disabled={create.isPending || !title.trim()}
                className="rounded bg-[#162136] px-2 py-1 text-xs text-white hover:bg-[#1E2F4A] disabled:opacity-50">
                {create.isPending ? '…' : 'OK'}
            </button>
            <button type="button" onClick={() => { setOpen(false); setTitle(''); setDueDate('') }}
                className="rounded p-1 text-gray-400 hover:text-gray-600"><X size={12} /></button>
        </form>
    )
}

function PlanItems({ planId }: { planId: string }) {
    const { data: items, isLoading } = useActionPlanItems(planId)
    const updateItem = useUpdateActionItem()

    if (isLoading) return <p className="px-6 py-3 text-xs text-gray-400">Carregando itens…</p>

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
                            <span className={item.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}>
                                {item.title}
                            </span>
                            {item.due_date && (
                                <span className="ml-auto text-xs text-gray-400">{formatDate(item.due_date)}</span>
                            )}
                        </li>
                    ))}
                </ul>
            )}
            {!items || items.length === 0 ? (
                <p className="mb-2 text-xs text-gray-400">Nenhum item ainda.</p>
            ) : null}
            <AddItemForm planId={planId} />
        </div>
    )
}

function PlanRow({ plan }: { plan: ActionPlan }) {
    const [expanded, setExpanded] = useState(false)
    const update = useUpdateActionPlan()
    const next = STATUS_NEXT[plan.status]

    return (
        <>
            <tr
                className="cursor-pointer border-b border-gray-100 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50"
                onClick={() => setExpanded((p) => !p)}>
                <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                        {expanded
                            ? <ChevronDown size={14} className="shrink-0 text-gray-400" />
                            : <ChevronRight size={14} className="shrink-0 text-gray-400" />}
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{plan.title}</span>
                    </div>
                </td>
                <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[plan.status] ?? ''}`}>
                        {actionStatusLabel[plan.status] ?? plan.status}
                    </span>
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 rounded-full bg-gray-200 dark:bg-gray-700">
                            <div className="h-1.5 rounded-full bg-[#00A898]" style={{ width: `${plan.progress_pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{formatPercent(plan.progress_pct)}</span>
                    </div>
                </td>
                <td className="hidden px-4 py-3 text-sm text-gray-500 md:table-cell">{formatDate(plan.due_date)}</td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                        {next && (
                            <button
                                onClick={() => void update.mutate({ id: plan.id, organizationId: plan.organization_id, payload: { status: next } })}
                                title={NEXT_LABEL[plan.status]}
                                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-[#00A898] dark:hover:bg-gray-700">
                                {plan.status === 'pending'
                                    ? <PlayCircle size={16} />
                                    : <CheckCircle2 size={16} />}
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

interface NewPlanModalProps { orgId: string; orgName: string; onClose: () => void }

function NewPlanModal({ orgId, orgName, onClose }: NewPlanModalProps) {
    const create = useCreateActionPlan()
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [fieldError, setFieldError] = useState<string | null>(null)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!title.trim()) { setFieldError('Título é obrigatório.'); return }
        setFieldError(null)
        try {
            await create.mutateAsync({
                organization_id: orgId,
                title: title.trim(),
                description: description.trim() || null,
                status: 'pending',
                due_date: dueDate || null,
                responsible_id: null,
                progress_pct: 0,
                created_by: '',
            })
            onClose()
        } catch { /* handled via create.error */ }
    }

    const mutError = create.error instanceof Error ? create.error.message : null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white shadow-xl dark:bg-gray-900">
                <div className="flex items-center justify-between border-b px-6 py-4 dark:border-gray-700">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Novo Plano de Ação</h2>
                        <p className="text-xs text-gray-500">{orgName}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-6 py-4">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Título *</label>
                        <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus
                            placeholder="Ex: Plano de Redução de Estresse 2026"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898] dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Descrição</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898] dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Prazo</label>
                        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898] dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                    </div>
                    {(fieldError || mutError) && (
                        <p className="text-xs text-red-600">{fieldError ?? mutError}</p>
                    )}
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">Cancelar</button>
                        <button type="submit" disabled={create.isPending}
                            className="flex items-center gap-2 rounded-lg bg-[#162136] px-4 py-2 text-sm text-white hover:bg-[#1E2F4A] disabled:opacity-50">
                            <Plus size={14} />{create.isPending ? 'Criando…' : 'Criar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export function ProfessionalActionPlansPage() {
    const { profile } = useAuth()
    const orgId = profile?.organization_id ?? ''
    const { data: plans, isLoading, error, refetch } = useActionPlans(orgId)
    const [creating, setCreating] = useState(false)

    if (!orgId) {
        return (
            <div className="space-y-6 p-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Planos de Ação</h1>
                <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma organização associada ao seu perfil.</p>
                </div>
            </div>
        )
    }

    if (isLoading) return <SectionLoader />
    if (error) return <ErrorMessage message="Erro ao carregar planos de ação" onRetry={() => void refetch()} />

    const active = (plans ?? []).filter(p => p.status !== 'completed' && p.status !== 'cancelled')
    const done = (plans ?? []).filter(p => p.status === 'completed' || p.status === 'cancelled')

    return (
        <div className="space-y-6 p-6">
            {creating && <NewPlanModal orgId={orgId} orgName={profile?.name ?? ''} onClose={() => setCreating(false)} />}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Planos de Ação</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {active.length} ativo(s) · {done.length} concluído(s)/cancelado(s)
                    </p>
                </div>
                <button onClick={() => setCreating(true)}
                    className="flex items-center gap-2 rounded-lg bg-[#162136] px-4 py-2 text-sm text-white hover:bg-[#1E2F4A]">
                    <Plus size={14} /> Novo Plano
                </button>
            </div>

            {!plans || plans.length === 0 ? (
                <EmptyState icon={ListChecks} title="Nenhum plano de ação" description="Crie o primeiro plano de ação da organização." />
            ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs uppercase dark:bg-gray-800">
                            <tr>
                                <th className="px-4 py-3 text-gray-500 dark:text-gray-400">Título</th>
                                <th className="px-4 py-3 text-gray-500 dark:text-gray-400">Status</th>
                                <th className="hidden px-4 py-3 text-gray-500 dark:text-gray-400 sm:table-cell">Progresso</th>
                                <th className="hidden px-4 py-3 text-gray-500 dark:text-gray-400 md:table-cell">Prazo</th>
                                <th className="px-4 py-3 text-gray-500 dark:text-gray-400">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {plans.map((plan) => <PlanRow key={plan.id} plan={plan} />)}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
