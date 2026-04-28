import type { WizardPlan, WizardValues } from '@/components/organizations/newOrgWizard.types'
import { planDescriptions } from '@/components/organizations/newOrgWizard.types'

export function StepCompany({
    form,
    set,
    onCnpjChange,
    cnpjLoading,
}: {
    form: WizardValues
    set: <K extends keyof WizardValues>(k: K, v: WizardValues[K]) => void
    onCnpjChange: (value: string) => void
    cnpjLoading: boolean
}) {
    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium">Nome da organização *</label>
                <input value={form.name} onChange={(e) => set('name', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div>
                <label className="mb-1 block text-sm font-medium">CNPJ</label>
                <input value={form.cnpj} onChange={(e) => onCnpjChange(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="00.000.000/0001-00" />
                {cnpjLoading && <p className="mt-1 text-xs text-gray-500">Consultando Receita Federal...</p>}
            </div>
            <div>
                <label className="mb-1 block text-sm font-medium">Setor / Indústria</label>
                <input value={form.industry} onChange={(e) => set('industry', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div>
                <label className="mb-1 block text-sm font-medium">Número de funcionários</label>
                <input type="number" min="1" value={form.employee_count} onChange={(e) => set('employee_count', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div>
                <label className="mb-1 block text-sm font-medium">Plano</label>
                <select value={form.plan} onChange={(e) => set('plan', e.target.value as WizardPlan)} className="w-full rounded-lg border px-3 py-2 text-sm">
                    <option value="basic">Basic</option>
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">{planDescriptions[form.plan]}</p>
            </div>
        </div>
    )
}

export function StepResponsible({
    form,
    set,
}: {
    form: WizardValues
    set: <K extends keyof WizardValues>(k: K, v: WizardValues[K]) => void
}) {
    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium">Nome do responsável *</label>
                <input value={form.responsible_name} onChange={(e) => set('responsible_name', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium">E-mail corporativo *</label>
                <input type="email" value={form.responsible_email} onChange={(e) => set('responsible_email', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div>
                <label className="mb-1 block text-sm font-medium">Telefone (opcional)</label>
                <input value={form.responsible_phone} onChange={(e) => set('responsible_phone', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div>
                <label className="mb-1 block text-sm font-medium">Cargo</label>
                <input value={form.responsible_role} onChange={(e) => set('responsible_role', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
        </div>
    )
}

export function StepConfig({
    form,
    set,
    onLogoUpload,
    logoUploading,
}: {
    form: WizardValues
    set: <K extends keyof WizardValues>(k: K, v: WizardValues[K]) => void
    onLogoUpload: (file: File) => void
    logoUploading: boolean
}) {
    const summary = {
        company: form.name || '—',
        cnpj: form.cnpj || '—',
        plan: form.plan,
        responsible: form.responsible_name || '—',
        email: form.responsible_email || '—',
        invite: form.invite_now ? (form.invite_email || form.responsible_email || '—') : 'Não',
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="mb-1 block text-sm font-medium">Cor primária</label>
                    <input type="color" value={form.primary_color} onChange={(e) => set('primary_color', e.target.value)} className="h-10 w-full rounded-lg border px-1 py-1" />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium">URL do logo</label>
                    <input value={form.logo_url} onChange={(e) => set('logo_url', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="https://..." />
                </div>
            </div>
            <div>
                <label className="mb-1 block text-sm font-medium">Upload de logo (opcional)</label>
                <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) onLogoUpload(file)
                    }}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                />
                {logoUploading && <p className="mt-1 text-xs text-gray-500">Enviando logo...</p>}
            </div>
            <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.invite_now} onChange={(e) => set('invite_now', e.target.checked)} />
                Convidar client_executive agora
            </label>
            {form.invite_now && (
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium">E-mail do convite</label>
                        <input value={form.invite_email} onChange={(e) => set('invite_email', e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" placeholder={form.responsible_email || 'responsavel@empresa.com'} />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium">Mensagem personalizada (opcional)</label>
                        <textarea value={form.invite_message} onChange={(e) => set('invite_message', e.target.value)} rows={3} className="w-full rounded-lg border px-3 py-2 text-sm" />
                    </div>
                </div>
            )}

            <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-sm text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200">
                <p><strong>Resumo:</strong></p>
                <p>Empresa: {summary.company}</p>
                <p>CNPJ: {summary.cnpj}</p>
                <p>Plano: {summary.plan}</p>
                <p>Responsável: {summary.responsible} ({summary.email})</p>
                <p>Convite imediato: {summary.invite}</p>
            </div>
        </div>
    )
}
