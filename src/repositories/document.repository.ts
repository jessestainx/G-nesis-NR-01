import { supabase } from '@/lib/supabase'
import { db, BaseRepository, formatError } from '@/repositories/base.repository'
import type { QueryResult, QueryListResult } from '@/repositories/base.repository'
import type { Document } from '@/types'

const BUCKET = 'documents'

export class DocumentRepository extends BaseRepository<Document> {
    constructor() { super('documents') }

    async findByOrganization(organizationId: string): Promise<QueryListResult<Document>> {
        const { data, error, count } = await db
            .from('documents').select('*', { count: 'exact' })
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false })
        return { data: (data as Document[]) ?? [], error: formatError(error), count }
    }

    async findByType(organizationId: string, type: string): Promise<QueryListResult<Document>> {
        const { data, error, count } = await db
            .from('documents').select('*', { count: 'exact' })
            .eq('organization_id', organizationId).eq('type', type)
            .order('created_at', { ascending: false })
        return { data: (data as Document[]) ?? [], error: formatError(error), count }
    }

    async upload(params: {
        file: File
        organizationId: string
        type: string
        uploadedBy: string
    }): Promise<QueryResult<Document>> {
        const ext = params.file.name.split('.').pop()
        const storagePath = `${params.organizationId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

        const { error: storageError } = await supabase.storage
            .from(BUCKET).upload(storagePath, params.file, { upsert: false })
        if (storageError) return { data: null, error: storageError.message }

        const { data, error } = await db
            .from('documents')
            .insert({
                organization_id: params.organizationId,
                name: params.file.name,
                type: params.type,
                storage_path: storagePath,
                size_bytes: params.file.size,
                uploaded_by: params.uploadedBy,
            })
            .select().single()
        return { data: data as Document | null, error: formatError(error) }
    }

    async getDownloadUrl(storagePath: string): Promise<{ url: string | null; error: string | null }> {
        const { data, error } = await supabase.storage
            .from(BUCKET).createSignedUrl(storagePath, 3600)
        return { url: data?.signedUrl ?? null, error: error?.message ?? null }
    }

    async remove(id: string, storagePath: string): Promise<{ error: string | null }> {
        const { error: storageError } = await supabase.storage
            .from(BUCKET).remove([storagePath])
        if (storageError) return { error: storageError.message }
        return this.delete(id)
    }
}

export const documentRepository = new DocumentRepository()
