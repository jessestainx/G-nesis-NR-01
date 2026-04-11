import { useState } from 'react'
import { Plus, X, Play, Square, BarChart2, ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import { useOrganizations } from '@/hooks/queries/useOrganizations'
import {
    useAllPulseSurveys,
    useCreatePulseSurvey,
    useUpdateSurveyStatus,
    usePulseResponses,
    useDeletePulseSurvey,
} from '@/hooks/queries/usePulseSurveys'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { formatDate, formatPercent } from '@/utils/format'
import type { PulseSurvey, PulseQuestion } from '@/types'

// ─── Tipos e helpers ──────────────────────────────────────────────────────────

const STATUS_LABEL: Record<PulseSurvey['status'], string> = {
    draft: 'Rascunho',
    active: 'Ativa',
    closed: 'Encerrada',
}
const STATUS_COLOR: Record<PulseSurvey['status'], string> = {
    draft: 'bg-gray-100 text-gray-600',
    active: 'bg-emerald-100 text-emerald-700',
    closed: 'bg-slate-100 text-slate-600',
}

function responseRate(s: PulseSurvey) {
    return s.total_invited > 0 ? Math.round((s.total_responded / s.total_invited) * 100) : 0
}

// ─── Linha de survey ──────────────────────────────────────────────────────────

interface SurveyRowProps { s: PulseSurvey; orgName: string }

function SurveyRow({ s, orgName }: SurveyRowProps) {
    const updateStatus = useUpdateSurveyStatus()
    const deleteSurvey = useDeletePulseSurvey()
    const [expanded, setExpanded] = useState(false)
    const [confirmDel, setConfirmDel] = useState(false)
    const rate = responseRate(s)

    return (
        <>
            <tr className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                <td className="px-4 py-3">
                    <button
                        onClick={() => setExpanded((v) => !v)}
                        className="flex items-center gap-1 text-sm font-medium text-gray-900 dark:text-white">
                        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        {s.title}
                    </button>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{orgName}</td>
                <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[s.status]}`}>
                        {STATUS_LABEL[s.status]}
                    </span>
                </td>
                <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 rounded-full bg-gray-200 dark:bg-gray-700">
                            <div className="h-1.5 rounded-full bg-[#00A898]" style={{ width: `${rate}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{s.total_responded}/{s.total_invited} ({formatPercent(rate)})</span>
                    </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatDate(s.created_at)}</td>
                <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                        {s.status === 'draft' && (
                            <button
                                onClick={() => void updateStatus.mutateAsync({ id: s.id, status: 'active', orgId: s.organization_id })}
                                disabled={updateStatus.isPending}
                                title="Abrir pesquisa"
                                className="flex items-center gap-1 rounded px-2 py-1 text-xs text-emerald-600 hover:bg-emerald-50 disabled:opacity-40">
                                <Play size={12} />Abrir
                            </button>
                        )}
                        {s.status === 'active' && (
                            <button
                                onClick={() => void updateStatus.mutateAsync({ id: s.id, status: 'closed', orgId: s.organization_id })}
                                disabled={updateStatus.isPending}
                                title="Encerrar pesquisa"
                                className="flex items-center gap-1 rounded px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 disabled:opacity-40">
                                <Square size={12} />Encerrar
                            </button>
                        )}
                        {(s.status === 'draft' || s.status === 'closed') && (
                            !confirmDel ? (
                                <button
                                    onClick={() => setConfirmDel(true)}
                                    title="Excluir pesquisa"
                                    className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500">
                                    <Trash2 size={13} />
                                </button>
                            ) : (
                                <span className="flex items-center gap-1">
                                    <span className="text-xs text-red-600">Excluir?</span>
                                    <button
                                        onClick={() => void deleteSurvey.mutateAsync({ id: s.id, orgId: s.organization_id })}
                                        disabled={deleteSurvey.isPending}
                                        className="rounded px-1.5 py-0.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40">
                                        Sim
                                    </button>
                                    <button onClick={() => setConfirmDel(false)}
                                        className="text-xs text-gray-400 hover:text-gray-600">Não</button>
                                </span>
                            )
                        )}
                        {s.status === 'active' && (
                            <span title="Feche a pesquisa antes de excluir"
                                className="cursor-not-allowed rounded p-1 text-gray-200">
                                <Trash2 size={13} />
                            </span>
                        )}
                    </div>
                </td>
            </tr>
            {expanded && (
                <tr className="border-b border-gray-100 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800/50">
                    <td colSpan={6} className="px-8 py-4">
                        <div className="space-y-3">
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span><strong>Aberta em:</strong> {formatDate(s.opened_at) || '—'}</span>
                                <span><strong>Encerrada em:</strong> {formatDate(s.closed_at) || '—'}</span>
                                <span><strong>Perguntas:</strong> {s.questions?.questions?.length ?? 0}</span>
                            </div>
                            {s.questions?.questions?.length > 0 && (
                                <ol className="space-y-1">
                                    {s.questions.questions.map((q, i) => (
                                        <li key={q.id} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                            <span className="shrink-0 font-medium text-gray-400">{i + 1}.</span>
                                            <span>{q.text}</span>
                                            <span className="ml-auto shrink-0 text-xs text-gray-400">
                                                {q.type === 'scale' ? `Escala ${q.min ?? 1}–${q.max ?? 5}` : q.type === 'yesno' ? 'Sim/Não' : q.type === 'multiple' ? `Múltipla (${q.options?.length ?? 0})` : 'Texto'}
                                            </span>
                                        </li>
                                    ))}
                                </ol>
                            )}
                            {(s.status === 'active' || s.status === 'closed') && s.questions?.questions?.length > 0 && (
                                <SurveyResults surveyId={s.id} questions={s.questions.questions} />
                            )}
                        </div>
                    </td>
                </tr>
            )}
        </>
    )
}

