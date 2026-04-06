#!/usr/bin/env bash
# =============================================================
# Gênesis NR-01 — Setup do ambiente de Development
# Execute: ./scripts/setup-dev.sh
# =============================================================
set -euo pipefail

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║     Gênesis NR-01 — Setup Dev            ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ─── 1. Verificar Supabase CLI ────────────────────────────────────────────────
echo "[ 1/6 ] Verificando Supabase CLI..."
if ! command -v supabase &>/dev/null; then
  echo "  ✗ Supabase CLI não encontrado."
  echo "  Instale com: brew install supabase/tap/supabase"
  echo "  Ou via npm:  npx supabase"
  exit 1
fi
echo "  ✓ Supabase CLI $(supabase --version)"

# ─── 2. Verificar .env.development ───────────────────────────────────────────
echo ""
echo "[ 2/6 ] Verificando .env.development..."
if [ ! -f ".env.development" ]; then
  echo "  ✗ Arquivo .env.development não encontrado."
  echo "  Copie o exemplo: cp .env.example .env.development"
  exit 1
fi
if grep -q "SEU_PROJECT" ".env.development"; then
  echo "  ✗ .env.development ainda tem valores placeholder."
  echo "  Preencha com as credenciais do seu projeto Supabase de DEV."
  exit 1
fi

SUPABASE_URL=$(grep "VITE_SUPABASE_URL=" .env.development | cut -d'=' -f2 | tr -d '[:space:]')
PROJECT_ID=$(echo "$SUPABASE_URL" | sed 's|https://||' | cut -d'.' -f1)

echo "  ✓ .env.development encontrado"
echo "  → Project ID: ${PROJECT_ID}"

# ─── 3. Login no Supabase ─────────────────────────────────────────────────────
echo ""
echo "[ 3/6 ] Autenticando no Supabase..."
supabase login
echo "  ✓ Autenticado"

# ─── 4. Linkar ao projeto dev ─────────────────────────────────────────────────
echo ""
echo "[ 4/6 ] Linkando ao projeto dev (${PROJECT_ID})..."
supabase link --project-ref "${PROJECT_ID}"
echo "  ✓ Projeto linkado"

# ─── 5. Rodar migrations ──────────────────────────────────────────────────────
echo ""
echo "[ 5/6 ] Rodando migrations no banco de dev..."
echo "  → 001_initial_schema.sql (15 tabelas + triggers + índices)"
echo "  → 002_rls_policies.sql   (Row Level Security por role)"
echo "  → 003_storage.sql        (bucket documents + políticas)"
supabase db push
echo "  ✓ Migrations aplicadas com sucesso"

# ─── 6. Gerar tipos TypeScript ────────────────────────────────────────────────
echo ""
echo "[ 6/6 ] Gerando tipos TypeScript..."
supabase gen types typescript --project-id "${PROJECT_ID}" > src/types/database.ts
echo "  ✓ src/types/database.ts atualizado"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║    Dev configurado com sucesso! ✓        ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Agora execute: bun dev"
echo ""
