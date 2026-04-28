export type WizardPlan = 'basic' | 'standard' | 'premium'

export type WizardValues = {
    name: string
    cnpj: string
    industry: string
    employee_count: string
    plan: WizardPlan
    responsible_name: string
    responsible_email: string
    responsible_phone: string
    responsible_role: string
    primary_color: string
    logo_url: string
    invite_now: boolean
    invite_email: string
    invite_message: string
}

export const initialValues: WizardValues = {
    name: '',
    cnpj: '',
    industry: '',
    employee_count: '',
    plan: 'basic',
    responsible_name: '',
    responsible_email: '',
    responsible_phone: '',
    responsible_role: '',
    primary_color: '#00A898',
    logo_url: '',
    invite_now: true,
    invite_email: '',
    invite_message: '',
}

export const planDescriptions: Record<WizardPlan, string> = {
    basic: 'Essencial para começar com NR-01',
    standard: 'Recursos intermediários de gestão e acompanhamento',
    premium: 'Operação completa com maior capacidade e escala',
}
