import { ClipboardCheck } from 'lucide-react'

export function CollaboratorSurveyPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Pesquisa de Pulso
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Responda às pesquisas de bem-estar e clima organizacional. Suas respostas são
                    completamente anônimas.
                </p>
            </div>

            <div className="rounded-lg border border-dashed border-gray-300 p-16 text-center dark:border-gray-700">
                <ClipboardCheck className="mx-auto mb-4 h-10 w-10 text-gray-300 dark:text-gray-600" />
                <p className="text-base font-medium text-gray-700 dark:text-gray-300">
                    Nenhuma pesquisa ativa no momento
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Quando uma nova pesquisa for disponibilizada, ela aparecerá aqui.
                </p>
            </div>
        </div>
    )
}
