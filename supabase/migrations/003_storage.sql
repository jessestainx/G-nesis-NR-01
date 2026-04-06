-- ============================================================
-- Migração 003: Storage buckets
-- ============================================================

-- Bucket para documentos das organizações
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Bucket para avatars de usuários
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- ─── Policies de Storage: documents ──────────────────────────────────────────
CREATE POLICY "genesis e professional fazem upload de documentos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents'
    AND (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('genesis', 'professional')
    )
  );

CREATE POLICY "Membros da org baixam documentos da org"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents'
    AND (
      -- extrai organization_id do path (primeiro segmento)
      (storage.foldername(name))[1] = (
        SELECT organization_id::TEXT FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "genesis e professional deletam documentos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents'
    AND (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('genesis', 'professional')
    )
  );

-- ─── Policies de Storage: avatars ────────────────────────────────────────────
CREATE POLICY "Usuário faz upload do próprio avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

CREATE POLICY "Avatars são públicos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
