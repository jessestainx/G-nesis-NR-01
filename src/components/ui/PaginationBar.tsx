import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationBarProps {
    page: number
    totalPages: number
    total: number
    pageSize: number
    hasPrev: boolean
    hasNext: boolean
    onPrev: () => void
    onNext: () => void
    onGoTo?: (p: number) => void
}

export function PaginationBar({ page, totalPages, total, pageSize, hasPrev, hasNext, onPrev, onNext }: PaginationBarProps) {
    if (totalPages <= 1) return null

    const from = (page - 1) * pageSize + 1
    const to = Math.min(page * pageSize, total)

    return (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-b-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">
                {from}–{to} de {total}
            </p>
            <div className="flex items-center gap-1">
                <button
                    onClick={onPrev}
                    disabled={!hasPrev}
                    className="flex h-7 w-7 items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs text-gray-500 dark:text-gray-400 px-2">
                    {page} / {totalPages}
                </span>
                <button
                    onClick={onNext}
                    disabled={!hasNext}
                    className="flex h-7 w-7 items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    )
}
