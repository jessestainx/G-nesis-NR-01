import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, AlertTriangle, Info, AlertCircle, X } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import type { AppNotification } from '@/hooks/useNotifications'

const iconMap = {
    warning: { Icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    urgent: { Icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
    info: { Icon: Info, color: 'text-[#00A898]', bg: 'bg-[#00A898]/10' },
}

function NotificationItem({ n, onClose }: { n: AppNotification; onClose: () => void }) {
    const navigate = useNavigate()
    const { Icon, color, bg } = iconMap[n.type]

    return (
        <button
            onClick={() => { if (n.href) navigate(n.href); onClose() }}
            className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-[#1E2F4A] transition-colors border-b border-[#2A3F5A] last:border-0`}
        >
            <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
            </span>
            <div className="min-w-0">
                <p className="text-sm font-medium text-white leading-tight">{n.title}</p>
                <p className="text-xs text-[#8BA5C4] mt-0.5 leading-snug">{n.message}</p>
            </div>
        </button>
    )
}

export function NotificationsDropdown() {
    const [open, setOpen] = useState(false)
    const { notifications, count } = useNotifications()
    const ref = useRef<HTMLDivElement>(null)

    // Fechar ao clicar fora
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        if (open) document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [open])

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="relative flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                aria-label="Notificações"
            >
                <Bell className="h-5 w-5" />
                {count > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
                        {count > 9 ? '9+' : count}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-[#2A3F5A] bg-[#162136] shadow-xl">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A3F5A]">
                        <span className="text-sm font-semibold text-white">Notificações</span>
                        <button onClick={() => setOpen(false)} className="text-[#4E6B8C] hover:text-white">
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                            <Bell className="h-8 w-8 text-[#2A3F5A] mb-2" />
                            <p className="text-sm text-[#4E6B8C]">Nenhuma notificação no momento</p>
                        </div>
                    ) : (
                        <div>
                            {notifications.map((n) => (
                                <NotificationItem key={n.id} n={n} onClose={() => setOpen(false)} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
