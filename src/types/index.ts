import type { Enums } from '@/types/database'

// ─── Roles ────────────────────────────────────────────────────────────────────
export type UserRole = Enums<'user_role'>

// ─── Perfil de usuário ────────────────────────────────────────────────────────
export interface Profile {
    id: string
    email: string
    name: string
    role: UserRole
    organization_id: string | null
    avatar_url: string | null
    created_at: string
    updated_at: string
}

// ─── Organização (empresa cliente) ───────────────────────────────────────────
export interface Organization {
    id: string
    name: string
    cnpj: string | null
    industry: string | null
    employee_count: number | null
    responsible_name: string | null
    responsible_email: string | null
    plan: 'basic' | 'standard' | 'premium' | null
    status: 'active' | 'suspended' | 'inactive'
    created_at: string
    updated_at: string
}

// ─── Unidade organizacional ───────────────────────────────────────────────────
export interface OrganizationUnit {
    id: string
    organization_id: string
    name: string
    type: 'department' | 'team' | 'branch' | 'unit'
    parent_unit_id: string | null
    manager_name: string | null
    employee_count: number | null
    created_at: string
}

// ─── Diagnóstico Psicossocial ─────────────────────────────────────────────────
export interface PsychosocialDiagnosis {
    id: string
    organization_id: string
    title: string
    status: Enums<'diagnosis_status'>
    started_at: string | null
    completed_at: string | null
    total_invited: number
    total_responded: number
    created_by: string
    created_at: string
    updated_at: string
}

// ─── Risco Psicossocial ───────────────────────────────────────────────────────
export interface PsychosocialRisk {
    id: string
    organization_id: string
    diagnosis_id: string | null
    category: string
    description: string
    level: Enums<'risk_level'>
    affected_unit_id: string | null
    identified_at: string
    created_by: string
    created_at: string
}

// ─── Plano de Ação ────────────────────────────────────────────────────────────
export interface ActionPlan {
    id: string
    organization_id: string
    title: string
    description: string | null
    status: Enums<'action_status'>
    due_date: string | null
    responsible_id: string | null
    progress_pct: number
    created_by: string
    created_at: string
    updated_at: string
}

export interface ActionItem {
    id: string
    action_plan_id: string
    title: string
    status: Enums<'action_status'>
    due_date: string | null
    responsible_id: string | null
    completed_at: string | null
    created_at: string
}

// ─── Treinamento ──────────────────────────────────────────────────────────────
export interface Training {
    id: string
    organization_id: string
    title: string
    description: string | null
    type: 'online' | 'in_person' | 'hybrid'
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
    scheduled_date: string | null
    completed_date: string | null
    instructor: string | null
    participant_count: number
    created_by: string
    created_at: string
}

// ─── Documento ────────────────────────────────────────────────────────────────
export interface Document {
    id: string
    organization_id: string
    name: string
    type: string
    storage_path: string
    size_bytes: number | null
    uploaded_by: string
    created_at: string
}

// ─── Pesquisa de Pulso ────────────────────────────────────────────────────────
export interface PulseSurvey {
    id: string
    organization_id: string
    title: string
    status: 'draft' | 'active' | 'closed'
    opened_at: string | null
    closed_at: string | null
    total_invited: number
    total_responded: number
    created_by: string
    created_at: string
}

// ─── CRM ──────────────────────────────────────────────────────────────────────
export interface CrmContact {
    id: string
    organization_id: string | null
    name: string
    email: string | null
    phone: string | null
    company: string | null
    stage: 'lead' | 'prospect' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'
    assigned_to: string | null
    created_at: string
    updated_at: string
}

export interface Contract {
    id: string
    organization_id: string
    title: string
    value: number
    status: Enums<'contract_status'>
    start_date: string
    end_date: string | null
    created_at: string
}

// ─── Financeiro ───────────────────────────────────────────────────────────────
export interface FinancialTransaction {
    id: string
    organization_id: string | null
    type: 'revenue' | 'expense' | 'commission'
    amount: number
    description: string
    category: string | null
    reference_date: string
    created_by: string
    created_at: string
}

// ─── Audit Log ────────────────────────────────────────────────────────────────
export interface AuditLog {
    id: string
    user_id: string
    organization_id: string | null
    action: string
    entity_type: string
    entity_id: string | null
    metadata: Record<string, unknown> | null
    created_at: string
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthUser {
    id: string
    email: string
    profile: Profile | null
}
