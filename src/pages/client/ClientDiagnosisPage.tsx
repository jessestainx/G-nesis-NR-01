import { Brain, Printer } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useDiagnoses } from '@/hooks/queries/useDiagnosis'
import { useOrganization } from '@/hooks/queries/useOrganizations'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { EmptyState } from '@/components/ui/EmptyState'
import { diagnosisStatusLabel, formatDate, formatPercent } from '@/utils/format'
import { useState } from 'react'
import type { PsychosocialDiagnosis, PsychosocialRisk } from '@/types'
import { useRisks } from '@/hooks/queries/useDiagnosis'
import { DiagnosisReport } from '@/components/DiagnosisReport'

function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
        in_progress: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
        completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
        archived: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    }
    return (
        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? colors['draft']}`}>
            {diagnosisStatusLabel[status] ?? status}
        </span>
    )
}

function DiagnosisRow({ d, onPrint }: { d: PsychosocialDiagnosis; onPrint: (d: PsychosocialDiagnosis) => void }) {
    const rate =
        d.total_invited > 0 ? Math.round((d.total_responded / d.total_invited) * 100) : 0
    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{d.title}</td>
            <td className="px-4 py-3">
                <StatusBadge status={d.status} />
            </td>
            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                {d.total_responded} / {d.total_invited} ({formatPercent(rate)})
            </td>
            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                {formatDate(d.started_at)}
            </td>
            <td className="px-4 py-3">
                <button onClick={() => onPrint(d)} title="Imprimir relatório" className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                    <Printer size={14} />
                </button>
            </td>
        </tr>
    )
}

export function ClientDiagnosisPage() {
    const { profile } = useAuth()
    const orgId = profile?.organization_id ?? ''
    const { data: diagnoses, isLoading, error, refetch } = useDiagnoses(orgId)
    const { data: risks } = useRisks(orgId)
    const { data: org } = useOrganization(orgId)
    const [printDiag, setPrintDiag] = useState<PsychosocialDiagnosis | null>(null)

    if (isLoading) return <SectionLoader />
    if (error) return <ErrorMessage message="Erro ao carregar diagnósticos" onRetry={refetch} />

    return (
        <>
        {printDiag && (
            <DiagnosisReport
                orgName={org?.name ?? 'Minha Organização'}
                diagnosis={printDiag}
                risks={(risks ?? []) as PsychosocialRisk[]}
                onClose={() => setPrintDiag(null)}
            />
        )}
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Diagnóstico Psicossocial
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Diagnósticos NR-01 realizados pela sua organização.
                </p>
            </div>

            {!diagnoses || diagnoses.length === 0 ? (
                <EmptyState icon={Brain} title="Nenhum diagnóstico" description="Os diagnósticos da sua empresa serão exibidos aqui." />) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                    Diagnóstico
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                    Respostas
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                    Início
                                </th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {diagnoses.map((d) => (
                                <DiagnosisRow key={d.id} d={d} onPrint={setPrintDiag} />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
        </>
    )
}