interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-4',
    lg: 'h-12 w-12 border-4',
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
    return (
        <div
            className={`animate-spin rounded-full border-indigo-600 border-t-transparent ${sizes[size]} ${className}`}
            role="status"
            aria-label="Carregando…"
        />
    )
}

export function PageLoader() {
    return (
        <div className="flex h-screen items-center justify-center">
            <LoadingSpinner size="lg" />
        </div>
    )
}

export function SectionLoader() {
    return (
        <div className="flex h-48 items-center justify-center">
            <LoadingSpinner size="md" />
        </div>
    )
}

/** @deprecated Use PageLoader instead */
export const LoadingPage = PageLoader
