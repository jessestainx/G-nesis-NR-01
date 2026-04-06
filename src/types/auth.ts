import type { Session, User } from '@supabase/supabase-js'
import type { Profile, UserRole } from '@/types'

export interface AuthContextValue {
    session: Session | null
    user: User | null
    profile: Profile | null
    role: UserRole | null
    isLoading: boolean
    isAuthenticated: boolean
    signIn: (email: string, password: string) => Promise<{ error: string | null }>
    signOut: () => Promise<void>
    refreshProfile: () => Promise<void>
}
