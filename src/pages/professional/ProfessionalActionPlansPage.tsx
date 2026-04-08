import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useOrganizations } from '@/hooks/queries/useOrganizations'
import { useActionPlans, useCreateActionPlan } from '@/hooks/queries/useActionPlans'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { actionStatusLabel, formatDate, formatPercent } from '@/utils/format'
import type { ActionPlan } from '@/types'

const statusColors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    in_progress: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
}

function StatusBadge({ status }: { status: string }) {
    return (
        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[status] ?? statusColors['pending']}`}>
            {actionStatusLabel[status] ?? status}
        </span>
    )
}

function PlanRow({ plan }: { plan: ActionPlan }) {
    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{plan.title}</td>
            <td className="px-4 py-3"><StatusBadge status={plan.status} /></td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 rounded-full bg-gray-200 dark:bg-gray-700">
                        <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${plan.progress_pct}%` }} />
                    </div>
                    <span className="w-8 text-right text-xs text-gray-500">{formatPercent(plan.progress_pct)}</span>
                </div>
            </td>
            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatDate(plan.due_date)}</td>
        </tr>
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
            <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900">Novo Plano de Ação</h2>
                        <p className="text-xs text-gray-500">{orgName}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-6 py-4">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">Título *</label>
                        <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus
                            placeholder="Ex: Plano de Redução de Estresse 2026"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898]" />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">Descrição</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                            placeholder="Objetivo e escopo do plano..."
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898]" />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">Prazo</label>
                        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898]" />
                    </div>
                    {(fieldError ?? mutError) && <p className="text-xs text-red-600">{fieldError ?? mutError}</p>}
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancelar</button>
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

function OrgPlansBlock({ orgId, orgName }: { orgId: string; orgName: string }) {
    const { data: plans, isLoading, error, refetch } = useActionPlans(orgId)
    const [showModal, setShowModal] = useState(false)

    if (isLoading) return <SectionLoader />
    if (error) return <ErrorMessage message={`Erro ao carregar planos de ${orgName}`} onRetry={refetch} />

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{orgName}</h2>
                <button onClick={() => setShowModal(true)}
                    className="flex items-center gap-1 rounded-lg bg-[#162136] px-3 py-1.5 text-xs text-white hover:bg-[#1E2F4A]">
                    <Plus size={12} />Novo
                </button>
            </div>
            {!plans || plans.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center">
                    <p className="text-xs text-gray-400">Nenhum plano cadastrado.</p>
                </div>
            ) : (
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
                        <tbody>{plans.map((plan) => <PlanRow key={plan.id} plan={plan} />)}</tbody>
                    </table>
                </div>
            )}
            {showModal && <NewPlanModal orgId={orgId} orgName={orgName} onClose={() => setShowModal(false)} />}
        </div>
    )
}

export function ProfessionalActionPlansPage() {
    const orgsQuery = useOrganizations()

    if (orgsQuery.isLoading) return <SectionLoader />
    if (orgsQuery.error)
        return <ErrorMessage message="Erro ao carregar organizações" onRetry={() => orgsQuery.refetch()} />

    const orgs = orgsQuery.data ?? []

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Planos de Ação</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Planos de ação das organizações sob sua gestão.
                </p>
            </div>
            {orgs.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma organização atribuída.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {orgs.map((org) => <OrgPlansBlock key={org.id} orgId={org.id} orgName={org.name} />)}
                </div>
            )}
        </div>
    )
}
