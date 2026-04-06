import type { FinancialTransaction } from '@/types'
import {
    useFinanceSummary,
    useFinanceTransactions,
} from '@/hooks/queries/useFinance'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { formatDate, formatCurrency } from '@/utils/format'

const typeLabel: Record<FinancialTransaction['type'], string> = {
    revenue: 'Receita',
    expense: 'Despesa',
    commission: 'Comissão',
}

const typeColor: Record<FinancialTransaction['type'], string> = {
    revenue: 'text-green-600',
    expense: 'text-red-600',
    commission: 'text-blue-600',
}

function currentMonthRange(): { from: string; to: string } {
    const now = new Date()
    const from = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .slice(0, 10)
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .slice(0, 10)
    return { from, to }
}

const { from, to } = currentMonthRange()

function SummaryCards() {
    const { data: summary, isLoading, error } = useFinanceSummary(from, to)

    if (isLoading) return <SectionLoader />
    if (error ?? summary?.error) return null

    const cards = [
        { label: 'Receitas', value: summary?.revenue ?? 0, color: 'text-green-600' },
        { label: 'Despesas', value: summary?.expenses ?? 0, color: 'text-red-600' },
        { label: 'Comissões', value: summary?.commissions ?? 0, color: 'text-blue-600' },
        { label: 'Resultado', value: summary?.net ?? 0, color: (summary?.net ?? 0) >= 0 ? 'text-green-700' : 'text-red-700' },
    ]

    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {cards.map(({ label, value, color }) => (
                <div key={label} className="rounded-lg border border-gray-200 bg-white p-4">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className={`mt-1 text-lg font-bold ${color}`}>{formatCurrency(value)}</p>
                </div>
            ))}
        </div>
    )
}

function TransactionRow({ tx }: { tx: FinancialTransaction }) {
    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50">
            <td className="px-4 py-3 text-sm text-gray-600">{formatDate(tx.reference_date)}</td>
            <td className="px-4 py-3 text-sm font-medium text-gray-900">{tx.description}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{tx.category ?? '—'}</td>
            <td className="px-4 py-3">
                <span className={`text-xs font-medium ${typeColor[tx.type]}`}>
                    {typeLabel[tx.type]}
                </span>
            </td>
            <td className={`px-4 py-3 text-sm font-semibold ${typeColor[tx.type]}`}>
                {tx.type === 'expense' ? '-' : '+'}{formatCurrency(tx.amount)}
            </td>
        </tr>
    )
}

function TransactionsTable() {
    const { data: txs, isLoading, error, refetch } = useFinanceTransactions(from, to)

    if (isLoading) return <SectionLoader />
    if (error) return <ErrorMessage message={error instanceof Error ? error.message : 'Erro'} onRetry={() => void refetch()} />

    return (
        <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-4 py-3">
                <h2 className="text-base font-semibold text-gray-800">Transações do mês</h2>
                <p className="text-xs text-gray-400">{from} → {to}</p>
            </div>
            {!txs || txs.length === 0 ? (
                <p className="px-4 py-6 text-sm text-gray-500">Nenhuma transação no período.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-4 py-2">Data</th>
                                <th className="px-4 py-2">Descrição</th>
                                <th className="px-4 py-2">Categoria</th>
                                <th className="px-4 py-2">Tipo</th>
                                <th className="px-4 py-2">Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {txs.map((tx) => <TransactionRow key={tx.id} tx={tx} />)}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

export function FinancePage() {
    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
                <p className="mt-1 text-sm text-gray-500">Resumo e transações do mês atual</p>
            </div>
            <SummaryCards />
            <TransactionsTable />
        </div>
    )
}
