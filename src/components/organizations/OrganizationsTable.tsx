import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'
import type { Organization } from '@/types'
import { formatCnpj, formatDate } from '@/utils/format'
import { DeleteOrganizationModal } from '@/components/organizations/DeleteOrganizationModal'

const statusLabel: Record<Organization['status'], string> = {
    active: 'Ativo',
    suspended: 'Suspenso',
    inactive: 'Inativo',
}

const statusColor: Record<Organization['status'], string> = {
    active: 'bg-green-100 text-green-700',
    suspended: 'bg-yellow-100 text-yellow-700',
    inactive: 'bg-gray-100 text-gray-500',
}

const planLabel: Record<string, string> = {
    basic: 'Básico',
    standard: 'Standard',
    premium: 'Premium',
}

function OrgRow({
    org,
    onEdit,
}: {
    org: Organization
    onEdit: (o: Organization) => void
}) {
    const [showDelete, setShowDelete] = useState(false)
    return (
        <>
            {showDelete && <DeleteOrganizationModal org={org} onClose={() => setShowDelete(false)} />}
            <tr className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3 text-sm font-medium">
                    <Link to={`/dashboard/genesis/organizations/${org.id}`} className="text-gray-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-300">
                        {org.name}
                    </Link>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{formatCnpj(org.cnpj)}</td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{org.industry ?? '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{org.employee_count ?? '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {org.plan ? planLabel[org.plan] : '—'}
                </td>
                <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[org.status]}`}>
                        {statusLabel[org.status]}
                    </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatDate(org.created_at)}</td>
                <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => onEdit(org)}
                            className="rounded-md p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400"
                            title="Editar">
                            <Pencil className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setShowDelete(true)}
                            className="rounded-md p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500"
                            title="Excluir organização">
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </td>
            </tr>
        </>
    )
}

export function OrganizationsTable({
    orgs,
    onEdit,
}: {
    orgs: Organization[]
    onEdit: (org: Organization) => void
}) {
    return (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <table className="w-full text-left">
                <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-400">
                    <tr>
                        <th className="px-4 py-3">Nome</th>
                        <th className="px-4 py-3">CNPJ</th>
                        <th className="px-4 py-3">Setor</th>
                        <th className="px-4 py-3">Funcionários</th>
                        <th className="px-4 py-3">Plano</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Criado em</th>
                        <th className="px-4 py-3">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {orgs.map((org) => (
                        <OrgRow key={org.id} org={org} onEdit={onEdit} />
                    ))}
                </tbody>
            </table>
        </div>
    )
}
