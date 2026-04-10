import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

// As tabelas org_settings e email_queue não estão no Database gerado ainda.
// Este cast permite usar o cliente tipado sem erros até a geração de tipos.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export interface OrgSettings {
    id: string
    organization_id: string
    logo_url: string | null
    primary_color: string
    company_tagline: string | null
    email_notify_action_overdue: boolean
    email_notify_survey_opened: boolean
    email_notify_diagnosis_done: boolean
    email_notify_contract_expiry: boolean
    notification_email: string | null
    created_at: string
    updated_at: string
}

export type OrgSettingsPayload = Partial<Omit<OrgSettings, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useOrgSettings(organizationId: string) {
    return useQuery<OrgSettings | null>({
        queryKey: ['org-settings', organizationId],
        queryFn: async () => {
            if (!organizationId) return null
            const { data, error } = await db
                .from('org_settings')
                .select('*')
                .eq('organization_id', organizationId)
                .maybeSingle()
            if (error) throw error
            return data as OrgSettings | null
        },
        enabled: !!organizationId,
    })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useUpsertOrgSettings() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({
            organizationId,
            payload,
        }: {
            organizationId: string
            payload: OrgSettingsPayload
        }) => {
            const { data, error } = await db
                .from('org_settings')
                .upsert({ organization_id: organizationId, ...payload }, { onConflict: 'organization_id' })
                .select()
                .single()
            if (error) throw error
            return data
        },
        onSuccess: (_, vars) => {
            void qc.invalidateQueries({ queryKey: ['org-settings', vars.organizationId] })
            toast.success('Configurações salvas')
        },
        onError: (err: Error) => toast.error('Erro ao salvar: ' + err.message),
    })
}

// ─── Email Queue hooks ────────────────────────────────────────────────────────

export interface EmailQueueItem {
    id: string
    organization_id: string | null
    to_email: string
    to_name: string | null
    subject: string
    trigger_event: string
    status: 'pending' | 'sent' | 'failed'
    attempts: number
    error_message: string | null
    scheduled_at: string
    sent_at: string | null
    created_at: string
}

export function useEmailQueue() {
    return useQuery<EmailQueueItem[]>({
        queryKey: ['email-queue'],
        queryFn: async () => {
            const { data, error } = await db
                .from('email_queue')
                .select('id, organization_id, to_email, to_name, subject, trigger_event, status, attempts, error_message, scheduled_at, sent_at, created_at')
                .order('created_at', { ascending: false })
                .limit(100)
            if (error) throw error
            return (data ?? []) as EmailQueueItem[]
        },
        refetchInterval: 30_000,
    })
}

export function useRetryEmailQueue() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await db
                .from('email_queue')
                .update({ status: 'pending', attempts: 0, error_message: null, scheduled_at: new Date().toISOString() })
                .eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            void qc.invalidateQueries({ queryKey: ['email-queue'] })
            toast.success('Email reagendado para envio')
        },
        onError: (err: Error) => toast.error('Erro: ' + err.message),
    })
}
