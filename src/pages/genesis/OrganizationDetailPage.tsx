import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Plus, Users, ListChecks, Mail } from 'lucide-react'
import { useOrganization, useOrgAdoptionStats } from '@/hooks/queries/useOrganizations'
import { useOrganizationProfiles, useInviteUser, usePendingInvites } from '@/hooks/queries/useProfiles'
import { useDiagnoses, useRisks } from '@/hooks/queries/useDiagnosis'
import { useActionPlans } from '@/hooks/queries/useActionPlans'
import { useOrgAuditLogs } from '@/hooks/queries/useAudit'
import { useOrgSettings } from '@/hooks/queries/useOrgSettings'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate, formatDateTime, roleLabel } from '@/utils/format'
import type { UserRole } from '@/types'

function Kpi({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{value}</p>
        </div>
    )
}

function InviteUserModal({ organizationId, onClose }: { organizationId: string; onClose: () => void }) {
    const invite = useInviteUser()
    const [email, setEmail] = useState('')
    const [name, setName] = useState('')
    const [role, setRole] = useState<UserRole>('collaborator')
    const [message, setMessage] = useState('')
    const [sent, setSent] = useState(false)
    const preview = `Olá ${name || '[Nome]'}, você foi convidado para acessar o Portal Gênesis NR-01 como ${roleLabel[role] ?? role}.`

    async function handleInvite(e: React.FormEvent) {
        e.preventDefault()
        const result = await invite.mutateAsync({
            email: email.trim(),
            name: name.trim() || 'Usuário',
            role,
            organizationId,
            message: message.trim() || undefined,
        })
        if (!result.error) {
            setSent(true)
            setTimeout(onClose, 900)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl dark:bg-gray-900">
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Convidar novo usuário</h3>
                <form onSubmit={(e) => void handleInvite(e)} className="space-y-3">
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800" />
                    <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800" />
                    <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800">
                        <option value="client_executive">Empresa (Executivo)</option>
                        <option value="professional">Profissional</option>
                        <option value="collaborator">Colaborador</option>
                    </select>
                    <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Mensagem personalizada (opcional)" rows={3} className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800" />
                    <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-xs text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200">
                        <strong>Preview:</strong> {preview}
                    </div>
                    {sent && <p className="text-sm text-green-600">Convite enviado - aguardando confirmação.</p>}
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="rounded-lg border px-3 py-2 text-sm">Cancelar</button>
                        <button disabled={invite.isPending} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white">
                            {invite.isPending ? 'Enviando...' : 'Enviar convite'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export function OrganizationDetailPage() {
    const { id = '' } = useParams()
    const [showInvite, setShowInvite] = useState(false)
    const org = useOrganization(id)
    const profiles = useOrganizationProfiles(id)
    const pendingInvites = usePendingInvites(id)
    const diagnoses = useDiagnoses(id)
    const risks = useRisks(id)
    const plans = useActionPlans(id)
    const audit = useOrgAuditLogs(id)
    const settings = useOrgSettings(id)
    const adoption = useOrgAdoptionStats()

    const isLoading =
        org.isLoading ||
        profiles.isLoading ||
        pendingInvites.isLoading ||
        diagnoses.isLoading ||
        risks.isLoading ||
        plans.isLoading ||
        audit.isLoading ||
        settings.isLoading ||
        adoption.isLoading

    const fatalError = org.error || profiles.error || diagnoses.error || risks.error || plans.error || audit.error
    if (isLoading) return <SectionLoader />
    if (fatalError) {
        return (
            <ErrorMessage
                message={fatalError instanceof Error ? fatalError.message : 'Erro ao carregar organização'}
                onRetry={() => {
                    void org.refetch()
                    void profiles.refetch()
                    void diagnoses.refetch()
                    void plans.refetch()
                    void audit.refetch()
                }}
            />
        )
    }

    if (!org.data) {
        return <EmptyState icon={Users} title="Organização não encontrada" description="Verifique o identificador informado." />
    }

    const orgAdoption = adoption.data?.find((item) => item.organization_id === id)
    const adoptionPct = orgAdoption?.total_users
        ? Math.round((orgAdoption.users_with_responses / orgAdoption.total_users) * 100)
        : 0

    const criticalRisks = (risks.data ?? []).filter((r) => r.level === 'critical').length
    const plansInProgress = (plans.data ?? []).filter((p) => p.status === 'in_progress' || p.status === 'pending').length
    const timeline = (audit.data ?? []).slice(0, 10)

    return (
        <div className="space-y-6 p-6">
            {showInvite && <InviteUserModal organizationId={id} onClose={() => setShowInvite(false)} />}

            <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                            {settings.data?.logo_url ? <img src={settings.data.logo_url} alt="Logo" className="h-full w-full object-cover" /> : null}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{org.data.name}</h1>
                            <div className="mt-1 flex items-center gap-2 text-xs">
                                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">{org.data.status}</span>
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">{org.data.plan ?? 'sem plano'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link to="/dashboard/genesis/organizations" className="rounded-lg border px-3 py-2 text-sm">Editar</Link>
                        <Link to={`/dashboard/genesis/org-settings?orgId=${id}`} className="rounded-lg border px-3 py-2 text-sm">Config. por Org</Link>
                        <button onClick={() => setShowInvite(true)} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white">Convidar usuário</button>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <Kpi label="Usuários ativos" value={orgAdoption?.users_logged_in ?? 0} />
                <Kpi label="Diagnósticos" value={diagnoses.data?.length ?? 0} />
                <Kpi label="Riscos críticos" value={criticalRisks} />
                <Kpi label="Planos em andamento" value={plansInProgress} />
                <Kpi label="Taxa de adoção" value={`${adoptionPct}%`} />
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
                    <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">Usuários da organização</h2>
                    {!profiles.data || profiles.data.length === 0 ? (
                        <EmptyState icon={Users} title="Sem usuários" description="Convide o primeiro usuário para esta organização." />
                    ) : (
                        <div className="space-y-2">
                            {profiles.data.map((p) => (
                                <div key={p.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm dark:border-gray-800">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{p.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{p.email}</p>
                                    </div>
                                    <div className="text-right text-xs">
                                        <p className="text-gray-700 dark:text-gray-300">{roleLabel[p.role] ?? p.role}</p>
                                        <p className={p.active === false ? 'text-amber-600' : 'text-emerald-600'}>{p.active === false ? 'Inativo' : 'Ativo'}</p>
                                        <p className="text-gray-400">{formatDate(p.created_at)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <button onClick={() => setShowInvite(true)} className="mt-4 rounded-lg border px-3 py-2 text-sm">Convidar novo usuário</button>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
                    <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">Convites pendentes</h2>
                    {!pendingInvites.data || pendingInvites.data.length === 0 ? (
                        <EmptyState icon={Mail} title="Sem convites pendentes" description="Todos os convites foram aceitos ou ainda não há envios." />
                    ) : (
                        <div className="space-y-2">
                            {pendingInvites.data.map((invite) => (
                                <div key={invite.id} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm dark:border-amber-900 dark:bg-amber-950/30">
                                    <p className="font-medium text-amber-800 dark:text-amber-300">{invite.email}</p>
                                    <p className="text-xs text-amber-700 dark:text-amber-400">
                                        {roleLabel[invite.role] ?? invite.role} • convidado em {formatDate(invite.invited_at)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
                <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">Timeline de atividades</h2>
                {timeline.length === 0 ? (
                    <EmptyState icon={ListChecks} title="Sem atividades" description="As ações desta organização aparecerão aqui." />
                ) : (
                    <div className="space-y-2">
                        {timeline.map((item) => (
                            <div key={item.id} className="rounded-lg border border-gray-100 px-3 py-2 text-sm dark:border-gray-800">
                                <p className="font-medium text-gray-900 dark:text-white">{item.action}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {item.entity_type} • {formatDateTime(item.created_at)}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
                <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">Ações rápidas</h2>
                <div className="flex flex-wrap gap-2">
                    <Link to={`/dashboard/genesis/diagnosis?orgId=${id}`} className="rounded-lg border px-3 py-2 text-sm">+ Novo diagnóstico</Link>
                    <Link to={`/dashboard/genesis/action-plans?orgId=${id}`} className="rounded-lg border px-3 py-2 text-sm">+ Novo plano de ação</Link>
                    <Link to={`/dashboard/genesis/pulse?orgId=${id}`} className="rounded-lg border px-3 py-2 text-sm">+ Nova pesquisa de pulso</Link>
                    <button onClick={() => setShowInvite(true)} className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white">
                        <Plus className="h-4 w-4" /> Convidar usuário
                    </button>
                </div>
            </section>
        </div>
    )
}
