import { Menu } from "lucide-react"

interface HeaderProps {
    onMenuClick: () => void
    title?: string
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
        </header>
    )
}
