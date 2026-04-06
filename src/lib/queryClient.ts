import { QueryClient } from '@tanstack/react-query'
import { env } from '@/lib/env'

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5,       // 5 minutos
            gcTime: 1000 * 60 * 10,         // 10 minutos
            retry: env.isProd ? 2 : 0,      // sem retry em dev (falha rápida)
            refetchOnWindowFocus: env.isProd,
        },
        mutations: {
            retry: 0,
        },
    },
})
