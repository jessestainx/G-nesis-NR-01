import { useAuth } from '@/hooks/useAuth'
import { useDocuments } from '@/hooks/queries/useDocuments'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { formatDate, formatFileSize } from '@/utils/format'
import { FileText } from 'lucide-react'
import type { Document as OrgDocument } from '@/types'

function DocRow({ doc }: { doc: OrgDocument }) {
    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{doc.name}</span>
                </div>
            </td>
            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{doc.type}</td>
            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                {formatFileSize(doc.size_bytes)}
            </td>
            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                {formatDate(doc.created_at)}
            </td>
        </tr>
    )
}

export function ClientDocumentsPage() {
    const { profile } = useAuth()
    const orgId = profile?.organization_id ?? ''
    const { data: docs, isLoading, error, refetch } = useDocuments(orgId)

    if (isLoading) return <SectionLoader />
    if (error) return <ErrorMessage message="Erro ao carregar documentos" onRetry={refetch} />

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Documentos</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Documentos e arquivos da sua organização.
                </p>
            </div>

            {!docs || docs.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
                    <FileText className="mx-auto mb-3 h-8 w-8 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Nenhum documento disponível.
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                    Documento
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                    Tipo
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                    Tamanho
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                                    Data
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {docs.map((doc) => (
                                <DocRow key={doc.id} doc={doc} />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
