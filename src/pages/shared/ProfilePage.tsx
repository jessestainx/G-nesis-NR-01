import { useState, useRef } from 'react'
import { User, Lock, Save, Eye, EyeOff, CheckCircle, Camera, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useUpdateProfile } from '@/hooks/queries/useProfiles'
import { profileService } from '@/services/profile.service'
import { supabase } from '@/lib/supabase'

const ROLE_LABELS: Record<string, string> = {
    genesis: 'Administrador Genesis',
    client_executive: 'Cliente Executivo',
    professional: 'Profissional',
    collaborator: 'Colaborador',
}

const ROLE_COLORS: Record<string, string> = {
    genesis: 'bg-purple-500/20 text-purple-300',
    client_executive: 'bg-sky-500/20 text-sky-300',
    professional: 'bg-[#00A898]/20 text-[#00A898]',
    collaborator: 'bg-amber-500/20 text-amber-300',
}

function getInitials(name: string | null | undefined): string {
    if (!name) return '?'
    return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
}

// ─── Seção Avatar ─────────────────────────────────────────────────────────────

function AvatarSection() {
    const { user, profile, refreshProfile } = useAuth()
    const fileRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file || !user) return
        const ext = file.name.split('.').pop() ?? 'jpg'
        const path = `avatars/${user.id}/avatar.${ext}`

        setUploading(true)
        setUploadError(null)

        const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
        if (uploadErr) {
            setUploadError(uploadErr.message)
            setUploading(false)
            return
        }

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
        const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

        await profileService.updateAvatar(user.id, publicUrl, user.id)
        await refreshProfile()
        setUploading(false)
    }

    return (
        <div className="bg-[#1E2F4A] rounded-xl border border-[#2A3F5A] p-5">
            <h2 className="mb-4 text-sm font-semibold text-white">Foto de perfil</h2>
            <div className="flex items-center gap-5">
                <div className="relative">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#00A898]/20 border-2 border-[#00A898]/40 text-2xl font-bold text-[#00A898] overflow-hidden">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                        ) : (
                            <span>{getInitials(profile?.name)}</span>
                        )}
                    </div>
                    {uploading && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                            <Loader2 className="h-6 w-6 animate-spin text-white" />
                        </div>
                    )}
                </div>
                <div>
                    <button
                        type="button"
                        disabled={uploading}
                        onClick={() => fileRef.current?.click()}
                        className="flex items-center gap-2 rounded-md border border-[#2A3F5A] bg-[#162136] hover:bg-[#1E2F4A] disabled:opacity-60 px-4 py-2 text-sm font-medium text-[#8BA5C4] transition-colors"
                    >
                        <Camera className="h-4 w-4" />
                        {uploading ? 'Enviando…' : 'Alterar foto'}
                    </button>
                    <p className="mt-1.5 text-xs text-[#4E6B8C]">JPG, PNG ou WebP. Máx. 2 MB.</p>
                    {uploadError && <p className="mt-1 text-xs text-red-400">{uploadError}</p>}
                </div>
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>
        </div>
    )
}

// ─── Seção Dados Pessoais ─────────────────────────────────────────────────────

