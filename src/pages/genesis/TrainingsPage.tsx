import { useState, useMemo } from 'react'
import { GraduationCap, Plus, X, Search, Users, CalendarDays, ChevronRight, Ban } from 'lucide-react'
import { useOrganizations } from '@/hooks/queries/useOrganizations'
import { useTrainings, useCreateTraining, useUpdateTrainingStatus } from '@/hooks/queries/useTrainings'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/utils/format'
import { useAuth } from '@/hooks/useAuth'
import type { Training } from '@/types'

const TYPE_LABEL: Record<Training['type'], string> = {
    online: 'Online',
    in_person: 'Presencial',
    hybrid: 'Híbrido',
}

const STATUS_LABEL: Record<Training['status'], string> = {
    scheduled: 'Agendado',
    in_progress: 'Em andamento',
    completed: 'Concluído',
    cancelled: 'Cancelado',
}

const STATUS_COLORS: Record<Training['status'], string> = {
    scheduled: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-indigo-100 text-indigo-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-rose-100 text-rose-700',
}

const STATUS_NEXT: Partial<Record<Training['status'], Training['status']>> = {
    scheduled: 'in_progress',
    in_progress: 'completed',
}

// ─── TrainingRow ─────────────────────────────────────────────────────────────

function TrainingRow({ t, orgId }: { t: Training; orgId: string }) {
    const advance = useUpdateTrainingStatus()
    const next = STATUS_NEXT[t.status]

    return (
        <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <td className="px-4 py-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{t.title}</p>
                {t.instructor && (
                    <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        <Users size={11} />{t.instructor}
                    </p>
                )}
            </td>
            <td className="px-4 py-3 hidden sm:table-cell">
                <span className="text-xs text-gray-500 dark:text-gray-400">{TYPE_LABEL[t.type]}</span>
            </td>
            <td className="px-4 py-3">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[t.status]}`}>
                    {STATUS_LABEL[t.status]}
                </span>
            </td>
            <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 hidden md:table-cell">
                {t.scheduled_date ? (
                    <span className="flex items-center gap-1">
                        <CalendarDays size={11} />
                        {formatDate(t.scheduled_date)}
                    </span>
                ) : '—'}
            </td>
            <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                    {next && (
                        <button
                            onClick={() => void advance.mutate({ id: t.id, organizationId: orgId, status: next })}
                            disabled={advance.isPending}
                            title={`Avançar para ${STATUS_LABEL[next]}`}
                            className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:border-[#00A898] hover:text-[#00A898] disabled:opacity-40 dark:border-gray-700 dark:text-gray-400"
                        >
                            {STATUS_LABEL[next]} <ChevronRight size={11} />
                        </button>
                    )}
                    {(t.status === 'scheduled' || t.status === 'in_progress') && (
                        <button
                            onClick={() => void advance.mutate({ id: t.id, organizationId: orgId, status: 'cancelled' })}
                            disabled={advance.isPending}
                            title="Cancelar treinamento"
                            className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-rose-500 hover:border-rose-300 hover:bg-rose-50 disabled:opacity-40"
                        >
                            <Ban size={11} /> Cancelar
                        </button>
                    )}
                </div>
            </td>
        </tr>
    )
}

// ─── NewTrainingModal ─────────────────────────────────────────────────────────

interface NewTrainingModalProps { orgId: string; orgName: string; onClose: () => void }

function NewTrainingModal({ orgId, orgName, onClose }: NewTrainingModalProps) {
    const create = useCreateTraining()
    const { user } = useAuth()
    const [form, setForm] = useState({
        title: '',
        description: '',
        type: 'in_person' as Training['type'],
        scheduledDate: '',
        instructor: '',
    })
    const [fieldError, setFieldError] = useState<string | null>(null)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!form.title.trim()) { setFieldError('Título é obrigatório.'); return }
        setFieldError(null)
        try {
            await create.mutateAsync({
                organization_id: orgId,
                title: form.title.trim(),
                description: form.description.trim() || null,
                type: form.type,
                status: 'scheduled',
                scheduled_date: form.scheduledDate || null,
                completed_date: null,
                instructor: form.instructor.trim() || null,
                participant_count: 0,
                created_by: user?.id ?? '',
            })
            onClose()
        } catch { /* handled via create.error */ }
    }

    const mutError = create.error instanceof Error ? create.error.message : null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white shadow-xl dark:bg-gray-900">
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Novo Treinamento</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{orgName}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3 px-6 py-4">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Título *</label>
                        <input
                            value={form.title}
                            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                            autoFocus
                            placeholder="Ex: NR-35 Trabalho em Altura"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Modalidade</label>
                            <select
                                value={form.type}
                                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as Training['type'] }))}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            >
                                {(Object.entries(TYPE_LABEL) as [Training['type'], string][]).map(([k, v]) => (
                                    <option key={k} value={k}>{v}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Data</label>
                            <input
                                type="date"
                                value={form.scheduledDate}
                                onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value }))}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Instrutor</label>
                        <input
                            value={form.instructor}
                            onChange={(e) => setForm((f) => ({ ...f, instructor: e.target.value }))}
                            placeholder="Nome do instrutor"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Descrição</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                            rows={2}
                            placeholder="Objetivo e conteúdo do treinamento..."
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                    </div>
                    {(fieldError ?? mutError) && <p className="text-xs text-red-600">{fieldError ?? mutError}</p>}
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                            Cancelar
                        </button>
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

// ─── OrgTrainingsBlock ────────────────────────────────────────────────────────

interface OrgTrainingsBlockProps { orgId: string; orgName: string }

function OrgTrainingsBlock({ orgId, orgName }: OrgTrainingsBlockProps) {
    const { data: trainings, isLoading, error, refetch } = useTrainings(orgId)
    const [showModal, setShowModal] = useState(false)

    if (isLoading) return <SectionLoader />
    if (error) return <ErrorMessage message={error instanceof Error ? error.message : 'Erro'} onRetry={() => void refetch()} />

    return (
        <>
            {showModal && <NewTrainingModal orgId={orgId} orgName={orgName} onClose={() => setShowModal(false)} />}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{orgName}</h2>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                            {trainings?.length ?? 0} treinamento{(trainings?.length ?? 0) !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-1 rounded-lg bg-[#162136] px-3 py-1.5 text-xs text-white hover:bg-[#1E2F4A]"
                    >
                        <Plus size={12} /> Novo
                    </button>
                </div>

                {!trainings || trainings.length === 0 ? (
                    <div className="py-6">
                        <EmptyState
                            icon={GraduationCap}
                            title="Nenhum treinamento cadastrado"
                            description="Clique em Novo para criar o primeiro treinamento."
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Treinamento</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 hidden sm:table-cell">Tipo</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Status</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400 hidden md:table-cell">Data</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {trainings.map((t) => <TrainingRow key={t.id} t={t} orgId={orgId} />)}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    )
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function TrainingsPage() {
    const { data: orgs, isLoading, error, refetch } = useOrganizations()
    const [search, setSearch] = useState('')

    const filteredOrgs = useMemo(() => {
        if (!orgs) return []
        const q = search.trim().toLowerCase()
        if (!q) return orgs
        return orgs.filter((o) => o.name.toLowerCase().includes(q))
    }, [orgs, search])

    if (isLoading) return <SectionLoader />
    if (error) return <ErrorMessage message={error instanceof Error ? error.message : 'Erro'} onRetry={() => void refetch()} />

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Treinamentos SST</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Treinamentos de Saúde e Segurança do Trabalho por organização.
                </p>
            </div>

            <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por organização…"
                    className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-4 text-sm shadow-sm focus:border-[#00A898] focus:outline-none focus:ring-1 focus:ring-[#00A898] dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                />
            </div>

            {!orgs || orgs.length === 0 ? (
                <EmptyState
                    icon={GraduationCap}
                    title="Nenhuma organização cadastrada"
                    description="Cadastre uma organização para começar a gerenciar treinamentos."
                />
            ) : filteredOrgs.length === 0 ? (
                <EmptyState
                    icon={GraduationCap}
                    title="Nenhuma organização encontrada"
                    description={`Sem resultados para "${search}".`}
                />
            ) : (
                <div className="space-y-6">
                    {filteredOrgs.map((org) => (
                        <OrgTrainingsBlock key={org.id} orgId={org.id} orgName={org.name} />
                    ))}
                </div>
            )}
        </div>
    )
}
