// Este arquivo será sobrescrito pelo Supabase CLI após as migrations (Fase 3).
// Comando: npx supabase gen types typescript --project-id SEU_PROJECT_ID > src/types/database.ts
//
// Por ora, exporta o tipo base para o cliente não quebrar na compilação.

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: Record<string, never>
        Views: Record<string, never>
        Functions: Record<string, never>
        Enums: {
            user_role: 'genesis' | 'client_executive' | 'collaborator' | 'professional'
            risk_level: 'low' | 'medium' | 'high' | 'critical'
            action_status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
            diagnosis_status: 'draft' | 'in_progress' | 'completed' | 'archived'
            contract_status: 'active' | 'suspended' | 'cancelled' | 'expired'
        }
        CompositeTypes: Record<string, never>
    }
}

// Helpers para extrair tipos das tabelas após geração
export type Tables<T extends keyof Database['public']['Tables']> =
    Database['public']['Tables'][T]['Row']

export type Enums<T extends keyof Database['public']['Enums']> =
    Database['public']['Enums'][T]
