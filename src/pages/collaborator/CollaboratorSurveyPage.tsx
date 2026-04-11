import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
    useActivePulseSurvey,
    useHasResponded,
    useSubmitPulseResponse,
} from '@/hooks/queries/usePulseSurveys'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { ClipboardList, CheckCircle, Clock, Send, ChevronLeft, ChevronRight } from 'lucide-react'
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
                <div className="flex flex-wrap gap-2">
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

    if (question.type === 'multiple') {
        const options = question.options ?? []
        return (
            <div className="space-y-2">
                {options.map((opt) => (
                    <label
                        key={opt}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${
                            value === opt
                                ? 'border-[#00A898] bg-[#00A898]/5 text-[#00A898]'
                                : 'border-gray-200 text-gray-700 hover:border-[#00A898]/50'
                        }`}>
                        <input
                            type="radio"
                            name={`q-${question.id}`}
                            value={opt}
                            checked={value === opt}
                            onChange={() => onChange(opt)}
                            className="accent-[#00A898]"
                        />
                        {opt}
                    </label>
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

// ─── Formulário de pesquisa (passo a passo) ───────────────────────────────────

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
    const [step, setStep] = useState(0)
    const [stepError, setStepError] = useState<string | null>(null)
    const [submitError, setSubmitError] = useState<string | null>(null)

    const total = questions.length
    const current = questions[step]
    const isLast = step === total - 1
    const progress = Math.round(((step + 1) / total) * 100)

    const isRequired = current.required !== false && current.type !== 'text'
    const hasAnswer = answers[current.id] !== undefined && answers[current.id] !== ''

    function handleNext() {
        if (isRequired && !hasAnswer) {
            setStepError('Por favor, responda esta pergunta para continuar.')
            return
        }
        setStepError(null)
        setStep((s) => s + 1)
    }

    async function handleSubmit() {
        if (isRequired && !hasAnswer) {
            setStepError('Por favor, responda esta pergunta para enviar.')
            return
        }
        setStepError(null)
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
        <div className="space-y-5">
            {/* Barra de progresso */}
            <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Pergunta {step + 1} de {total}</span>
                    <span>{progress}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                        className="h-full rounded-full bg-[#00A898] transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Pergunta atual */}
            <div className="space-y-3">
                <p className="text-sm font-medium text-gray-800">
                    {current.text}
                    {isRequired && <span className="ml-1 text-rose-500">*</span>}
                </p>
                <QuestionInput
                    question={current}
                    value={answers[current.id]}
                    onChange={(val) => {
                        setAnswers((prev) => ({ ...prev, [current.id]: val }))
                        setStepError(null)
                    }}
                />
                {stepError && <p className="text-xs text-red-600">{stepError}</p>}
            </div>

            {submitError && <p className="text-sm text-red-600">{submitError}</p>}

            {/* Navegação */}
            <div className="flex items-center justify-between gap-3 pt-2">
                <button
                    type="button"
                    onClick={() => { setStepError(null); setStep((s) => s - 1) }}
                    disabled={step === 0}
                    className="flex items-center gap-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30">
                    <ChevronLeft size={15} />
                    Anterior
                </button>

                {isLast ? (
                    <button
                        type="button"
                        onClick={() => void handleSubmit()}
                        disabled={submit.isPending}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#162136] py-2 text-sm font-medium text-white hover:bg-[#1E2F4A] disabled:opacity-50">
                        <Send size={14} />
                        {submit.isPending ? 'Enviando…' : 'Enviar Resposta'}
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handleNext}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#00A898] py-2 text-sm font-medium text-white hover:bg-[#008f80]">
                        Próxima
                        <ChevronRight size={15} />
                    </button>
                )}
            </div>
        </div>
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
