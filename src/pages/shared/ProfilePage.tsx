import { useState } from 'react'
import { User, Lock, Save, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useUpdateProfile } from '@/hooks/queries/useProfiles'
import { supabase } from '@/lib/supabase'

const ROLE_LABELS: Record<string, string> = {
    genesis: 'Administrador Genesis',
    client_executive: 'Cliente Executivo',
    professional: 'Profissional',
    collaborator: 'Colaborador',
}

function getInitials(name: string | null | undefined): string {
    if (!name) return '?'
    return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
}

export function ProfilePage() {
    const { user, profile, refreshProfile } = useAuth()
    const updateProfile = useUpdateProfile()

    // Dados pessoais
    const [name, setName] = useState(profile?.name ?? '')
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '')
    const [profileError, setProfileError] = useState<string | null>(null)
    const [profileSaved, setProfileSaved] = useState(false)

    // Senha
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [showPwd, setShowPwd] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [pwdError, setPwdError] = useState<string | null>(null)
    const [pwdSaved, setPwdSaved] = useState(false)
    const [pwdLoading, setPwdLoading] = useState(false)

    async function handleSaveProfile(e: React.FormEvent) {
        e.preventDefault()
        setProfileError(null)
        if (name.trim().length < 2) { setProfileError('Nome deve ter ao menos 2 caracteres.'); return }
        if (avatarUrl && !/^https?:\/\/.+/.test(avatarUrl)) { setProfileError('URL do avatar inválida.'); return }
        await updateProfile.mutateAsync({
            id: user!.id,
            payload: { name: name.trim(), avatar_url: avatarUrl.trim() || null },
        })
        await refreshProfile()
        setProfileSaved(true)
        setTimeout(() => setProfileSaved(false), 3000)
    }

    async function handleChangePassword(e: React.FormEvent) {
        e.preventDefault()
        setPwdError(null)
        if (password.length < 8) { setPwdError('A senha deve ter ao menos 8 caracteres.'); return }
        if (password !== confirm) { setPwdError('As senhas não coincidem.'); return }
        setPwdLoading(true)
        const { error } = await supabase.auth.updateUser({ password })
        setPwdLoading(false)
        if (error) { setPwdError(error.message); return }
        setPassword('')
        setConfirm('')
        setPwdSaved(true)
        setTimeout(() => setPwdSaved(false), 3000)
    }

    if (!profile) return null

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold text-white">Meu Perfil</h1>
                <p className="text-sm text-[#8BA5C4] mt-1">Gerencie suas informações pessoais e segurança</p>
            </div>

            {/* Identidade */}
            <div className="bg-[#1E2F4A] rounded-xl border border-[#2A3F5A] p-5">
                <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#00A898]/20 border-2 border-[#00A898]/40 text-xl font-bold text-[#00A898] overflow-hidden">
                        {profile.avatar_url
                            ? <img src={profile.avatar_url} alt="avatar" className="h-16 w-16 rounded-full object-cover" />
                            : getInitials(profile.name)
                        }
                    </div>
                    <div>
                        <p className="text-lg font-semibold text-white">{profile.name}</p>
                        <p className="text-sm text-[#8BA5C4]">{profile.email}</p>
                        <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-[#00A898]/20 text-[#00A898] border border-[#00A898]/40">
                            {ROLE_LABELS[profile.role] ?? profile.role}
                        </span>
                    </div>
                </div>
            </div>

            {/* Dados pessoais */}
            <div className="bg-[#1E2F4A] rounded-xl border border-[#2A3F5A] p-5">
                <h2 className="flex items-center gap-2 text-base font-semibold text-white mb-4">
                    <User className="h-4 w-4 text-[#00A898]" />
                    Dados Pessoais
                </h2>
                <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="block text-sm text-[#8BA5C4]">Nome completo</label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-md border border-[#2A3F5A] bg-[#162136] px-3 py-2 text-sm text-white placeholder:text-[#4E6B8C] focus:outline-none focus:ring-2 focus:ring-[#00A898]"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-sm text-[#8BA5C4]">E-mail</label>
                        <input
                            value={profile.email}
                            disabled
                            className="w-full rounded-md border border-[#2A3F5A] bg-[#162136] px-3 py-2 text-sm text-[#4E6B8C] cursor-not-allowed"
                        />
                        <p className="text-xs text-[#4E6B8C]">O e-mail não pode ser alterado</p>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-sm text-[#8BA5C4]">URL do avatar (opcional)</label>
                        <input
                            value={avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                            placeholder="https://exemplo.com/foto.jpg"
                            className="w-full rounded-md border border-[#2A3F5A] bg-[#162136] px-3 py-2 text-sm text-white placeholder:text-[#4E6B8C] focus:outline-none focus:ring-2 focus:ring-[#00A898]"
                        />
                    </div>

                    {profileError && (
                        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-md px-3 py-2">
                            {profileError}
                        </p>
                    )}

                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={updateProfile.isPending}
                            className="flex items-center gap-2 rounded-md bg-[#00A898] hover:bg-[#008F82] disabled:opacity-60 px-4 py-2 text-sm font-medium text-white transition-colors"
                        >
                            <Save className="h-4 w-4" />
                            {updateProfile.isPending ? 'Salvando...' : 'Salvar alterações'}
                        </button>
                        {profileSaved && (
                            <span className="flex items-center gap-1 text-sm text-[#00A898]">
                                <CheckCircle className="h-4 w-4" /> Salvo com sucesso
                            </span>
                        )}
                    </div>
                </form>
            </div>

            {/* Alterar senha */}
            <div className="bg-[#1E2F4A] rounded-xl border border-[#2A3F5A] p-5">
                <h2 className="flex items-center gap-2 text-base font-semibold text-white mb-4">
                    <Lock className="h-4 w-4 text-[#00A898]" />
                    Alterar Senha
                </h2>
                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="block text-sm text-[#8BA5C4]">Nova senha</label>
                        <div className="relative">
                            <input
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                type={showPwd ? 'text' : 'password'}
                                placeholder="Mínimo 8 caracteres"
                                className="w-full rounded-md border border-[#2A3F5A] bg-[#162136] px-3 py-2 pr-10 text-sm text-white placeholder:text-[#4E6B8C] focus:outline-none focus:ring-2 focus:ring-[#00A898]"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPwd(!showPwd)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4E6B8C] hover:text-[#8BA5C4]"
                            >
                                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-sm text-[#8BA5C4]">Confirmar nova senha</label>
                        <div className="relative">
                            <input
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                type={showConfirm ? 'text' : 'password'}
                                placeholder="Repita a nova senha"
                                className="w-full rounded-md border border-[#2A3F5A] bg-[#162136] px-3 py-2 pr-10 text-sm text-white placeholder:text-[#4E6B8C] focus:outline-none focus:ring-2 focus:ring-[#00A898]"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4E6B8C] hover:text-[#8BA5C4]"
                            >
                                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    {pwdError && (
                        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-md px-3 py-2">
                            {pwdError}
                        </p>
                    )}

                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={pwdLoading}
                            className="flex items-center gap-2 rounded-md bg-[#00A898] hover:bg-[#008F82] disabled:opacity-60 px-4 py-2 text-sm font-medium text-white transition-colors"
                        >
                            <Lock className="h-4 w-4" />
                            {pwdLoading ? 'Alterando...' : 'Alterar senha'}
                        </button>
                        {pwdSaved && (
                            <span className="flex items-center gap-1 text-sm text-[#00A898]">
                                <CheckCircle className="h-4 w-4" /> Senha alterada
                            </span>
                        )}
                    </div>
                </form>
            </div>

            <div className="border-t border-[#2A3F5A] pt-4">
                <p className="text-xs text-[#4E6B8C]">
                    Conta criada em{' '}
                    {profile.created_at
                        ? new Date(profile.created_at).toLocaleDateString('pt-BR')
                        : '—'}
                </p>
            </div>
        </div>
    )
}
