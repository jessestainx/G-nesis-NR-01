-- ============================================================
-- Migração 004: RLS Trainings + Pulse + Tabela pulse_responses
-- ============================================================

-- Adicionar coluna questions em pulse_surveys
ALTER TABLE pulse_surveys
  ADD COLUMN IF NOT EXISTS questions JSONB NOT NULL DEFAULT '{"questions":[]}';

-- Criar tabela pulse_responses
CREATE TABLE IF NOT EXISTS pulse_responses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id     UUID NOT NULL REFERENCES pulse_surveys(id) ON DELETE CASCADE,
  respondent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers       JSONB NOT NULL DEFAULT '{}',
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (survey_id, respondent_id)
);

ALTER TABLE pulse_responses ENABLE ROW LEVEL SECURITY;

-- Função auxiliar: incrementar contador
CREATE OR REPLACE FUNCTION increment_total_responded(p_survey_id UUID)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE pulse_surveys SET total_responded = total_responded + 1 WHERE id = p_survey_id;
$$;

-- ============================================================
-- RLS: trainings
-- ============================================================
DROP POLICY IF EXISTS "trainings_select" ON trainings;
DROP POLICY IF EXISTS "trainings_insert" ON trainings;
DROP POLICY IF EXISTS "trainings_update" ON trainings;
DROP POLICY IF EXISTS "trainings_delete" ON trainings;

CREATE POLICY "trainings_select" ON trainings FOR SELECT
  USING (auth.user_role() = 'genesis' OR organization_id = auth.user_organization());

CREATE POLICY "trainings_insert" ON trainings FOR INSERT
  WITH CHECK (auth.user_role() = 'genesis' OR (auth.user_role() = 'professional' AND organization_id = auth.user_organization()));

CREATE POLICY "trainings_update" ON trainings FOR UPDATE
  USING (auth.user_role() = 'genesis' OR (auth.user_role() = 'professional' AND organization_id = auth.user_organization()));

CREATE POLICY "trainings_delete" ON trainings FOR DELETE
  USING (auth.user_role() = 'genesis');

-- ============================================================
-- RLS: pulse_surveys
-- ============================================================
DROP POLICY IF EXISTS "pulse_surveys_select" ON pulse_surveys;
DROP POLICY IF EXISTS "pulse_surveys_insert" ON pulse_surveys;
DROP POLICY IF EXISTS "pulse_surveys_update" ON pulse_surveys;
DROP POLICY IF EXISTS "pulse_surveys_delete" ON pulse_surveys;

CREATE POLICY "pulse_surveys_select" ON pulse_surveys FOR SELECT
  USING (auth.user_role() = 'genesis' OR organization_id = auth.user_organization());

CREATE POLICY "pulse_surveys_insert" ON pulse_surveys FOR INSERT
  WITH CHECK (auth.user_role() = 'genesis' OR (auth.user_role() = 'professional' AND organization_id = auth.user_organization()));

CREATE POLICY "pulse_surveys_update" ON pulse_surveys FOR UPDATE
  USING (auth.user_role() = 'genesis' OR (auth.user_role() = 'professional' AND organization_id = auth.user_organization()));

CREATE POLICY "pulse_surveys_delete" ON pulse_surveys FOR DELETE
  USING (auth.user_role() = 'genesis');

-- ============================================================
-- RLS: pulse_responses
-- ============================================================
DROP POLICY IF EXISTS "pulse_responses_select" ON pulse_responses;
DROP POLICY IF EXISTS "pulse_responses_insert" ON pulse_responses;
DROP POLICY IF EXISTS "pulse_responses_delete" ON pulse_responses;

CREATE POLICY "pulse_responses_select" ON pulse_responses FOR SELECT
  USING (
    auth.user_role() = 'genesis'
    OR (auth.user_role() IN ('professional','client_executive') AND survey_id IN (
      SELECT id FROM pulse_surveys WHERE organization_id = auth.user_organization()
    ))
    OR respondent_id = auth.uid()
  );

CREATE POLICY "pulse_responses_insert" ON pulse_responses FOR INSERT
  WITH CHECK (auth.user_role() = 'collaborator' AND respondent_id = auth.uid());

CREATE POLICY "pulse_responses_delete" ON pulse_responses FOR DELETE
  USING (auth.user_role() = 'genesis');