function PersonalDataSection() {
    const { user, profile, refreshProfile } = useAuth()
    const updateProfile = useUpdateProfile()
    const [name, setName] = useState(profile?.name ?? '')
    const [nameError, setNameError] = useState<string | null>(null)
    const [saved, setSaved] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setNameError(null)
        if (name.trim().length < 2) { setNameError('Nome deve ter ao menos 2 caracteres.'); return }
        await updateProfile.mutateAsync({ id: user!.id, payload: { name: name.trim() } })
        await refreshProfile()
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
    }

    return (
        <div className="bg-[#1E2F4A] rounded-xl border border-[#2A3F5A] p-5">
            <div className="mb-4 flex items-center gap-2">
                <User className="h-4 w-4 text-[#00A898]" />
                <h2 className="text-sm font-semibold text-white">Dados pessoais</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#8BA5C4]">Nome</label>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-md border border-[#2A3F5A] bg-[#162136] px-3 py-2 text-sm text-white placeholder:text-[#4E6B8C] focus:border-[#00A898] focus:outline-none"
                        placeholder="Seu nome completo"
                    />
                    {nameError && <p className="mt-1 text-xs text-red-400">{nameError}</p>}
                </div>
                <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#8BA5C4]">E-mail</label>
                    <input
                        value={user?.email ?? ''}
                        readOnly
                        className="w-full rounded-md border border-[#2A3F5A] bg-[#162136]/50 px-3 py-2 text-sm text-[#4E6B8C] cursor-not-allowed"
                    />
                </div>
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="mb-1.5 block text-xs font-medium text-[#8BA5C4]">Função</label>
                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${ROLE_COLORS[profile?.role ?? ''] ?? 'bg-gray-700 text-gray-300'}`}>
                            {ROLE_LABELS[profile?.role ?? ''] ?? profile?.role ?? '—'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3 pt-1">
                    <button
                        type="submit"
                        disabled={updateProfile.isPending}
                        className="flex items-center gap-2 rounded-md bg-[#00A898] hover:bg-[#008F82] disabled:opacity-60 px-4 py-2 text-sm font-medium text-white transition-colors"
                    >
                        <Save className="h-4 w-4" />
                        {updateProfile.isPending ? 'Salvando…' : 'Salvar dados'}
                    </button>
                    {saved && (
                        <span className="flex items-center gap-1 text-sm text-[#00A898]">
                            <CheckCircle className="h-4 w-4" /> Salvo
                        </span>
                    )}
                </div>
            </form>
        </div>
    )
}

// ─── Seção Alterar Senha ──────────────────────────────────────────────────────

function PasswordSection() {
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [showPwd, setShowPwd] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [pwdError, setPwdError] = useState<string | null>(null)
    const [pwdSaved, setPwdSaved] = useState(false)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setPwdError(null)
        if (password.length < 8) { setPwdError('A senha deve ter ao menos 8 caracteres.'); return }
        if (password !== confirm) { setPwdError('As senhas não coincidem.'); return }
        setLoading(true)
        const { error } = await supabase.auth.updateUser({ password })
        setLoading(false)
        if (error) { setPwdError(error.message); return }
        setPassword('')
        setConfirm('')
        setPwdSaved(true)
        setTimeout(() => setPwdSaved(false), 3000)
    }

    return (
        <div className="bg-[#1E2F4A] rounded-xl border border-[#2A3F5A] p-5">
            <div className="mb-4 flex items-center gap-2">
                <Lock className="h-4 w-4 text-[#00A898]" />
                <h2 className="text-sm font-semibold text-white">Alterar senha</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#8BA5C4]">Nova senha</label>
                    <div className="relative">
                        <input
                            type={showPwd ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Mínimo 8 caracteres"
                            className="w-full rounded-md border border-[#2A3F5A] bg-[#162136] px-3 py-2 pr-10 text-sm text-white placeholder:text-[#4E6B8C] focus:border-[#00A898] focus:outline-none"
                        />
                        <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4E6B8C] hover:text-[#8BA5C4]">
                            {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>
                <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#8BA5C4]">Confirmar nova senha</label>
                    <div className="relative">
                        <input
                            type={showConfirm ? 'text' : 'password'}
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            placeholder="Repita a nova senha"
                            className="w-full rounded-md border border-[#2A3F5A] bg-[#162136] px-3 py-2 pr-10 text-sm text-white placeholder:text-[#4E6B8C] focus:border-[#00A898] focus:outline-none"
                        />
                        <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4E6B8C] hover:text-[#8BA5C4]">
                            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>
                {pwdError && <p className="text-xs text-red-400">{pwdError}</p>}
                <div className="flex items-center gap-3 pt-1">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 rounded-md bg-[#00A898] hover:bg-[#008F82] disabled:opacity-60 px-4 py-2 text-sm font-medium text-white transition-colors"
                    >
                        <Lock className="h-4 w-4" />
                        {loading ? 'Alterando…' : 'Alterar senha'}
                    </button>
                    {pwdSaved && (
                        <span className="flex items-center gap-1 text-sm text-[#00A898]">
                            <CheckCircle className="h-4 w-4" /> Senha alterada
                        </span>
                    )}
                </div>
            </form>
        </div>
    )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function ProfilePage() {
    const { profile } = useAuth()

    if (!profile) return null

    return (
        <div className="space-y-6 max-w-2xl p-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Meu Perfil</h1>
                <p className="text-sm text-[#8BA5C4] mt-1">Gerencie suas informações pessoais e segurança</p>
            </div>
            <AvatarSection />
            <PersonalDataSection />
            <PasswordSection />
            <div className="border-t border-[#2A3F5A] pt-4">
                <p className="text-xs text-[#4E6B8C]">
                    Conta criada em{' '}
                    {profile.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR') : '—'}
                </p>
            </div>
        </div>
    )
}
