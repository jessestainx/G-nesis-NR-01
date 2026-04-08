import { Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

export function DashboardRouter() {
    const { role, isLoading, isAuthenticated, refreshProfile } = useAuth()
    const [timedOut, setTimedOut] = useState(false)

    // Tenta buscar o perfil quando autenticado mas sem role
    useEffect(() => {
        if (!isLoading && isAuthenticated && !role) {
            refreshProfile()
        }
    }, [isLoading, isAuthenticated, role, refreshProfile])

    // Fallback: se após 8s ainda sem role, redireciona para login
    useEffect(() => {
        if (!isLoading && isAuthenticated && !role) {
            const t = setTimeout(() => setTimedOut(true), 8000)
            return () => clearTimeout(t)
        }
    }, [isLoading, isAuthenticated, role])

    if (timedOut) {
        return <Navigate to="/login" replace />
    }

    if (isLoading || (isAuthenticated && !role)) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#162136]">
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
