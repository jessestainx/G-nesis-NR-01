import { useAuth } from '@/hooks/useAuth'
import { useActivePulseSurvey } from '@/hooks/queries/usePulseSurveys'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { ClipboardList, CheckCircle, Clock } from 'lucide-react'

export function CollaboratorSurveyPage() {
    const { profile } = useAuth()
    const orgId = profile?.organization_id ?? ''
    const { data: survey, isLoading, error } = useActivePulseSurvey(orgId)

    if (isLoading) return <SectionLoader />

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Pesquisa de Clima</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Sua participação ajuda a melhorar o ambiente de trabalho.
                </p>
            </div>

            {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    Não foi possível verificar as pesquisas. Tente novamente mais tarde.
                </div>
            ) : !survey ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 p-16 text-center">
                    <Clock className="mb-4 h-12 w-12 text-gray-300" />
                    <h3 className="text-base font-semibold text-gray-700">Nenhuma pesquisa ativa</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Quando houver uma nova pesquisa, ela aparecerá aqui.
                    </p>
                </div>
            ) : (
                <div className="mx-auto max-w-xl rounded-xl border border-[#00A898]/30 bg-white shadow-sm">
                    <div className="space-y-4 p-6">
                        <div className="flex items-start gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00A898]/10">
                                <ClipboardList className="h-5 w-5 text-[#00A898]" />
                            </span>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">{survey.title}</h2>
                                <p className="mt-0.5 text-sm text-gray-500">
                                    Pesquisa em andamento — suas respostas são anônimas.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">
                            <CheckCircle size={14} />
                            <span>Pesquisa ativa</span>
                            {survey.opened_at && (
                                <span className="ml-auto text-xs text-green-600/70">
                                    Aberta em {new Date(survey.opened_at).toLocaleDateString('pt-BR')}
                                </span>
                            )}
                        </div>

                        <p className="text-sm text-gray-600">
                            Esta pesquisa foi elaborada para entender o clima organizacional e identificar
                            possíveis riscos psicossociais. Sua participação é voluntária e garante o
                            anonimato das respostas.
                        </p>

                        <button
                            disabled
                            className="w-full cursor-not-allowed rounded-lg bg-[#162136] py-2.5 text-sm font-medium text-white opacity-60">
                            Formulário disponível em breve
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
