-- fix-migrations: contracts + helper functions (public schema) + RLS policies

-- Tabela contracts
CREATE TABLE IF NOT EXISTS contracts (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  value            NUMERIC(12,2) NOT NULL DEFAULT 0,
  status           contract_status NOT NULL DEFAULT 'draft',
  start_date       DATE NOT NULL,
  end_date         DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contracts_org ON contracts(organization_id);
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Helper functions em public (sem permissão auth schema via psql direto)
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role::TEXT FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.user_organization()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
$$;

-- RLS policies (usando public.user_role() e public.user_organization())
DROP POLICY IF EXISTS "genesis lê todos os perfis" ON profiles;
CREATE POLICY "genesis lê todos os perfis" ON profiles FOR SELECT USING (public.user_role() = 'genesis');

DROP POLICY IF EXISTS "Professional lê perfis da sua org" ON profiles;
CREATE POLICY "Professional lê perfis da sua org" ON profiles FOR SELECT USING (public.user_role() = 'professional' AND organization_id = public.user_organization());

DROP POLICY IF EXISTS "genesis atualiza qualquer perfil" ON profiles;
CREATE POLICY "genesis atualiza qualquer perfil" ON profiles FOR UPDATE USING (public.user_role() = 'genesis');

DROP POLICY IF EXISTS "genesis gerencia organizações" ON organizations;
CREATE POLICY "genesis gerencia organizações" ON organizations FOR ALL USING (public.user_role() = 'genesis');

DROP POLICY IF EXISTS "Professional vê sua organização" ON organizations;
CREATE POLICY "Professional vê sua organização" ON organizations FOR SELECT USING (id = public.user_organization());

DROP POLICY IF EXISTS "Cliente vê sua organização" ON organizations;
CREATE POLICY "Cliente vê sua organização" ON organizations FOR SELECT USING (id = public.user_organization());

ALTER TABLE organization_units ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "genesis e professional gerenciam unidades" ON organization_units;
CREATE POLICY "genesis e professional gerenciam unidades" ON organization_units FOR ALL USING (public.user_role() IN ('genesis', 'professional'));
DROP POLICY IF EXISTS "Membros da org veem unidades" ON organization_units;
CREATE POLICY "Membros da org veem unidades" ON organization_units FOR SELECT USING (organization_id = public.user_organization());

DROP POLICY IF EXISTS "genesis e professional gerenciam diagnósticos" ON diagnoses;
CREATE POLICY "genesis e professional gerenciam diagnósticos" ON diagnoses FOR ALL USING (public.user_role() IN ('genesis', 'professional'));
DROP POLICY IF EXISTS "client_executive vê diagnósticos da org" ON diagnoses;
CREATE POLICY "client_executive vê diagnósticos da org" ON diagnoses FOR SELECT USING (public.user_role() = 'client_executive' AND organization_id = public.user_organization());

DROP POLICY IF EXISTS "genesis e professional gerenciam planos" ON action_plans;
CREATE POLICY "genesis e professional gerenciam planos" ON action_plans FOR ALL USING (public.user_role() IN ('genesis', 'professional'));
DROP POLICY IF EXISTS "client_executive vê planos da org" ON action_plans;
CREATE POLICY "client_executive vê planos da org" ON action_plans FOR SELECT USING (public.user_role() = 'client_executive' AND organization_id = public.user_organization());
DROP POLICY IF EXISTS "Responsável vê seus planos" ON action_plans;
CREATE POLICY "Responsável vê seus planos" ON action_plans FOR SELECT USING (responsible_id = auth.uid());

ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "genesis e professional gerenciam itens" ON action_items;
CREATE POLICY "genesis e professional gerenciam itens" ON action_items FOR ALL USING (public.user_role() IN ('genesis', 'professional'));

DROP POLICY IF EXISTS "genesis e professional gerenciam documentos" ON documents;
CREATE POLICY "genesis e professional gerenciam documentos" ON documents FOR ALL USING (public.user_role() IN ('genesis', 'professional'));
DROP POLICY IF EXISTS "Membros da org veem documentos" ON documents;
CREATE POLICY "Membros da org veem documentos" ON documents FOR SELECT USING (organization_id = public.user_organization());

ALTER TABLE psychosocial_risks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "genesis e professional gerenciam riscos" ON psychosocial_risks;
CREATE POLICY "genesis e professional gerenciam riscos" ON psychosocial_risks FOR ALL USING (public.user_role() IN ('genesis', 'professional'));
DROP POLICY IF EXISTS "client_executive vê riscos da org" ON psychosocial_risks;
CREATE POLICY "client_executive vê riscos da org" ON psychosocial_risks FOR SELECT USING (public.user_role() = 'client_executive' AND organization_id = public.user_organization());

ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "genesis e professional gerenciam treinamentos" ON trainings;
CREATE POLICY "genesis e professional gerenciam treinamentos" ON trainings FOR ALL USING (public.user_role() IN ('genesis', 'professional'));
DROP POLICY IF EXISTS "Membros veem treinamentos da org" ON trainings;
CREATE POLICY "Membros veem treinamentos da org" ON trainings FOR SELECT USING (organization_id = public.user_organization());

ALTER TABLE pulse_surveys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "genesis e professional gerenciam pesquisas" ON pulse_surveys;
CREATE POLICY "genesis e professional gerenciam pesquisas" ON pulse_surveys FOR ALL USING (public.user_role() IN ('genesis', 'professional'));

DROP POLICY IF EXISTS "genesis e professional gerenciam CRM" ON crm_contacts;
CREATE POLICY "genesis e professional gerenciam CRM" ON crm_contacts FOR ALL USING (public.user_role() IN ('genesis', 'professional'));

DROP POLICY IF EXISTS "genesis e professional gerenciam contratos" ON contracts;
CREATE POLICY "genesis e professional gerenciam contratos" ON contracts FOR ALL USING (public.user_role() IN ('genesis', 'professional'));

DROP POLICY IF EXISTS "Somente genesis gerencia financeiro" ON financial_transactions;
CREATE POLICY "Somente genesis gerencia financeiro" ON financial_transactions FOR ALL USING (public.user_role() = 'genesis');

DROP POLICY IF EXISTS "genesis lê audit logs" ON audit_logs;
CREATE POLICY "genesis lê audit logs" ON audit_logs FOR SELECT USING (public.user_role() = 'genesis');
DROP POLICY IF EXISTS "Sistema insere audit logs" ON audit_logs;
CREATE POLICY "Sistema insere audit logs" ON audit_logs FOR INSERT WITH CHECK (true);

SELECT 'FIX CONCLUIDO' as status;
