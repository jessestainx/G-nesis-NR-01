import type { ComponentType } from 'react'
import { Shield, Lock, Eye, Database } from 'lucide-react'

interface PrivacyItemProps {
    icon: ComponentType<{ className?: string }>
    title: string
    description: string
}

function PrivacyItem({ icon: Icon, title, description }: PrivacyItemProps) {
    return (
        <div className="flex gap-4">
            <div className="h-fit shrink-0 rounded-lg bg-indigo-100 p-2.5 dark:bg-indigo-950">
                <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{description}</p>
            </div>
        </div>
    )
}

export function CollaboratorPrivacyPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Privacidade e Anonimato
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Entenda como protegemos seus dados e garantimos o anonimato das pesquisas.
                </p>
            </div>

            <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                <PrivacyItem
                    icon={Shield}
                    title="Respostas completamente anônimas"
                    description="Nenhuma resposta individual é identificada. Apenas resultados agregados por grupo ou departamento são compartilhados com sua empresa."
                />
                <PrivacyItem
                    icon={Lock}
                    title="Dados criptografados"
                    description="Todas as suas informações são armazenadas com criptografia e nunca são acessadas sem autorização."
                />
                <PrivacyItem
                    icon={Eye}
                    title="O que sua empresa vê"
                    description="Sua empresa tem acesso apenas a médias e tendências de grupos com mais de 5 respondentes. Respostas individuais são inacessíveis."
                />
                <PrivacyItem
                    icon={Database}
                    title="Seus direitos (LGPD)"
                    description="Você tem o direito de solicitar a exclusão de suas respostas a qualquer momento. Entre em contato com o RH da sua empresa ou com a Gênesis."
                />
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
                <p className="text-sm text-amber-800 dark:text-amber-300">
                    <span className="font-semibold">Dúvidas sobre privacidade?</span> Entre em contato
                    com a equipe Gênesis pelo e-mail{' '}
                    <a
                        href="mailto:privacidade@genesis360care.com.br"
                        className="underline hover:no-underline"
                    >
                        privacidade@genesis360care.com.br
                    </a>
                    .
                </p>
            </div>
        </div>
    )
}
