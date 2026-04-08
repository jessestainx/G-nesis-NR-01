import { useState } from 'react'
import { Plus, X, UserPlus } from 'lucide-react'
import type { Profile, UserRole } from '@/types'
import { useOrganizationProfiles, useInviteUser } from '@/hooks/queries/useProfiles'
import { useOrganizations } from '@/hooks/queries/useOrganizations'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { formatDate, roleLabel } from '@/utils/format'

const roleColor: Record<UserRole, string> = {
    genesis: 'bg-purple-100 text-purple-700',
    client_executive: 'bg-blue-100 text-blue-700',
    collaborator: 'bg-green-100 text-green-700',
    professional: 'bg-orange-100 text-orange-700',
}

// ─── Modal convidar usuário ───────────────────────────────────────────────────

interface InviteModalProps { onClose: () => void; orgId?: string }

function InviteModal({ onClose, orgId }: InviteModalProps) {
    const { data: orgs } = useOrganizations()
    const invite = useInviteUser()
    const [form, setForm] = useState({
        email: '',
        name: '',
        role: 'client_executive' as UserRole,
        organizationId: orgId ?? '',
    })
    const [fieldError, setFieldError] = useState<string | null>(null)

    function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
        setForm((f) => ({ ...f, [k]: v }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!form.email.trim() || !form.name.trim()) {
            setFieldError('Nome e e-mail são obrigatórios.'); return
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            setFieldError('E-mail inválido.'); return
        }
        setFieldError(null)
        try {
            await invite.mutateAsync({
                email: form.email.trim(),
                name: form.name.trim(),
                role: form.role,
                organizationId: form.organizationId || undefined,
            })
            onClose()
        } catch {
            // handled via invite.error
        }
    }

    const mutError = invite.error instanceof Error ? invite.error.message : null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <h2 className="text-base font-semibold text-gray-900">Convidar Usuário</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-6 py-4">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">Nome *</label>
                        <input value={form.name} onChange={(e) => set('name', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898]" />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">E-mail *</label>
                        <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898]" />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">Papel</label>
                        <select value={form.role} onChange={(e) => set('role', e.target.value as UserRole)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898]">
                            <option value="client_executive">Empresa (Executivo)</option>
                            <option value="collaborator">Colaborador</option>
                            <option value="professional">Profissional</option>
                            <option value="genesis">Genesis (Admin)</option>
                        </select>
                    </div>
                    {!orgId && (
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-700">Organização</label>
                            <select value={form.organizationId} onChange={(e) => set('organizationId', e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898]">
                                <option value="">Sem organização</option>
                                {orgs?.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                            </select>
                        </div>
                    )}
                    {(fieldError ?? mutError) && (
                        <p className="text-xs text-red-600">{fieldError ?? mutError}</p>
                    )}
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            Cancelar
                        </button>
                        <button type="submit" disabled={invite.isPending}
                            className="flex items-center gap-2 rounded-lg bg-[#162136] px-4 py-2 text-sm text-white hover:bg-[#1E2F4A] disabled:opacity-50">
                            <UserPlus size={14} />
                            {invite.isPending ? 'Convidando…' : 'Convidar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ─── Linha de usuário ─────────────────────────────────────────────────────────

function UserRow({ profile }: { profile: Profile }) {
    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50">
            <td className="px-4 py-3 text-sm font-medium text-gray-900">{profile.name}</td>
            <td className="px-4 py-3 text-sm text-gray-600">{profile.email}</td>
            <td className="px-4 py-3">
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${roleColor[profile.role]}`}>
                    {roleLabel[profile.role] ?? profile.role}
                </span>
            </td>
            <td className="px-4 py-3 text-sm text-gray-500">{formatDate(profile.created_at)}</td>
        </tr>
    )
}

function OrgUsersBlock({ orgId, orgName }: { orgId: string; orgName: string }) {
    const { data: profiles, isLoading, error, refetch } = useOrganizationProfiles(orgId)
    const [inviting, setInviting] = useState(false)

    if (isLoading) return <SectionLoader />
    if (error) return <ErrorMessage message={error instanceof Error ? error.message : 'Erro'} onRetry={() => void refetch()} />
    if (!profiles || profiles.length === 0) return null

    return (
        <>
            {inviting && <InviteModal orgId={orgId} onClose={() => setInviting(false)} />}
            <div className="rounded-lg border border-gray-200 bg-white">
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-700">{orgName}</h2>
                        <p className="text-xs text-gray-400">{profiles.length} usuário(s)</p>
                    </div>
                    <button onClick={() => setInviting(true)}
                        className="flex items-center gap-1 rounded-lg bg-[#162136] px-3 py-1.5 text-xs text-white hover:bg-[#1E2F4A]">
                        <Plus size={12} /> Convidar
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-4 py-2">Nome</th>
                                <th className="px-4 py-2">E-mail</th>
                                <th className="px-4 py-2">Papel</th>
                                <th className="px-4 py-2">Criado em</th>
                            </tr>
                        </thead>
                        <tbody>
                            {profiles.map((p) => <UserRow key={p.id} profile={p} />)}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    )
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function UsersPage() {
    const { data: orgs, isLoading, error, refetch } = useOrganizations()
    const [showInvite, setShowInvite] = useState(false)

    if (isLoading) return <SectionLoader />
    if (error) return <ErrorMessage message={error instanceof Error ? error.message : 'Erro'} onRetry={() => void refetch()} />

    return (
        <>
            {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
            <div className="space-y-6 p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
                        <p className="mt-1 text-sm text-gray-500">Usuários agrupados por organização</p>
                    </div>
                    <button onClick={() => setShowInvite(true)}
                        className="flex items-center gap-2 rounded-lg bg-[#162136] px-4 py-2 text-sm text-white hover:bg-[#1E2F4A]">
                        <Plus size={14} /> Convidar Usuário
                    </button>
                </div>
                {!orgs || orgs.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center">
                        <p className="text-sm text-gray-500">Nenhuma organização cadastrada.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orgs.map((org) => (
                            <OrgUsersBlock key={org.id} orgId={org.id} orgName={org.name} />
                        ))}
                    </div>
                )}
            </div>
        </>
    )
}
