import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// ─── Tipos ────────────────────────────────────────────────────────────────────
export interface QueryResult<T> {
    data: T | null
    error: string | null
}

export interface QueryListResult<T> {
    data: T[]
    error: string | null
    count: number | null
}

export interface PaginationParams {
    page?: number
    pageSize?: number
}

export interface FilterParams {
    search?: string
    orderBy?: string
    orderDir?: 'asc' | 'desc'
}

// ─── Formatador de erro ───────────────────────────────────────────────────────
export function formatError(error: PostgrestError | null, fallback?: string): string | null {
    if (!error) return null
    console.error('[Repository]', error)
    return error.message ?? fallback ?? 'Erro desconhecido'
}

// ─── Cliente sem tipagem de schema (usada até gerar types via Supabase CLI) ───
// Após executar: npx supabase gen types typescript --project-id ID > src/types/database.ts
// remova este cast e o supabase client passará a ser totalmente tipado.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = supabase as SupabaseClient<any>

// ─── Base Repository ──────────────────────────────────────────────────────────
export class BaseRepository<T extends { id: string }> {
    protected readonly table: string

    constructor(table: string) {
        this.table = table
    }

    async findById(id: string): Promise<QueryResult<T>> {
        const { data, error } = await db
            .from(this.table)
            .select('*')
            .eq('id', id)
            .single()

        return { data: data as T | null, error: formatError(error) }
    }

    async findAll(params?: PaginationParams & FilterParams): Promise<QueryListResult<T>> {
        let query = db.from(this.table).select('*', { count: 'exact' })

        if (params?.orderBy) {
            query = query.order(params.orderBy, {
                ascending: params.orderDir !== 'desc',
            })
        }

        if (params?.page !== undefined && params?.pageSize) {
            const from = params.page * params.pageSize
            const to = from + params.pageSize - 1
            query = query.range(from, to)
        }

        const { data, error, count } = await query

        return { data: (data as T[]) ?? [], error: formatError(error), count }
    }

    async create(
        payload: Omit<T, 'id' | 'created_at' | 'updated_at'>,
    ): Promise<QueryResult<T>> {
        const { data, error } = await db
            .from(this.table)
            .insert(payload)
            .select()
            .single()

        return { data: data as T | null, error: formatError(error) }
    }

    async update(
        id: string,
        payload: Partial<Omit<T, 'id' | 'created_at'>>,
    ): Promise<QueryResult<T>> {
        const { data, error } = await db
            .from(this.table)
            .update(payload)
            .eq('id', id)
            .select()
            .single()

        return { data: data as T | null, error: formatError(error) }
    }

    async delete(id: string): Promise<{ error: string | null }> {
        const { error } = await db.from(this.table).delete().eq('id', id)
        return { error: formatError(error) }
    }
}
