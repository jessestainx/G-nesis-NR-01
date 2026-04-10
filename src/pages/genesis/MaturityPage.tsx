import { useMemo, useState } from 'react'
import { useOrganizations } from '@/hooks/queries/useOrganizations'
import { useDiagnoses } from '@/hooks/queries/useDiagnosis'
import { useActionPlans } from '@/hooks/queries/useActionPlans'
import { usePulseSurveys } from '@/hooks/queries/usePulseSurveys'
import { useRisks } from '@/hooks/queries/useDiagnosis'
import { useTrainings } from '@/hooks/queries/useTrainings'
import { SectionLoader } from '@/components/ui/LoadingSpinner'
import { BarChart3, ChevronDown } from 'lucide-react'

// ─── NR-01 dimensions ────────────────────────────────────────────────────────

const DIMENSIONS = [
    { key: 'diagnostico',    label: 'Diagnóstico' },
    { key: 'gestao_riscos',  label: 'Gestão de Riscos' },
    { key: 'planos_acao',    label: 'Planos de Ação' },
    { key: 'pesquisa_pulso', label: 'Pesquisa de Pulso' },
    { key: 'treinamentos',   label: 'Treinamentos' },
    { key: 'documentacao',   label: 'Documentação' },
] as const

type DimKey = (typeof DIMENSIONS)[number]['key']
type Scores = Record<DimKey, number>

// ─── Radar SVG ────────────────────────────────────────────────────────────────

const CX = 200
const CY = 200
const R = 160
const N = DIMENSIONS.length

function polarToXY(angle: number, r: number) {
    const rad = (angle - 90) * (Math.PI / 180)
    return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) }
}

function RadarChart({ scores }: { scores: Scores }) {
    const angleStep = 360 / N
    const rings = [0.2, 0.4, 0.6, 0.8, 1.0]

    const axisPoints = DIMENSIONS.map((_, i) => polarToXY(i * angleStep, R))

    const dataPoints = DIMENSIONS.map((d, i) => {
        const val = (scores[d.key] / 100) * R
        return polarToXY(i * angleStep, val)
    })
    const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'

    const labelPoints = DIMENSIONS.map((_, i) => polarToXY(i * angleStep, R + 28))

    return (
        <svg viewBox="0 0 400 400" className="w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto" aria-label="Radar de Maturidade NR-01">
            {/* Rings */}
            {rings.map((pct) => {
                const ringPoints = DIMENSIONS.map((_, i) => polarToXY(i * angleStep, R * pct))
                const ringPath = ringPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'
                return (
                    <g key={pct}>
                        <path d={ringPath} fill="none" stroke="#e5e7eb" strokeWidth="1" className="dark:stroke-gray-600" />
                        <text x={CX + 4} y={CY - R * pct + 4} fontSize="8" fill="#9ca3af" className="dark:fill-gray-500">
                            {Math.round(pct * 100)}
                        </text>
                    </g>
                )
            })}

            {/* Axes */}
            {axisPoints.map((p, i) => (
                <line key={i} x1={CX} y1={CY} x2={p.x} y2={p.y} stroke="#e5e7eb" strokeWidth="1" className="dark:stroke-gray-600" />
            ))}

            {/* Data polygon */}
            <path d={dataPath} fill="#00A898" fillOpacity="0.25" stroke="#00A898" strokeWidth="2" />

            {/* Data dots */}
            {dataPoints.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="4" fill="#00A898" />
            ))}

            {/* Labels */}
            {labelPoints.map((p, i) => {
                const score = scores[DIMENSIONS[i].key]
                return (
                    <text
                        key={i}
                        x={p.x}
                        y={p.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="10"
                        fontWeight="600"
                        fill="#374151"
                        className="dark:fill-gray-300"
                    >
                        {DIMENSIONS[i].label}
                        <tspan x={p.x} dy="12" fontSize="9" fontWeight="400" fill="#6b7280">
                            {score}%
                        </tspan>
                    </text>
                )
            })}

            {/* Center score */}
            {(() => {
                const avg = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / N)
                const color = avg >= 70 ? '#10b981' : avg >= 40 ? '#f59e0b' : '#ef4444'
                return (
                    <text x={CX} y={CY - 6} textAnchor="middle" fontSize="22" fontWeight="700" fill={color}>
                        {avg}%
                    </text>
                )
            })()}
            <text x={CX} y={CY + 14} textAnchor="middle" fontSize="9" fill="#9ca3af">maturidade</text>
        </svg>
    )
}

// ─── Score badge ──────────────────────────────────────────────────────────────

function ScoreBar({ label, score }: { label: string; score: number }) {
    const color = score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-rose-500'
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">{label}</span>
                <span className="font-semibold text-gray-900 dark:text-white">{score}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-700">
                <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
            </div>
        </div>
    )
}

// ─── Score calculator for an org ─────────────────────────────────────────────

