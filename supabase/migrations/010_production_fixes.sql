-- ═══════════════════════════════════════════════════════════════════════════
-- EXECUÇÃO OBRIGATÓRIA NO SUPABASE SQL EDITOR
-- Acesse: https://supabase.com/dashboard/project/ntgdbglvibruhaqfzesx/sql
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── CRÍTICO 1: Bucket "avatars" para fotos de perfil ────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 'avatars', false, 5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

CREATE POLICY IF NOT EXISTS "avatars: upload próprio"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY IF NOT EXISTS "avatars: ver próprio"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY IF NOT EXISTS "avatars: deletar próprio"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Verificação: deve retornar 1 row com id = 'avatars'
-- SELECT id, name FROM storage.buckets WHERE id = 'avatars';

-- ─── CRÍTICO 2: Corrigir handle_new_user (organization_id do metadata) ────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name, role, organization_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'collaborator'),
    NULLIF(NEW.raw_user_meta_data->>'organization_id', '')::uuid
  )
  ON CONFLICT (id) DO UPDATE SET
    organization_id = EXCLUDED.organization_id
    WHERE profiles.organization_id IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── CRÍTICO 2b: Trigger para sincronizar profile ao confirmar convite ─────────
CREATE OR REPLACE FUNCTION sync_profile_on_confirm()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'organization_id' IS NOT NULL THEN
    UPDATE profiles
    SET organization_id = (NEW.raw_user_meta_data->>'organization_id')::uuid
    WHERE id = NEW.id AND organization_id IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_profile_on_confirm ON auth.users;
CREATE TRIGGER trg_sync_profile_on_confirm
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (
    OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at
    AND NEW.email_confirmed_at IS NOT NULL
  )
  EXECUTE FUNCTION sync_profile_on_confirm();

-- ─── CRÍTICO 3: Verificar e criar tabelas org_settings e email_queue ──────────
-- Execute a query de verificação ANTES de rodar as migrations 005 e 006:
--   SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public'
--   AND table_name IN ('org_settings', 'email_queue');
-- Se retornar menos de 2 rows → execute os arquivos:
--   supabase/migrations/005_org_settings_email_queue.sql
--   supabase/migrations/006_pg_cron_email_queue.sql

-- ─── MIGRATION 009 (profiles.active) ─────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(active);
