import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatDate(iso: string | null | undefined, pattern = 'dd/MM/yyyy'): string {
    if (!iso) return '—'
    try {
        return format(parseISO(iso), pattern, { locale: ptBR })
    } catch {
        return '—'
    }
}

export function formatDateTime(iso: string | null | undefined): string {
    if (!iso) return '—'
    try {
        return format(parseISO(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    } catch {
        return '—'
    }
}

export function formatRelative(iso: string | null | undefined): string {
    if (!iso) return '—'
    try {
        return formatDistanceToNow(parseISO(iso), { addSuffix: true, locale: ptBR })
    } catch {
        return '—'
    }
}

export function formatCurrency(value: number | null | undefined): string {
    if (value == null) return '—'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatNumber(value: number | null | undefined): string {
    if (value == null) return '—'
    return new Intl.NumberFormat('pt-BR').format(value)
}

export function formatPercent(value: number | null | undefined): string {
    if (value == null) return '—'
    return `${value}%`
}

export function formatFileSize(bytes: number | null | undefined): string {
    if (bytes == null) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatCnpj(cnpj: string | null | undefined): string {
    if (!cnpj) return '—'
    const digits = cnpj.replace(/\D/g, '')
    if (digits.length !== 14) return cnpj
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

// ─── Domain label maps ──────────────────────────────────────────────────────

export const riskLevelLabel: Record<string, string> = {
    critical: 'Crítico',
    high: 'Alto',
    medium: 'Médio',
    low: 'Baixo',
}

export const actionStatusLabel: Record<string, string> = {
    pending: 'Pendente',
    in_progress: 'Em andamento',
    completed: 'Concluído',
    cancelled: 'Cancelado',
}

export const diagnosisStatusLabel: Record<string, string> = {
    draft: 'Rascunho',
    in_progress: 'Em andamento',
    completed: 'Concluído',
    archived: 'Arquivado',
}

export const contractStatusLabel: Record<string, string> = {
    active: 'Ativo',
    suspended: 'Suspenso',
    cancelled: 'Cancelado',
    expired: 'Expirado',
}

export const crmStageLabel: Record<string, string> = {
    lead: 'Lead',
    prospect: 'Prospecto',
    proposal: 'Proposta',
    negotiation: 'Negociação',
    closed_won: 'Fechado (ganho)',
    closed_lost: 'Fechado (perdido)',
}

export const roleLabel: Record<string, string> = {
    genesis: 'Genesis',
    client_executive: 'Cliente Executivo',
    collaborator: 'Colaborador',
    professional: 'Profissional',
}
