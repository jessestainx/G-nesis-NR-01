import type { ComponentType } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useOrganization } from '@/hooks/queries/useOrganizations'
import { useDiagnoses, useRisks } from '@/hooks/queries/useDiagnosis'
import { useActionPlans } from '@/hooks/queries/useActionPlans'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { Building2, ClipboardCheck, AlertTriangle, ListChecks } from 'lucide-react'

interface KpiCardProps {
    title: string
    value: number | string
    icon: ComponentType<{ className?: string }>
    color: 'indigo' | 'emerald' | 'amber' | 'rose'
}

const kpiColors = {
    indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400',
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
    rose: 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400',
}

function KpiCard({ title, value, icon: Icon, color }: KpiCardProps) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
                </div>
                <div className={`rounded-lg p-2 ${kpiColors[color]}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    )
}

export function ProfessionalOverview() {
    const { profile } = useAuth()
    const orgId = profile?.organization_id ?? ''

    const orgQuery = useOrganization(orgId)
    const diagnosesQuery = useDiagnoses(orgId)
    const actionPlansQuery = useActionPlans(orgId)
    const risksQuery = useRisks(orgId)

    const isLoading = orgQuery.isLoading || diagnosesQuery.isLoading || actionPlansQuery.isLoading || risksQuery.isLoading

    if (!orgId) {
        return (
            <div className="space-y-6 p-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Olá, {profile?.name ?? 'Profissional'}
                </h1>
                <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
                    <Building2 className="mx-auto mb-3 h-8 w-8 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Nenhuma organização associada ao seu perfil.
                    </p>
                </div>
            </div>
        )
    }

    if (isLoading) return <SectionLoader />

    const org = orgQuery.data
    const diagnoses = diagnosesQuery.data ?? []
    const actionPlans = actionPlansQuery.data ?? []
    const risks = risksQuery.data ?? []

    const openPlans = actionPlans.filter((p) => p.status === 'pending' || p.status === 'in_progress')
    const highRisks = risks.filter((r) => r.level === 'high' || r.level === 'critical')

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Olá, {profile?.name ?? 'Profissional'}
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {org ? (
                        <>Visão geral de <span className="font-medium text-gray-700 dark:text-gray-300">{org.name}</span></>
                    ) : 'Visão geral da sua organização'}
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    title="Diagnósticos"
                    value={diagnoses.length}
                    icon={ClipboardCheck}
                    color="indigo"
                />
                <KpiCard
                    title="Planos de Ação"
                    value={actionPlans.length}
                    icon={ListChecks}
                    color="emerald"
                />
                <KpiCard
                    title="Em Andamento"
                    value={openPlans.length}
                    icon={Building2}
                    color="amber"
                />
                <KpiCard
                    title="Riscos Altos"
                    value={highRisks.length}
                    icon={AlertTriangle}
                    color="rose"
                />
            </div>

            {/* Resumo da organização */}
            {org && (
                <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
                    <h2 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Organização
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                        <div>
                            <p className="text-xs text-gray-400">Nome</p>
                            <p className="font-medium text-gray-900 dark:text-white">{org.name}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">CNPJ</p>
                            <p className="font-medium text-gray-900 dark:text-white">{org.cnpj ?? '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Colaboradores</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                                {org.employee_count ?? '—'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">Status</p>
                            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${org.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                {org.status === 'active' ? 'Ativo' : org.status}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
