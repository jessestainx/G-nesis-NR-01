import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

// Cada role é redirecionado para seu dashboard específico.
export function DashboardRouter() {
    const { role, isLoading } = useAuth()

    if (isLoading) return null

    switch (role) {
        case 'genesis':
            return <Navigate to="/dashboard/genesis" replace />
        case 'client_executive':
            return <Navigate to="/dashboard/client" replace />
        case 'collaborator':
            return <Navigate to="/dashboard/collaborator" replace />
        case 'professional':
            return <Navigate to="/dashboard/professional" replace />
        default:
            return <Navigate to="/unauthorized" replace />
    }
}
