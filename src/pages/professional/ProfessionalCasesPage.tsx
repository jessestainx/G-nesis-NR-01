import { useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useDiagnoses, useRisks } from '@/hooks/queries/useDiagnosis'
import { useActionPlans } from '@/hooks/queries/useActionPlans'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Briefcase, Clock, AlertTriangle, BarChart2, CalendarX } from 'lucide-react'
import { formatDate, diagnosisStatusLabel, actionStatusLabel } from '@/utils/format'

const STATUS_COLORS: Record<string, string> = {
    in_progress: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400',
    draft:       'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
    completed:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
    archived:    'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    pending:     'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
    cancelled:   'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
}

export function ProfessionalCasesPage() {
    const { profile } = useAuth()
    const orgId = profile?.organization_id ?? ''

    const diagnosesQ   = useDiagnoses(orgId)
    const risksQ       = useRisks(orgId)
    const actionPlansQ = useActionPlans(orgId)

    const isLoading = diagnosesQ.isLoading || risksQ.isLoading || actionPlansQ.isLoading
    const isError   = diagnosesQ.isError   || risksQ.isError   || actionPlansQ.isError

    const stats = useMemo(() => {
        const diagnoses  = diagnosesQ.data  ?? []
        const risks      = risksQ.data      ?? []
        const plans      = actionPlansQ.data ?? []
        const thirtyAgo  = new Date()
        thirtyAgo.setDate(thirtyAgo.getDate() - 30)

        return {
            active:      diagnoses.filter(d => d.status === 'in_progress').length,
            draft:       diagnoses.filter(d => d.status === 'draft').length,
            highRisks:   risks.filter(r => r.level === 'critical' || r.level === 'high').length,
            completed30: plans.filter(p =>
                p.status === 'completed' && p.updated_at && new Date(p.updated_at) >= thirtyAgo
            ).length,
        }
    }, [diagnosesQ.data, risksQ.data, actionPlansQ.data])

    const activeDiagnoses = useMemo(
        () => (diagnosesQ.data ?? []).filter(d => d.status === 'in_progress' || d.status === 'draft'),
        [diagnosesQ.data]
    )

    const overduePlans = useMemo(() => {
        const today = new Date().toISOString().slice(0, 10)
        return (actionPlansQ.data ?? []).filter(p =>
            p.due_date && p.due_date < today &&
            p.status !== 'completed' && p.status !== 'cancelled'
        )
    }, [actionPlansQ.data])

    const statCards = [
        {
            label: 'Casos ativos',
            value: stats.active,
            icon: Briefcase,
            color: 'text-[#00A898]',
            bg: 'bg-[#00A898]/10',
        },
        {
            label: 'Aguardando triagem',
            value: stats.draft,
            icon: Clock,
            color: 'text-amber-600',
            bg: 'bg-amber-50 dark:bg-amber-950/30',
        },
        {
            label: 'Alta complexidade',
            value: stats.highRisks,
            icon: AlertTriangle,
            color: 'text-rose-600',
            bg: 'bg-rose-50 dark:bg-rose-950/30',
        },
        {
            label: 'Concluídos (30d)',
            value: stats.completed30,
            icon: BarChart2,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50 dark:bg-indigo-950/30',
        },
    ]

    if (isLoading) return <SectionLoader />
    if (isError) return (
        <div className="p-6 text-sm text-rose-600">Erro ao carregar dados. Tente recarregar a página.</div>
    )

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Casos Clínicos</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Acompanhamento dos diagnósticos ativos e planos de ação da organização.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {statCards.map(({ label, value, icon: Icon, color, bg }) => (
                    <div
                        key={label}
                        className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
                    >
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${bg}`}>
                            <Icon className={`h-5 w-5 ${color}`} />
                        </span>
                        <div>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <section>
                <h2 className="mb-3 text-base font-semibold text-gray-800 dark:text-gray-100">
                    Diagnósticos em acompanhamento
                </h2>
                {activeDiagnoses.length === 0 ? (
                    <EmptyState
                        icon={Briefcase}
                        title="Nenhum diagnóstico ativo"
                        description="Não há diagnósticos em andamento ou rascunho no momento."
                    />
                ) : (
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Título</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">Status</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Iniciado em</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">Respondentes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {activeDiagnoses.map(d => (
                                    <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                            {d.title}
                                        </td>
                                        <td className="px-4 py-3 hidden sm:table-cell">
                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[d.status] ?? ''}`}>
                                                {diagnosisStatusLabel[d.status] ?? d.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell">
                                            {formatDate(d.started_at)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300 hidden sm:table-cell">
                                            {d.total_responded}/{d.total_invited}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section>
                <h2 className="mb-3 text-base font-semibold text-gray-800 dark:text-gray-100">
                    Planos de ação com prazo vencido
                </h2>
                {overduePlans.length === 0 ? (
                    <EmptyState
                        icon={CalendarX}
                        title="Nenhum plano vencido"
                        description="Todos os planos estão dentro do prazo ou já foram concluídos."
                    />
                ) : (
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Plano</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">Status</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Prazo</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">Progresso</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {overduePlans.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                            {p.title}
                                        </td>
                                        <td className="px-4 py-3 hidden sm:table-cell">
                                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[p.status] ?? ''}`}>
                                                {actionStatusLabel[p.status] ?? p.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-rose-600 dark:text-rose-400 font-medium">
                                            {formatDate(p.due_date)}
                                        </td>
                                        <td className="px-4 py-3 text-right hidden sm:table-cell">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                                    <div
                                                        className="h-full rounded-full bg-[#00A898]"
                                                        style={{ width: `${p.progress_pct}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-500">{p.progress_pct}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    )
}
