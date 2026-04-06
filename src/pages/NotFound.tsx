import { useNavigate } from 'react-router-dom'

export function NotFound() {
    const navigate = useNavigate()

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
            <div className="max-w-sm space-y-5">
                <p className="text-7xl font-bold text-gray-200">404</p>
                <div className="space-y-1">
                    <h1 className="text-xl font-semibold text-gray-800">
                        Página não encontrada
                    </h1>
                    <p className="text-sm text-gray-500">
                        O endereço que você tentou acessar não existe ou foi movido.
                    </p>
                </div>
                <button
                    onClick={() => navigate('/')}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
                >
                    Voltar ao início
                </button>
            </div>
        </div>
    )
}
