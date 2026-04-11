import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { usePulseSurveys, usePulseResponses } from '@/hooks/queries/usePulseSurveys'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { formatDate } from '@/utils/format'
import { Activity, ChevronDown, ChevronRight } from 'lucide-react'
import type { PulseSurvey, PulseQuestion } from '@/types'

const statusLabel: Record<PulseSurvey['status'], string> = {
    draft: 'Rascunho',
    active: 'Ativa',
    closed: 'Encerrada',
}

const statusColor: Record<PulseSurvey['status'], string> = {
    draft: 'bg-gray-100 text-gray-600',
    active: 'bg-green-100 text-green-700',
    closed: 'bg-gray-200 text-gray-500',
}

function responseRate(survey: PulseSurvey) {
    if (!survey.total_invited) return 0
    return Math.round((survey.total_responded / survey.total_invited) * 100)
}

// ─── Resultados por pergunta ──────────────────────────────────────────────────

function SurveyResultsExpanded({ surveyId, questions }: { surveyId: string; questions: PulseQuestion[] }) {
    const { data: responses, isLoading } = usePulseResponses(surveyId)

    if (isLoading) return <p className="py-2 text-xs text-gray-400">Carregando resultados...</p>
    if (!responses?.length) return <p className="py-2 text-xs text-gray-400">Nenhuma resposta registrada.</p>

    return (
        <div className="space-y-4 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Resultados agregados — {responses.length} resposta{responses.length !== 1 ? 's' : ''}
            </p>
            {questions.map((q) => {
                const vals = responses.map((r) => r.answers[q.id]).filter((v) => v !== undefined && v !== '')
                if (!vals.length) return null

                if (q.type === 'scale') {
                    const nums = vals.filter((v) => typeof v === 'number') as number[]
                    if (!nums.length) return null
                    const avg = (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1)
                    const min = q.min ?? 1
                    const max = q.max ?? 5
                    const pct = Math.round(((parseFloat(avg) - min) / (max - min)) * 100)
                    return (
                        <div key={q.id} className="space-y-1">
                            <p className="text-xs font-medium text-gray-700">{q.text}</p>
                            <div className="flex items-center gap-3">
                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                                    <div className="h-2 rounded-full bg-[#00A898] transition-all" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="w-20 text-right text-xs text-gray-500">Média: {avg} / {max}</span>
                            </div>
                        </div>
                    )
                }

                if (q.type === 'yesno' || q.type === 'multiple') {
                    const opts = q.type === 'yesno' ? ['sim', 'não'] : (q.options ?? [])
                    const total = vals.length
                    return (
                        <div key={q.id} className="space-y-1">
                            <p className="text-xs font-medium text-gray-700">{q.text}</p>
                            {opts.map((opt) => {
                                const count = vals.filter((v) => String(v).toLowerCase() === opt.toLowerCase()).length
                                const pct = total ? Math.round((count / total) * 100) : 0
                                return (
                                    <div key={opt} className="flex items-center gap-2">
                                        <span className="w-16 shrink-0 truncate text-xs text-gray-500">
                                            {opt.charAt(0).toUpperCase() + opt.slice(1)}
                                        </span>
                                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
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
                    <div key={q.id} className="space-y-0.5">
                        <p className="text-xs font-medium text-gray-700">{q.text}</p>
                        <p className="text-xs text-gray-400">{vals.length} resposta{vals.length !== 1 ? 's' : ''} de texto (anônimas).</p>
                    </div>
                )
            })}
        </div>
    )
}

// ─── Card de survey ───────────────────────────────────────────────────────────

function SurveyCard({ survey }: { survey: PulseSurvey }) {
    const rate = responseRate(survey)
    const [expanded, setExpanded] = useState(false)
    const hasQuestions = (survey.questions?.questions?.length ?? 0) > 0
    const canExpand = (survey.status === 'active' || survey.status === 'closed') && hasQuestions

    return (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-gray-900">{survey.title}</h3>
                        <p className="mt-0.5 text-xs text-gray-500">
                            {survey.opened_at ? `Aberta em ${formatDate(survey.opened_at)}` : 'Não iniciada'}
                            {survey.closed_at ? ` · Encerrada em ${formatDate(survey.closed_at)}` : ''}
                        </p>
                    </div>
                    <span className={`shrink-0 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[survey.status]}`}>
                        {statusLabel[survey.status]}
                    </span>
                </div>

                <div className="mt-4 space-y-1">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Taxa de resposta</span>
                        <span className="font-medium text-gray-700">
                            {survey.total_responded}/{survey.total_invited} ({rate}%)
                        </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-[#00A898] transition-all" style={{ width: `${rate}%` }} />
                    </div>
                </div>

                {canExpand && (
                    <button
                        onClick={() => setExpanded((v) => !v)}
                        className="mt-3 flex w-full items-center gap-1 text-xs text-[#00A898] hover:text-[#008f80]">
                        {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                        {expanded ? 'Ocultar resultados' : 'Ver resultados por pergunta'}
                    </button>
                )}
            </div>

            {expanded && canExpand && (
                <div className="border-t border-gray-100 px-5 pb-5">
                    <SurveyResultsExpanded
                        surveyId={survey.id}
                        questions={survey.questions.questions}
                    />
                </div>
            )}
        </div>
    )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function ClientPulsePage() {
    const { profile } = useAuth()
    const orgId = profile?.organization_id ?? ''
    const { data: surveys, isLoading, error, refetch } = usePulseSurveys(orgId)

    if (!orgId) {
        return (
            <div className="space-y-6 p-6">
                <h1 className="text-2xl font-bold text-gray-900">Pesquisa de Pulso</h1>
                <p className="text-sm text-gray-500">Conta sem organização associada.</p>
            </div>
        )
    }

    if (isLoading) return <SectionLoader />
    if (error) return <ErrorMessage message="Erro ao carregar pesquisas" onRetry={() => void refetch()} />

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Pesquisa de Pulso</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Acompanhe o bem-estar e o clima organizacional em tempo real.
                </p>
            </div>

            {!surveys || surveys.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-16 text-center">
                    <Activity className="mx-auto mb-4 h-10 w-10 text-gray-300" />
                    <p className="text-base font-medium text-gray-700">Nenhuma pesquisa disponível</p>
                    <p className="mt-1 text-sm text-gray-500">As pesquisas criadas pela equipe Genesis aparecerão aqui.</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {surveys.map((s) => <SurveyCard key={s.id} survey={s} />)}
                </div>
            )}
        </div>
    )
}
