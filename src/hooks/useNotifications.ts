import { useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useExpiringContracts } from '@/hooks/queries/useFinance'
import { useActionPlans } from '@/hooks/queries/useActionPlans'
import { useActivePulseSurvey, useHasResponded } from '@/hooks/queries/usePulseSurveys'
import { useRisks } from '@/hooks/queries/useDiagnosis'

export interface AppNotification {
    id: string
    type: 'warning' | 'info' | 'urgent'
    title: string
    message: string
    href?: string
}

export function useNotifications(): { notifications: AppNotification[]; count: number } {
    const { role, profile, user } = useAuth()
    const orgId = profile?.organization_id ?? ''
    const uid = user?.id ?? ''

    // genesis: contratos expirando
    const { data: expiringContracts } = useExpiringContracts(30)

    // genesis + professional + client_executive: planos atrasados
    const { data: actionPlans } = useActionPlans(orgId)

    // collaborator + client_executive: pesquisa ativa
    const { data: activeSurvey } = useActivePulseSurvey(orgId)

    // collaborator: verificar se já respondeu
    const { data: hasResponded } = useHasResponded(activeSurvey?.id ?? '', uid)

    // professional: riscos críticos
    const { data: risks } = useRisks(orgId)

    const notifications = useMemo<AppNotification[]>(() => {
        const list: AppNotification[] = []

        // ── Genesis ───────────────────────────────────────────────────────────
        if (role === 'genesis') {
            if (expiringContracts?.length) {
                list.push(
                    expiringContracts.length === 1
                        ? {
                              id: `contract-${expiringContracts[0].id}`,
                              type: 'warning',
                              title: 'Contrato expirando',
                              message: `"${expiringContracts[0].title}" vence em breve`,
                              href: '/dashboard/genesis/finance',
                          }
                        : {
                              id: 'contracts-expiring',
                              type: 'warning',
                              title: `${expiringContracts.length} contratos expirando`,
                              message: 'Verifique os contratos que vencem nos próximos 30 dias',
                              href: '/dashboard/genesis/finance',
                          },
                )
            }
        }

        // ── Planos em atraso (genesis, professional, client_executive) ─────────
        if (role === 'genesis' || role === 'professional' || role === 'client_executive') {
            if (actionPlans) {
                const now = new Date()
                const overdue = actionPlans.filter(
                    (ap) =>
                        ap.due_date &&
                        new Date(ap.due_date) < now &&
                        ap.status !== 'completed' &&
                        ap.status !== 'cancelled',
                )
                if (overdue.length > 0) {
                    const href =
                        role === 'genesis'
                            ? '/dashboard/genesis/action-plans'
                            : role === 'professional'
                              ? '/dashboard/professional/action-plans'
                              : '/dashboard/client/action-plans'
                    list.push({
                        id: 'action-plans-overdue',
                        type: 'urgent',
                        title: `${overdue.length} plano${overdue.length > 1 ? 's' : ''} em atraso`,
                        message: 'Planos de ação com prazo vencido precisam de atenção',
                        href,
                    })
                }
            }
        }

        // ── Pesquisa ativa não respondida (collaborator) ───────────────────────
        if (role === 'collaborator' && activeSurvey && !hasResponded) {
            list.push({
                id: `survey-${activeSurvey.id}`,
                type: 'urgent',
                title: 'Pesquisa de Pulso pendente',
                message: `"${activeSurvey.title}" aguarda sua resposta`,
                href: '/dashboard/collaborator/survey',
            })
        }

        // ── Pesquisa ativa para client_executive ──────────────────────────────
        if (role === 'client_executive' && activeSurvey) {
            list.push({
                id: `survey-exec-${activeSurvey.id}`,
                type: 'info',
                title: 'Pesquisa de Pulso ativa',
                message: `"${activeSurvey.title}" está aberta para seus colaboradores`,
                href: '/dashboard/client/pulse',
            })
        }

        // ── Riscos críticos sem plano de ação (professional) ──────────────────
        if (role === 'professional' && risks) {
            const criticalRisks = risks.filter((r) => r.level === 'critical' || r.level === 'high')
            if (criticalRisks.length > 0) {
                list.push({
                    id: 'professional-critical-risks',
                    type: 'warning',
                    title: `${criticalRisks.length} risco${criticalRisks.length > 1 ? 's' : ''} alto${criticalRisks.length > 1 ? 's' : ''}`,
                    message: 'Riscos de nível alto/crítico identificados na organização',
                    href: '/dashboard/professional/risks',
                })
            }
        }

        return list
    }, [role, expiringContracts, actionPlans, activeSurvey, hasResponded, risks])

    return { notifications, count: notifications.length }
}
