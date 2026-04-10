import { useState } from 'react'
import { Plus, X, DollarSign } from 'lucide-react'
import type { FinancialTransaction } from '@/types'
import {
    useFinanceSummary,
    useFinanceTransactions,
    useCreateTransaction,
} from '@/hooks/queries/useFinance'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
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

function monthRange(year: number, month: number) {
    const from = new Date(year, month, 1).toISOString().slice(0, 10)
    const to = new Date(year, month + 1, 0).toISOString().slice(0, 10)
    return { from, to }
}

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

// ─── Modal nova transação ─────────────────────────────────────────────────────

interface NewTxModalProps { onClose: () => void; from: string; to: string }

function NewTxModal({ onClose }: NewTxModalProps) {
    const create = useCreateTransaction()
    const [form, setForm] = useState({
        description: '',
        amount: '',
        type: 'revenue' as FinancialTransaction['type'],
        category: '',
        reference_date: new Date().toISOString().slice(0, 10),
    })
    const [fieldError, setFieldError] = useState<string | null>(null)

    function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
        setForm((f) => ({ ...f, [k]: v }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!form.description.trim()) { setFieldError('Descrição é obrigatória.'); return }
        const amount = parseFloat(form.amount)
        if (isNaN(amount) || amount <= 0) { setFieldError('Valor inválido.'); return }
        setFieldError(null)
        try {
            await create.mutateAsync({
                description: form.description.trim(),
                amount,
                type: form.type,
                category: form.category.trim() || null,
                reference_date: form.reference_date,
                organization_id: null,
                created_by: '',
            })
            onClose()
        } catch { /* handled via create.error */ }
    }

    const mutError = create.error instanceof Error ? create.error.message : null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-white shadow-xl dark:bg-gray-900">
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">Nova Transação</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"><X size={18} /></button>
                </div>
                <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-6 py-4">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">Descrição *</label>
                        <input value={form.description} onChange={(e) => set('description', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898] dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700">Valor (R$) *</label>
                            <input type="number" min="0.01" step="0.01" value={form.amount}
                                onChange={(e) => set('amount', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898] dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700">Tipo</label>
                            <select value={form.type} onChange={(e) => set('type', e.target.value as FinancialTransaction['type'])}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898] dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                                <option value="revenue">Receita</option>
                                <option value="expense">Despesa</option>
                                <option value="commission">Comissão</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700">Categoria</label>
                            <input value={form.category} onChange={(e) => set('category', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898] dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700">Data de referência</label>
                            <input type="date" value={form.reference_date} onChange={(e) => set('reference_date', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898] dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                        </div>
                    </div>
                    {(fieldError ?? mutError) && <p className="text-xs text-red-600">{fieldError ?? mutError}</p>}
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancelar</button>
                        <button type="submit" disabled={create.isPending}
                            className="flex items-center gap-2 rounded-lg bg-[#162136] px-4 py-2 text-sm text-white hover:bg-[#1E2F4A] disabled:opacity-50">
                            <Plus size={14} />{create.isPending ? 'Salvando…' : 'Salvar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ─── KPI Cards ────────────────────────────────────────────────────────────────

function SummaryCards({ from, to }: { from: string; to: string }) {
    const { data: summary, isLoading } = useFinanceSummary(from, to)
    if (isLoading) return <SectionLoader />
    if (!summary || summary.error) return null

    const cards = [
        { label: 'Receitas', value: summary.revenue ?? 0, color: 'text-green-600' },
        { label: 'Despesas', value: summary.expenses ?? 0, color: 'text-red-600' },
        { label: 'Comissões', value: summary.commissions ?? 0, color: 'text-blue-600' },
        { label: 'Resultado', value: summary.net ?? 0, color: (summary.net ?? 0) >= 0 ? 'text-green-700' : 'text-red-700' },
    ]

    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {cards.map(({ label, value, color }) => (
                <div key={label} className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                    <p className={`mt-1 text-lg font-bold ${color}`}>{formatCurrency(value)}</p>
                </div>
            ))}
        </div>
    )
}

// ─── Tabela de transações ─────────────────────────────────────────────────────

function TransactionRow({ tx }: { tx: FinancialTransaction }) {
    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50">
            <td className="px-4 py-3 text-sm text-gray-600">{formatDate(tx.reference_date)}</td>
            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{tx.description}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{tx.category ?? '—'}</td>
            <td className="px-4 py-3">
                <span className={`text-xs font-medium ${typeColor[tx.type]}`}>{typeLabel[tx.type]}</span>
            </td>
            <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{formatCurrency(tx.amount)}</td>
        </tr>
    )
}

function TransactionsTable({ from, to, onNew }: { from: string; to: string; onNew: () => void }) {
    const { data: txs, isLoading, error, refetch } = useFinanceTransactions(from, to)
    if (isLoading) return <SectionLoader />
    if (error) return <ErrorMessage message={error instanceof Error ? error.message : 'Erro'} onRetry={() => void refetch()} />

    return (
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-3">
                <div>
                    <h2 className="text-base font-semibold text-gray-800">Transações</h2>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{txs?.length ?? 0} transação(ões) no período</p>
                </div>
                <button onClick={onNew}
                    className="flex items-center gap-2 rounded-lg bg-[#162136] px-3 py-1.5 text-xs text-white hover:bg-[#1E2F4A]">
                    <Plus size={12} /> Nova Transação
                </button>
            </div>
            {!txs || txs.length === 0 ? (
                <div className="py-4">
                    <EmptyState
                        icon={DollarSign}
                        title="Nenhuma transação no período"
                        description="Clique em Nova Transação para registrar a primeira."
                    />
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                            <tr>
                                <th className="px-4 py-2">Data</th><th className="px-4 py-2">Descrição</th>
                                <th className="px-4 py-2">Categoria</th><th className="px-4 py-2">Tipo</th>
                                <th className="px-4 py-2 text-right">Valor</th>
                            </tr>
                        </thead>
                        <tbody>{txs.map((tx) => <TransactionRow key={tx.id} tx={tx} />)}</tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function FinancePage() {
    const now = new Date()
    const [year, setYear] = useState(now.getFullYear())
    const [month, setMonth] = useState(now.getMonth())
    const [showNew, setShowNew] = useState(false)
    const { from, to } = monthRange(year, month)

    return (
        <>
            {showNew && <NewTxModal onClose={() => setShowNew(false)} from={from} to={to} />}
            <div className="space-y-6 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financeiro</h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Receitas, despesas e comissões</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898] dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                            {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                        </select>
                        <input type="number" value={year} min={2020} max={2099}
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898] dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                    </div>
                </div>
                <SummaryCards from={from} to={to} />
                <TransactionsTable from={from} to={to} onNew={() => setShowNew(true)} />
            </div>
        </>
    )
}
