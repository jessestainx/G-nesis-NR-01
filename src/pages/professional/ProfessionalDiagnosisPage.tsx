import { useState } from 'react'
import { Plus, X, Brain } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useDiagnoses, useCreateDiagnosis } from '@/hooks/queries/useDiagnosis'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { EmptyState } from '@/components/ui/EmptyState'
import { diagnosisStatusLabel, formatDate, formatPercent } from '@/utils/format'
import type { PsychosocialDiagnosis } from '@/types'

const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    in_progress: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    archived: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
}

function StatusBadge({ status }: { status: string }) {
    return (
        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[status] ?? statusColors['draft']}`}>
            {diagnosisStatusLabel[status] ?? status}
        </span>
    )
}

function DiagRow({ d }: { d: PsychosocialDiagnosis }) {
    const rate = d.total_invited > 0 ? Math.round((d.total_responded / d.total_invited) * 100) : 0
    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{d.title}</td>
            <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                {d.total_responded}/{d.total_invited} ({formatPercent(rate)})
            </td>
            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatDate(d.started_at)}</td>
        </tr>
    )
}

interface NewDiagModalProps { orgId: string; orgName: string; onClose: () => void }

function NewDiagModal({ orgId, orgName, onClose }: NewDiagModalProps) {
    const create = useCreateDiagnosis()
    const [title, setTitle] = useState('')
    const [fieldError, setFieldError] = useState<string | null>(null)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!title.trim()) { setFieldError('Título é obrigatório.'); return }
        setFieldError(null)
        try {
            await create.mutateAsync({
                organization_id: orgId,
                title: title.trim(),
                status: 'draft',
                started_at: null,
                completed_at: null,
                total_invited: 0,
                total_responded: 0,
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
                        <h2 className="text-base font-semibold text-gray-900">Novo Diagnóstico</h2>
                        <p className="text-xs text-gray-500">{orgName}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-6 py-4">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">Título *</label>
                        <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus
                            placeholder="Ex: Diagnóstico Psicossocial 2026"
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

function OrgDiagBlock({ orgId, orgName }: { orgId: string; orgName: string }) {
    const { data: diagnoses, isLoading, error, refetch } = useDiagnoses(orgId)
    const [showModal, setShowModal] = useState(false)

    if (isLoading) return <SectionLoader />
    if (error) return <ErrorMessage message={`Erro ao carregar diagnósticos de ${orgName}`} onRetry={refetch} />

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{orgName}</h2>
                <button onClick={() => setShowModal(true)}
                    className="flex items-center gap-1 rounded-lg bg-[#162136] px-3 py-1.5 text-xs text-white hover:bg-[#1E2F4A]">
                    <Plus size={12} />Novo
                </button>
            </div>
            {!diagnoses || diagnoses.length === 0 ? (
                <EmptyState icon={Brain} title="Nenhum diagnóstico" description="Inicie o primeiro diagnóstico psicossocial." />) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Diagnóstico</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Respostas</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Início</th>
                            </tr>
                        </thead>
                        <tbody>{diagnoses.map((d) => <DiagRow key={d.id} d={d} />)}</tbody>
                    </table>
                </div>
            )}
            {showModal && <NewDiagModal orgId={orgId} orgName={orgName} onClose={() => setShowModal(false)} />}
        </div>
    )
}

export function ProfessionalDiagnosisPage() {
    const { profile } = useAuth()
    const orgId = profile?.organization_id ?? ''

    if (!orgId) {
        return (
            <div className="space-y-6 p-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Diagnósticos</h1>
                <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma organização associada ao seu perfil.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Diagnósticos</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Diagnósticos psicossociais da sua organização.
                </p>
            </div>
            <OrgDiagBlock orgId={orgId} orgName={profile?.name ?? ''} />
        </div>
    )
}
