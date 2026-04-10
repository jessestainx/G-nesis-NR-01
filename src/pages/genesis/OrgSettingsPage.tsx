import { useState, useEffect } from 'react'
import { Settings, Mail, Palette, RefreshCw, CheckCircle2, XCircle, Clock, Send } from 'lucide-react'
import { useOrganizations } from '@/hooks/queries/useOrganizations'
import {
    useOrgSettings, useUpsertOrgSettings, useEmailQueue, useRetryEmailQueue,
} from '@/hooks/queries/useOrgSettings'
import { formatDateTime } from '@/utils/format'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

// ─── Const ────────────────────────────────────────────────────────────────────
const TRIGGER_LABELS: Record<string, string> = {
    action_overdue:  'Plano em atraso',
    survey_opened:   'Pesquisa aberta',
    diagnosis_done:  'Diagnóstico concluído',
    contract_expiry: 'Contrato expirando',
}

const STATUS_ICON = {
    pending: <Clock size={14} className="text-amber-500" />,
    sent:    <CheckCircle2 size={14} className="text-emerald-500" />,
    failed:  <XCircle size={14} className="text-rose-500" />,
}

// ─── Settings Form ────────────────────────────────────────────────────────────
function OrgSettingsForm({ orgId, orgName }: { orgId: string; orgName: string }) {
    const { data: settings, isLoading } = useOrgSettings(orgId)
    const upsert = useUpsertOrgSettings()

    const [logoUrl,       setLogoUrl]       = useState('')
    const [color,         setColor]         = useState('#00A898')
    const [tagline,       setTagline]       = useState('')
    const [notifEmail,    setNotifEmail]    = useState('')
    const [notifOverdue,  setNotifOverdue]  = useState(true)
    const [notifSurvey,   setNotifSurvey]   = useState(true)
    const [notifDiag,     setNotifDiag]     = useState(true)
    const [notifContract, setNotifContract] = useState(true)
    const [invokingFn,    setInvokingFn]    = useState(false)

    // Preencher form quando settings carregam
    useEffect(() => {
        if (!settings) return
        setLogoUrl(settings.logo_url ?? '')
        setColor(settings.primary_color ?? '#00A898')
        setTagline(settings.company_tagline ?? '')
        setNotifEmail(settings.notification_email ?? '')
        setNotifOverdue(settings.email_notify_action_overdue)
        setNotifSurvey(settings.email_notify_survey_opened)
        setNotifDiag(settings.email_notify_diagnosis_done)
        setNotifContract(settings.email_notify_contract_expiry)
    }, [settings])

    function handleSave(e: React.FormEvent) {
        e.preventDefault()
        void upsert.mutateAsync({
            organizationId: orgId,
            payload: {
                logo_url:                    logoUrl || null,
                primary_color:               color,
                company_tagline:             tagline || null,
                notification_email:          notifEmail || null,
                email_notify_action_overdue: notifOverdue,
                email_notify_survey_opened:  notifSurvey,
                email_notify_diagnosis_done: notifDiag,
                email_notify_contract_expiry: notifContract,
            },
        })
    }

    async function handleTestEmail() {
        const email = notifEmail || prompt('Email de teste:')
        if (!email) return
        setInvokingFn(true)
        const testHtml = `<h2 style="color:#162136">Teste de Email — Gênesis 360Care</h2>
<p>Olá!</p><p>Este é um email de teste da plataforma Gênesis 360Care para confirmar que as notificações estão configuradas corretamente para <strong>${orgName}</strong>.</p>
<hr/><p style="font-size:11px;color:#6b7280">Gênesis 360Care — Portal NR-01</p>`

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any).from('email_queue').insert({
            organization_id: orgId,
            to_email:       email,
            subject:        `✅ Teste de email — ${orgName}`,
            body_html:      testHtml,
            trigger_event:  'test',
        })
        setInvokingFn(false)
        if (error) { toast.error('Erro ao enfileirar: ' + error.message); return }
        toast.success('Email de teste enfileirado! Acione a Edge Function para processar.')
    }

    if (isLoading) return <SectionLoader />

    return (
        <form onSubmit={handleSave} className="space-y-8">
            {/* ── Branding ── */}
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <div className="mb-5 flex items-center gap-2">
                    <Palette size={18} className="text-[#00A898]" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Identidade Visual</h3>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">URL do Logo</label>
                        <input
                            type="url"
                            value={logoUrl}
                            onChange={(e) => setLogoUrl(e.target.value)}
                            placeholder="https://empresa.com/logo.png"
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#00A898] focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                        />
                        {logoUrl && (
                            <div className="mt-2 flex items-center gap-2">
                                <img src={logoUrl} alt="preview" className="h-8 max-w-32 rounded object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display='none' }} />
                                <span className="text-xs text-gray-400">Prévia</span>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">Cor Primária</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="h-9 w-16 cursor-pointer rounded border border-gray-300 p-0.5"
                            />
                            <input
                                type="text"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                maxLength={7}
                                className="w-28 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-mono focus:border-[#00A898] focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                            />
                            <div className="h-9 w-9 rounded-full border border-gray-200" style={{ backgroundColor: color }} />
                        </div>
                    </div>

                    <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">Tagline / Slogan</label>
                        <input
                            type="text"
                            value={tagline}
                            onChange={(e) => setTagline(e.target.value)}
                            maxLength={120}
                            placeholder="Ex: Saúde e segurança no centro de tudo"
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#00A898] focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                        />
                    </div>
                </div>
            </section>

            {/* ── Email Notifications ── */}
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <div className="mb-5 flex items-center gap-2">
                    <Mail size={18} className="text-[#00A898]" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notificações por Email</h3>
                </div>

                <div className="mb-5">
                    <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">Email de notificação</label>
                    <input
                        type="email"
                        value={notifEmail}
                        onChange={(e) => setNotifEmail(e.target.value)}
                        placeholder="responsavel@empresa.com.br"
                        className="w-full max-w-sm rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#00A898] focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    />
                    <p className="mt-1 text-xs text-gray-400">Deixe vazio para usar o email do responsável da organização</p>
                </div>

                <div className="space-y-3">
                    {[
                        { key: 'overdue',  label: 'Planos de ação em atraso',       val: notifOverdue,  set: setNotifOverdue },
                        { key: 'survey',   label: 'Nova pesquisa de pulso ativada', val: notifSurvey,   set: setNotifSurvey },
                        { key: 'diag',     label: 'Diagnóstico concluído',          val: notifDiag,     set: setNotifDiag },
                        { key: 'contract', label: 'Contrato expirando (30 dias)',    val: notifContract, set: setNotifContract },
                    ].map(({ key, label, val, set }) => (
                        <label key={key} className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                            <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                            <button
                                type="button"
                                onClick={() => set(!val)}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${val ? 'bg-[#00A898]' : 'bg-gray-300'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${val ? 'translate-x-4' : 'translate-x-0.5'}`} />
                            </button>
                        </label>
                    ))}
                </div>

                <div className="mt-4 flex gap-2">
                    <button
                        type="button"
                        onClick={() => void handleTestEmail()}
                        disabled={invokingFn}
                        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    >
                        <Send size={14} /> Enfileirar email de teste
                    </button>
                </div>
            </section>

            {/* ── Save btn ── */}
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={upsert.isPending}
                    className="flex items-center gap-2 rounded-lg bg-[#162136] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#1E2F4A] disabled:opacity-50"
                >
                    {upsert.isPending ? <RefreshCw size={14} className="animate-spin" /> : <Settings size={14} />}
                    Salvar configurações
                </button>
            </div>
        </form>
    )
}

// ─── Email Queue Table ────────────────────────────────────────────────────────
function EmailQueueTable() {
    const { data: emails, isLoading, refetch } = useEmailQueue()
    const retry = useRetryEmailQueue()

    if (isLoading) return <SectionLoader />

    const stats = {
        pending: emails?.filter((e) => e.status === 'pending').length ?? 0,
        sent:    emails?.filter((e) => e.status === 'sent').length ?? 0,
        failed:  emails?.filter((e) => e.status === 'failed').length ?? 0,
    }

    return (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Mail size={18} className="text-[#00A898]" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Fila de Emails</h3>
                </div>
                <div className="flex items-center gap-4 text-xs">
                    <span className="text-amber-600">{stats.pending} pendente{stats.pending !== 1 ? 's' : ''}</span>
                    <span className="text-emerald-600">{stats.sent} enviado{stats.sent !== 1 ? 's' : ''}</span>
                    <span className="text-rose-600">{stats.failed} falha{stats.failed !== 1 ? 's' : ''}</span>
                    <button onClick={() => refetch()} className="rounded p-1 text-gray-400 hover:text-gray-600"><RefreshCw size={14} /></button>
                </div>
            </div>

            {!emails || emails.length === 0 ? (
                <p className="text-center text-xs text-gray-400 py-6">Nenhum email na fila</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-gray-100 text-gray-500 dark:border-gray-700">
                                {['Status', 'Destinatário', 'Assunto', 'Evento', 'Tentativas', 'Agendado', 'Ação'].map((h) => (
                                    <th key={h} className="py-2 pr-4 font-medium">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {emails.map((e) => (
                                <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50">
                                    <td className="py-2 pr-4">
                                        <div className="flex items-center gap-1">
                                            {STATUS_ICON[e.status]}
                                            <span className="capitalize">{e.status}</span>
                                        </div>
                                    </td>
                                    <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">
                                        {e.to_name ? <span>{e.to_name}<br /></span> : null}
                                        <span className="text-gray-400">{e.to_email}</span>
                                    </td>
                                    <td className="py-2 pr-4 max-w-xs truncate text-gray-700 dark:text-gray-300">{e.subject}</td>
                                    <td className="py-2 pr-4 text-gray-500">{TRIGGER_LABELS[e.trigger_event] ?? e.trigger_event}</td>
                                    <td className="py-2 pr-4 text-center text-gray-500">{e.attempts}</td>
                                    <td className="py-2 pr-4 text-gray-500">{formatDateTime(e.scheduled_at)}</td>
                                    <td className="py-2">
                                        {e.status === 'failed' && (
                                            <button
                                                onClick={() => void retry.mutateAsync(e.id)}
                                                disabled={retry.isPending}
                                                className="rounded px-2 py-0.5 text-[#00A898] hover:bg-teal-50 disabled:opacity-40"
                                            >
                                                Retentar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <p className="mt-3 text-xs text-gray-400">
                Para processar a fila: <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">supabase functions invoke send-email</code>
            </p>
        </section>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function OrgSettingsPage() {
    const { data: orgs } = useOrganizations()
    const [selectedOrgId, setSelectedOrgId] = useState('')
    const [activeTab, setActiveTab] = useState<'settings' | 'queue'>('settings')

    const selectedOrg = orgs?.find((o) => o.id === selectedOrgId)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações por Organização</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Branding personalizado, preferências de notificação e fila de emails.
                </p>
            </div>

            {/* Org selector */}
            <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Organização:</label>
                <select
                    value={selectedOrgId}
                    onChange={(e) => setSelectedOrgId(e.target.value)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#00A898] focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                >
                    <option value="">Selecione…</option>
                    {(orgs ?? []).map((o) => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                </select>
            </div>

            {selectedOrgId ? (
                <>
                    {/* Tabs */}
                    <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800 w-fit">
                        {(['settings', 'queue'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                                    activeTab === tab
                                        ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                                }`}
                            >
                                {tab === 'settings' ? '⚙️ Configurações' : '📧 Fila de Emails'}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'settings' && (
                        <OrgSettingsForm orgId={selectedOrgId} orgName={selectedOrg?.name ?? ''} />
                    )}
                    {activeTab === 'queue' && <EmailQueueTable />}
                </>
            ) : (
                <div className="flex h-40 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400 dark:border-gray-700">
                    Selecione uma organização para gerenciar suas configurações
                </div>
            )}
        </div>
    )
}
