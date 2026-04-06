import type { PsychosocialDiagnosis, PsychosocialRisk } from '@/types'
import { useOrganizations } from '@/hooks/queries/useOrganizations'
import { useDiagnoses, useRisks } from '@/hooks/queries/useDiagnosis'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { formatDate, diagnosisStatusLabel, riskLevelLabel } from '@/utils/format'

const riskColor: Record<string, string> = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-green-100 text-green-700',
}

const diagnosisStatusColor: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    archived: 'bg-gray-200 text-gray-500',
}

function DiagnosisRow({ d }: { d: PsychosocialDiagnosis }) {
    const responseRate = d.total_invited > 0
        ? Math.round((d.total_responded / d.total_invited) * 100)
        : 0

    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50">
            <td className="px-4 py-3 text-sm font-medium text-gray-900">{d.title}</td>
            <td className="px-4 py-3">
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${diagnosisStatusColor[d.status]}`}>
                    {diagnosisStatusLabel[d.status] ?? d.status}
                </span>
            </td>
            <td className="px-4 py-3 text-sm text-gray-600">
                {d.total_responded}/{d.total_invited} ({responseRate}%)
            </td>
            <td className="px-4 py-3 text-sm text-gray-500">{formatDate(d.started_at)}</td>
            <td className="px-4 py-3 text-sm text-gray-500">{formatDate(d.completed_at)}</td>
        </tr>
    )
}

function RiskRow({ risk }: { risk: PsychosocialRisk }) {
    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50">
            <td className="px-4 py-3 text-sm font-medium text-gray-900">{risk.category}</td>
            <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{risk.description}</td>
            <td className="px-4 py-3">
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${riskColor[risk.level] ?? ''}`}>
                    {riskLevelLabel[risk.level] ?? risk.level}
                </span>
            </td>
            <td className="px-4 py-3 text-sm text-gray-500">{formatDate(risk.identified_at)}</td>
        </tr>
    )
}

function OrgDiagnosisBlock({ orgId, orgName }: { orgId: string; orgName: string }) {
    const diagnoses = useDiagnoses(orgId)
    const risks = useRisks(orgId)

    if (diagnoses.isLoading || risks.isLoading) return <SectionLoader />

    const hasData = (diagnoses.data?.length ?? 0) > 0 || (risks.data?.length ?? 0) > 0
    if (!hasData) return null

    return (
        <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">{orgName}</h2>

            {(diagnoses.data?.length ?? 0) > 0 && (
                <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                    <div className="border-b border-gray-200 px-4 py-2">
                        <p className="text-xs font-medium text-gray-500 uppercase">Diagnósticos</p>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-4 py-2">Título</th>
                                <th className="px-4 py-2">Status</th>
                                <th className="px-4 py-2">Respostas</th>
                                <th className="px-4 py-2">Início</th>
                                <th className="px-4 py-2">Conclusão</th>
                            </tr>
                        </thead>
                        <tbody>
                            {diagnoses.data!.map((d) => <DiagnosisRow key={d.id} d={d} />)}
                        </tbody>
                    </table>
                </div>
            )}

            {(risks.data?.length ?? 0) > 0 && (
                <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                    <div className="border-b border-gray-200 px-4 py-2">
                        <p className="text-xs font-medium text-gray-500 uppercase">Riscos Identificados</p>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-4 py-2">Categoria</th>
                                <th className="px-4 py-2">Descrição</th>
                                <th className="px-4 py-2">Nível</th>
                                <th className="px-4 py-2">Identificado em</th>
                            </tr>
                        </thead>
                        <tbody>
                            {risks.data!.map((r) => <RiskRow key={r.id} risk={r} />)}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

export function DiagnosisPage() {
    const { data: orgs, isLoading, error, refetch } = useOrganizations()

    if (isLoading) return <SectionLoader />
    if (error) {
        return (
            <ErrorMessage
                message={error instanceof Error ? error.message : 'Erro ao carregar organizações'}
                onRetry={() => void refetch()}
            />
        )
    }

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Diagnósticos</h1>
                <p className="mt-1 text-sm text-gray-500">Diagnósticos psicossociais e riscos por organização</p>
            </div>
            {!orgs || orgs.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center">
                    <p className="text-sm text-gray-500">Nenhuma organização cadastrada.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {orgs.map((org) => (
                        <OrgDiagnosisBlock key={org.id} orgId={org.id} orgName={org.name} />
                    ))}
                </div>
            )}
        </div>
    )
}
