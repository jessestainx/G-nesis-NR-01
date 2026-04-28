import { cleanCnpj } from '@/utils/cnpj'

export const CNPJ_RE = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/

export function isEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function formatCnpjInput(value: string): { digits: string; formatted: string } {
    const digits = cleanCnpj(value)
    let formatted = digits
    if (digits.length > 2) formatted = digits.slice(0, 2) + '.' + digits.slice(2)
    if (digits.length > 5) formatted = formatted.slice(0, 6) + '.' + digits.slice(5)
    if (digits.length > 8) formatted = formatted.slice(0, 10) + '/' + digits.slice(8)
    if (digits.length > 12) formatted = formatted.slice(0, 15) + '-' + digits.slice(12, 14)
    return { digits, formatted }
}
