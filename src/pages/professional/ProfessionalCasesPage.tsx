import { ShieldAlert } from 'lucide-react'

export function ProfessionalCasesPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Casos Sensíveis — GenesisCare
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Acompanhamento individualizado e sigiloso de colaboradores em situação de
                    vulnerabilidade psicossocial.
                </p>
            </div>

            <div className="rounded-lg border border-dashed border-gray-300 p-16 text-center dark:border-gray-700">
                <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-gray-300 dark:text-gray-600" />
                <p className="text-base font-medium text-gray-700 dark:text-gray-300">
                    Módulo GenesisCare em breve
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Esta funcionalidade estará disponível em uma próxima versão.
                </p>
            </div>
        </div>
    )
}
