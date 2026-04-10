/**
 * Hook de branding multi-tenant.
 *
 * Quando um usuário client/collaborator/professional está logado,
 * busca as org_settings da organização e aplica a cor primária como
 * CSS custom property --brand-primary no :root do documento.
 *
 * O logo da org é exposto via retorno do hook para uso no Header/Sidebar.
 */
import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useOrgSettings } from '@/hooks/queries/useOrgSettings'

/** Converte hex #RRGGBB para "H S% L%" para uso com CSS variables HSL */
function hexToHsl(hex: string): string | null {
    const m = hex.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)
    if (!m) return null
    const r = parseInt(m[1], 16) / 255
    const g = parseInt(m[2], 16) / 255
    const b = parseInt(m[3], 16) / 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    let h = 0, s = 0
    const l = (max + min) / 2
    if (max !== min) {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
            case g: h = ((b - r) / d + 2) / 6; break
            case b: h = ((r - g) / d + 4) / 6; break
        }
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

export function useOrgBranding() {
    const { profile, role } = useAuth()
    const orgId = profile?.organization_id ?? ''

    // Só busca branding para roles que têm organização associada
    const enabled = !!orgId && role !== 'genesis'
    const { data: settings } = useOrgSettings(enabled ? orgId : '')

    // Aplicar cor primária como CSS var para uso do Tailwind
    useEffect(() => {
        if (!settings?.primary_color) return
        const hsl = hexToHsl(settings.primary_color)
        if (!hsl) return
        document.documentElement.style.setProperty('--brand-primary', hsl)
        return () => {
            // Restaurar cor padrão teal ao desmontar
            document.documentElement.style.removeProperty('--brand-primary')
        }
    }, [settings?.primary_color])

    return {
        logoUrl:    settings?.logo_url ?? null,
        color:      settings?.primary_color ?? null,
        tagline:    settings?.company_tagline ?? null,
        orgName:    null as string | null, // preenchido pelo componente via useOrganization
        hasCustom:  !!settings?.logo_url || (!!settings?.primary_color && settings.primary_color !== '#00A898'),
    }
}
