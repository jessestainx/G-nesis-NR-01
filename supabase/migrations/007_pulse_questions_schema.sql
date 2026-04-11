-- Migration 007: garantir estrutura JSONB das perguntas de pesquisa de pulso

ALTER TABLE pulse_surveys
  ALTER COLUMN questions SET DEFAULT '{"questions": []}'::jsonb;

-- Normalizar surveys existentes sem estrutura correta
UPDATE pulse_surveys
SET questions = '{"questions": []}'::jsonb
WHERE questions IS NULL
   OR NOT (questions ? 'questions');
