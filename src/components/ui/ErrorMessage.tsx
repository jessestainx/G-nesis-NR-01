interface ErrorMessageProps {
    message?: string | null
    title?: string
    className?: string
    onRetry?: () => void
}

export function ErrorMessage({
    message,
    title = 'Ocorreu um erro',
    className = '',
    onRetry,
}: ErrorMessageProps) {
    if (!message) return null

    return (
        <div
            role="alert"
            className={`rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200 ${className}`}
        >
            <p className="text-sm font-medium">{title}</p>
            <p className="mt-1 text-sm">{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="mt-2 text-xs font-medium underline hover:no-underline"
                >
                    Tentar novamente
                </button>
            )}
        </div>
    )
}

export function InlineError({ message }: { message?: string | null }) {
    if (!message) return null
    return <p className="text-xs text-red-600 dark:text-red-400">{message}</p>
}
