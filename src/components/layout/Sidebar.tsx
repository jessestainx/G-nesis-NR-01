import { type ComponentType } from "react"
import { NavLink } from "react-router-dom"
import {
    LayoutDashboard, Building2, ClipboardCheck, FileText, Users,
    TrendingUp, BadgeCheck, X, AlertTriangle, BookOpen, Activity,
    Lock, ShieldAlert, UserCircle2, History, LogOut,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import type { UserRole } from "@/types"

interface NavItem {
    label: string
    to: string
    icon: ComponentType<{ className?: string }>
}

interface NavSection {
    title?: string
    items: NavItem[]
}

const genesisNav: NavSection[] = [
    { title: "GESTÃO", items: [
        { label: "Visão Geral", to: "/dashboard/genesis", icon: LayoutDashboard },
        { label: "Organizações", to: "/dashboard/genesis/organizations", icon: Building2 },
        { label: "Usuários", to: "/dashboard/genesis/users", icon: UserCircle2 },
    ]},
    { title: "NR-01", items: [
        { label: "Diagnósticos", to: "/dashboard/genesis/diagnosis", icon: ClipboardCheck },
        { label: "Planos de Ação", to: "/dashboard/genesis/action-plans", icon: BadgeCheck },
        { label: "Pesquisas de Pulso", to: "/dashboard/genesis/pulse", icon: Activity },
    ]},
    { title: "COMERCIAL", items: [
        { label: "CRM", to: "/dashboard/genesis/crm", icon: Users },
        { label: "Financeiro", to: "/dashboard/genesis/finance", icon: TrendingUp },
    ]},
    { title: "SISTEMA", items: [
        { label: "Auditoria", to: "/dashboard/genesis/audit", icon: History },
    ]},
]

const clientExecutiveNav: NavSection[] = [
    { title: "ROTINA", items: [
        { label: "Dashboard", to: "/dashboard/client", icon: LayoutDashboard },
        { label: "Diagnóstico NR-01", to: "/dashboard/client/diagnosis", icon: ClipboardCheck },
        { label: "Riscos", to: "/dashboard/client/risks", icon: AlertTriangle },
        { label: "Planos de Ação", to: "/dashboard/client/action-plans", icon: BadgeCheck },
    ]},
    { title: "RECURSOS", items: [
        { label: "Documentos", to: "/dashboard/client/documents", icon: FileText },
        { label: "Treinamentos", to: "/dashboard/client/trainings", icon: BookOpen },
        { label: "Pesquisa de Pulso", to: "/dashboard/client/pulse", icon: Activity },
    ]},
]

const professionalNav: NavSection[] = [
    { items: [
        { label: "Visão Geral", to: "/dashboard/professional", icon: LayoutDashboard },
        { label: "Diagnósticos", to: "/dashboard/professional/diagnosis", icon: ClipboardCheck },
        { label: "Riscos", to: "/dashboard/professional/risks", icon: AlertTriangle },
        { label: "Planos de Ação", to: "/dashboard/professional/action-plans", icon: BadgeCheck },
        { label: "Casos Sensíveis", to: "/dashboard/professional/cases", icon: ShieldAlert },
    ]},
]

const collaboratorNav: NavSection[] = [
    { items: [
        { label: "Início", to: "/dashboard/collaborator", icon: LayoutDashboard },
        { label: "Pesquisa de Pulso", to: "/dashboard/collaborator/survey", icon: ClipboardCheck },
        { label: "Privacidade", to: "/dashboard/collaborator/privacy", icon: Lock },
    ]},
]

function getNavSections(role: UserRole): NavSection[] {
    switch (role) {
        case "genesis": return genesisNav
        case "client_executive": return clientExecutiveNav
        case "professional": return professionalNav
        case "collaborator": return collaboratorNav
        default: return []
    }
}

function getRoleLabel(role: UserRole): string {
    switch (role) {
        case "genesis": return "ADMINISTRADOR"
        case "client_executive": return "CLIENTE EXECUTIVO"
        case "professional": return "PROFISSIONAL"
        case "collaborator": return "COLABORADOR"
        default: return String(role).toUpperCase()
    }
}

function getInitials(name: string | null | undefined): string {
    if (!name) return "?"
    return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("")
}

const ROOT_PATHS = new Set(["/dashboard/genesis", "/dashboard/client", "/dashboard/collaborator", "/dashboard/professional"])

interface SidebarProps { role: UserRole; open: boolean; onClose: () => void }

function SidebarContent({ role, onClose }: { role: UserRole; onClose: () => void }) {
    const sections = getNavSections(role)
    const { profile, signOut } = useAuth()

    return (
        <div className="flex h-full flex-col bg-[#162136]">
            <div className="flex h-16 items-center justify-between px-4 border-b border-[#1E2F4A]">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00A898]/20 border border-[#00A898]/40">
                        <span className="text-xs font-bold text-[#00A898]">GN</span>
                    </div>
                    <div>
                        <p className="text-sm font-bold leading-tight text-white">PAINEL GESTÃO</p>
                        <p className="text-[10px] leading-tight text-[#00A898] tracking-wider">GÊNESIS NR-01</p>
                    </div>
                </div>
                <button onClick={onClose} className="lg:hidden rounded-md p-1 text-[#8BA5C4] hover:text-white hover:bg-[#1E2F4A]" aria-label="Fechar menu">
                    <X className="h-5 w-5" />
                </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
                {sections.map((section, sIdx) => (
                    <div key={sIdx}>
                        {section.title && (
                            <p className="mb-2 px-3 text-[10px] font-semibold tracking-widest text-[#4E6B8C]">{section.title}</p>
                        )}
                        <ul className="space-y-0.5">
                            {section.items.map((item) => (
                                <li key={item.to}>
                                    <NavLink
                                        to={item.to}
                                        end={ROOT_PATHS.has(item.to)}
                                        onClick={onClose}
                                        className={({ isActive }) =>
                                            `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? "bg-[#1E2F4A] text-white" : "text-[#8BA5C4] hover:bg-[#1E2F4A] hover:text-white"}`
                                        }
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <item.icon className={`h-5 w-5 shrink-0 ${isActive ? "text-[#00A898]" : ""}`} />
                                                {item.label}
                                            </>
                                        )}
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </nav>
            <div className="border-t border-[#1E2F4A] px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#00A898]/20 text-xs font-bold text-[#00A898]">
                        {getInitials(profile?.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{profile?.name ?? "Usuário"}</p>
                        <p className="text-[10px] tracking-wider text-[#4E6B8C]">{getRoleLabel(role)}</p>
                    </div>
                    <button onClick={signOut} title="Sair" className="rounded-md p-1 text-[#4E6B8C] hover:text-red-400 hover:bg-[#1E2F4A] transition-colors">
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}

export function Sidebar({ role, open, onClose }: SidebarProps) {
    return (
        <>
            <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-30">
                <SidebarContent role={role} onClose={onClose} />
            </aside>
            {open && <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={onClose} aria-hidden="true" />}
            <aside className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col transition-transform duration-200 lg:hidden ${open ? "translate-x-0" : "-translate-x-full"}`}>
                <SidebarContent role={role} onClose={onClose} />
            </aside>
        </>
    )
}
