import { useAuth } from '@/hooks/useAuth'
import { useRisks } from '@/hooks/queries/useDiagnosis'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { riskLevelLabel, formatDate } from '@/utils/format'
import type { PsychosocialRisk } from '@/types'

function LevelBadge({ level }: { level: string }) {
    const colors: Record<string, string> = {
        critical: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
        high: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
        medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
        low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    }
    return (
        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[level] ?? ''}`}>
            {riskLevelLabel[level] ?? level}
        </span>
    )
}

function RiskRow({ risk }: { risk: PsychosocialRisk }) {
    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{risk.category}</td>
            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{risk.description}</td>
            <td className="px-4 py-3">
                <LevelBadge level={risk.level} />
            </td>
            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                {formatDate(risk.identified_at)}
            </td>
        </tr>
    )
}

export function ClientRisksPage() {
    const { profile } = useAuth()
    const orgId = profile?.organization_id ?? ''
    const { data: risks, isLoading, error, refetch } = useRisks(orgId)

    if (isLoading) return <SectionLoader />
    if (error) return <ErrorMessage message="Erro ao carregar riscos" onRetry={refetch} />

    const summary = {
        critical: risks?.filter((r) => r.level === 'critical').length ?? 0,
        high: risks?.filter((r) => r.level === 'high').length ?? 0,
        medium: risks?.filter((r) => r.level === 'medium').length ?? 0,
        low: risks?.filter((r) => r.level === 'low').length ?? 0,
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Mapa de Riscos Psicossociais
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Riscos identificados no diagnóstico da sua organização.
                </p>
            </div>

            <div className="flex flex-wrap gap-2">
                {(Object.entries(summary) as [string, number][]).map(
                    ([level, count]) =>
                        count > 0 && (
                            <span
                                key={level}
                                className="rounded-full border border-gray-200 px-3 py-1 text-sm dark:border-gray-700"
                            >
                                <span className="font-semibold">{count}</span>{' '}
                                {riskLevelLabel[level]}
                            </span>
                        ),
                )}
            </div>

            {!risks || risks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Nenhum risco identificado.
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                    Categoria
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                    Descrição
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                    Nível
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                    Identificado em
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {risks.map((risk) => (
                                <RiskRow key={risk.id} risk={risk} />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
