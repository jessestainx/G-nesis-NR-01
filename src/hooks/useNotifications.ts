import { useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useExpiringContracts } from '@/hooks/queries/useFinance'
import { useActionPlans } from '@/hooks/queries/useActionPlans'
import { useActivePulseSurvey } from '@/hooks/queries/usePulseSurveys'

export interface AppNotification {
    id: string
    type: 'warning' | 'info' | 'urgent'
    title: string
    message: string
    href?: string
}

export function useNotifications(): { notifications: AppNotification[]; count: number } {
    const { role, profile } = useAuth()
    const orgId = profile?.organization_id ?? ''

    // Contratos expirando — apenas genesis
    const { data: expiringContracts } = useExpiringContracts(30)

    // Planos de ação em atraso — genesis e professional, client_executive
    const { data: actionPlans } = useActionPlans(orgId)

    // Pesquisa ativa — apenas collaborator
    const { data: activeSurvey } = useActivePulseSurvey(orgId)

    const notifications = useMemo<AppNotification[]>(() => {
        const list: AppNotification[] = []

        if (role === 'genesis' && expiringContracts?.length) {
            if (expiringContracts.length === 1) {
                list.push({
                    id: `contract-${expiringContracts[0].id}`,
                    type: 'warning',
                    title: 'Contrato expirando',
                    message: `"${expiringContracts[0].title}" vence em breve`,
                    href: '/dashboard/genesis/finance',
                })
            } else {
                list.push({
                    id: 'contracts-expiring',
                    type: 'warning',
                    title: `${expiringContracts.length} contratos expirando`,
                    message: 'Verifique os contratos que vencem nos próximos 30 dias',
                    href: '/dashboard/genesis/finance',
                })
            }
        }

        if ((role === 'genesis' || role === 'professional' || role === 'client_executive') && actionPlans) {
            const now = new Date()
            const overdue = actionPlans.filter(
                (ap) => ap.due_date && new Date(ap.due_date) < now && ap.status !== 'completed' && ap.status !== 'cancelled',
            )
            if (overdue.length > 0) {
                const basePath =
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
                    href: basePath,
                })
            }
        }

        if (role === 'collaborator' && activeSurvey) {
            list.push({
                id: `survey-${activeSurvey.id}`,
                type: 'info',
                title: 'Pesquisa de Pulso aberta',
                message: `"${activeSurvey.title}" aguarda sua resposta`,
                href: '/dashboard/collaborator/survey',
            })
        }

        return list
    }, [role, expiringContracts, actionPlans, activeSurvey])

    return { notifications, count: notifications.length }
}
