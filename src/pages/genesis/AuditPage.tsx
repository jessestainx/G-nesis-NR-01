import { useState, useMemo } from 'react'
import type { AuditLog } from '@/types'
import { useAllAuditLogs } from '@/hooks/queries/useAudit'
import { usePagination } from '@/hooks/usePagination'
import { Pagination } from '@/components/ui/Pagination'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { formatDateTime } from '@/utils/format'
import { Search, RefreshCw, ShieldCheck, Download } from 'lucide-react'
import Papa from 'papaparse'
import { EmptyState } from '@/components/ui/EmptyState'

const ENTITY_TYPES = [
    'organizations',
    'profiles',
    'diagnoses',
    'action_plans',
    'pulse_surveys',
    'trainings',
    'documents',
    'crm_contacts',
    'contracts',
]

function AuditRow({ log }: { log: AuditLog }) {
    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50">
            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {formatDateTime(log.created_at)}
            </td>
            <td className="px-4 py-3">
                <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                    {log.action}
                </code>
            </td>
            <td className="px-4 py-3">
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    {log.entity_type ?? '—'}
                </span>
            </td>
            <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 font-mono">
                {log.entity_id ? log.entity_id.slice(0, 8) + '…' : '—'}
            </td>
            <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 font-mono">
                {log.user_id ? log.user_id.slice(0, 8) + '…' : '—'}
            </td>
            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                {log.metadata ? (
                    <code className="text-xs">
                        {JSON.stringify(log.metadata).slice(0, 80)}
                        {JSON.stringify(log.metadata).length > 80 ? '…' : ''}
                    </code>
                ) : '—'}
            </td>
        </tr>
    )
}

export function AuditPage() {
    const [entityFilter, setEntityFilter] = useState('')
    const [search, setSearch] = useState('')
    const { data: logs, isLoading, error, refetch } = useAllAuditLogs()

    const filtered = useMemo(() => {
        if (!logs) return []
        return logs.filter((log) => {
            const matchesEntity = entityFilter ? log.entity_type === entityFilter : true
            const matchesSearch = search
                ? log.action?.toLowerCase().includes(search.toLowerCase()) ||
                  log.entity_id?.toLowerCase().includes(search.toLowerCase()) ||
                  log.user_id?.toLowerCase().includes(search.toLowerCase())
                : true
            return matchesEntity && matchesSearch
        })
    }, [logs, entityFilter, search])

    const { paged, page, goTo } = usePagination(filtered, 20)

    function exportLogsCSV() {
        const rows = filtered.map((log) => ({
            Data: log.created_at,
            Ação: log.action,
            Entidade: log.entity_type ?? '',
            'ID Entidade': log.entity_id ?? '',
            'ID Usuário': log.user_id ?? '',
            Metadados: log.metadata ? JSON.stringify(log.metadata) : '',
        }))
        const csv = Papa.unparse(rows)
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `auditoria_${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Auditoria</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Histórico de todas as ações do sistema
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {filtered.length > 0 && (
                        <button
                            onClick={exportLogsCSV}
                            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            <Download className="h-3.5 w-3.5" />
                            Exportar CSV
                        </button>
                    )}
                    <button
                        onClick={() => void refetch()}
                        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Atualizar
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por ação, ID de entidade ou usuário…"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); goTo(1) }}
                        className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                </div>
                <select
                    value={entityFilter}
                    onChange={(e) => { setEntityFilter(e.target.value); goTo(1) }}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                    <option value="">Todos os tipos</option>
                    {ENTITY_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                    ))}
                </select>
            </div>

            {/* Tabela */}
            {isLoading ? (
                <SectionLoader />
            ) : error ? (
                <ErrorMessage
                    message={error instanceof Error ? error.message : 'Erro ao carregar logs'}
                    onRetry={() => void refetch()}
                />
            ) : (
                <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                    <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                        <p className="text-xs text-gray-400">
                            {filtered.length} registro{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    {filtered.length === 0 ? (
                        <div className="p-4"><EmptyState icon={ShieldCheck} title="Nenhum log encontrado para este filtro" description="Ajuste os filtros ou aguarde novas atividades." /></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                    <tr>
                                        <th className="px-4 py-2">Data/Hora</th>
                                        <th className="px-4 py-2">Ação</th>
                                        <th className="px-4 py-2">Tipo</th>
                                        <th className="px-4 py-2">ID Entidade</th>
                                        <th className="px-4 py-2">ID Usuário</th>
                                        <th className="px-4 py-2">Dados</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paged.map((log) => <AuditRow key={log.id} log={log} />)}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <Pagination page={page} pageSize={20} total={filtered.length} onPageChange={goTo} />
                </div>
            )}
        </div>
    )
}
