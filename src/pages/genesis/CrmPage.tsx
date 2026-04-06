import type { CrmContact, Contract } from '@/types'
import { useCrmContacts, useActiveContracts } from '@/hooks/queries/useFinance'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { formatDate, formatCurrency, crmStageLabel, contractStatusLabel } from '@/utils/format'

const stageColor: Record<CrmContact['stage'], string> = {
    lead: 'bg-gray-100 text-gray-600',
    prospect: 'bg-blue-100 text-blue-700',
    proposal: 'bg-yellow-100 text-yellow-700',
    negotiation: 'bg-orange-100 text-orange-700',
    closed_won: 'bg-green-100 text-green-700',
    closed_lost: 'bg-red-100 text-red-600',
}

function ContactRow({ contact }: { contact: CrmContact }) {
    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50">
            <td className="px-4 py-3 text-sm font-medium text-gray-900">{contact.name}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{contact.company ?? '—'}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{contact.email ?? '—'}</td>
            <td className="px-4 py-3">
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${stageColor[contact.stage]}`}>
                    {crmStageLabel[contact.stage] ?? contact.stage}
                </span>
            </td>
            <td className="px-4 py-3 text-sm text-gray-500">{formatDate(contact.created_at)}</td>
        </tr>
    )
}

function ContractRow({ contract }: { contract: Contract }) {
    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50">
            <td className="px-4 py-3 text-sm font-medium text-gray-900">{contract.title}</td>
            <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(contract.value)}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{formatDate(contract.start_date)}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{formatDate(contract.end_date)}</td>
            <td className="px-4 py-3 text-sm text-gray-600">
                {contractStatusLabel[contract.status] ?? contract.status}
            </td>
        </tr>
    )
}

function ContactsTable() {
    const { data: contacts, isLoading, error, refetch } = useCrmContacts()

    if (isLoading) return <SectionLoader />
    if (error) return <ErrorMessage message={error instanceof Error ? error.message : 'Erro'} onRetry={() => void refetch()} />

    return (
        <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-4 py-3">
                <h2 className="text-base font-semibold text-gray-800">Contatos</h2>
                <p className="text-xs text-gray-400">{contacts?.length ?? 0} contato(s)</p>
            </div>
            {!contacts || contacts.length === 0 ? (
                <p className="px-4 py-6 text-sm text-gray-500">Nenhum contato cadastrado.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-4 py-2">Nome</th>
                                <th className="px-4 py-2">Empresa</th>
                                <th className="px-4 py-2">E-mail</th>
                                <th className="px-4 py-2">Etapa</th>
                                <th className="px-4 py-2">Criado em</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contacts.map((c) => <ContactRow key={c.id} contact={c} />)}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

function ContractsTable() {
    const { data: contracts, isLoading, error, refetch } = useActiveContracts()

    if (isLoading) return <SectionLoader />
    if (error) return <ErrorMessage message={error instanceof Error ? error.message : 'Erro'} onRetry={() => void refetch()} />

    return (
        <div className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-4 py-3">
                <h2 className="text-base font-semibold text-gray-800">Contratos Ativos</h2>
                <p className="text-xs text-gray-400">{contracts?.length ?? 0} contrato(s)</p>
            </div>
            {!contracts || contracts.length === 0 ? (
                <p className="px-4 py-6 text-sm text-gray-500">Nenhum contrato ativo.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-4 py-2">Título</th>
                                <th className="px-4 py-2">Valor</th>
                                <th className="px-4 py-2">Início</th>
                                <th className="px-4 py-2">Vencimento</th>
                                <th className="px-4 py-2">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contracts.map((c) => <ContractRow key={c.id} contract={c} />)}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

export function CrmPage() {
    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">CRM</h1>
                <p className="mt-1 text-sm text-gray-500">Contatos e contratos</p>
            </div>
            <ContactsTable />
            <ContractsTable />
        </div>
    )
}
