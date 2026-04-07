import { useState } from 'react'
import { Pencil, Plus, X } from 'lucide-react'
import type { Organization } from '@/types'
import {
    useOrganizations,
    useCreateOrganization,
    useUpdateOrganization,
} from '@/hooks/queries/useOrganizations'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { formatDate, formatCnpj } from '@/utils/format'

// ─── Labels ───────────────────────────────────────────────────────────────────

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

// ─── Tipos do formulário ──────────────────────────────────────────────────────

type FormValues = {
    name: string
    cnpj: string
    industry: string
    employee_count: string
    responsible_name: string
    responsible_email: string
    plan: string
    status: Organization['status']
}

const emptyForm: FormValues = {
    name: '',
    cnpj: '',
    industry: '',
    employee_count: '',
    responsible_name: '',
    responsible_email: '',
    plan: 'basic',
    status: 'active',
}

function orgToForm(org: Organization): FormValues {
    return {
        name: org.name,
        cnpj: org.cnpj ?? '',
        industry: org.industry ?? '',
        employee_count: org.employee_count?.toString() ?? '',
        responsible_name: org.responsible_name ?? '',
        responsible_email: org.responsible_email ?? '',
        plan: org.plan ?? 'basic',
        status: org.status,
    }
}

// ─── Modal de criar / editar ──────────────────────────────────────────────────

interface OrgModalProps {
    initial?: Organization | null
    onClose: () => void
}

function OrgModal({ initial, onClose }: OrgModalProps) {
    const [form, setForm] = useState<FormValues>(initial ? orgToForm(initial) : emptyForm)
    const [fieldError, setFieldError] = useState<string | null>(null)

    const createMut = useCreateOrganization()
    const updateMut = useUpdateOrganization()
    const isLoading = createMut.isPending || updateMut.isPending
    const mutError = (createMut.error ?? updateMut.error) as Error | null

    function set(field: keyof FormValues, value: string) {
        setForm((f) => ({ ...f, [field]: value }))
    }

    function validate(): boolean {
        if (!form.name.trim()) { setFieldError('O nome é obrigatório.'); return false }
        if (form.responsible_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.responsible_email)) {
            setFieldError('E-mail do responsável inválido.'); return false
        }
        setFieldError(null)
        return true
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!validate()) return
        const payload = {
            name: form.name.trim(),
            cnpj: form.cnpj.trim() || null,
            industry: form.industry.trim() || null,
            employee_count: form.employee_count ? parseInt(form.employee_count, 10) : null,
            responsible_name: form.responsible_name.trim() || null,
            responsible_email: form.responsible_email.trim() || null,
            plan: (form.plan || null) as Organization['plan'],
            status: form.status,
        }
        try {
            if (initial) {
                await updateMut.mutateAsync({ id: initial.id, payload })
            } else {
                await createMut.mutateAsync(payload)
            }
            onClose()
        } catch {
            // handled via mutError
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-xl dark:bg-gray-900">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {initial ? 'Editar Organização' : 'Nova Organização'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-6 py-5">
                    {(fieldError || mutError) && (
                        <ErrorMessage message={fieldError ?? mutError?.message} />
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Nome <span className="text-red-500">*</span>
                            </label>
                            <input
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                value={form.name}
                                onChange={(e) => set('name', e.target.value)}
                                placeholder="Empresa Ltda."
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">CNPJ</label>
                            <input
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                value={form.cnpj}
                                onChange={(e) => set('cnpj', e.target.value)}
                                placeholder="00.000.000/0001-00"
                                maxLength={18}
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Setor</label>
                            <input
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                value={form.industry}
                                onChange={(e) => set('industry', e.target.value)}
                                placeholder="Tecnologia"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Funcionários</label>
                            <input
                                type="number"
                                min="1"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                value={form.employee_count}
                                onChange={(e) => set('employee_count', e.target.value)}
                                placeholder="100"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Plano</label>
                            <select
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                value={form.plan}
                                onChange={(e) => set('plan', e.target.value)}
                            >
                                <option value="basic">Básico</option>
                                <option value="standard">Standard</option>
                                <option value="premium">Premium</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                            <select
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                value={form.status}
                                onChange={(e) => set('status', e.target.value as Organization['status'])}
                            >
                                <option value="active">Ativo</option>
                                <option value="suspended">Suspenso</option>
                                <option value="inactive">Inativo</option>
                            </select>
                        </div>

                        <div className="col-span-2">
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Responsável</label>
                            <input
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                value={form.responsible_name}
                                onChange={(e) => set('responsible_name', e.target.value)}
                                placeholder="João Silva"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">E-mail do Responsável</label>
                            <input
                                type="email"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                value={form.responsible_email}
                                onChange={(e) => set('responsible_email', e.target.value)}
                                placeholder="joao@empresa.com"
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                        >
                            {isLoading ? 'Salvando…' : initial ? 'Salvar alterações' : 'Criar organização'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ─── Linha da tabela ──────────────────────────────────────────────────────────

function OrgRow({ org, onEdit }: { org: Organization; onEdit: (o: Organization) => void }) {
    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50">
            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{org.name}</td>
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
                <button
                    onClick={() => onEdit(org)}
                    className="rounded-md p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400"
                    title="Editar"
                >
                    <Pencil className="h-4 w-4" />
                </button>
            </td>
        </tr>
    )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function OrganizationsPage() {
    const { data: orgs, isLoading, error, refetch } = useOrganizations()
    const [modal, setModal] = useState<{ open: boolean; org: Organization | null }>({
        open: false,
        org: null,
    })

    function openCreate() { setModal({ open: true, org: null }) }
    function openEdit(org: Organization) { setModal({ open: true, org }) }
    function closeModal() { setModal({ open: false, org: null }) }

    if (isLoading) return <SectionLoader />
    if (error) {
        return (
            <ErrorMessage
                message={error instanceof Error ? error.message : 'Erro ao carregar organizações'}
                onRetry={() => void refetch()}
            />
        )
    }

    return (
        <div className="space-y-6 p-6">
            {modal.open && <OrgModal initial={modal.org} onClose={closeModal} />}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Organizações</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {orgs?.length ?? 0} organização(ões) cadastrada(s)
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                    <Plus className="h-4 w-4" />
                    Nova organização
                </button>
            </div>

            {!orgs || orgs.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 py-16 text-center dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Nenhuma organização cadastrada ainda.
                    </p>
                    <button
                        onClick={openCreate}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                        <Plus className="h-4 w-4" />
                        Criar primeira organização
                    </button>
                </div>
            ) : (
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
                                <OrgRow key={org.id} org={org} onEdit={openEdit} />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
