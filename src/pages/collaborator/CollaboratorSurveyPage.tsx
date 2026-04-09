import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
    useActivePulseSurvey,
    useHasResponded,
    useSubmitPulseResponse,
} from '@/hooks/queries/usePulseSurveys'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { ClipboardList, CheckCircle, Clock, Send } from 'lucide-react'
import type { PulseQuestion } from '@/types'

// ─── Componente de pergunta ───────────────────────────────────────────────────

interface QuestionInputProps {
    question: PulseQuestion
    value: string | number | boolean | undefined
    onChange: (val: string | number | boolean) => void
}

function QuestionInput({ question, value, onChange }: QuestionInputProps) {
    if (question.type === 'scale') {
        const min = question.min ?? 1
        const max = question.max ?? 5
        return (
            <div className="flex items-center gap-2">
                <span className="w-6 text-xs text-gray-400">{min}</span>
                <div className="flex gap-2">
                    {Array.from({ length: max - min + 1 }, (_, i) => i + min).map((n) => (
                        <button
                            key={n}
                            type="button"
                            onClick={() => onChange(n)}
                            className={`h-9 w-9 rounded-lg border text-sm font-medium transition-colors ${
                                value === n
                                    ? 'border-[#00A898] bg-[#00A898] text-white'
                                    : 'border-gray-300 text-gray-700 hover:border-[#00A898] hover:bg-[#00A898]/10'
                            }`}>
                            {n}
                        </button>
                    ))}
                </div>
                <span className="w-6 text-xs text-gray-400">{max}</span>
            </div>
        )
    }

    if (question.type === 'yesno') {
        return (
            <div className="flex gap-3">
                {(['sim', 'não'] as const).map((opt) => (
                    <button
                        key={opt}
                        type="button"
                        onClick={() => onChange(opt)}
                        className={`rounded-lg border px-5 py-2 text-sm font-medium transition-colors ${
                            value === opt
                                ? 'border-[#00A898] bg-[#00A898] text-white'
                                : 'border-gray-300 text-gray-700 hover:border-[#00A898] hover:bg-[#00A898]/10'
                        }`}>
                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </button>
                ))}
            </div>
        )
    }

    // text
    return (
        <textarea
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            placeholder="Escreva seu comentário (opcional)..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898]"
        />
    )
}

// ─── Formulário de pesquisa ───────────────────────────────────────────────────

interface SurveyFormProps {
    surveyId: string
    orgId: string
    questions: PulseQuestion[]
    onSubmitted: () => void
}

function SurveyForm({ surveyId, questions, onSubmitted }: SurveyFormProps) {
    const { user } = useAuth()
    const submit = useSubmitPulseResponse()
    const [answers, setAnswers] = useState<Record<string, string | number | boolean>>({})
    const [submitError, setSubmitError] = useState<string | null>(null)

    const requiredIds = questions.filter((q) => q.type !== 'text').map((q) => q.id)
    const allAnswered = requiredIds.every((id) => answers[id] !== undefined)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!allAnswered) { setSubmitError('Por favor, responda todas as perguntas.'); return }
        setSubmitError(null)
        try {
            const result = await submit.mutateAsync({
                survey_id: surveyId,
                respondent_id: user!.id,
                answers,
            })
            if (result.error) throw new Error(result.error)
            onSubmitted()
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'Erro ao enviar resposta.')
        }
    }

    return (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
            {questions.map((q, i) => (
                <div key={q.id} className="space-y-2">
                    <p className="text-sm font-medium text-gray-800">
                        <span className="mr-2 text-gray-400">{i + 1}.</span>
                        {q.text}
                        {q.type !== 'text' && <span className="ml-1 text-rose-500">*</span>}
                    </p>
                    <QuestionInput
                        question={q}
                        value={answers[q.id]}
                        onChange={(val) => setAnswers((prev) => ({ ...prev, [q.id]: val }))}
                    />
                </div>
            ))}

            {submitError && <p className="text-sm text-red-600">{submitError}</p>}

            <button
                type="submit"
                disabled={submit.isPending || !allAnswered}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#162136] py-2.5 text-sm font-medium text-white hover:bg-[#1E2F4A] disabled:opacity-50">
                <Send size={14} />
                {submit.isPending ? 'Enviando…' : 'Enviar Resposta'}
            </button>
        </form>
    )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function CollaboratorSurveyPage() {
    const { profile, user } = useAuth()
    const orgId = profile?.organization_id ?? ''
    const uid = user?.id ?? ''

    const { data: survey, isLoading: loadingSurvey } = useActivePulseSurvey(orgId)
    const { data: hasResponded, isLoading: loadingCheck } = useHasResponded(survey?.id ?? '', uid)
    const [submitted, setSubmitted] = useState(false)

    const isLoading = loadingSurvey || (!!survey && loadingCheck)

    if (isLoading) return <SectionLoader />

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Pesquisa de Clima</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Sua participação ajuda a melhorar o ambiente de trabalho.
                </p>
            </div>

            {!survey ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 p-16 text-center">
                    <Clock className="mb-4 h-12 w-12 text-gray-300" />
                    <h3 className="text-base font-semibold text-gray-700">Nenhuma pesquisa ativa</h3>
                    <p className="mt-1 text-sm text-gray-500">Quando houver uma nova pesquisa, ela aparecerá aqui.</p>
                </div>
            ) : hasResponded || submitted ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 p-12 text-center">
                    <CheckCircle className="mb-4 h-12 w-12 text-emerald-500" />
                    <h3 className="text-base font-semibold text-emerald-800">Você já participou desta pesquisa</h3>
                    <p className="mt-1 text-sm text-emerald-600">Obrigado pela sua contribuição!</p>
                </div>
            ) : (
                <div className="mx-auto max-w-xl rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-100 px-6 py-4">
                        <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00A898]/10">
                                <ClipboardList className="h-5 w-5 text-[#00A898]" />
                            </span>
                            <div>
                                <h2 className="text-base font-semibold text-gray-900">{survey.title}</h2>
                                <p className="text-xs text-gray-500">
                                    Suas respostas são anônimas e confidenciais.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-5">
                        {!survey.questions?.questions?.length ? (
                            <p className="text-sm text-gray-500">Esta pesquisa não possui perguntas cadastradas.</p>
                        ) : (
                            <SurveyForm
                                surveyId={survey.id}
                                orgId={orgId}
                                questions={survey.questions.questions}
                                onSubmitted={() => setSubmitted(true)}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
