import { useOrganizations } from '@/hooks/queries/useOrganizations'
import { useDiagnoses } from '@/hooks/queries/useDiagnosis'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { diagnosisStatusLabel, formatDate, formatPercent } from '@/utils/format'
import type { PsychosocialDiagnosis } from '@/types'

function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
        in_progress: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
        completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
        archived: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    }
    return (
        <span
            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? colors['draft']}`}
        >
            {diagnosisStatusLabel[status] ?? status}
        </span>
    )
}

function DiagRow({ d }: { d: PsychosocialDiagnosis }) {
    const rate =
        d.total_invited > 0 ? Math.round((d.total_responded / d.total_invited) * 100) : 0
    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{d.title}</td>
            <td className="px-4 py-3">
                <StatusBadge status={d.status} />
            </td>
            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                {d.total_responded}/{d.total_invited} ({formatPercent(rate)})
            </td>
            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                {formatDate(d.started_at)}
            </td>
        </tr>
    )
}

function OrgDiagBlock({ orgId, orgName }: { orgId: string; orgName: string }) {
    const { data: diagnoses, isLoading, error, refetch } = useDiagnoses(orgId)

    if (isLoading) return <SectionLoader />
    if (error)
        return <ErrorMessage message={`Erro ao carregar diagnósticos de ${orgName}`} onRetry={refetch} />
    if (!diagnoses || diagnoses.length === 0) return null

    return (
        <div className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{orgName}</h2>
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
                    <tbody>
                        {diagnoses.map((d) => (
                            <DiagRow key={d.id} d={d} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export function ProfessionalDiagnosisPage() {
    const orgsQuery = useOrganizations()

    if (orgsQuery.isLoading) return <SectionLoader />
    if (orgsQuery.error)
        return (
            <ErrorMessage
                message="Erro ao carregar organizações"
                onRetry={() => orgsQuery.refetch()}
            />
        )

    const orgs = orgsQuery.data ?? []

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Diagnósticos</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Diagnósticos psicossociais das organizações sob sua gestão.
                </p>
            </div>

            {orgs.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Nenhuma organização atribuída.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {orgs.map((org) => (
                        <OrgDiagBlock key={org.id} orgId={org.id} orgName={org.name} />
                    ))}
                </div>
            )}
        </div>
    )
}
