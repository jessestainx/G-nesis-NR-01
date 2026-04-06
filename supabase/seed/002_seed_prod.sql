-- ============================================================
-- Gênesis NR-01 — Seed de produção: Admin Genesis
-- Execute no SQL Editor do Supabase Dashboard APENAS se o
-- script scripts/create-admin.sh não conseguir atualizar o
-- profile automaticamente.
--
-- Preencha os placeholders antes de executar:
--   ADMIN_USER_ID → UUID do usuário criado via Auth
--   ADMIN_EMAIL   → e-mail cadastrado
--   ADMIN_NAME    → nome completo
-- ============================================================

-- 1. Garantir que o perfil existe com role genesis
INSERT INTO public.profiles (id, email, name, role)
VALUES (
  'ADMIN_USER_ID',
  'ADMIN_EMAIL',
  'ADMIN_NAME',
  'genesis'
)
ON CONFLICT (id) DO UPDATE
  SET role = 'genesis',
      name = EXCLUDED.name,
      email = EXCLUDED.email;

-- 2. Verificar que ficou certo
SELECT id, email, name, role, created_at
FROM public.profiles
WHERE id = 'ADMIN_USER_ID';
