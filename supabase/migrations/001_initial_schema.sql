-- ============================================================
-- Migração 001: Schema inicial — Gênesis NR-01
-- ============================================================

-- Habilitar UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Enums ────────────────────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM (
  'genesis',
  'professional',
  'client_executive',
  'collaborator'
);

CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TYPE action_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'cancelled'
);

CREATE TYPE diagnosis_status AS ENUM ('draft', 'in_progress', 'completed', 'archived');

CREATE TYPE contract_status AS ENUM ('active', 'suspended', 'cancelled', 'expired');

-- ─── Tabela: organizations ────────────────────────────────────────────────────
CREATE TABLE organizations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  cnpj            TEXT UNIQUE,
  industry        TEXT,
  employee_count  INTEGER,
  responsible_name  TEXT,
  responsible_email TEXT,
  plan            TEXT CHECK (plan IN ('basic', 'standard', 'premium')),
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'suspended', 'inactive')),
  owner_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Tabela: profiles ─────────────────────────────────────────────────────────
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  name            TEXT,
  role            user_role NOT NULL DEFAULT 'collaborator',
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  avatar_url      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger para criar perfil automaticamente após signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  -- Define o role se já vier no metadata (ex: usuário admin criado via painel)
  IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
    UPDATE public.profiles
    SET role = (NEW.raw_user_meta_data->>'role')::user_role
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Tabela: organization_units ───────────────────────────────────────────────
CREATE TABLE organization_units (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  type             TEXT NOT NULL CHECK (type IN ('department','team','branch','unit')),
  parent_unit_id   UUID REFERENCES organization_units(id) ON DELETE SET NULL,
  manager_name     TEXT,
  employee_count   INTEGER,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Tabela: diagnoses ────────────────────────────────────────────────────────
CREATE TABLE diagnoses (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  status           diagnosis_status NOT NULL DEFAULT 'draft',
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  total_invited    INTEGER NOT NULL DEFAULT 0,
  total_responded  INTEGER NOT NULL DEFAULT 0,
  created_by       UUID NOT NULL REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Tabela: psychosocial_risks ───────────────────────────────────────────────
CREATE TABLE psychosocial_risks (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  diagnosis_id     UUID REFERENCES diagnoses(id) ON DELETE SET NULL,
  category         TEXT NOT NULL,
  description      TEXT NOT NULL,
  level            risk_level NOT NULL DEFAULT 'medium',
  affected_unit_id UUID REFERENCES organization_units(id) ON DELETE SET NULL,
  identified_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by       UUID NOT NULL REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Tabela: action_plans ─────────────────────────────────────────────────────
CREATE TABLE action_plans (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  status           action_status NOT NULL DEFAULT 'pending',
  due_date         DATE,
  responsible_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  progress_pct     INTEGER NOT NULL DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  created_by       UUID NOT NULL REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Tabela: action_items ─────────────────────────────────────────────────────
CREATE TABLE action_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action_plan_id  UUID NOT NULL REFERENCES action_plans(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  status          action_status NOT NULL DEFAULT 'pending',
  due_date        DATE,
  responsible_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Tabela: documents ────────────────────────────────────────────────────────
CREATE TABLE documents (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  document_type    TEXT NOT NULL,
  storage_path     TEXT NOT NULL,
  size_bytes       BIGINT,
  uploaded_by      UUID NOT NULL REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Tabela: trainings ────────────────────────────────────────────────────────
CREATE TABLE trainings (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id   UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT,
  type              TEXT NOT NULL CHECK (type IN ('online','in_person','hybrid')),
  status            TEXT NOT NULL DEFAULT 'scheduled'
                      CHECK (status IN ('scheduled','in_progress','completed','cancelled')),
  scheduled_date    TIMESTAMPTZ,
  completed_date    TIMESTAMPTZ,
  instructor        TEXT,
  participant_count INTEGER NOT NULL DEFAULT 0,
  created_by        UUID NOT NULL REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Tabela: pulse_surveys ────────────────────────────────────────────────────
CREATE TABLE pulse_surveys (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft','active','closed')),
  opened_at        TIMESTAMPTZ,
  closed_at        TIMESTAMPTZ,
  total_invited    INTEGER NOT NULL DEFAULT 0,
  total_responded  INTEGER NOT NULL DEFAULT 0,
  created_by       UUID NOT NULL REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Tabela: crm_contacts ─────────────────────────────────────────────────────
CREATE TABLE crm_contacts (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  UUID REFERENCES organizations(id) ON DELETE SET NULL,
  name             TEXT NOT NULL,
  email            TEXT,
  phone            TEXT,
  company          TEXT,
  stage            TEXT NOT NULL DEFAULT 'lead'
                     CHECK (stage IN ('lead','prospect','proposal','negotiation','closed_won','closed_lost')),
  assigned_to      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Tabela: contracts ────────────────────────────────────────────────────────
CREATE TABLE contracts (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  value            NUMERIC(12,2) NOT NULL DEFAULT 0,
  status           contract_status NOT NULL DEFAULT 'draft',
  start_date       DATE NOT NULL,
  end_date         DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Tabela: financial_transactions ──────────────────────────────────────────
CREATE TABLE financial_transactions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  UUID REFERENCES organizations(id) ON DELETE SET NULL,
  type             TEXT NOT NULL CHECK (type IN ('revenue','expense','commission')),
  amount           NUMERIC(12,2) NOT NULL,
  description      TEXT NOT NULL,
  category         TEXT,
  reference_date   DATE NOT NULL,
  created_by       UUID NOT NULL REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Tabela: audit_logs ───────────────────────────────────────────────────────
CREATE TABLE audit_logs (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id  UUID REFERENCES organizations(id) ON DELETE SET NULL,
  action           TEXT NOT NULL,
  table_name       TEXT NOT NULL,
  record_id        UUID,
  old_data         JSONB,
  new_data         JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de desempenho
CREATE INDEX idx_profiles_org         ON profiles(organization_id);
CREATE INDEX idx_diagnoses_org        ON diagnoses(organization_id);
CREATE INDEX idx_action_plans_org     ON action_plans(organization_id);
CREATE INDEX idx_action_plans_resp    ON action_plans(responsible_id);
CREATE INDEX idx_documents_org        ON documents(organization_id);
CREATE INDEX idx_crm_contacts_org     ON crm_contacts(organization_id);
CREATE INDEX idx_contracts_org        ON contracts(organization_id);
CREATE INDEX idx_transactions_org     ON financial_transactions(organization_id);
CREATE INDEX idx_audit_logs_user      ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_org       ON audit_logs(organization_id);
