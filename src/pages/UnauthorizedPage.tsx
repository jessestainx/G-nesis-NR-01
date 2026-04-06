import { useNavigate } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'

export function UnauthorizedPage() {
    const navigate = useNavigate()

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4 dark:bg-gray-950">
            <ShieldOff className="h-12 w-12 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Acesso negado</h1>
            <p className="text-center text-gray-500">
                Você não tem permissão para acessar esta página.
            </p>
            <button
                onClick={() => navigate(-1)}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
                Voltar
            </button>
        </div>
    )
}
