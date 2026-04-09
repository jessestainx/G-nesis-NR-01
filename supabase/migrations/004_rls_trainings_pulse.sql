-- ============================================================
-- Migração 004: RLS Trainings + Pulse + Tabela pulse_responses
-- Nota: usa subqueries inline em vez de auth.user_role()
--       pois o SQL Editor do Supabase não permite criar funções no schema auth
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

CREATE OR REPLACE FUNCTION public.increment_total_responded(p_survey_id UUID)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE pulse_surveys SET total_responded = total_responded + 1 WHERE id = p_survey_id;
$$;

-- RLS: trainings
DROP POLICY IF EXISTS "trainings_select" ON trainings;
DROP POLICY IF EXISTS "trainings_insert" ON trainings;
DROP POLICY IF EXISTS "trainings_update" ON trainings;
DROP POLICY IF EXISTS "trainings_delete" ON trainings;

CREATE POLICY "trainings_select" ON trainings FOR SELECT
  USING (
    (SELECT role::TEXT FROM public.profiles WHERE id = auth.uid()) = 'genesis'
    OR organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );
CREATE POLICY "trainings_insert" ON trainings FOR INSERT
  WITH CHECK (
    (SELECT role::TEXT FROM public.profiles WHERE id = auth.uid()) = 'genesis'
    OR ((SELECT role::TEXT FROM public.profiles WHERE id = auth.uid()) = 'professional'
        AND organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  );
CREATE POLICY "trainings_update" ON trainings FOR UPDATE
  USING (
    (SELECT role::TEXT FROM public.profiles WHERE id = auth.uid()) = 'genesis'
    OR ((SELECT role::TEXT FROM public.profiles WHERE id = auth.uid()) = 'professional'
        AND organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  );
CREATE POLICY "trainings_delete" ON trainings FOR DELETE
  USING ((SELECT role::TEXT FROM public.profiles WHERE id = auth.uid()) = 'genesis');

-- RLS: pulse_surveys
DROP POLICY IF EXISTS "pulse_surveys_select" ON pulse_surveys;
DROP POLICY IF EXISTS "pulse_surveys_insert" ON pulse_surveys;
DROP POLICY IF EXISTS "pulse_surveys_update" ON pulse_surveys;
DROP POLICY IF EXISTS "pulse_surveys_delete" ON pulse_surveys;

CREATE POLICY "pulse_surveys_select" ON pulse_surveys FOR SELECT
  USING (
    (SELECT role::TEXT FROM public.profiles WHERE id = auth.uid()) = 'genesis'
    OR organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );
CREATE POLICY "pulse_surveys_insert" ON pulse_surveys FOR INSERT
  WITH CHECK (
    (SELECT role::TEXT FROM public.profiles WHERE id = auth.uid()) = 'genesis'
    OR ((SELECT role::TEXT FROM public.profiles WHERE id = auth.uid()) = 'professional'
        AND organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  );
CREATE POLICY "pulse_surveys_update" ON pulse_surveys FOR UPDATE
  USING (
    (SELECT role::TEXT FROM public.profiles WHERE id = auth.uid()) = 'genesis'
    OR ((SELECT role::TEXT FROM public.profiles WHERE id = auth.uid()) = 'professional'
        AND organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  );
CREATE POLICY "pulse_surveys_delete" ON pulse_surveys FOR DELETE
  USING ((SELECT role::TEXT FROM public.profiles WHERE id = auth.uid()) = 'genesis');

-- RLS: pulse_responses
DROP POLICY IF EXISTS "pulse_responses_select" ON pulse_responses;
DROP POLICY IF EXISTS "pulse_responses_insert" ON pulse_responses;
DROP POLICY IF EXISTS "pulse_responses_delete" ON pulse_responses;

CREATE POLICY "pulse_responses_select" ON pulse_responses FOR SELECT
  USING (
    (SELECT role::TEXT FROM public.profiles WHERE id = auth.uid()) = 'genesis'
    OR (
      (SELECT role::TEXT FROM public.profiles WHERE id = auth.uid()) IN ('professional','client_executive')
      AND survey_id IN (
        SELECT id FROM pulse_surveys
        WHERE organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
      )
    )
    OR respondent_id = auth.uid()
  );
CREATE POLICY "pulse_responses_insert" ON pulse_responses FOR INSERT
  WITH CHECK (
    (SELECT role::TEXT FROM public.profiles WHERE id = auth.uid()) = 'collaborator'
    AND respondent_id = auth.uid()
  );
CREATE POLICY "pulse_responses_delete" ON pulse_responses FOR DELETE
  USING ((SELECT role::TEXT FROM public.profiles WHERE id = auth.uid()) = 'genesis');
