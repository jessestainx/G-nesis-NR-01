import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { useAuth } from '@/hooks/useAuth'

export function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { role } = useAuth()

    if (!role) return null

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
            <Sidebar
                role={role}
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* Main content — offset for desktop sidebar */}
            <div className="flex flex-1 flex-col overflow-hidden lg:pl-64">
                <Header onMenuClick={() => setSidebarOpen((prev) => !prev)} />

                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
