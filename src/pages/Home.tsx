export function Home() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
            <div className="max-w-md space-y-6">
                {/* Logo */}
                <div className="space-y-1">
                    <h1 className="text-4xl font-bold tracking-tight text-indigo-600">
                        Gênesis
                    </h1>
                    <p className="text-sm font-medium uppercase tracking-widest text-gray-400">
                        NR-01 · 360 Care
                    </p>
                </div>

                {/* Divider */}
                <div className="mx-auto h-px w-16 bg-gray-200" />

                {/* Mensagem */}
                <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Plataforma em implantação
                    </h2>
                    <p className="text-sm leading-relaxed text-gray-500">
                        Estamos configurando o ambiente para você.
                        Em breve a plataforma de gestão de riscos psicossociais
                        estará disponível neste endereço.
                    </p>
                </div>

                {/* Badge de status */}
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 ring-1 ring-amber-200">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                    Em breve
                </div>

                {/* Contato */}
                <p className="text-xs text-gray-400">
                    Dúvidas?{' '}
                    <a
                        href="mailto:contato@genesis360care.com.br"
                        className="text-indigo-500 hover:text-indigo-600 hover:underline"
                    >
                        contato@genesis360care.com.br
                    </a>
                </p>
            </div>
        </div>
    )
}
