import { useRef } from 'react'
import { FileDown, X } from 'lucide-react'
import type { PsychosocialDiagnosis, PsychosocialRisk } from '@/types'
import { formatDate, diagnosisStatusLabel, riskLevelLabel } from '@/utils/format'

interface DiagnosisReportProps {
    orgName: string
    diagnosis: PsychosocialDiagnosis
    risks: PsychosocialRisk[]
    onClose: () => void
}

const riskLevelColor: Record<string, string> = {
    critical: '#dc2626',
    high: '#ea580c',
    medium: '#ca8a04',
    low: '#16a34a',
}

export function DiagnosisReport({ orgName, diagnosis, risks, onClose }: DiagnosisReportProps) {
    const printRef = useRef<HTMLDivElement>(null)
    const responseRate = diagnosis.total_invited > 0
        ? Math.round((diagnosis.total_responded / diagnosis.total_invited) * 100)
        : 0
    const today = new Date().toLocaleDateString('pt-BR')

    function handlePrint() {
        const content = printRef.current?.innerHTML ?? ''
        const win = window.open('', '_blank', 'width=900,height=700')
        if (!win) return
        win.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>Relatório — ${diagnosis.title}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #111; background: #fff; padding: 24px 32px; }
  h1 { font-size: 20px; color: #162136; margin-bottom: 4px; }
  h2 { font-size: 13px; font-weight: 700; color: #374151; margin: 18px 0 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; }
  .meta { color: #6b7280; font-size: 11px; margin-top: 2px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; background: #d1fae5; color: #065f46; }
  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  th { background: #f3f4f6; text-align: left; padding: 6px 10px; font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; }
  td { padding: 6px 10px; border-bottom: 1px solid #f3f4f6; font-size: 11px; }
  .kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 4px; }
  .kpi { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 14px; }
  .kpi-val { font-size: 20px; font-weight: 700; color: #162136; }
  .kpi-lbl { font-size: 10px; color: #6b7280; margin-top: 2px; }
  .progress-wrap { background: #e5e7eb; border-radius: 4px; height: 8px; margin-top: 4px; }
  .progress-bar { background: #00A898; border-radius: 4px; height: 8px; }
  .footer { margin-top: 32px; color: #9ca3af; font-size: 10px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 12px; }
  @media print { body { padding: 12px 16px; } }
</style>
</head>
<body>
${content}
<div class="footer">Relatório gerado em ${today} &bull; Gênesis 360Care &bull; Portal NR-01</div>
</body>
</html>`)
        win.document.close()
        win.focus()
        setTimeout(() => { win.print(); win.close() }, 400)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-10">
            <div className="w-full max-w-3xl rounded-xl bg-white shadow-2xl dark:bg-gray-900">
                {/* Modal header */}
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Prévia do Relatório</h2>
                        <p className="text-xs text-gray-500">{orgName} — {diagnosis.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 rounded-lg bg-[#162136] px-4 py-2 text-sm text-white hover:bg-[#1E2F4A]"
                        >
                            <FileDown size={14} /> Baixar PDF
                        </button>
                        <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Preview content */}
                <div className="overflow-y-auto p-6" style={{ maxHeight: '70vh' }}>
                    <div ref={printRef} className="space-y-5 font-sans text-sm text-gray-900">
                        {/* Report header */}
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-xl font-bold text-[#162136]">{diagnosis.title}</h1>
                                <p className="mt-1 text-xs text-gray-500">{orgName} &bull; Relatório de Diagnóstico Psicossocial NR-01</p>
                            </div>
                            <p className="text-xs text-gray-400">{today}</p>
                        </div>

                        {/* KPIs */}
                        <h2 className="border-b border-gray-200 pb-1 text-xs font-bold uppercase tracking-wide text-gray-500">Sumário Executivo</h2>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: 'Participantes convidados', value: diagnosis.total_invited },
                                { label: 'Respostas recebidas', value: diagnosis.total_responded },
                                { label: 'Taxa de resposta', value: `${responseRate}%` },
                            ].map((k) => (
                                <div key={k.label} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                    <p className="text-lg font-bold text-[#162136]">{k.value}</p>
                                    <p className="mt-0.5 text-xs text-gray-500">{k.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Progress bar */}
                        <div>
                            <div className="mb-1 flex justify-between text-xs text-gray-500">
                                <span>Taxa de participação</span><span>{responseRate}%</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-gray-200">
                                <div className="h-2 rounded-full bg-[#00A898]" style={{ width: `${responseRate}%` }} />
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-3 gap-3 text-xs">
                            <div>
                                <p className="font-medium text-gray-500">Status</p>
                                <p className="mt-0.5 font-semibold text-gray-900">{diagnosisStatusLabel[diagnosis.status] ?? diagnosis.status}</p>
                            </div>
                            <div>
                                <p className="font-medium text-gray-500">Início</p>
                                <p className="mt-0.5 font-semibold text-gray-900">{formatDate(diagnosis.started_at) || '—'}</p>
                            </div>
                            <div>
                                <p className="font-medium text-gray-500">Conclusão</p>
                                <p className="mt-0.5 font-semibold text-gray-900">{formatDate(diagnosis.completed_at) || '—'}</p>
                            </div>
                        </div>

                        {/* Risks */}
                        {risks.length > 0 && (
                            <>
                                <h2 className="border-b border-gray-200 pb-1 text-xs font-bold uppercase tracking-wide text-gray-500">
                                    Riscos Identificados ({risks.length})
                                </h2>
                                <table className="w-full border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-500">Categoria</th>
                                            <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-500">Descrição</th>
                                            <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-500">Nível</th>
                                            <th className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-500">Identificado em</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {risks.map((r) => (
                                            <tr key={r.id} className="border-b border-gray-100">
                                                <td className="px-3 py-2 font-medium text-gray-900">{r.category}</td>
                                                <td className="px-3 py-2 text-gray-600 max-w-xs">{r.description}</td>
                                                <td className="px-3 py-2">
                                                    <span style={{ color: riskLevelColor[r.level] }} className="font-semibold">
                                                        {riskLevelLabel[r.level] ?? r.level}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2 text-gray-500">{formatDate(r.identified_at)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </>
                        )}

                        {/* Disclaimer */}
                        <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                            Este relatório foi gerado automaticamente pela plataforma Gênesis 360Care. As informações refletem
                            os dados registrados até a data de geração. Deve ser complementado por análise técnica do profissional responsável.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
