import { useState, useRef, useEffect } from 'react'
import { Menu, LogOut, UserCircle, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { NotificationsDropdown } from '@/components/layout/NotificationsDropdown'

interface HeaderProps {
    onMenuClick: () => void
    title?: string
}

function getInitials(name: string | null | undefined): string {
    if (!name) return '?'
    return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
}

function ProfileDropdown() {
    const { user, profile, signOut } = useAuth()
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        if (open) document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [open])

    async function handleSignOut() {
        setOpen(false)
        await signOut()
    }

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Menu do usuário"
            >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 overflow-hidden">
                    {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                        getInitials(profile?.name)
                    )}
                </div>
                <span className="hidden text-sm font-medium text-gray-700 sm:block max-w-[120px] truncate">
                    {profile?.name ?? user?.email ?? 'Usuário'}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute right-0 top-11 z-50 w-64 rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                    {/* Cabeçalho do dropdown */}
                    <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 overflow-hidden">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                            ) : (
                                getInitials(profile?.name)
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                                {profile?.name ?? 'Usuário'}
                            </p>
                            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                                {user?.email ?? ''}
                            </p>
                        </div>
                    </div>

                    {/* Ações */}
                    <div className="p-1">
                        <button
                            onClick={() => { navigate('/profile'); setOpen(false) }}
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                        >
                            <UserCircle className="h-4 w-4 text-gray-400" />
                            Meu perfil
                        </button>
                    </div>

                    <div className="border-t border-gray-100 p-1 dark:border-gray-700">
                        <button
                            onClick={handleSignOut}
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors"
                        >
                            <LogOut className="h-4 w-4" />
                            Sair
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export function Header({ onMenuClick, title }: HeaderProps) {
    return (
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-4 shadow-sm">
            <button
                onClick={onMenuClick}
                className="lg:hidden rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Abrir menu"
            >
                <Menu className="h-5 w-5" />
            </button>
            {title && (
                <p className="text-sm text-gray-500 hidden lg:block">{title}</p>
            )}
            <div className="ml-auto flex items-center gap-2">
                <NotificationsDropdown />
                <ProfileDropdown />
            </div>
        </header>
    )
}