// ─── Resultados agregados ─────────────────────────────────────────────────────

function SurveyResults({ surveyId, questions }: { surveyId: string; questions: PulseQuestion[] }) {
    const { data: responses, isLoading } = usePulseResponses(surveyId)

    if (isLoading) return <p className="text-xs text-gray-400">Carregando respostas...</p>
    if (!responses?.length) return <p className="text-xs text-gray-400">Nenhuma resposta registrada ainda.</p>

    return (
        <div className="space-y-4 border-t border-gray-200 pt-4 dark:border-gray-700">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Resultados ({responses.length} resposta{responses.length !== 1 ? 's' : ''})</p>
            {questions.map((q) => {
                const vals = responses.map((r) => r.answers[q.id]).filter((v) => v !== undefined && v !== '')
                if (!vals.length) return null

                if (q.type === 'scale') {
                    const nums = vals.filter((v) => typeof v === 'number') as number[]
                    const avg = nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1) : '—'
                    const min = q.min ?? 1
                    const max = q.max ?? 5
                    const pct = nums.length ? Math.round(((parseFloat(avg) - min) / (max - min)) * 100) : 0
                    return (
                        <div key={q.id} className="space-y-1">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{q.text}</p>
                            <div className="flex items-center gap-3">
                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                                    <div className="h-2 rounded-full bg-[#00A898]" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="w-16 text-right text-xs text-gray-500">Média: {avg}</span>
                            </div>
                        </div>
                    )
                }

                if (q.type === 'yesno' || q.type === 'multiple') {
                    const opts = q.type === 'yesno' ? ['sim', 'não'] : (q.options ?? [])
                    const total = vals.length
                    return (
                        <div key={q.id} className="space-y-1">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{q.text}</p>
                            {opts.map((opt) => {
                                const count = vals.filter((v) => String(v).toLowerCase() === opt.toLowerCase()).length
                                const pct = total ? Math.round((count / total) * 100) : 0
                                return (
                                    <div key={opt} className="flex items-center gap-2">
                                        <span className="w-20 truncate text-xs text-gray-500">{opt.charAt(0).toUpperCase() + opt.slice(1)}</span>
                                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                                            <div className="h-1.5 rounded-full bg-[#00A898]" style={{ width: `${pct}%` }} />
                                        </div>
                                        <span className="w-14 text-right text-xs text-gray-400">{count} ({pct}%)</span>
                                    </div>
                                )
                            })}
                        </div>
                    )
                }

                // text
                return (
                    <div key={q.id} className="space-y-1">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{q.text}</p>
                        <p className="text-xs text-gray-400">{vals.length} resposta{vals.length !== 1 ? 's' : ''} de texto.</p>
                    </div>
                )
            })}
        </div>
    )
}

