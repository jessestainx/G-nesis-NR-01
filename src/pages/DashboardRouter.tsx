import { Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

export function DashboardRouter() {
    const { role, isLoading, isAuthenticated, refreshProfile } = useAuth()

    useEffect(() => {
        if (!isLoading && isAuthenticated && !role) {
            refreshProfile()
        }
    }, [isLoading, isAuthenticated, role, refreshProfile])

    if (isLoading || (isAuthenticated && !role)) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#00A898] border-t-transparent" />
            </div>
        )
    }

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
