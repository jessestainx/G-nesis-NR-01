import { useState, type FormEvent } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { ErrorMessage } from "@/components/ui/ErrorMessage"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { ShieldCheck, Building2, User } from "lucide-react"

type Role = "consultor" | "empresa" | "colaborador"

const ROLE_TABS: { id: Role; label: string; icon: typeof ShieldCheck; description: string }[] = [
    { id: "consultor", label: "Consultor", icon: ShieldCheck, description: "Gestão corporativa de múltiplos clientes, auditorias e relatórios executivos." },
    { id: "empresa", label: "Empresa", icon: Building2, description: "Acesse os diagnósticos, planos de ação e indicadores da sua organização." },
    { id: "colaborador", label: "Colaborador", icon: User, description: "Participe das pesquisas de bem-estar e acompanhe suas atividades." },
]

export function LoginPage() {
    const { signIn, isAuthenticated, isLoading } = useAuth()
    const location = useLocation()
    const from = (location.state as { from?: Location })?.from?.pathname ?? "/app"

    const [activeTab, setActiveTab] = useState<Role>("consultor")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [forgotLoading, setForgotLoading] = useState(false)

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#162136]">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    if (isAuthenticated) {
        return <Navigate to={from} replace />
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        setError(null)
        setSuccess(null)
        setSubmitting(true)
        const { error: authError } = await signIn(email, password)
        if (authError) setError(authError)
        setSubmitting(false)
    }

    async function handleForgotPassword() {
        if (!email.trim()) {
            setError('Digite seu e-mail acima para recuperar a senha.')
            return
        }
        setError(null)
        setSuccess(null)
        setForgotLoading(true)
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: `${window.location.origin}/profile`,
        })
        setForgotLoading(false)
        if (resetError) {
            setError(resetError.message)
        } else {
            setSuccess('E-mail de recuperação enviado! Verifique sua caixa de entrada.')
        }
    }

    const active = ROLE_TABS.find((t) => t.id === activeTab)!

    return (
        <div className="flex min-h-screen">
            {/* Left: brand panel */}
            <div className="hidden lg:flex flex-col justify-between w-[45%] bg-[#162136] px-12 py-12">
                <div>
                    <div className="flex items-center gap-3 mb-12">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00A898]/20 border border-[#00A898]/40">
                            <span className="text-sm font-bold text-[#00A898]">GN</span>
                        </div>
                        <div>
                            <p className="text-white font-bold text-base leading-tight">GÊNESIS</p>
                            <p className="text-[#00A898] text-[10px] tracking-widest">NR-01 PLATFORM</p>
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold text-white leading-tight mb-4">
                        Gestão Inteligente de<br />
                        <span className="text-[#00A898]">Riscos Psicossociais</span>
                    </h1>
                    <p className="text-[#8BA5C4] text-base leading-relaxed mb-10">
                        Plataforma corporativa completa para conformidade com a NR-01, promovendo saúde, segurança e bem-estar no ambiente de trabalho.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        {["Visão Sistêmica", "Monitoramento Contínuo", "360° Care"].map((item) => (
                            <div key={item} className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-[#00A898]" />
                                <span className="text-sm text-[#8BA5C4]">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <p className="text-xs text-[#4E6B8C]">Ambiente seguro, 100% aderente à LGPD</p>
            </div>

            {/* Right: login card */}
            <div className="flex flex-1 items-center justify-center bg-gray-50 px-6 py-12">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="flex items-center gap-3 mb-8 lg:hidden">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#162136]">
                            <span className="text-sm font-bold text-[#00A898]">GN</span>
                        </div>
                        <p className="font-bold text-gray-900">Gênesis NR-01</p>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Bem-vindo ao Gênesis</h2>
                    <p className="text-sm text-gray-500 mb-6">Acesse sua área restrita selecionando seu perfil</p>

                    {/* Role tabs */}
                    <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
                        {ROLE_TABS.map((tab) => {
                            const Icon = tab.icon
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition-colors ${
                                        activeTab === tab.id
                                            ? "bg-[#162136] text-white shadow"
                                            : "text-gray-500 hover:text-gray-700"
                                    }`}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                    {tab.label}
                                </button>
                            )
                        })}
                    </div>

                    {/* Role description */}
                    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <active.icon className="h-4 w-4 text-[#00A898]" />
                            <span className="text-sm font-semibold text-gray-800">Acesso {active.label}</span>
                        </div>
                        <p className="text-xs text-gray-500">{active.description}</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                E-mail Corporativo
                            </label>
                            <input
                                id="email" type="email" autoComplete="email" required
                                placeholder="consultor@genesis.com"
                                value={email} onChange={(e) => setEmail(e.target.value)}
                                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-[#00A898] focus:outline-none focus:ring-1 focus:ring-[#00A898]"
                            />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Senha</label>
                                <button
                                    type="button"
                                    onClick={() => void handleForgotPassword()}
                                    disabled={forgotLoading}
                                    className="text-xs text-[#00A898] hover:underline disabled:opacity-50"
                                >
                                    {forgotLoading ? 'Enviando…' : 'Esqueceu a senha?'}
                                </button>
                            </div>
                            <input
                                id="password" type="password" autoComplete="current-password" required
                                value={password} onChange={(e) => setPassword(e.target.value)}
                                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#00A898] focus:outline-none focus:ring-1 focus:ring-[#00A898]"
                            />
                        </div>
                        {error && <ErrorMessage message={error} />}
                        {success && (
                            <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 border border-green-200">
                                {success}
                            </p>
                        )}
                        <button
                            type="submit" disabled={submitting}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#162136] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1E2F4A] disabled:opacity-50"
                        >
                            {submitting && <LoadingSpinner size="sm" />}
                            Acessar Plataforma
                        </button>
                    </form>

                    <p className="mt-6 text-center text-xs text-gray-400">Ambiente seguro, protegido por criptografia e 100% aderente à LGPD</p>
                </div>
            </div>
        </div>
    )
}
