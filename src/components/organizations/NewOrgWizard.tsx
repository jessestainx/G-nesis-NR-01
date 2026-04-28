import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { fetchCnpjData, validateCnpj } from '@/utils/cnpj'
import { useCreateOrganization } from '@/hooks/queries/useOrganizations'
import { useUpsertOrgSettings } from '@/hooks/queries/useOrgSettings'
import { useInviteUser } from '@/hooks/queries/useProfiles'
import { initialValues, type WizardValues } from '@/components/organizations/newOrgWizard.types'
import { CNPJ_RE, formatCnpjInput, isEmail } from '@/components/organizations/newOrgWizard.utils'
import { StepCompany, StepConfig, StepResponsible } from '@/components/organizations/newOrgWizard.steps'

interface NewOrgWizardProps {
    onClose: () => void
}

export function NewOrgWizard({ onClose }: NewOrgWizardProps) {
    const [step, setStep] = useState(1)
    const [form, setForm] = useState<WizardValues>(initialValues)
    const [error, setError] = useState<string | null>(null)
    const [cnpjLoading, setCnpjLoading] = useState(false)
    const [logoUploading, setLogoUploading] = useState(false)
    const createOrg = useCreateOrganization()
    const upsertOrgSettings = useUpsertOrgSettings()
    const inviteUser = useInviteUser()
    const navigate = useNavigate()

    const isSubmitting = createOrg.isPending || upsertOrgSettings.isPending || inviteUser.isPending

    function set<K extends keyof WizardValues>(key: K, value: WizardValues[K]) {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    async function handleCnpjChange(value: string) {
        const { digits, formatted } = formatCnpjInput(value)
        set('cnpj', formatted)

        if (digits.length !== 14 || !validateCnpj(digits)) return

        setCnpjLoading(true)
        const data = await fetchCnpjData(digits)
        setCnpjLoading(false)
        if (data.error) return

        setForm((prev) => ({
            ...prev,
            name: prev.name || data.razaoSocial || data.nomeFantasia || '',
            industry: prev.industry || data.setor || '',
            responsible_name: prev.responsible_name || data.socioAdministrador || '',
            responsible_email: prev.responsible_email || data.email || '',
            invite_email: prev.invite_email || data.email || '',
        }))
    }

    async function handleLogoUpload(file: File) {
        setLogoUploading(true)
        setError(null)
        const ext = file.name.split('.').pop() ?? 'png'
        const path = `logos/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadError } = await supabase.storage.from('documents').upload(path, file, {
            upsert: false,
        })
        if (uploadError) {
            setLogoUploading(false)
            setError(`Erro no upload do logo: ${uploadError.message}`)
            return
        }

        const { data, error: signedError } = await supabase.storage
            .from('documents')
            .createSignedUrl(path, 60 * 60 * 24 * 365)
        setLogoUploading(false)
        if (signedError || !data?.signedUrl) {
            setError('Logo enviado, mas não foi possível gerar URL')
            return
        }
        set('logo_url', data.signedUrl)
        toast.success('Logo enviado com sucesso')
    }

    function validateStep(current: number): boolean {
        if (current === 1) {
            if (!form.name.trim()) return false
            if (form.cnpj && !CNPJ_RE.test(form.cnpj)) return false
            if (form.employee_count && Number.isNaN(Number(form.employee_count))) return false
            return true
        }
        if (current === 2) {
            if (!form.responsible_name.trim()) return false
            if (!form.responsible_email.trim()) return false
            return isEmail(form.responsible_email)
        }
        if (current === 3) {
            if (form.invite_now) {
                const email = form.invite_email || form.responsible_email
                return !!email && isEmail(email)
            }
            return true
        }
        return true
    }

    async function handleFinish() {
        setError(null)
        if (!validateStep(3)) {
            setError('Revise os campos antes de finalizar.')
            return
        }

        try {
            const created = await createOrg.mutateAsync({
                name: form.name.trim(),
                cnpj: form.cnpj.trim() || null,
                industry: form.industry.trim() || null,
                employee_count: form.employee_count ? Number(form.employee_count) : null,
                responsible_name: form.responsible_name.trim() || null,
                responsible_email: form.responsible_email.trim() || null,
                responsible_phone: form.responsible_phone.trim() || null,
                responsible_role: form.responsible_role.trim() || null,
                plan: form.plan,
                status: 'active',
            })

            if (!created.data || created.error) {
                throw new Error(created.error ?? 'Falha ao criar organização')
            }

            const organizationId = created.data.id

            await upsertOrgSettings.mutateAsync({
                organizationId,
                payload: {
                    primary_color: form.primary_color || '#00A898',
                    logo_url: form.logo_url || null,
                },
            })

            if (form.invite_now) {
                const email = (form.invite_email || form.responsible_email).trim()
                const inviteResult = await inviteUser.mutateAsync({
                    email,
                    name: form.responsible_name.trim() || 'Responsável',
                    role: 'client_executive',
                    organizationId,
                    message: form.invite_message.trim() || undefined,
                })
                if (inviteResult.error) throw new Error(inviteResult.error)
                toast.success(`Organização criada! Convite enviado para ${email}`)
            } else {
                toast.success('Organização criada com sucesso!')
            }

            onClose()
            navigate(`/dashboard/genesis/organizations/${organizationId}`)
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Erro ao finalizar onboarding')
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl dark:bg-gray-900">
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Onboarding de Organização</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Passo {step} de 3</p>
                    </div>
                    <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4 px-6 py-5">
                    {step === 1 && (
                        <StepCompany form={form} set={set} onCnpjChange={(v) => void handleCnpjChange(v)} cnpjLoading={cnpjLoading} />
                    )}

                    {step === 2 && (
                        <StepResponsible form={form} set={set} />
                    )}

                    {step === 3 && (
                        <StepConfig form={form} set={set} onLogoUpload={(file) => void handleLogoUpload(file)} logoUploading={logoUploading} />
                    )}

                    {error && <p className="text-sm text-red-600">{error}</p>}
                </div>

                <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-gray-800">
                    <button
                        type="button"
                        onClick={() => setStep((s) => Math.max(1, s - 1))}
                        disabled={step === 1 || isSubmitting}
                        className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
                    >
                        Voltar
                    </button>
                    {step < 3 ? (
                        <button
                            type="button"
                            disabled={!validateStep(step) || isSubmitting}
                            onClick={() => setStep((s) => Math.min(3, s + 1))}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-40"
                        >
                            Próximo
                        </button>
                    ) : (
                        <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => void handleFinish()}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white disabled:opacity-40"
                        >
                            {isSubmitting ? 'Finalizando...' : 'Finalizar onboarding'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
