import { useState } from 'react'
import { z } from 'zod'
import { X } from 'lucide-react'
import type { Organization } from '@/types'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { cleanCnpj, fetchCnpjData, validateCnpj } from '@/utils/cnpj'
import { useCreateOrganization, useUpdateOrganization } from '@/hooks/queries/useOrganizations'

type FormValues = {
    name: string
    cnpj: string
    industry: string
    employee_count: string
    responsible_name: string
    responsible_email: string
    responsible_phone: string
    responsible_role: string
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
    responsible_phone: '',
    responsible_role: '',
    plan: 'basic',
    status: 'active',
}

const CNPJ_RE = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/

const orgSchema = z.object({
    name: z.string().min(1, 'O nome é obrigatório'),
    cnpj: z.string().refine((v) => !v || CNPJ_RE.test(v), {
        message: 'CNPJ inválido. Use o formato 00.000.000/0001-00',
    }),
    responsible_email: z.string().refine((v) => !v || z.string().email().safeParse(v).success, {
        message: 'E-mail do responsável inválido',
    }),
    employee_count: z.string().refine((v) => !v || /^\d+$/.test(v), {
        message: 'Nº de funcionários deve ser um número',
    }),
    industry: z.string(),
    responsible_name: z.string(),
    responsible_phone: z.string(),
    responsible_role: z.string(),
    plan: z.string(),
    status: z.enum(['active', 'suspended', 'inactive']),
})

type OrgErrors = Partial<Record<keyof FormValues, string>>

function orgToForm(org: Organization): FormValues {
    return {
        name: org.name,
        cnpj: org.cnpj ?? '',
        industry: org.industry ?? '',
        employee_count: org.employee_count?.toString() ?? '',
        responsible_name: org.responsible_name ?? '',
        responsible_email: org.responsible_email ?? '',
        responsible_phone: org.responsible_phone ?? '',
        responsible_role: org.responsible_role ?? '',
        plan: org.plan ?? 'basic',
        status: org.status,
    }
}

export function OrganizationEditModal({
    initial,
    onClose,
}: {
    initial?: Organization | null
    onClose: () => void
}) {
    const [form, setForm] = useState<FormValues>(initial ? orgToForm(initial) : emptyForm)
    const [errors, setErrors] = useState<OrgErrors>({})
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [cnpjLoading, setCnpjLoading] = useState(false)
    const [cnpjError, setCnpjError] = useState<string | null>(null)
    const [cnpjFound, setCnpjFound] = useState(false)

    const createMut = useCreateOrganization()
    const updateMut = useUpdateOrganization()
    const isLoading = createMut.isPending || updateMut.isPending
    const mutError = (createMut.error ?? updateMut.error) as Error | null

    function set<K extends keyof FormValues>(field: K, value: FormValues[K]) {
        setForm((f) => ({ ...f, [field]: value }))
        if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }))
    }

    async function handleCnpjChange(value: string) {
        const digits = cleanCnpj(value)
        let formatted = digits
        if (digits.length > 2) formatted = digits.slice(0, 2) + '.' + digits.slice(2)
        if (digits.length > 5) formatted = formatted.slice(0, 6) + '.' + digits.slice(5)
        if (digits.length > 8) formatted = formatted.slice(0, 10) + '/' + digits.slice(8)
        if (digits.length > 12) formatted = formatted.slice(0, 15) + '-' + digits.slice(12, 14)

        setForm((f) => ({ ...f, cnpj: formatted }))
        if (errors.cnpj) setErrors((e) => ({ ...e, cnpj: undefined }))
        setCnpjError(null)
        setCnpjFound(false)

        if (digits.length !== 14) return
        if (!validateCnpj(digits)) {
            setCnpjError('CNPJ inválido')
            return
        }

        setCnpjLoading(true)
        const data = await fetchCnpjData(digits)
        setCnpjLoading(false)

        if (data.error) {
            setCnpjError(data.error)
            return
        }

        setForm((f) => ({
            ...f,
            name: f.name || data.razaoSocial || data.nomeFantasia || f.name,
            industry: f.industry || data.setor || f.industry,
            responsible_name: f.responsible_name || data.socioAdministrador || f.responsible_name,
            responsible_email: f.responsible_email || data.email || f.responsible_email,
        }))
        setCnpjFound(true)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setSubmitError(null)
        const result = orgSchema.safeParse(form)
        if (!result.success) {
            const fieldErrors: OrgErrors = {}
            for (const issue of result.error.issues) {
                const key = issue.path[0] as keyof FormValues
                if (key) fieldErrors[key] = issue.message
            }
            setErrors(fieldErrors)
            return
        }
        setErrors({})

        const payload = {
            name: form.name.trim(),
            cnpj: form.cnpj.trim() || null,
            industry: form.industry.trim() || null,
            employee_count: form.employee_count ? parseInt(form.employee_count, 10) : null,
            responsible_name: form.responsible_name.trim() || null,
            responsible_email: form.responsible_email.trim() || null,
            responsible_phone: form.responsible_phone.trim() || null,
            responsible_role: form.responsible_role.trim() || null,
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
        } catch (e) {
            setSubmitError(e instanceof Error ? e.message : 'Erro ao salvar organização')
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-xl dark:bg-gray-900">
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

                <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-6 py-5">
                    {mutError && <ErrorMessage message={mutError.message} />}
                    {submitError && <ErrorMessage message={submitError} />}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Nome <span className="text-red-500">*</span>
                            </label>
                            <input
                                className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:bg-gray-800 dark:text-white ${errors.name ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
                                value={form.name}
                                onChange={(e) => set('name', e.target.value)}
                                placeholder="Empresa Ltda."
                            />
                            {errors.name && <p className="mt-0.5 text-xs text-red-500">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">CNPJ</label>
                            <div className="relative">
                                <input
                                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:bg-gray-800 dark:text-white pr-8 ${errors.cnpj ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
                                    value={form.cnpj}
                                    onChange={(e) => void handleCnpjChange(e.target.value)}
                                    placeholder="00.000.000/0001-00"
                                    maxLength={18}
                                />
                                {cnpjLoading && (
                                    <div className="absolute right-2 top-2.5">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                                    </div>
                                )}
                                {cnpjFound && !cnpjLoading && (
                                    <div className="absolute right-2 top-2.5 text-green-500">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                            <path d="M13.5 3.5L6 11 2.5 7.5l-1 1L6 13l8.5-8.5z" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            {errors.cnpj && <p className="mt-0.5 text-xs text-red-500">{errors.cnpj}</p>}
                            {cnpjError && !errors.cnpj && <p className="mt-1 text-xs text-red-500">{cnpjError}</p>}
                            {cnpjFound && (
                                <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                                    Dados preenchidos automaticamente pela Receita Federal
                                </p>
                            )}
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

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Telefone (opcional)</label>
                            <input
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                value={form.responsible_phone}
                                onChange={(e) => set('responsible_phone', e.target.value)}
                                placeholder="(11) 99999-9999"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Cargo</label>
                            <input
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                value={form.responsible_role}
                                onChange={(e) => set('responsible_role', e.target.value)}
                                placeholder="Diretor(a) / RH / Compliance"
                            />
                        </div>
                    </div>

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
