import { useState, useMemo } from 'react'
import { z } from 'zod'
import { Plus, X, UserPlus, Search, UserX, UserCheck, MoreHorizontal, Pencil } from 'lucide-react'
import type { Profile, UserRole } from '@/types'
import { useOrganizationProfiles, useInviteUser, useDeactivateUser, useReactivateUser, useUpdateProfile, usePendingInvites } from '@/hooks/queries/useProfiles'
import { useAuth } from '@/hooks/useAuth'
import { useOrganizations } from '@/hooks/queries/useOrganizations'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { Pagination } from '@/components/ui/Pagination'
import { usePagination } from '@/hooks/usePagination'
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

const inviteSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    email: z.string().email('E-mail inválido'),
})

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
    const [customMessage, setCustomMessage] = useState('')
    const [sentState, setSentState] = useState<string | null>(null)

    function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
        setForm((f) => ({ ...f, [k]: v }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        const result = inviteSchema.safeParse(form)
        if (!result.success) {
            setFieldError(result.error.issues[0]?.message ?? 'Dados inválidos.')
            return
        }
        setFieldError(null)
        try {
            await invite.mutateAsync({
                email: form.email.trim(),
                name: form.name.trim(),
                role: form.role,
                organizationId: form.organizationId || undefined,
                message: customMessage.trim() || undefined,
            })
            setSentState('Convite enviado - aguardando confirmação')
            onClose()
        } catch {
            // handled via invite.error
        }
    }

    const mutError = invite.error instanceof Error ? invite.error.message : null
    const previewText = `Olá ${form.name || '[Nome]'}, você foi convidado para acessar o Portal Gênesis NR-01 como ${roleLabel[form.role] ?? form.role}.`

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
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">Mensagem personalizada</label>
                        <textarea
                            value={customMessage}
                            onChange={(e) => setCustomMessage(e.target.value)}
                            rows={3}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898]"
                            placeholder="Mensagem opcional para aparecer no convite..."
                        />
                    </div>
                    <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-xs text-indigo-700">
                        <p className="font-semibold">Preview do e-mail</p>
                        <p className="mt-1">{previewText}</p>
                        {customMessage.trim() && <p className="mt-1">Mensagem: {customMessage.trim()}</p>}
                    </div>
                    {(fieldError ?? mutError) && (
                        <p className="text-xs text-red-600">{fieldError ?? mutError}</p>
                    )}
                    {sentState && <p className="text-xs text-green-700">{sentState}</p>}
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