function useOrgMaturity(orgId: string) {
    const diagnoses = useDiagnoses(orgId)
    const actionPlans = useActionPlans(orgId)
    const pulse = usePulseSurveys(orgId)
    const risks = useRisks(orgId)
    const trainings = useTrainings(orgId)

    const isLoading = diagnoses.isLoading || actionPlans.isLoading || pulse.isLoading || risks.isLoading || trainings.isLoading

    const scores = useMemo<Scores>(() => {
        // Diagnóstico: tem ≥1 concluído = 100, em andamento = 60, apenas rascunho = 20, nenhum = 0
        const diags = diagnoses.data ?? []
        const diagScore = diags.some((d) => d.status === 'completed') ? 100
            : diags.some((d) => d.status === 'in_progress') ? 60
            : diags.length > 0 ? 20 : 0

        // Gestão de riscos: baseado em % de riscos mitigados (level = critical/high vs total)
        const allRisks = risks.data ?? []
        const highRisks = allRisks.filter((r) => r.level === 'critical' || r.level === 'high').length
        const gestaoScore = allRisks.length === 0 ? 0
            : Math.round(((allRisks.length - highRisks) / allRisks.length) * 100)

        // Planos de ação: % de planos concluídos
        const plans = actionPlans.data ?? []
        const completedPlans = plans.filter((p) => p.status === 'completed').length
        const planosScore = plans.length === 0 ? 0 : Math.round((completedPlans / plans.length) * 100)

        // Pesquisa de pulso: tem pesquisa closed com taxa ≥50% = 100, active = 60, draft = 20, nenhuma = 0
        const surveys = pulse.data ?? []
        const pulsoScore = surveys.some((s) => {
            if (s.status !== 'closed') return false
            const rate = s.total_invited > 0 ? (s.total_responded / s.total_invited) : 0
            return rate >= 0.5
        }) ? 100
            : surveys.some((s) => s.status === 'active') ? 60
            : surveys.some((s) => s.status === 'closed') ? 40
            : surveys.length > 0 ? 20 : 0

        // Treinamentos: % de completed
        const allTrainings = trainings.data ?? []
        const completedTr = allTrainings.filter((t) => t.status === 'completed').length
        const trainScore = allTrainings.length === 0 ? 0 : Math.round((completedTr / allTrainings.length) * 100)

        // Documentação: tem ≥1 diagnóstico completed E ≥1 plano = 80, apenas diag = 40, nenhum = 0
        const docScore = diagScore === 100 && plans.length > 0 ? 80
            : diagScore === 100 ? 40
            : diagScore > 0 ? 20 : 0

        return {
            diagnostico: diagScore,
            gestao_riscos: gestaoScore,
            planos_acao: planosScore,
            pesquisa_pulso: pulsoScore,
            treinamentos: trainScore,
            documentacao: docScore,
        }
    }, [diagnoses.data, actionPlans.data, pulse.data, risks.data, trainings.data])

    return { scores, isLoading }
}

// ─── Org card ─────────────────────────────────────────────────────────────────

function OrgMaturityCard({ orgId, orgName }: { orgId: string; orgName: string }) {
    const { scores, isLoading } = useOrgMaturity(orgId)
    const [expanded, setExpanded] = useState(false)
    const avg = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / DIMENSIONS.length)
    const levelColor = avg >= 70 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400'
        : avg >= 40 ? 'text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400'
        : 'text-rose-600 bg-rose-50 dark:bg-rose-950 dark:text-rose-400'
    const levelLabel = avg >= 70 ? 'Maduro' : avg >= 40 ? 'Em desenvolvimento' : 'Inicial'

    return (
        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <button
                onClick={() => setExpanded((v) => !v)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${levelColor}`}>
                        {avg}%
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{orgName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{levelLabel}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Mini progress bar */}
                    <div className="hidden sm:block h-2 w-24 rounded-full bg-gray-100 dark:bg-gray-700">
                        <div
                            className={`h-2 rounded-full ${avg >= 70 ? 'bg-emerald-500' : avg >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                            style={{ width: `${avg}%` }}
                        />
                    </div>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {expanded && (
                <div className="border-t border-gray-100 dark:border-gray-700 px-5 pb-5 pt-4">
                    {isLoading ? (
                        <div className="py-4 text-center text-sm text-gray-400">Carregando dados…</div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2">
                            <RadarChart scores={scores} />
                            <div className="space-y-3 flex flex-col justify-center">
                                {DIMENSIONS.map((d) => (
                                    <ScoreBar key={d.key} label={d.label} score={scores[d.key]} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function MaturityPage() {
    const { data: orgs, isLoading, error } = useOrganizations()

    if (isLoading) return <SectionLoader />
    if (error) return (
        <div className="p-6 text-sm text-red-600">Erro ao carregar organizações.</div>
    )

    const activeOrgs = (orgs ?? []).filter((o) => o.status === 'active')

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-start gap-3">
                <BarChart3 className="mt-0.5 h-7 w-7 shrink-0 text-[#00A898]" />
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Maturidade NR-01</h1>
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                        Avaliação do nível de conformidade psicossocial por organização
                    </p>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                    <span className="text-gray-500">Inicial (0–39%)</span>
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <span className="text-gray-500">Em desenvolvimento (40–69%)</span>
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span className="text-gray-500">Maduro (70–100%)</span>
                </span>
            </div>

            {activeOrgs.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 py-16 text-center dark:border-gray-600">
                    <BarChart3 className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                    <p className="text-sm text-gray-500">Nenhuma organização ativa encontrada.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {activeOrgs.map((org) => (
                        <OrgMaturityCard key={org.id} orgId={org.id} orgName={org.name} />
                    ))}
                </div>
            )}
        </div>
    )
}
