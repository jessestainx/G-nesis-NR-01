import { useState, useMemo } from 'react'

export function usePagination<T>(items: T[] | undefined, pageSize = 15) {
    const [page, setPage] = useState(1)
    const data = items ?? []

    const totalPages = Math.max(1, Math.ceil(data.length / pageSize))
    const currentPage = Math.min(page, totalPages)

    const paged = useMemo(
        () => data.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [data, currentPage, pageSize],
    )

    function goTo(p: number) { setPage(Math.max(1, Math.min(p, totalPages))) }
    function next() { goTo(currentPage + 1) }
    function prev() { goTo(currentPage - 1) }

    return {
        paged,
        page: currentPage,
        totalPages,
        total: data.length,
        pageSize,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
        next,
        prev,
        goTo,
    }
}