function PendingInvitesBlock({ orgId }: { orgId: string }) {
    const pending = usePendingInvites(orgId)
    const resend = useInviteUser()

    async function handleResend(email: string, name: string | null, role: UserRole) {
        await resend.mutateAsync({
            email,
            name: name ?? 'Usuário',
            role,
            organizationId: orgId,
        })
    }

    if (pending.isLoading) return null
    if (!pending.data || pending.data.length === 0) return null

    return (
        <div className="border-t border-gray-200 px-4 py-3">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700">Convites pendentes</h3>
            <div className="space-y-2">
                {pending.data.map((invite) => (
                    <div key={invite.id} className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                        <div>
                            <p className="text-sm font-medium text-amber-900">{invite.email}</p>
                            <p className="text-xs text-amber-800">{roleLabel[invite.role] ?? invite.role} • {formatDate(invite.invited_at)}</p>
                        </div>
                        <button
                            onClick={() => void handleResend(invite.email, invite.name, invite.role)}
                            disabled={resend.isPending}
                            className="rounded-md border border-amber-300 bg-white px-2.5 py-1 text-xs text-amber-800 hover:bg-amber-100 disabled:opacity-60"
                        >
                            {resend.isPending ? 'Reenviando…' : 'Reenviar'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── Modal editar usuário ─────────────────────────────────────────────────────

interface EditUserModalProps { profile: Profile; onClose: () => void }

function EditUserModal({ profile, onClose }: EditUserModalProps) {
    const { data: orgs } = useOrganizations()
    const update = useUpdateProfile()
    const [role, setRole] = useState<UserRole>(profile.role)
    const [orgId, setOrgId] = useState(profile.organization_id ?? '')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        try {
            await update.mutateAsync({
                id: profile.id,
                payload: {
                    role,
                    organization_id: orgId || null,
                },
            })
            onClose()
        } catch {
            // handled via update.error
        }
    }

    const mutError = update.error instanceof Error ? update.error.message : null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900">Editar Usuário</h2>
                        <p className="text-xs text-gray-500">{profile.name} · {profile.email}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-6 py-4">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">Papel</label>
                        <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898]">
                            <option value="client_executive">Empresa (Executivo)</option>
                            <option value="collaborator">Colaborador</option>
                            <option value="professional">Profissional</option>
                            <option value="genesis">Genesis (Admin)</option>
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">Organização</label>
                        <select value={orgId} onChange={(e) => setOrgId(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898]">
                            <option value="">Sem organização</option>
                            {orgs?.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                    </div>
                    {mutError && <p className="text-xs text-red-600">{mutError}</p>}
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            Cancelar
                        </button>
                        <button type="submit" disabled={update.isPending}
                            className="flex items-center gap-2 rounded-lg bg-[#162136] px-4 py-2 text-sm text-white hover:bg-[#1E2F4A] disabled:opacity-50">
                            <Pencil size={14} />
                            {update.isPending ? 'Salvando…' : 'Salvar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ─── Modal confirmar desativação ─────────────────────────────────────────────

interface ConfirmDeactivateModalProps {
    profile: Profile
    onClose: () => void
    onConfirm: () => void
    isPending: boolean
}

function ConfirmDeactivateModal({ profile, onClose, onConfirm, isPending }: ConfirmDeactivateModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <h2 className="text-base font-semibold text-gray-900">Desativar acesso</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <div className="px-6 py-4 space-y-3">
                    <p className="text-sm text-gray-700">
                        Desativar <span className="font-semibold">{profile.name}</span>?
                    </p>
                    <p className="text-sm text-gray-500">
                        O usuário perderá acesso imediatamente e não conseguirá fazer login.
                        Os dados relacionados serão preservados.
                    </p>
                </div>
                <div className="flex justify-end gap-2 border-t px-6 py-4">
                    <button onClick={onClose}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        Cancelar
                    </button>
                    <button onClick={onConfirm} disabled={isPending}
                        className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50">
                        <UserX size={14} />
                        {isPending ? 'Desativando…' : 'Desativar acesso'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Linha de usuário ─────────────────────────────────────────────────────────

function UserRow({ profile, currentUserId }: { profile: Profile; currentUserId: string }) {
    const deactivate = useDeactivateUser()
    const reactivate = useReactivateUser()
    const [showMenu, setShowMenu] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [showEdit, setShowEdit] = useState(false)
    const isSelf = profile.id === currentUserId
    const isActive = profile.active !== false  // default true when field is missing

    async function handleDeactivate() {
        await deactivate.mutateAsync(profile.id)
        setShowConfirm(false)
    }

    async function handleReactivate() {
        await reactivate.mutateAsync(profile.id)
        setShowMenu(false)
    }

    return (
        <>
            {showEdit && (
                <EditUserModal profile={profile} onClose={() => { setShowEdit(false); setShowMenu(false) }} />
            )}
            {showConfirm && (
                <ConfirmDeactivateModal
                    profile={profile}
                    onClose={() => { setShowConfirm(false); setShowMenu(false) }}
                    onConfirm={() => void handleDeactivate()}
                    isPending={deactivate.isPending}
                />
            )}
            <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    <span className="flex items-center gap-2">
                        {profile.name}
                        {!isActive && (
                            <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-xs text-gray-500">Inativo</span>
                        )}
                    </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{profile.email}</td>
                <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${roleColor[profile.role]}`}>
                        {roleLabel[profile.role] ?? profile.role}
                    </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{formatDate(profile.created_at)}</td>
                <td className="px-4 py-3 text-right">
                    {!isSelf && (
                        <div className="relative inline-block">
                            <button
                                onClick={() => setShowMenu((v) => !v)}
                                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                                <MoreHorizontal size={15} />
                            </button>
                            {showMenu && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                                    <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-gray-200 bg-white shadow-lg">
                                        <button
                                            onClick={() => { setShowMenu(false); setShowEdit(true) }}
                                            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                                            <Pencil size={14} /> Editar papel / org
                                        </button>
                                        {isActive ? (
                                            <button
                                                onClick={() => { setShowMenu(false); setShowConfirm(true) }}
                                                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                                                <UserX size={14} /> Desativar acesso
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => void handleReactivate()}
                                                disabled={reactivate.isPending}
                                                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-green-700 hover:bg-green-50 disabled:opacity-40">
                                                <UserCheck size={14} />
                                                {reactivate.isPending ? 'Reativando…' : 'Reativar acesso'}
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </td>
            </tr>
        </>
    )
}

function OrgUsersBlock({ orgId, orgName, currentUserId }: { orgId: string; orgName: string; currentUserId: string }) {
    const { data: profiles, isLoading, error, refetch } = useOrganizationProfiles(orgId)
    const pg = usePagination(profiles, 10)
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
                                <th className="px-4 py-2 w-10"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {pg.paged.map((p) => <UserRow key={p.id} profile={p} currentUserId={currentUserId} />)}
                        </tbody>
                    </table>
                    <Pagination page={pg.page} pageSize={10} total={profiles?.length ?? 0} onPageChange={pg.goTo} />
                </div>
                <PendingInvitesBlock orgId={orgId} />
            </div>
        </>
    )
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function UsersPage() {
    const { user } = useAuth()
    const { data: orgs, isLoading, error, refetch } = useOrganizations()
    const [showInvite, setShowInvite] = useState(false)
    const [search, setSearch] = useState('')

    const filteredOrgs = useMemo(() => {
        if (!orgs) return []
        const q = search.trim().toLowerCase()
        if (!q) return orgs
        return orgs.filter((o) => o.name.toLowerCase().includes(q))
    }, [orgs, search])

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

                <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por organização…"
                        className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-4 text-sm shadow-sm focus:border-[#00A898] focus:outline-none focus:ring-1 focus:ring-[#00A898] dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                    />
                </div>

                {!orgs || orgs.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center">
                        <p className="text-sm text-gray-500">Nenhuma organização cadastrada.</p>
                    </div>
                ) : filteredOrgs.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center">
                        <p className="text-sm text-gray-500">Nenhuma organização encontrada para &quot;{search}&quot;.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredOrgs.map((org) => (
                            <OrgUsersBlock key={org.id} orgId={org.id} orgName={org.name}
                            currentUserId={user?.id ?? ""} />
                        ))}
                    </div>
                )}
            </div>
        </>
    )
}
