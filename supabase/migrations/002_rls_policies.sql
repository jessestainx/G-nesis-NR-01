-- ============================================================
-- Migração 002: Row Level Security (RLS)
-- ============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_units      ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnoses               ENABLE ROW LEVEL SECURITY;
ALTER TABLE psychosocial_risks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_plans            ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents               ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainings               ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulse_surveys           ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts               ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs              ENABLE ROW LEVEL SECURITY;

-- ─── Helper: papel do usuário atual ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role::TEXT FROM public.profiles WHERE id = auth.uid()
$$;

-- ─── Helper: organização do usuário atual ─────────────────────────────────────
CREATE OR REPLACE FUNCTION auth.user_organization()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
$$;

-- ─── Policies: profiles ───────────────────────────────────────────────────────
CREATE POLICY "Usuário lê próprio perfil"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "genesis lê todos os perfis"
  ON profiles FOR SELECT
  USING (auth.user_role() = 'genesis');

CREATE POLICY "Professional lê perfis da sua org"
  ON profiles FOR SELECT
  USING (
    auth.user_role() = 'professional'
    AND organization_id = auth.user_organization()
  );

CREATE POLICY "Usuário atualiza próprio perfil"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "genesis atualiza qualquer perfil"
  ON profiles FOR UPDATE
  USING (auth.user_role() = 'genesis');

-- ─── Policies: organizations ──────────────────────────────────────────────────
CREATE POLICY "genesis gerencia organizações"
  ON organizations FOR ALL
  USING (auth.user_role() = 'genesis');

CREATE POLICY "Professional vê sua organização"
  ON organizations FOR SELECT
  USING (id = auth.user_organization());

CREATE POLICY "Cliente vê sua organização"
  ON organizations FOR SELECT
  USING (id = auth.user_organization());

-- ─── Policies: diagnoses ──────────────────────────────────────────────────────
CREATE POLICY "genesis e professional gerenciam diagnósticos"
  ON diagnoses FOR ALL
  USING (auth.user_role() IN ('genesis', 'professional'));

CREATE POLICY "client_executive vê diagnósticos da org"
  ON diagnoses FOR SELECT
  USING (
    auth.user_role() = 'client_executive'
    AND organization_id = auth.user_organization()
  );

-- ─── Policies: action_plans ───────────────────────────────────────────────────
CREATE POLICY "genesis e professional gerenciam planos"
  ON action_plans FOR ALL
  USING (auth.user_role() IN ('genesis', 'professional'));

CREATE POLICY "client_executive vê planos da org"
  ON action_plans FOR SELECT
  USING (
    auth.user_role() = 'client_executive'
    AND organization_id = auth.user_organization()
  );

CREATE POLICY "Responsável vê seus planos"
  ON action_plans FOR SELECT
  USING (responsible_id = auth.uid());

-- ─── Policies: documents ──────────────────────────────────────────────────────
CREATE POLICY "genesis e professional gerenciam documentos"
  ON documents FOR ALL
  USING (auth.user_role() IN ('genesis', 'professional'));

CREATE POLICY "Membros da org veem documentos"
  ON documents FOR SELECT
  USING (organization_id = auth.user_organization());

-- ─── Policies: crm_contacts ───────────────────────────────────────────────────
CREATE POLICY "genesis e professional gerenciam CRM"
  ON crm_contacts FOR ALL
  USING (auth.user_role() IN ('genesis', 'professional'));

-- ─── Policies: contracts ──────────────────────────────────────────────────────
CREATE POLICY "genesis e professional gerenciam contratos"
  ON contracts FOR ALL
  USING (auth.user_role() IN ('genesis', 'professional'));

-- ─── Policies: financial_transactions ────────────────────────────────────────
CREATE POLICY "Somente genesis gerencia financeiro"
  ON financial_transactions FOR ALL
  USING (auth.user_role() = 'genesis');

-- ─── Policies: audit_logs ─────────────────────────────────────────────────────
CREATE POLICY "genesis lê audit logs"
  ON audit_logs FOR SELECT
  USING (auth.user_role() = 'genesis');

CREATE POLICY "Sistema insere audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);
