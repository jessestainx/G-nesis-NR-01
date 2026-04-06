// Validação de variáveis de ambiente obrigatórias.
// Lança erro claro no boot se alguma estiver ausente,
// evitando falhas silenciosas em runtime.

function requireEnv(key: keyof ImportMetaEnv): string {
    const value = import.meta.env[key]
    if (!value) {
        throw new Error(
            `[env] Variável obrigatória ausente: ${key}\n` +
            `Verifique o arquivo .env.${import.meta.env.MODE}`
        )
    }
    return value
}

export const env = {
    supabaseUrl: requireEnv('VITE_SUPABASE_URL'),
    supabaseAnonKey: requireEnv('VITE_SUPABASE_ANON_KEY'),
    appEnv: requireEnv('VITE_APP_ENV') as 'development' | 'staging' | 'production',
    appName: import.meta.env.VITE_APP_NAME ?? 'Gênesis NR-01',
    appUrl: import.meta.env.VITE_APP_URL ?? 'http://localhost:5173',
    isDev: import.meta.env.VITE_APP_ENV === 'development',
    isStaging: import.meta.env.VITE_APP_ENV === 'staging',
    isProd: import.meta.env.VITE_APP_ENV === 'production',
} as const
