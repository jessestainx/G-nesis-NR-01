-- Migration 009: adiciona coluna active em profiles para controle de acesso
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(active);
