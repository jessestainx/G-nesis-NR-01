import type { AuditLog } from '@/types'
import { useMyAuditLogs } from '@/hooks/queries/useAudit'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { formatDateTime } from '@/utils/format'

function AuditRow({ log }: { log: AuditLog }) {
    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50">
            <td className="px-4 py-3 text-sm text-gray-500">{formatDateTime(log.created_at)}</td>
            <td className="px-4 py-3">
                <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">
                    {log.action}
                </code>
            </td>
            <td className="px-4 py-3 text-sm text-gray-600">{log.entity_type}</td>
            <td className="px-4 py-3 text-sm text-gray-500 font-mono text-xs">
                {log.entity_id ? log.entity_id.slice(0, 8) + '…' : '—'}
            </td>
            <td className="px-4 py-3 text-sm text-gray-500">
                {log.metadata ? (
                    <code className="text-xs text-gray-500">
                        {JSON.stringify(log.metadata).slice(0, 60)}
                        {JSON.stringify(log.metadata).length > 60 ? '…' : ''}
                    </code>
                ) : '—'}
            </td>
        </tr>
    )
}

function AuditTable() {
    const { data: logs, isLoading, error, refetch } = useMyAuditLogs()

    if (isLoading) return <SectionLoader />
    if (error) {
        return (
            <ErrorMessage
                message={error instanceof Error ? error.message : 'Erro ao carregar logs'}
                onRetry={() => void refetch()}
            />
        )
    }

    return (
        <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-4 py-3">
                <h2 className="text-base font-semibold text-gray-800">Log de Atividades</h2>
                <p className="text-xs text-gray-400">Últimas {logs?.length ?? 0} ações registradas</p>
            </div>
            {!logs || logs.length === 0 ? (
                <p className="px-4 py-6 text-sm text-gray-500">Nenhuma atividade registrada.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-4 py-2">Data/Hora</th>
                                <th className="px-4 py-2">Ação</th>
                                <th className="px-4 py-2">Entidade</th>
                                <th className="px-4 py-2">ID</th>
                                <th className="px-4 py-2">Dados</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => <AuditRow key={log.id} log={log} />)}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

export function AuditPage() {
    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Auditoria</h1>
                <p className="mt-1 text-sm text-gray-500">Histórico de ações do sistema</p>
            </div>
            <AuditTable />
        </div>
    )
}
