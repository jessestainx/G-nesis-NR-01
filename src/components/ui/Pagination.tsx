interface PaginationProps {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
}

function range(from: number, to: number): number[] {
    const result: number[] = []
    for (let i = from; i <= to; i++) result.push(i)
    return result
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
    if (total <= 7) return range(1, total)
    const pages: (number | '...')[] = [1]
    if (current > 4) pages.push('...')
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)
    pages.push(...range(start, end))
    if (current < total - 3) pages.push('...')
    pages.push(total)
    return pages
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    if (totalPages <= 1 && total <= pageSize) return null

    const from = (page - 1) * pageSize + 1
    const to = Math.min(page * pageSize, total)
    const pages = getPageNumbers(page, totalPages)

    return (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 dark:border-gray-700 sm:flex-row">
            <p className="text-xs text-gray-500 dark:text-gray-400">
                Mostrando <span className="font-medium">{from}</span>–<span className="font-medium">{to}</span>{' '}
                de <span className="font-medium">{total}</span> resultado{total !== 1 ? 's' : ''}
            </p>

            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                    aria-label="Página anterior"
                >
                    ←
                </button>

                {pages.map((p, i) =>
                    p === '...' ? (
                        <span key={`ellipsis-${i}`} className="flex h-8 w-8 items-center justify-center text-xs text-gray-400">
                            …
                        </span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => onPageChange(p)}
                            className={`flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium transition-colors ${
                                p === page
                                    ? 'bg-indigo-600 text-white'
                                    : 'border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800'
                            }`}
                        >
                            {p}
                        </button>
                    ),
                )}

                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages}
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                    aria-label="Próxima página"
                >
                    →
                </button>
            </div>
        </div>
    )
}
