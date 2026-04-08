import { useAuth } from '@/hooks/useAuth'
import { usePulseSurveys } from '@/hooks/queries/usePulseSurveys'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { formatDate } from '@/utils/format'
import { Activity } from 'lucide-react'
import type { PulseSurvey } from '@/types'

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

function SurveyCard({ survey }: { survey: PulseSurvey }) {
    const rate = responseRate(survey)
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{survey.title}</h3>
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
                    <span className="font-medium text-gray-700">{survey.total_responded}/{survey.total_invited} ({rate}%)</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                        className="h-full rounded-full bg-[#00A898] transition-all"
                        style={{ width: `${rate}%` }}
                    />
                </div>
            </div>
        </div>
    )
}

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