// ─── Modal criar survey ───────────────────────────────────────────────────────

const DEFAULT_QUESTIONS: PulseQuestion[] = [
    { id: 'q1', text: 'Como você avalia seu nível de estresse no trabalho?', type: 'scale', min: 1, max: 5 },
    { id: 'q2', text: 'Você se sente apoiado pela sua liderança?', type: 'yesno' },
    { id: 'q3', text: 'O volume de trabalho tem sido adequado para você?', type: 'scale', min: 1, max: 5 },
    { id: 'q4', text: 'Você se sente seguro para falar sobre dificuldades com sua equipe?', type: 'yesno' },
    { id: 'q5', text: 'Comentários adicionais (opcional):', type: 'text' },
]

interface NewSurveyModalProps { onClose: () => void }

function NewSurveyModal({ onClose }: NewSurveyModalProps) {
    const { data: orgs } = useOrganizations()
    const create = useCreatePulseSurvey()

    const [title, setTitle] = useState('')
    const [orgId, setOrgId] = useState('')
    const [questions, setQuestions] = useState<PulseQuestion[]>(DEFAULT_QUESTIONS)
    const [newQ, setNewQ] = useState('')
    const [newQType, setNewQType] = useState<PulseQuestion['type']>('scale')
    const [newQOptions, setNewQOptions] = useState('')
    const [fieldError, setFieldError] = useState<string | null>(null)

    function addQuestion() {
        if (!newQ.trim()) return
        const options = newQType === 'multiple'
            ? newQOptions.split(',').map((o) => o.trim()).filter(Boolean)
            : undefined
        if (newQType === 'multiple' && (!options || options.length < 2)) {
            setFieldError('Múltipla escolha requer ao menos 2 opções separadas por vírgula.')
            return
        }
        setFieldError(null)
        setQuestions((prev) => [
            ...prev,
            { id: `q${Date.now()}`, text: newQ.trim(), type: newQType, min: 1, max: 5, options },
        ])
        setNewQ('')
        setNewQOptions('')
    }

    function removeQuestion(id: string) {
        setQuestions((prev) => prev.filter((q) => q.id !== id))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!title.trim()) { setFieldError('Título é obrigatório.'); return }
        if (!orgId) { setFieldError('Selecione uma organização.'); return }
        if (questions.length === 0) { setFieldError('Adicione ao menos uma pergunta.'); return }
        setFieldError(null)
        try {
            await create.mutateAsync({
                organization_id: orgId,
                title: title.trim(),
                status: 'draft',
                questions: { questions },
                created_by: '',
            })
            onClose()
        } catch { /* handled via create.error */ }
    }

    const mutError = create.error instanceof Error ? create.error.message : null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <h2 className="text-base font-semibold text-gray-900">Nova Pesquisa de Pulso</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>

                <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4 overflow-y-auto px-6 py-4">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">Título *</label>
                        <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus
                            placeholder="Ex: Pesquisa de Clima — Abril/2026"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898]" />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">Organização *</label>
                        <select value={orgId} onChange={(e) => setOrgId(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898]">
                            <option value="">Selecione...</option>
                            {orgs?.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-medium text-gray-700">Perguntas</label>
                        <ol className="space-y-2">
                            {questions.map((q, i) => (
                                <li key={q.id} className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                                    <span className="shrink-0 font-medium text-gray-400">{i + 1}.</span>
                                    <span className="flex-1 text-gray-700">{q.text}</span>
                                    <span className="shrink-0 text-xs text-gray-400">
                                        {q.type === 'scale' ? `${q.min ?? 1}–${q.max ?? 5}` : q.type === 'yesno' ? 'S/N' : q.type === 'multiple' ? `Mult.(${q.options?.length ?? 0})` : 'Texto'}
                                    </span>
                                    <button type="button" onClick={() => removeQuestion(q.id)}
                                        className="shrink-0 text-gray-300 hover:text-red-500">
                                        <Trash2 size={13} />
                                    </button>
                                </li>
                            ))}
                        </ol>
                        <div className="mt-2 flex gap-2">
                            <input value={newQ} onChange={(e) => setNewQ(e.target.value)}
                                placeholder="Nova pergunta..."
                                className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898]" />
                            <select value={newQType} onChange={(e) => { setNewQType(e.target.value as PulseQuestion['type']); setNewQOptions('') }}
                                className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#00A898]">
                                <option value="scale">Escala</option>
                                <option value="yesno">Sim/Não</option>
                                <option value="multiple">Múltipla</option>
                                <option value="text">Texto</option>
                            </select>
                            <button type="button" onClick={addQuestion}
                                className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200">
                                <Plus size={13} />
                            </button>
                        </div>
                        {newQType === 'multiple' && (
                            <div className="mt-1">
                                <input value={newQOptions} onChange={(e) => setNewQOptions(e.target.value)}
                                    placeholder="Opções separadas por vírgula: Ex: Sempre, Às vezes, Nunca"
                                    className="w-full rounded-lg border border-dashed border-[#00A898]/50 bg-[#00A898]/5 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#00A898]" />
                            </div>
                        )}
                    </div>

                    {(fieldError ?? mutError) && <p className="text-xs text-red-600">{fieldError ?? mutError}</p>}

                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancelar</button>
                        <button type="submit" disabled={create.isPending}
                            className="flex items-center gap-2 rounded-lg bg-[#162136] px-4 py-2 text-sm text-white hover:bg-[#1E2F4A] disabled:opacity-50">
                            <Plus size={14} />{create.isPending ? 'Criando…' : 'Criar Pesquisa'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function PulsePage() {
    const { data: surveys, isLoading, error, refetch } = useAllPulseSurveys()
    const { data: orgs } = useOrganizations()
    const [showModal, setShowModal] = useState(false)

    const orgMap = Object.fromEntries((orgs ?? []).map((o) => [o.id, o.name]))

    if (isLoading) return <SectionLoader />
    if (error) return <ErrorMessage message="Erro ao carregar pesquisas" onRetry={() => void refetch()} />

    const active = surveys?.filter((s) => s.status === 'active') ?? []
    const draft = surveys?.filter((s) => s.status === 'draft') ?? []
    const closed = surveys?.filter((s) => s.status === 'closed') ?? []

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pesquisas de Pulso</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Gestão de pesquisas psicossociais por organização.
                    </p>
                </div>
                <button onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 rounded-lg bg-[#162136] px-4 py-2 text-sm text-white hover:bg-[#1E2F4A]">
                    <Plus size={14} />Nova Pesquisa
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Ativas', count: active.length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Rascunho', count: draft.length, color: 'text-gray-600', bg: 'bg-gray-50' },
                    { label: 'Encerradas', count: closed.length, color: 'text-slate-600', bg: 'bg-slate-50' },
                ].map(({ label, count, color, bg }) => (
                    <div key={label} className={`flex items-center gap-3 rounded-xl border border-gray-200 ${bg} p-4`}>
                        <BarChart2 className={`h-5 w-5 ${color}`} />
                        <div>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">{count}</p>
                            <p className="text-xs text-gray-500">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {!surveys || surveys.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
                    <BarChart2 className="mx-auto mb-3 h-8 w-8 text-gray-300" />
                    <p className="text-sm text-gray-500">Nenhuma pesquisa criada.</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
                    <table className="w-full text-left">
                        <thead className="border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">Pesquisa</th>
                                <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">Organização</th>
                                <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">Status</th>
                                <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">Respostas</th>
                                <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">Criada em</th>
                                <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {surveys.map((s) => (
                                <SurveyRow key={s.id} s={s} orgName={orgMap[s.organization_id] ?? '—'} />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && <NewSurveyModal onClose={() => setShowModal(false)} />}
        </div>
    )
}
