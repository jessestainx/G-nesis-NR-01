// Hook de autenticação — único ponto de acesso ao AuthContext na aplicação.
import { useContext } from 'react'
import { AuthContext } from '@/contexts/authContext.internal'
import type { AuthContextValue } from '@/types/auth'

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
    return ctx
}
