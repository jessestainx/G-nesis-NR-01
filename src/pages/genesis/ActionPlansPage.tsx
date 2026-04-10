import { useState } from 'react'
import { Plus, X, ChevronDown, ChevronRight, PlayCircle, CheckCircle2, XCircle } from 'lucide-react'
import type { ActionPlan, ActionItem } from '@/types'
import { useOrganizations } from '@/hooks/queries/useOrganizations'
import {
    useActionPlans, useActionPlanItems,
    useCreateActionPlan, useUpdateActionPlan, useUpdateActionItem,
} from '@/hooks/queries/useActionPlans'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { EmptyState } from '@/components/ui/EmptyState'
import { ClipboardList } from 'lucide-react'
import { formatDate, actionStatusLabel, formatPercent } from '@/utils/format'

const STATUS_NEXT: Partial<Record<ActionPlan['status'], ActionPlan['status']>> = {
    pending: 'in_progress',
    in_progress: 'completed',
}
const NEXT_LABEL: Partial<Record<ActionPlan['status'], string>> = {
    pending: 'Iniciar',
    in_progress: 'Concluir',
}

const statusColor: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    cancelled: 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400',
}

// ─── Modal criar plano ────────────────────────────────────────────────────────

interface NewPlanModalProps { orgId: string; orgName: string; onClose: () => void }

