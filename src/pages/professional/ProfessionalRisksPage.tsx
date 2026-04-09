import { useState } from 'react'
import { Plus, X, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useRisks, useCreateRisk } from '@/hooks/queries/useDiagnosis'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { EmptyState } from '@/components/ui/EmptyState'
import { riskLevelLabel, formatDate } from '@/utils/format'
import type { PsychosocialRisk } from '@/types'

const levelColors: Record<string, string> = {
    critical: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
}

function LevelBadge({ level }: { level: string }) {
    return (
        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${levelColors[level] ?? ''}`}>
            {riskLevelLabel[level] ?? level}
        </span>
    )
}

function RiskRow({ risk }: { risk: PsychosocialRisk }) {
    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{risk.category}</td>
            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{risk.description}</td>
            <td className="px-4 py-3"><LevelBadge level={risk.level} /></td>
            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatDate(risk.identified_at)}</td>
        </tr>
    )
}

const RISK_LEVELS = ['low', 'medium', 'high', 'critical'] as const
const RISK_CATEGORIES = [
    'Sobrecarga de trabalho', 'Assédio moral', 'Conflito interpessoal',
    'Falta de autonomia', 'Insegurança no trabalho', 'Outros',
]

interface NewRiskModalProps { orgId: string; orgName: string; onClose: () => void }

function NewRiskModal({ orgId, orgName, onClose }: NewRiskModalProps) {
    const create = useCreateRisk()
    const [category, setCategory] = useState(RISK_CATEGORIES[0])
    const [description, setDescription] = useState('')
    const [level, setLevel] = useState<typeof RISK_LEVELS[number]>('medium')
    const [fieldError, setFieldError] = useState<string | null>(null)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!description.trim()) { setFieldError('Descrição é obrigatória.'); return }
        setFieldError(null)
        try {
            await create.mutateAsync({
                organization_id: orgId,
                diagnosis_id: null,
                category,
                description: description.trim(),
                level,
                affected_unit_id: null,
                identified_at: new Date().toISOString(),
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
                        <h2 className="text-base font-semibold text-gray-900">Novo Risco</h2>
                        <p className="text-xs text-gray-500">{orgName}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-6 py-4">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">Categoria</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898]">
                            {RISK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">Nível</label>
                        <select value={level} onChange={(e) => setLevel(e.target.value as typeof RISK_LEVELS[number])}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898]">
                            {RISK_LEVELS.map((l) => (
                                <option key={l} value={l}>{riskLevelLabel[l] ?? l}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">Descrição *</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} autoFocus
                            placeholder="Descreva o risco identificado..."
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898]" />
                    </div>
                    {(fieldError ?? mutError) && <p className="text-xs text-red-600">{fieldError ?? mutError}</p>}
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancelar</button>
                        <button type="submit" disabled={create.isPending}
                            className="flex items-center gap-2 rounded-lg bg-[#162136] px-4 py-2 text-sm text-white hover:bg-[#1E2F4A] disabled:opacity-50">
                            <Plus size={14} />{create.isPending ? 'Salvando…' : 'Salvar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function OrgRisksBlock({ orgId, orgName }: { orgId: string; orgName: string }) {
    const { data: risks, isLoading, error, refetch } = useRisks(orgId)
    const [showModal, setShowModal] = useState(false)

    if (isLoading) return <SectionLoader />
    if (error) return <ErrorMessage message={`Erro ao carregar riscos de ${orgName}`} onRetry={refetch} />

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{orgName}</h2>
                <button onClick={() => setShowModal(true)}
                    className="flex items-center gap-1 rounded-lg bg-[#162136] px-3 py-1.5 text-xs text-white hover:bg-[#1E2F4A]">
                    <Plus size={12} />Novo
                </button>
            </div>
            {!risks || risks.length === 0 ? (
                <EmptyState icon={AlertTriangle} title="Nenhum risco cadastrado" description="Registre os riscos psicossociais mapeados." />) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Categoria</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Descrição</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Nível</th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Identificado em</th>
                            </tr>
                        </thead>
                        <tbody>{risks.map((risk) => <RiskRow key={risk.id} risk={risk} />)}</tbody>
                    </table>
                </div>
            )}
            {showModal && <NewRiskModal orgId={orgId} orgName={orgName} onClose={() => setShowModal(false)} />}
        </div>
    )
}

export function ProfessionalRisksPage() {
    const { profile } = useAuth()
    const orgId = profile?.organization_id ?? ''

    if (!orgId) {
        return (
            <div className="space-y-6 p-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Riscos Psicossociais</h1>
                <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Nenhuma organização associada ao seu perfil.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Riscos Psicossociais</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Riscos psicossociais identificados na sua organização.
                </p>
            </div>
            <OrgRisksBlock orgId={orgId} orgName={profile?.name ?? ''} />
        </div>
    )
}
