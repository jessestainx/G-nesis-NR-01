import { type ComponentType } from 'react'
import { NavLink } from 'react-router-dom'
import {
    LayoutDashboard,
    Building2,
    ClipboardCheck,
    FileText,
    Users,
    TrendingUp,
    BadgeCheck,
    X,
    AlertTriangle,
    BookOpen,
    Activity,
    Lock,
    ShieldAlert,
    UserCircle2,
    History,
} from 'lucide-react'
import type { UserRole } from '@/types'

interface NavItem {
    label: string
    to: string
    icon: ComponentType<{ className?: string }>
}

const genesisNav: NavItem[] = [
    { label: 'Visão Geral', to: '/dashboard/genesis', icon: LayoutDashboard },
    { label: 'Organizações', to: '/dashboard/genesis/organizations', icon: Building2 },
    { label: 'Usuários', to: '/dashboard/genesis/users', icon: UserCircle2 },
    { label: 'Diagnósticos', to: '/dashboard/genesis/diagnosis', icon: ClipboardCheck },
    { label: 'Planos de Ação', to: '/dashboard/genesis/action-plans', icon: BadgeCheck },
    { label: 'CRM', to: '/dashboard/genesis/crm', icon: Users },
    { label: 'Financeiro', to: '/dashboard/genesis/finance', icon: TrendingUp },
    { label: 'Auditoria', to: '/dashboard/genesis/audit', icon: History },
]

const clientExecutiveNav: NavItem[] = [
    { label: 'Dashboard', to: '/dashboard/client', icon: LayoutDashboard },
    { label: 'Diagnóstico NR-01', to: '/dashboard/client/diagnosis', icon: ClipboardCheck },
    { label: 'Riscos', to: '/dashboard/client/risks', icon: AlertTriangle },
    { label: 'Planos de Ação', to: '/dashboard/client/action-plans', icon: BadgeCheck },
    { label: 'Documentos', to: '/dashboard/client/documents', icon: FileText },
    { label: 'Treinamentos', to: '/dashboard/client/trainings', icon: BookOpen },
    { label: 'Pesquisa de Pulso', to: '/dashboard/client/pulse', icon: Activity },
]

const professionalNav: NavItem[] = [
    { label: 'Visão Geral', to: '/dashboard/professional', icon: LayoutDashboard },
    { label: 'Diagnósticos', to: '/dashboard/professional/diagnosis', icon: ClipboardCheck },
    { label: 'Riscos', to: '/dashboard/professional/risks', icon: AlertTriangle },
    { label: 'Planos de Ação', to: '/dashboard/professional/action-plans', icon: BadgeCheck },
    { label: 'Casos Sensíveis', to: '/dashboard/professional/cases', icon: ShieldAlert },
]

const collaboratorNav: NavItem[] = [
    { label: 'Início', to: '/dashboard/collaborator', icon: LayoutDashboard },
    { label: 'Pesquisa de Pulso', to: '/dashboard/collaborator/survey', icon: ClipboardCheck },
    { label: 'Privacidade', to: '/dashboard/collaborator/privacy', icon: Lock },
]

function getNavItems(role: UserRole): NavItem[] {
    switch (role) {
        case 'genesis': return genesisNav
        case 'client_executive': return clientExecutiveNav
        case 'professional': return professionalNav
        case 'collaborator': return collaboratorNav
        default: return []
    }
}

interface SidebarProps {
    role: UserRole
    open: boolean
    onClose: () => void
}

function SidebarContent({ role, onClose }: { role: UserRole; onClose: () => void }) {
    const navItems = getNavItems(role)

    return (
        <>
            {/* Logo */}
            <div className="flex h-16 items-center justify-between px-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                        <span className="text-xs font-bold text-white">GN</span>
                    </div>
                    <div>
                        <p className="text-sm font-bold leading-tight text-gray-900 dark:text-white">Gênesis</p>
                        <p className="text-xs leading-tight text-indigo-600 dark:text-indigo-400">NR-01</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="lg:hidden rounded-md p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                    aria-label="Fechar menu"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">
                <ul className="space-y-1">
                    {navItems.map((item) => (
                        <li key={item.to}>
                            <NavLink
                                to={item.to}
                                end={
                                    item.to === '/dashboard/genesis' ||
                                    item.to === '/dashboard/client' ||
                                    item.to === '/dashboard/collaborator' ||
                                    item.to === '/dashboard/professional'
                                }
                                onClick={onClose}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive
                                        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
                                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                                    }`
                                }
                            >
                                <item.icon className="h-5 w-5 shrink-0" />
                                {item.label}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>
        </>
    )
}

export function Sidebar({ role, open, onClose }: SidebarProps) {
    return (
        <>
            {/* Desktop: fixed sidebar */}
            <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-30 border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
                <SidebarContent role={role} onClose={onClose} />
            </aside>

            {/* Mobile: overlay */}
            {open && (
                <div
                    className="fixed inset-0 z-20 bg-black/40 lg:hidden"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            {/* Mobile: slide-in panel */}
            <aside
                className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-200 lg:hidden dark:border-gray-700 dark:bg-gray-900 ${open ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <SidebarContent role={role} onClose={onClose} />
            </aside>
        </>
    )
}
