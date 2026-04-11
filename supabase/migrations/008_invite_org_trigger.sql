-- Migration 008: trigger para vincular organization_id no profile ao aceitar convite

-- Função: sincroniza organization_id do metadata para profiles
CREATE OR REPLACE FUNCTION sync_profile_organization()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'organization_id' IS NOT NULL THEN
    UPDATE profiles
    SET organization_id = (NEW.raw_user_meta_data->>'organization_id')::uuid
    WHERE id = NEW.id
      AND organization_id IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- Disparar quando usuário confirma email
DROP TRIGGER IF EXISTS trg_sync_profile_org ON auth.users;
CREATE TRIGGER trg_sync_profile_org
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (
    OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at
    AND NEW.email_confirmed_at IS NOT NULL
  )
  EXECUTE FUNCTION sync_profile_organization();

-- Atualizar handle_new_user para incluir organization_id e role do metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, organization_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'collaborator'),
    NULLIF(NEW.raw_user_meta_data->>'organization_id', '')::uuid
  )
  ON CONFLICT (id) DO UPDATE SET
    name            = COALESCE(EXCLUDED.name, profiles.name),
    role            = COALESCE(EXCLUDED.role, profiles.role),
    organization_id = COALESCE(EXCLUDED.organization_id, profiles.organization_id);
  RETURN NEW;
END;
$$;
