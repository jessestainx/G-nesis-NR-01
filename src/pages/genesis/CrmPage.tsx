import { useState } from 'react'
import { Plus, X, ArrowRight, Trash2 } from 'lucide-react'
import type { CrmContact, Contract } from '@/types'
import {
    useCrmContacts,
    useActiveContracts,
    useCreateCrmContact,
    useUpdateCrmContact,
    useDeleteCrmContact,
    useCreateContract,
    useUpdateContractStatus,
    useDeleteContract,
} from '@/hooks/queries/useFinance'
import { useOrganizations } from '@/hooks/queries/useOrganizations'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { formatDate, formatCurrency, crmStageLabel, contractStatusLabel } from '@/utils/format'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { usePagination } from '@/hooks/usePagination'
import { UserSearch, FileText } from 'lucide-react'

const stageColor: Record<CrmContact['stage'], string> = {
    lead: 'bg-gray-100 text-gray-600',
    prospect: 'bg-blue-100 text-blue-700',
    proposal: 'bg-yellow-100 text-yellow-700',
    negotiation: 'bg-orange-100 text-orange-700',
    closed_won: 'bg-green-100 text-green-700',
    closed_lost: 'bg-red-100 text-red-600',
}

const CONTRACT_STATUSES: Contract['status'][] = ['active', 'suspended', 'cancelled', 'expired']

const STAGES: CrmContact['stage'][] = ['lead', 'prospect', 'proposal', 'negotiation', 'closed_won', 'closed_lost']

// ─── Modal novo contato ───────────────────────────────────────────────────────

interface NewContactModalProps { onClose: () => void }

