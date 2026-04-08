import { Briefcase, Clock, BarChart2, AlertTriangle } from 'lucide-react'

const MOCK_STATS = [
    { label: 'Casos ativos', value: '—', icon: Briefcase, color: 'text-[#00A898]', bg: 'bg-[#00A898]/10' },
    { label: 'Aguardando triagem', value: '—', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Alta complexidade', value: '—', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Concluídos (30d)', value: '—', icon: BarChart2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
]

export function ProfessionalCasesPage() {
    return (
        <div className="space-y-6 p-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Casos Clínicos</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Acompanhamento individual de casos identificados nas organizações.
                    </p>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                    Em desenvolvimento
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {MOCK_STATS.map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${bg}`}>
                            <Icon className={`h-5 w-5 ${color}`} />
                        </span>
                        <div>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="rounded-xl border border-dashed border-[#00A898]/40 bg-[#00A898]/5 p-10 text-center">
                <Briefcase className="mx-auto mb-4 h-10 w-10 text-[#00A898]/50" />
                <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300">
                    Módulo de Casos Clínicos
                </h3>
                <p className="mt-2 max-w-md mx-auto text-sm text-gray-500 dark:text-gray-400">
                    O módulo de gestão de casos individuais está em desenvolvimento. 
                    Permitirá o acompanhamento sigiloso de colaboradores, histórico de 
                    atendimentos e plano terapêutico.
                </p>
                <p className="mt-4 text-xs text-gray-400">Disponível em breve</p>
            </div>
        </div>
    )
}
