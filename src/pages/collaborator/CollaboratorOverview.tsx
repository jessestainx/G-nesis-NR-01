import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useOrganization } from '@/hooks/queries/useOrganizations'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { Shield, ClipboardCheck, Lock } from 'lucide-react'

export function CollaboratorOverview() {
    const { profile } = useAuth()
    const orgId = profile?.organization_id ?? ''
    const orgQuery = useOrganization(orgId)

    if (orgQuery.isLoading) return <SectionLoader />

    const org = orgQuery.data

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Olá, {profile?.name ?? 'Colaborador'}!
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Bem-vindo ao Portal de Saúde Ocupacional
                    {org ? ` — ${org.name}` : ''}.
                </p>
            </div>

            {/* Privacy notice */}
            <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-900 dark:bg-indigo-950/40">
                <div className="flex items-start gap-3">
                    <Shield className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
                    <div>
                        <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">
                            Sua privacidade está protegida
                        </p>
                        <p className="mt-1 text-sm text-indigo-700 dark:text-indigo-300">
                            Suas respostas nas pesquisas são completamente anônimas. A Gênesis e sua empresa
                            só têm acesso a dados agregados — nunca a respostas individuais.
                        </p>
                    </div>
                </div>
            </div>

            {/* Status cards */}
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                    <p className="mt-1 text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                        Ativo
                    </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Empresa</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                        {org?.name ?? '—'}
                    </p>
                </div>
            </div>

            {/* Quick links */}
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
                    Ações disponíveis
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                    <Link
                        to="/dashboard/collaborator/survey"
                        className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-indigo-400 hover:bg-indigo-50 dark:border-gray-700 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/30"
                    >
                        <ClipboardCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                Pesquisa de pulso
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Responder pesquisa ativa
                            </p>
                        </div>
                    </Link>
                    <Link
                        to="/dashboard/collaborator/privacy"
                        className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-indigo-400 hover:bg-indigo-50 dark:border-gray-700 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/30"
                    >
                        <Lock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                Privacidade e anonimato
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Como seus dados são protegidos
                            </p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    )
}
