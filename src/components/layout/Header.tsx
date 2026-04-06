import { Menu, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

function getInitials(name: string | null | undefined): string {
    if (!name) return '?'
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('')
}

interface HeaderProps {
    onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
    const { profile, signOut } = useAuth()

    return (
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            {/* Toggle sidebar (mobile) */}
            <button
                onClick={onMenuClick}
                className="lg:hidden rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
                aria-label="Abrir menu"
            >
                <Menu className="h-5 w-5" />
            </button>

            <div className="hidden lg:block" />

            {/* Right actions */}
            <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
                    {getInitials(profile?.name)}
                </div>

                <div className="hidden flex-col items-end sm:flex">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {profile?.name ?? 'Usuário'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {profile?.email}
                    </span>
                </div>

                <button
                    onClick={signOut}
                    className="flex items-center gap-1 rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-800"
                    aria-label="Sair"
                >
                    <LogOut className="h-5 w-5" />
                </button>
            </div>
        </header>
    )
}
