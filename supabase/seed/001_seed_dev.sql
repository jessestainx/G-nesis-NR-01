-- ============================================================
-- Gênesis NR-01 — Seed para ambiente DEV
-- Execute APENAS no projeto Supabase de development.
-- NUNCA execute em staging ou production.
-- ============================================================

-- PASSO 1: Crie os usuários pelo Supabase Auth Dashboard ou via:
--   supabase auth admin create-user --email admin@genesis.com --password senha123 \
--     --user-metadata '{"name":"Admin Genesis","role":"genesis"}'

-- PASSO 2: Após criar os usuários via Auth, copie os UUIDs gerados
--  e substitua os placeholders abaixo antes de executar.

-- Exemplo de organização para testes
insert into organizations (id, name, cnpj, industry, employee_count, plan, status)
values (
  'ORG_UUID_AQUI',
  'Empresa Teste Ltda',
  '12.345.678/0001-99',
  'Tecnologia',
  150,
  'standard',
  'active'
) on conflict do nothing;

-- Exemplo de unidade organizacional
insert into organization_units (organization_id, name, type, employee_count)
values (
  'ORG_UUID_AQUI',
  'Tecnologia da Informação',
  'department',
  45
) on conflict do nothing;
