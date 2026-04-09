import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
    icon: LucideIcon
    title: string
    description?: string
    actionLabel?: string
    onAction?: () => void
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 py-16 px-6 text-center dark:border-gray-700">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800">
                <Icon className="h-8 w-8 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            {description && (
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{description}</p>
            )}
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    )
}
