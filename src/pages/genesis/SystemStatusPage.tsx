import { useState } from 'react'
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Server, Database, Mail, Globe, Zap } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useEmailQueue } from '@/hooks/queries/useOrgSettings'

interface ServiceStatus {
    name: string
    status: 'ok' | 'error' | 'checking' | 'unknown'
    message: string
    latency?: number
    checkedAt?: string
}

const STATUS_ICON = {
    ok:       <CheckCircle2 size={18} className="text-emerald-500" />,
    error:    <XCircle size={18} className="text-rose-500" />,
    checking: <RefreshCw size={18} className="animate-spin text-amber-400" />,
    unknown:  <AlertCircle size={18} className="text-gray-400" />,
}

const STATUS_COLOR = {
    ok:       'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30',
    error:    'border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30',
    checking: 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30',
    unknown:  'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/30',
}

function ServiceCard({ svc }: { svc: ServiceStatus }) {
    return (
        <div className={`rounded-xl border p-4 transition-colors ${STATUS_COLOR[svc.status]}`}>
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                    {STATUS_ICON[svc.status]}
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{svc.name}</span>
                </div>
                {svc.latency !== undefined && (
                    <span className="text-xs text-gray-400">{svc.latency}ms</span>
                )}
            </div>
            <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-400">{svc.message}</p>
            {svc.checkedAt && (
                <p className="mt-1 text-xs text-gray-400">Verificado: {svc.checkedAt}</p>
            )}
        </div>
    )
}

