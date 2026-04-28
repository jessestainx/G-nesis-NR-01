import { useState } from 'react'
import { Trash2, X } from 'lucide-react'
import type { Organization } from '@/types'
import { useDeleteOrganization } from '@/hooks/queries/useOrganizations'

export function DeleteOrganizationModal({
    org,
    onClose,
}: {
    org: Organization
    onClose: () => void
}) {
    const del = useDeleteOrganization()
    const [confirm, setConfirm] = useState('')
    const match = confirm === org.name

    async function handleDelete() {
        if (!match) return
        const result = await del.mutateAsync(org.id)
        if (!result?.error) onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <h2 className="text-base font-semibold text-gray-900">Excluir organização</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <div className="space-y-4 px-6 py-4">
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                        <p className="text-sm font-medium text-red-700">ATENÇÃO: Esta ação é irreversível.</p>
                        <p className="mt-1 text-xs text-red-600">
                            Todos os dados serão excluídos: diagnósticos, riscos, planos de ação,
                            documentos e treinamentos.
                        </p>
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm text-gray-700">
                            Para confirmar, digite o nome da organização:
                            <span className="ml-1 font-semibold text-gray-900">{org.name}</span>
                        </label>
                        <input
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            placeholder="Digite o nome exato..."
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                        />
                    </div>
                    {del.error instanceof Error && (
                        <p className="text-xs text-red-600">{del.error.message}</p>
                    )}
                </div>
                <div className="flex justify-end gap-2 border-t px-6 py-4">
                    <button onClick={onClose}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        Cancelar
                    </button>
                    <button onClick={() => void handleDelete()} disabled={!match || del.isPending}
                        className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-40">
                        <Trash2 size={14} />
                        {del.isPending ? 'Excluindo…' : 'Excluir permanentemente'}
                    </button>
                </div>
            </div>
        </div>
    )
}
