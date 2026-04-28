-- ============================================================
-- Migration 011: Views de onboarding (convites + adoção)
-- ============================================================

-- ─── View: pending_invites ────────────────────────────────────────────────────
-- Usuários convidados que ainda não confirmaram e-mail.
CREATE OR REPLACE VIEW public.pending_invites AS
SELECT
    au.id,
    au.email,
    au.created_at AS invited_at,
    p.name,
    p.role,
    p.organization_id
FROM auth.users au
JOIN public.profiles p ON p.id = au.id
WHERE au.email_confirmed_at IS NULL
  AND p.organization_id IS NOT NULL;

GRANT SELECT ON public.pending_invites TO authenticated;

COMMENT ON VIEW public.pending_invites IS
    'Convites pendentes por organização (usuários sem email_confirmed_at).';

-- ─── View: org_adoption_stats ────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.org_adoption_stats AS
SELECT
    o.id AS organization_id,
    o.name,
    o.status,
    COUNT(DISTINCT p.id) AS total_users,
    COUNT(DISTINCT CASE WHEN au.last_sign_in_at IS NOT NULL THEN p.id END) AS users_logged_in,
    COUNT(DISTINCT pr.respondent_id) AS users_with_responses,
    MAX(al.created_at) AS last_activity_at
FROM public.organizations o
LEFT JOIN public.profiles p
    ON p.organization_id = o.id
   AND p.active = true
LEFT JOIN auth.users au
    ON au.id = p.id
LEFT JOIN public.pulse_responses pr
    ON pr.respondent_id = p.id
LEFT JOIN public.audit_logs al
    ON al.organization_id = o.id
GROUP BY o.id, o.name, o.status;

GRANT SELECT ON public.org_adoption_stats TO authenticated;

COMMENT ON VIEW public.org_adoption_stats IS
    'Métricas de adoção por organização: usuários totais, login, respostas e última atividade.';