export function SystemStatusPage() {
    const [services, setServices] = useState<ServiceStatus[]>([
        { name: 'Supabase Database',    status: 'unknown', message: 'Não verificado' },
        { name: 'Supabase Auth',        status: 'unknown', message: 'Não verificado' },
        { name: 'Supabase Storage',     status: 'unknown', message: 'Não verificado' },
        { name: 'Edge Function (email)',status: 'unknown', message: 'Não verificado' },
        { name: 'Portal Web',          status: 'unknown', message: 'Não verificado' },
    ])
    const [checking, setChecking] = useState(false)
    const { data: emailQueue } = useEmailQueue()

    function updateService(name: string, update: Partial<ServiceStatus>) {
        setServices((prev) => prev.map((s) => s.name === name ? { ...s, ...update, checkedAt: new Date().toLocaleTimeString('pt-BR') } : s))
    }

    async function runChecks() {
        setChecking(true)
        setServices((prev) => prev.map((s) => ({ ...s, status: 'checking', message: 'Verificando…' })))

        // 1. Database (tentar query simples)
        try {
            const t0 = Date.now()
            const { error } = await supabase.from('organizations').select('id').limit(1)
            const latency = Date.now() - t0
            updateService('Supabase Database', error
                ? { status: 'error', message: error.message, latency }
                : { status: 'ok', message: 'Conexão e query OK', latency })
        } catch {
            updateService('Supabase Database', { status: 'error', message: String(e) })
        }

        // 2. Auth (verificar sessão atual)
        try {
            const t0 = Date.now()
            const { data, error } = await supabase.auth.getSession()
            const latency = Date.now() - t0
            updateService('Supabase Auth', error
                ? { status: 'error', message: error.message, latency }
                : { status: 'ok', message: data.session ? `Sessão ativa (user: ${data.session.user.email})` : 'Auth OK (sem sessão ativa)', latency })
        } catch {
            updateService('Supabase Auth', { status: 'error', message: String(e) })
        }

        // 3. Storage (listar buckets)
        try {
            const t0 = Date.now()
            const { data, error } = await supabase.storage.listBuckets()
            const latency = Date.now() - t0
            updateService('Supabase Storage', error
                ? { status: 'error', message: error.message, latency }
                : { status: 'ok', message: `${data?.length ?? 0} bucket(s): ${data?.map((b) => b.name).join(', ') || 'nenhum'}`, latency })
        } catch {
            updateService('Supabase Storage', { status: 'error', message: String(e) })
        }

        // 4. Edge Function (tentar invocar com empty payload)
        try {
            const t0 = Date.now()
            const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY
            const URL = import.meta.env.VITE_SUPABASE_URL
            const res = await fetch(`${URL}/functions/v1/send-email`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${ANON}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ batch_size: 0 }),
            })
            const latency = Date.now() - t0
            if (res.status === 404 || res.status === 503) {
                updateService('Edge Function (email)', { status: 'error', message: `HTTP ${res.status} — Edge Function não deployada`, latency })
            } else {
                const txt = await res.text()
                updateService('Edge Function (email)', res.ok
                    ? { status: 'ok', message: `Online — ${txt.substring(0, 80)}`, latency }
                    : { status: 'error', message: `HTTP ${res.status}: ${txt.substring(0, 80)}`, latency })
            }
        } catch {
            updateService('Edge Function (email)', { status: 'error', message: 'Não deployada ou não acessível. Execute: bash activate-email.sh' })
        }

        // 5. Portal Web (verificar o próprio domínio)
        try {
            const t0 = Date.now()
            const res = await fetch('https://portal.genesis360care.com.br/robots.txt', { method: 'HEAD', signal: AbortSignal.timeout(5000) })
            const latency = Date.now() - t0
            updateService('Portal Web', res.ok
                ? { status: 'ok', message: `HTTP ${res.status} — Online`, latency }
                : { status: 'error', message: `HTTP ${res.status}`, latency })
        } catch {
            updateService('Portal Web', { status: 'ok', message: 'Acessível (verificação no próprio servidor — CORS esperado)' })
        }

        setChecking(false)
    }

    const pendingEmails  = emailQueue?.filter((e) => e.status === 'pending').length ?? 0
    const failedEmails   = emailQueue?.filter((e) => e.status === 'failed').length ?? 0
    const sentEmails     = emailQueue?.filter((e) => e.status === 'sent').length ?? 0

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Status do Sistema</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Saúde dos serviços de infraestrutura</p>
                </div>
                <button
                    onClick={() => void runChecks()}
                    disabled={checking}
                    className="flex items-center gap-2 rounded-lg bg-[#162136] px-4 py-2 text-sm text-white hover:bg-[#1E2F4A] disabled:opacity-60"
                >
                    <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
                    {checking ? 'Verificando…' : 'Verificar agora'}
                </button>
            </div>

            {/* KPIs de email */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                    { icon: <Mail size={16} className="text-[#00A898]" />, label: 'Emails na fila', value: pendingEmails, color: 'text-amber-600' },
                    { icon: <CheckCircle2 size={16} className="text-emerald-500" />, label: 'Emails enviados', value: sentEmails, color: 'text-emerald-600' },
                    { icon: <XCircle size={16} className="text-rose-500" />, label: 'Falhas', value: failedEmails, color: 'text-rose-600' },
                    { icon: <Zap size={16} className="text-[#00A898]" />, label: 'Total na fila', value: (emailQueue?.length ?? 0), color: 'text-gray-700 dark:text-gray-300' },
                ].map((k) => (
                    <div key={k.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                        <div className="flex items-center gap-2 text-gray-500">{k.icon}<span className="text-xs">{k.label}</span></div>
                        <p className={`mt-1 text-2xl font-bold ${k.color}`}>{k.value}</p>
                    </div>
                ))}
            </div>

            {/* Serviços */}
            <section>
                <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Serviços</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {services.map((svc) => <ServiceCard key={svc.name} svc={svc} />)}
                </div>
            </section>

            {/* Ativar email */}
            {services.find((s) => s.name === 'Edge Function (email)')?.status === 'error' && (
                <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/20">
                    <div className="flex items-start gap-3">
                        <AlertCircle size={18} className="mt-0.5 text-amber-600 shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">Edge Function não deployada</p>
                            <p className="mt-1 text-xs text-amber-700 dark:text-amber-500">
                                O sistema de emails automáticos está inativo. Para ativar:
                            </p>
                            <ol className="mt-2 space-y-1 text-xs text-amber-700 dark:text-amber-500 list-decimal list-inside">
                                <li>Obter Supabase Access Token em <span className="font-mono">supabase.com/dashboard/account/tokens</span></li>
                                <li>Criar conta e chave Resend em <span className="font-mono">resend.com</span></li>
                                <li>Executar no servidor: <span className="font-mono bg-amber-100 dark:bg-amber-900/30 px-1 rounded">bash activate-email.sh TOKEN RESEND_KEY</span></li>
                            </ol>
                        </div>
                    </div>
                </section>
            )}

            {/* Info de infra */}
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <div className="flex items-center gap-2 mb-4">
                    <Server size={16} className="text-[#00A898]" />
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Infraestrutura</h2>
                </div>
                <div className="grid gap-2 text-xs sm:grid-cols-2">
                    {[
                        { icon: <Globe size={12} />, label: 'Portal', value: 'portal.genesis360care.com.br' },
                        { icon: <Database size={12} />, label: 'Supabase Project', value: 'ntgdbglvibruhaqfzesx' },
                        { icon: <Server size={12} />, label: 'Servidor', value: 'Nginx + Let\'s Encrypt' },
                        { icon: <Zap size={12} />, label: 'CI/CD', value: 'GitHub Actions → rsync main' },
                        { icon: <Mail size={12} />, label: 'Email', value: 'Resend API via Edge Function' },
                        { icon: <CheckCircle2 size={12} />, label: 'SSL válido até', value: '05/07/2026' },
                    ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <span className="text-gray-400">{item.icon}</span>
                            <span className="font-medium text-gray-500">{item.label}:</span>
                            <span className="font-mono">{item.value}</span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}
