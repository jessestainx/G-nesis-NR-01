import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTrainings, useCreateTraining } from '@/hooks/queries/useTrainings'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { formatDate } from '@/utils/format'
import { GraduationCap, Plus, X, Users, CalendarDays } from 'lucide-react'
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

function TrainingCard({ t }: { t: Training }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-gray-900">{t.title}</h3>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[t.status]}`}>
                    {STATUS_LABEL[t.status]}
                </span>
            </div>
            {t.description && (
                <p className="mb-3 text-xs text-gray-500 line-clamp-2">{t.description}</p>
            )}
            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                    <GraduationCap size={12} />
                    {TYPE_LABEL[t.type]}
                </span>
                {t.instructor && (
                    <span className="flex items-center gap-1">
                        <Users size={12} />
                        {t.instructor}
                    </span>
                )}
                {(t.scheduled_date ?? t.completed_date) && (
                    <span className="flex items-center gap-1">
                        <CalendarDays size={12} />
                        {formatDate(t.completed_date ?? t.scheduled_date)}
                    </span>
                )}
                <span className="ml-auto font-medium text-gray-700">
                    {t.participant_count} participante{t.participant_count !== 1 ? 's' : ''}
                </span>
            </div>
        </div>
    )
}

interface NewTrainingModalProps { orgId: string; onClose: () => void }

function NewTrainingModal({ orgId, onClose }: NewTrainingModalProps) {
    const create = useCreateTraining()
    const { user } = useAuth()
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [type, setType] = useState<Training['type']>('in_person')
    const [scheduledDate, setScheduledDate] = useState('')
    const [instructor, setInstructor] = useState('')
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
                type,
                status: 'scheduled',
                scheduled_date: scheduledDate || null,
                completed_date: null,
                instructor: instructor.trim() || null,
                participant_count: 0,
                created_by: user?.id ?? '',
            })
            onClose()
        } catch { /* handled via create.error */ }
    }

    const mutError = create.error instanceof Error ? create.error.message : null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <h2 className="text-base font-semibold text-gray-900">Novo Treinamento</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3 px-6 py-4">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">Título *</label>
                        <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus
                            placeholder="Ex: NR-35 Trabalho em Altura"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898]" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700">Modalidade</label>
                            <select value={type} onChange={(e) => setType(e.target.value as Training['type'])}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898]">
                                {(Object.entries(TYPE_LABEL) as [Training['type'], string][]).map(([k, v]) => (
                                    <option key={k} value={k}>{v}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700">Data</label>
                            <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898]" />
                        </div>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">Instrutor</label>
                        <input value={instructor} onChange={(e) => setInstructor(e.target.value)}
                            placeholder="Nome do instrutor"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898]" />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">Descrição</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                            placeholder="Objetivo e conteúdo do treinamento..."
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

export function ClientTrainingsPage() {
    const { profile } = useAuth()
    const orgId = profile?.organization_id ?? ''
    const { data: trainings, isLoading, error, refetch } = useTrainings(orgId)
    const [showModal, setShowModal] = useState(false)

    if (!orgId) return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900">Treinamentos SST</h1>
            <p className="mt-2 text-sm text-gray-500">Conta sem organização associada.</p>
        </div>
    )

    if (isLoading) return <SectionLoader />
    if (error) return <ErrorMessage message="Erro ao carregar treinamentos" onRetry={() => void refetch()} />

    const byStatus = {
        scheduled: trainings?.filter((t) => t.status === 'scheduled') ?? [],
        in_progress: trainings?.filter((t) => t.status === 'in_progress') ?? [],
        completed: trainings?.filter((t) => t.status === 'completed') ?? [],
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Treinamentos SST</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Treinamentos de Saúde e Segurança do Trabalho da sua organização.
                    </p>
                </div>
                <button onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 rounded-lg bg-[#162136] px-4 py-2 text-sm text-white hover:bg-[#1E2F4A]">
                    <Plus size={14} />Novo Treinamento
                </button>
            </div>

            {!trainings || trainings.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-16 text-center">
                    <GraduationCap className="mx-auto mb-4 h-10 w-10 text-gray-300" />
                    <p className="text-base font-medium text-gray-700">Nenhum treinamento cadastrado</p>
                    <p className="mt-1 text-sm text-gray-500">Clique em "Novo Treinamento" para começar.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {byStatus.in_progress.length > 0 && (
                        <section>
                            <h2 className="mb-3 text-sm font-semibold text-indigo-700">Em andamento</h2>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {byStatus.in_progress.map((t) => <TrainingCard key={t.id} t={t} />)}
                            </div>
                        </section>
                    )}
                    {byStatus.scheduled.length > 0 && (
                        <section>
                            <h2 className="mb-3 text-sm font-semibold text-blue-700">Agendados</h2>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {byStatus.scheduled.map((t) => <TrainingCard key={t.id} t={t} />)}
                            </div>
                        </section>
                    )}
                    {byStatus.completed.length > 0 && (
                        <section>
                            <h2 className="mb-3 text-sm font-semibold text-emerald-700">Concluídos</h2>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {byStatus.completed.map((t) => <TrainingCard key={t.id} t={t} />)}
                            </div>
                        </section>
                    )}
                </div>
            )}

            {showModal && <NewTrainingModal orgId={orgId} onClose={() => setShowModal(false)} />}
        </div>
    )
}