function NewPlanModal({ orgId, orgName, onClose }: NewPlanModalProps) {
    const create = useCreateActionPlan()
    const [form, setForm] = useState({ title: '', description: '', due_date: '' })
    const [fieldError, setFieldError] = useState<string | null>(null)

    function set<K extends keyof typeof form>(k: K, v: string) {
        setForm((f) => ({ ...f, [k]: v }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!form.title.trim()) { setFieldError('Título é obrigatório.'); return }
        setFieldError(null)
        try {
            await create.mutateAsync({
                organization_id: orgId,
                title: form.title.trim(),
                description: form.description.trim() || null,
                status: 'pending',
                due_date: form.due_date || null,
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
            <div className="w-full max-w-md rounded-xl bg-white shadow-xl dark:bg-gray-900">
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Novo Plano de Ação</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{orgName}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-6 py-4">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Título *</label>
                        <input value={form.title} onChange={(e) => set('title', e.target.value)} autoFocus
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898] dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Descrição</label>
                        <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898] dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Prazo</label>
                        <input type="date" value={form.due_date} onChange={(e) => set('due_date', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898] dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                    </div>
                    {(fieldError ?? mutError) && <p className="text-xs text-red-600">{fieldError ?? mutError}</p>}
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">Cancelar</button>
                        <button type="submit" disabled={create.isPending}
                            className="flex items-center gap-2 rounded-lg bg-[#162136] px-4 py-2 text-sm text-white hover:bg-[#1E2F4A] disabled:opacity-50">
                            <Plus size={14} />{create.isPending ? 'Salvando…' : 'Criar Plano'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ─── Itens do plano (expansível) ──────────────────────────────────────────────

function PlanItems({ planId }: { planId: string }) {
    const { data: items, isLoading } = useActionPlanItems(planId)
    const updateItem = useUpdateActionItem()

    if (isLoading) return <p className="px-6 py-3 text-xs text-gray-400 dark:text-gray-500">Carregando itens…</p>
    if (!items || items.length === 0) {
        return <p className="px-6 py-3 text-xs text-gray-400 dark:text-gray-500">Nenhum item cadastrado.</p>
    }

    return (
        <div className="border-t border-gray-100 bg-gray-50 px-6 py-3 dark:border-gray-700 dark:bg-gray-800">
            <ul className="space-y-2">
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
        void update.mutate({ id: plan.id, organizationId: plan.organization_id, payload: { status: next } })
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
                {/* Título — sempre visível */}
                <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                        {expanded
                            ? <ChevronDown size={14} className="shrink-0 text-gray-400" />
                            : <ChevronRight size={14} className="shrink-0 text-gray-400" />}
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{plan.title}</span>
                    </div>
                </td>

                {/* Status — sempre visível */}
                <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[plan.status] ?? ''}`}>
                        {actionStatusLabel[plan.status] ?? plan.status}
                    </span>
                </td>

                {/* Progresso — oculto em mobile */}
                <td className="hidden px-4 py-3 sm:table-cell">
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                            <div className="h-full rounded-full bg-[#00A898]" style={{ width: `${plan.progress_pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{formatPercent(plan.progress_pct)}</span>
                    </div>
                </td>

                {/* Prazo — oculto em mobile */}
                <td className="hidden px-4 py-3 text-sm text-gray-500 dark:text-gray-400 md:table-cell">
                    {formatDate(plan.due_date)}
                </td>

                {/* Ações */}
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
                                {plan.status === 'pending'
                                    ? <PlayCircle size={13} />
                                    : <CheckCircle2 size={13} />}
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

// ─── Bloco por organização ────────────────────────────────────────────────────

function OrgActionPlansBlock({ orgId, orgName }: { orgId: string; orgName: string }) {
    const { data: plans, isLoading, error, refetch } = useActionPlans(orgId)
    const [creating, setCreating] = useState(false)

    if (isLoading) return <SectionLoader />
    if (error) return <ErrorMessage message={error instanceof Error ? error.message : 'Erro'} onRetry={() => void refetch()} />

    const active = plans?.filter((p) => p.status !== 'completed' && p.status !== 'cancelled') ?? []
    const done = plans?.filter((p) => p.status === 'completed' || p.status === 'cancelled') ?? []

    return (
        <>
            {creating && <NewPlanModal orgId={orgId} orgName={orgName} onClose={() => setCreating(false)} />}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{orgName}</h2>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                            {active.length} ativo(s) · {done.length} concluído(s)/cancelado(s)
                        </p>
                    </div>
                    <button onClick={() => setCreating(true)}
                        className="flex items-center gap-1 rounded-lg bg-[#162136] px-3 py-1.5 text-xs text-white hover:bg-[#1E2F4A]">
                        <Plus size={12} /> Novo Plano
                    </button>
                </div>

                {!plans || plans.length === 0 ? (
                    <div className="py-4">
                        <EmptyState icon={ClipboardList} title="Nenhum plano cadastrado" description="Clique em Novo Plano para criar o primeiro." />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-xs uppercase dark:bg-gray-800">
                                <tr>
                                    <th className="px-4 py-2 text-gray-500 dark:text-gray-400">Título</th>
                                    <th className="px-4 py-2 text-gray-500 dark:text-gray-400">Status</th>
                                    <th className="hidden px-4 py-2 text-gray-500 dark:text-gray-400 sm:table-cell">Progresso</th>
                                    <th className="hidden px-4 py-2 text-gray-500 dark:text-gray-400 md:table-cell">Prazo</th>
                                    <th className="px-4 py-2 text-gray-500 dark:text-gray-400">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {plans.map((plan) => <PlanRow key={plan.id} plan={plan} />)}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    )
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function ActionPlansPage() {
    const { data: orgs, isLoading, error, refetch } = useOrganizations()
    if (isLoading) return <SectionLoader />
    if (error) return <ErrorMessage message={error instanceof Error ? error.message : 'Erro'} onRetry={() => void refetch()} />

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Planos de Ação</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Gerencie os planos de ação NR-01 por organização.
                </p>
            </div>
            {!orgs || orgs.length === 0 ? (
                <EmptyState icon={ClipboardList} title="Nenhuma organização cadastrada" />
            ) : (
                <div className="space-y-6">
                    {orgs.map((org) => <OrgActionPlansBlock key={org.id} orgId={org.id} orgName={org.name} />)}
                </div>
            )}
        </div>
    )
}