function NewContactModal({ onClose }: NewContactModalProps) {
    const create = useCreateCrmContact()
    const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', stage: 'lead' as CrmContact['stage'] })
    const [fieldError, setFieldError] = useState<string | null>(null)

    function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
        setForm((f) => ({ ...f, [k]: v }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!form.name.trim()) { setFieldError('Nome é obrigatório.'); return }
        setFieldError(null)
        try {
            await create.mutateAsync({
                name: form.name.trim(),
                email: form.email.trim() || null,
                phone: form.phone.trim() || null,
                company: form.company.trim() || null,
                stage: form.stage,
                organization_id: null,
                assigned_to: null,
            })
            onClose()
        } catch { /* handled via create.error */ }
    }

    const mutError = create.error instanceof Error ? create.error.message : null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-white shadow-xl dark:bg-gray-900">
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">Novo Contato</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"><X size={18} /></button>
                </div>
                <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-6 py-4">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">Nome *</label>
                        <input value={form.name} onChange={(e) => set('name', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898] dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700">E-mail</label>
                            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898] dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700">Telefone</label>
                            <input value={form.phone} onChange={(e) => set('phone', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898] dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                        </div>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">Empresa</label>
                        <input value={form.company} onChange={(e) => set('company', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898] dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">Etapa</label>
                        <select value={form.stage} onChange={(e) => set('stage', e.target.value as CrmContact['stage'])}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898] dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                            {STAGES.map((s) => <option key={s} value={s}>{crmStageLabel[s] ?? s}</option>)}
                        </select>
                    </div>
                    {(fieldError ?? mutError) && <p className="text-xs text-red-600">{fieldError ?? mutError}</p>}
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancelar</button>
                        <button type="submit" disabled={create.isPending}
                            className="flex items-center gap-2 rounded-lg bg-[#162136] px-4 py-2 text-sm text-white hover:bg-[#1E2F4A] disabled:opacity-50">
                            <Plus size={14} />{create.isPending ? 'Salvando…' : 'Criar Contato'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ─── Modal novo contrato ──────────────────────────────────────────────────────

interface NewContractModalProps { onClose: () => void }

function NewContractModal({ onClose }: NewContractModalProps) {
    const create = useCreateContract()
    const { data: orgs } = useOrganizations()
    const [form, setForm] = useState({
        title: '',
        value: '',
        status: 'active' as Contract['status'],
        organization_id: '',
        start_date: new Date().toISOString().slice(0, 10),
        end_date: '',
    })
    const [fieldError, setFieldError] = useState<string | null>(null)

    function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
        setForm((f) => ({ ...f, [k]: v }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!form.title.trim()) { setFieldError('Título é obrigatório.'); return }
        const numValue = parseFloat(form.value)
        if (isNaN(numValue) || numValue < 0) { setFieldError('Valor inválido.'); return }
        if (!form.start_date) { setFieldError('Data de início é obrigatória.'); return }
        setFieldError(null)
        try {
            await create.mutateAsync({
                title: form.title.trim(),
                value: numValue,
                status: form.status,
                organization_id: form.organization_id || null,
                start_date: form.start_date,
                end_date: form.end_date || null,
            } as Omit<Contract, 'id' | 'created_at' | 'updated_at'>)
            onClose()
        } catch { /* handled via create.error */ }
    }

    const mutError = create.error instanceof Error ? create.error.message : null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-white shadow-xl dark:bg-gray-900">
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">Novo Contrato</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"><X size={18} /></button>
                </div>
                <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-6 py-4">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Título *</label>
                        <input value={form.title} onChange={(e) => set('title', e.target.value)}
                            placeholder="Ex: Contrato de Consultoria NR-01"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898] dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Valor (R$) *</label>
                            <input type="number" min="0" step="0.01" value={form.value} onChange={(e) => set('value', e.target.value)}
                                placeholder="0,00"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898] dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Status</label>
                            <select value={form.status} onChange={(e) => set('status', e.target.value as Contract['status'])}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898] dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                                {CONTRACT_STATUSES.map((s) => <option key={s} value={s}>{contractStatusLabel[s] ?? s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Organização</label>
                        <select value={form.organization_id} onChange={(e) => set('organization_id', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898] dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                            <option value="">— Nenhuma —</option>
                            {(orgs ?? []).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Início *</label>
                            <input type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898] dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Vencimento</label>
                            <input type="date" value={form.end_date} onChange={(e) => set('end_date', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898] dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
                        </div>
                    </div>
                    {(fieldError ?? mutError) && <p className="text-xs text-red-600">{fieldError ?? mutError}</p>}
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300">Cancelar</button>
                        <button type="submit" disabled={create.isPending}
                            className="flex items-center gap-2 rounded-lg bg-[#162136] px-4 py-2 text-sm text-white hover:bg-[#1E2F4A] disabled:opacity-50">
                            <Plus size={14} />{create.isPending ? 'Salvando…' : 'Criar Contrato'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ─── Linha de contato com avançar estágio ─────────────────────────────────────

function ContactRow({ contact }: { contact: CrmContact }) {
    const update = useUpdateCrmContact()
    const del = useDeleteCrmContact()
    const [confirmDel, setConfirmDel] = useState(false)
    const currentIdx = STAGES.indexOf(contact.stage)
    const nextStage = currentIdx < STAGES.length - 1 ? STAGES[currentIdx + 1] : null

    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50">
            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{contact.name}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{contact.company ?? '—'}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{contact.email ?? '—'}</td>
            <td className="px-4 py-3">
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${stageColor[contact.stage]}`}>
                    {crmStageLabel[contact.stage] ?? contact.stage}
                </span>
            </td>
            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatDate(contact.created_at)}</td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                    {nextStage && (
                        <button
                            onClick={() => void update.mutateAsync({ id: contact.id, stage: nextStage })}
                            disabled={update.isPending}
                            title={`Avançar para ${crmStageLabel[nextStage]}`}
                            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40">
                            <ArrowRight size={12} />
                            {crmStageLabel[nextStage]}
                        </button>
                    )}
                    {!confirmDel ? (
                        <button onClick={() => setConfirmDel(true)} title="Excluir contato"
                            className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500">
                            <Trash2 size={13} />
                        </button>
                    ) : (
                        <span className="flex items-center gap-1">
                            <span className="text-xs text-red-600">Confirmar?</span>
                            <button onClick={() => void del.mutateAsync(contact.id)}
                                disabled={del.isPending}
                                className="rounded px-1.5 py-0.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40">Sim</button>
                            <button onClick={() => setConfirmDel(false)} className="text-xs text-gray-400 hover:text-gray-600">Não</button>
                        </span>
                    )}
                </div>
            </td>
        </tr>
    )
}

// ─── Linha de contrato com status + delete ────────────────────────────────────

function ContractRow({ contract }: { contract: Contract }) {
    const updateStatus = useUpdateContractStatus()
    const del = useDeleteContract()
    const [confirmDel, setConfirmDel] = useState(false)

    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50">
            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{contract.title}</td>
            <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(contract.value)}</td>
            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{formatDate(contract.start_date)}</td>
            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{formatDate(contract.end_date)}</td>
            <td className="px-4 py-3">
                <select
                    value={contract.status}
                    onChange={(e) => void updateStatus.mutateAsync({ id: contract.id, status: e.target.value as Contract['status'] })}
                    disabled={updateStatus.isPending}
                    className="rounded border border-gray-200 bg-transparent px-2 py-0.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#00A898] disabled:opacity-40 dark:border-gray-600 dark:text-gray-300"
                >
                    {CONTRACT_STATUSES.map((s) => (
                        <option key={s} value={s}>{contractStatusLabel[s] ?? s}</option>
                    ))}
                </select>
            </td>
            <td className="px-4 py-3">
                {!confirmDel ? (
                    <button onClick={() => setConfirmDel(true)} title="Excluir contrato"
                        className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500">
                        <Trash2 size={13} />
                    </button>
                ) : (
                    <span className="flex items-center gap-1">
                        <span className="text-xs text-red-600">Excluir?</span>
                        <button onClick={() => void del.mutateAsync(contract.id)}
                            disabled={del.isPending}
                            className="rounded px-1.5 py-0.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40">Sim</button>
                        <button onClick={() => setConfirmDel(false)} className="text-xs text-gray-400 hover:text-gray-600">Não</button>
                    </span>
                )}
            </td>
        </tr>
    )
}

function ContactsTable({ onNew }: { onNew: () => void }) {
    const { data: contacts, isLoading, error, refetch } = useCrmContacts()
    const pg = usePagination(contacts, 15)
    if (isLoading) return <SectionLoader />
    if (error) return <ErrorMessage message={error instanceof Error ? error.message : 'Erro'} onRetry={() => void refetch()} />

    return (
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-3">
                <div>
                    <h2 className="text-base font-semibold text-gray-800">Contatos</h2>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{contacts?.length ?? 0} contato(s)</p>
                </div>
                <button onClick={onNew}
                    className="flex items-center gap-2 rounded-lg bg-[#162136] px-3 py-1.5 text-xs text-white hover:bg-[#1E2F4A]">
                    <Plus size={12} /> Novo Contato
                </button>
            </div>
            {!contacts || contacts.length === 0 ? (
                <div className="p-4"><EmptyState icon={UserSearch} title="Nenhum contato no CRM" description="Adicione o primeiro contato para começar a gerenciar relacionamentos." actionLabel="Novo Contato" onAction={onNew} /></div>
            ) : (
                <>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                            <tr>
                                <th className="px-4 py-2">Nome</th><th className="px-4 py-2">Empresa</th>
                                <th className="px-4 py-2">E-mail</th><th className="px-4 py-2">Etapa</th>
                                <th className="px-4 py-2">Criado em</th><th className="px-4 py-2">Ação</th>
                            </tr>
                        </thead>
                        <tbody>{pg.paged.map((c) => <ContactRow key={c.id} contact={c} />)}</tbody>
                    </table>
                </div>
                <Pagination page={pg.page} pageSize={15} total={contacts.length} onPageChange={pg.goTo} />
                </>
            )}
        </div>
    )
}

function ContractsTable({ onNew }: { onNew: () => void }) {
    const { data: contracts, isLoading, error, refetch } = useActiveContracts()
    if (isLoading) return <SectionLoader />
    if (error) return <ErrorMessage message={error instanceof Error ? error.message : 'Erro'} onRetry={() => void refetch()} />

    return (
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-3">
                <div>
                    <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">Contratos</h2>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{contracts?.length ?? 0} contrato(s)</p>
                </div>
                <button onClick={onNew}
                    className="flex items-center gap-2 rounded-lg bg-[#162136] px-3 py-1.5 text-xs text-white hover:bg-[#1E2F4A]">
                    <Plus size={12} /> Novo Contrato
                </button>
            </div>
            {!contracts || contracts.length === 0 ? (
                <div className="p-4"><EmptyState icon={FileText} title="Nenhum contrato" description="Crie o primeiro contrato para começar." actionLabel="Novo Contrato" onAction={onNew} /></div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                            <tr>
                                <th className="px-4 py-2">Título</th><th className="px-4 py-2">Valor</th>
                                <th className="px-4 py-2">Início</th><th className="px-4 py-2">Vencimento</th>
                                <th className="px-4 py-2">Status</th><th className="px-4 py-2"></th>
                            </tr>
                        </thead>
                        <tbody>{contracts.map((c) => <ContractRow key={c.id} contract={c} />)}</tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

export function CrmPage() {
    const [showNewContact, setShowNewContact] = useState(false)
    const [showNewContract, setShowNewContract] = useState(false)
    return (
        <>
            {showNewContact && <NewContactModal onClose={() => setShowNewContact(false)} />}
            {showNewContract && <NewContractModal onClose={() => setShowNewContract(false)} />}
            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CRM</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Contatos e contratos</p>
                </div>
                <ContactsTable onNew={() => setShowNewContact(true)} />
                <ContractsTable onNew={() => setShowNewContract(true)} />
            </div>
        </>
    )
}
