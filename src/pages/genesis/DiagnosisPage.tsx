import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import type { PsychosocialDiagnosis, PsychosocialRisk } from '@/types'
import { useOrganizations } from '@/hooks/queries/useOrganizations'
import {
    useDiagnoses, useRisks,
    useCreateDiagnosis, useUpdateDiagnosis,
} from '@/hooks/queries/useDiagnosis'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { formatDate, diagnosisStatusLabel, riskLevelLabel } from '@/utils/format'

const riskColor: Record<string, string> = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-green-100 text-green-700',
}

const diagnosisStatusColor: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    archived: 'bg-gray-200 text-gray-500',
}

type DiagStatus = PsychosocialDiagnosis['status']
const STATUS_NEXT: Partial<Record<DiagStatus, DiagStatus>> = {
    draft: 'in_progress',
    in_progress: 'completed',
    completed: 'archived',
}

// ─── Modal criar diagnóstico ──────────────────────────────────────────────────

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

// ─── Linha de diagnóstico com avançar status ──────────────────────────────────

function DiagnosisRow({ d, orgId }: { d: PsychosocialDiagnosis; orgId: string }) {
    const update = useUpdateDiagnosis()
    const next = STATUS_NEXT[d.status]
    const responseRate = d.total_invited > 0 ? Math.round((d.total_responded / d.total_invited) * 100) : 0

    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50">
            <td className="px-4 py-3 text-sm font-medium text-gray-900">{d.title}</td>
            <td className="px-4 py-3">
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${diagnosisStatusColor[d.status]}`}>
                    {diagnosisStatusLabel[d.status] ?? d.status}
                </span>
            </td>
            <td className="px-4 py-3 text-sm text-gray-600">{d.total_responded}/{d.total_invited} ({responseRate}%)</td>
            <td className="px-4 py-3 text-sm text-gray-500">{formatDate(d.started_at)}</td>
            <td className="px-4 py-3 text-sm text-gray-500">{formatDate(d.completed_at)}</td>
            <td className="px-4 py-3">
                {next && (
                    <button
                        onClick={() => void update.mutateAsync({ id: d.id, organizationId: orgId, payload: { status: next } })}
                        disabled={update.isPending}
                        className="rounded px-2 py-1 text-xs text-[#00A898] hover:bg-teal-50 disabled:opacity-40">
                        → {diagnosisStatusLabel[next]}
                    </button>
                )}
            </td>
        </tr>
    )
}

function RiskRow({ risk }: { risk: PsychosocialRisk }) {
    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50">
            <td className="px-4 py-3 text-sm font-medium text-gray-900">{risk.category}</td>
            <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{risk.description}</td>
            <td className="px-4 py-3">
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${riskColor[risk.level] ?? ''}`}>
                    {riskLevelLabel[risk.level] ?? risk.level}
                </span>
            </td>
            <td className="px-4 py-3 text-sm text-gray-500">{formatDate(risk.identified_at)}</td>
        </tr>
    )
}

function OrgDiagnosisBlock({ orgId, orgName }: { orgId: string; orgName: string }) {
    const diagnoses = useDiagnoses(orgId)
    const risks = useRisks(orgId)
    const [creating, setCreating] = useState(false)

    if (diagnoses.isLoading || risks.isLoading) return <SectionLoader />

    return (
        <>
            {creating && <NewDiagModal orgId={orgId} orgName={orgName} onClose={() => setCreating(false)} />}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-700">{orgName}</h2>
                    <button onClick={() => setCreating(true)}
                        className="flex items-center gap-1 rounded-lg bg-[#162136] px-3 py-1.5 text-xs text-white hover:bg-[#1E2F4A]">
                        <Plus size={12} /> Novo Diagnóstico
                    </button>
                </div>

                {(diagnoses.data?.length ?? 0) > 0 ? (
                    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                        <div className="border-b border-gray-200 px-4 py-2">
                            <p className="text-xs font-medium text-gray-500 uppercase">Diagnósticos</p>
                        </div>
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-4 py-2">Título</th><th className="px-4 py-2">Status</th>
                                    <th className="px-4 py-2">Respostas</th><th className="px-4 py-2">Início</th>
                                    <th className="px-4 py-2">Conclusão</th><th className="px-4 py-2">Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {diagnoses.data!.map((d) => <DiagnosisRow key={d.id} d={d} orgId={orgId} />)}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-xs text-gray-400">Nenhum diagnóstico criado.</p>
                )}

                {(risks.data?.length ?? 0) > 0 && (
                    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                        <div className="border-b border-gray-200 px-4 py-2">
                            <p className="text-xs font-medium text-gray-500 uppercase">Riscos Identificados</p>
                        </div>
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-4 py-2">Categoria</th><th className="px-4 py-2">Descrição</th>
                                    <th className="px-4 py-2">Nível</th><th className="px-4 py-2">Identificado em</th>
                                </tr>
                            </thead>
                            <tbody>{risks.data!.map((r) => <RiskRow key={r.id} risk={r} />)}</tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    )
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function DiagnosisPage() {
    const { data: orgs, isLoading, error, refetch } = useOrganizations()
    if (isLoading) return <SectionLoader />
    if (error) return <ErrorMessage message={error instanceof Error ? error.message : 'Erro'} onRetry={() => void refetch()} />

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Diagnósticos</h1>
                <p className="mt-1 text-sm text-gray-500">Diagnósticos psicossociais e riscos por organização</p>
            </div>
            {!orgs || orgs.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center">
                    <p className="text-sm text-gray-500">Nenhuma organização cadastrada.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {orgs.map((org) => <OrgDiagnosisBlock key={org.id} orgId={org.id} orgName={org.name} />)}
                </div>
            )}
        </div>
    )
}
