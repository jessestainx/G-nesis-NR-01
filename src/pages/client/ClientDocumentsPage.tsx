import { useRef, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useDocuments, useUploadDocument, useRemoveDocument } from '@/hooks/queries/useDocuments'
import { documentService } from '@/services/document.service'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { formatDate, formatFileSize } from '@/utils/format'
import { FileText, Upload, Trash2, Download } from 'lucide-react'
import type { Document as OrgDocument } from '@/types'

const DOC_TYPES = ['Contrato', 'Relatório', 'PCMSO', 'PPRA', 'NR-01', 'Outros']

function DocRow({ doc, orgId }: { doc: OrgDocument; orgId: string }) {
    const remove = useRemoveDocument()
    const [downloading, setDownloading] = useState(false)

    async function handleDownload() {
        setDownloading(true)
        try {
            const { url } = await documentService.getDownloadUrl(doc.storage_path)
            if (url) {
                const a = window.document.createElement('a')
                a.href = url
                a.download = doc.name
                a.rel = 'noopener noreferrer'
                a.click()
            }
        } finally {
            setDownloading(false)
        }
    }

    return (
        <tr className="border-b border-gray-100 hover:bg-gray-50">
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{doc.name}</span>
                </div>
            </td>
            <td className="px-4 py-3 text-sm text-gray-500">{doc.type}</td>
            <td className="px-4 py-3 text-sm text-gray-500">{formatFileSize(doc.size_bytes)}</td>
            <td className="px-4 py-3 text-sm text-gray-500">{formatDate(doc.created_at)}</td>
            <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => void handleDownload()}
                        disabled={downloading}
                        title="Baixar"
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-[#00A898] disabled:opacity-40">
                        <Download size={15} />
                    </button>
                    <button
                        onClick={() => void remove.mutateAsync({ id: doc.id, storagePath: doc.storage_path, organizationId: orgId })}
                        disabled={remove.isPending}
                        title="Remover"
                        className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40">
                        <Trash2 size={15} />
                    </button>
                </div>
            </td>
        </tr>
    )
}

function UploadArea({ orgId }: { orgId: string }) {
    const upload = useUploadDocument()
    const fileRef = useRef<HTMLInputElement>(null)
    const [docType, setDocType] = useState('Contrato')
    const [uploadError, setUploadError] = useState<string | null>(null)

    async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        setUploadError(null)
        try {
            await upload.mutateAsync({ file, organizationId: orgId, type: docType })
        } catch (err) {
            setUploadError(err instanceof Error ? err.message : 'Erro ao enviar arquivo.')
        } finally {
            if (fileRef.current) fileRef.current.value = ''
        }
    }

    return (
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
            <select value={docType} onChange={(e) => setDocType(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A898]">
                {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input ref={fileRef} type="file" className="hidden" id="doc-upload" onChange={(e) => void handleFile(e)} />
            <label htmlFor="doc-upload"
                className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#162136] px-4 py-2 text-sm text-white hover:bg-[#1E2F4A]">
                <Upload size={14} />
                {upload.isPending ? 'Enviando…' : 'Enviar Arquivo'}
            </label>
            {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
            {upload.isSuccess && <p className="text-xs text-green-600">Arquivo enviado!</p>}
        </div>
    )
}

export function ClientDocumentsPage() {
    const { profile } = useAuth()
    const orgId = profile?.organization_id ?? ''
    const { data: docs, isLoading, error, refetch } = useDocuments(orgId)

    if (!orgId) return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
            <p className="mt-2 text-sm text-gray-500">Conta sem organização associada.</p>
        </div>
    )

    if (isLoading) return <SectionLoader />
    if (error) return <ErrorMessage message="Erro ao carregar documentos" onRetry={() => void refetch()} />

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
                <p className="mt-1 text-sm text-gray-500">Documentos e arquivos da sua organização.</p>
            </div>

            <UploadArea orgId={orgId} />

            {!docs || docs.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
                    <FileText className="mx-auto mb-3 h-8 w-8 text-gray-300" />
                    <p className="text-sm text-gray-500">Nenhum documento disponível.</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-4 py-3">Documento</th>
                                <th className="px-4 py-3">Tipo</th>
                                <th className="px-4 py-3">Tamanho</th>
                                <th className="px-4 py-3">Data</th>
                                <th className="px-4 py-3">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {docs.map((doc) => <DocRow key={doc.id} doc={doc} orgId={orgId} />)}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
