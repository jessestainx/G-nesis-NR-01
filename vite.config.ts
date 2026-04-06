import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')

    return {
        plugins: [react()],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
        server: {
            port: 5173,
        },
        build: {
            sourcemap: mode !== 'production',
        },
        define: {
            __APP_ENV__: JSON.stringify(env.VITE_APP_ENV),
        },
    }
})
