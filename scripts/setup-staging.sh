#!/usr/bin/env bash
# =============================================================
# Gênesis NR-01 — Setup do ambiente de Staging
# Execute: ./scripts/setup-staging.sh
# =============================================================
set -euo pipefail

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║     Gênesis NR-01 — Setup STAGING        ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ─── 1. Verificar .env.staging ────────────────────────────────────────────────
echo "[ 1/5 ] Verificando .env.staging..."
if [ ! -f ".env.staging" ]; then
  echo "  ✗ .env.staging não encontrado."
  echo "  Copie: cp .env.example .env.staging"
  exit 1
fi
if grep -q "SEU_PROJECT" ".env.staging"; then
  echo "  ✗ .env.staging ainda tem valores placeholder."
  exit 1
fi

SUPABASE_URL=$(grep "VITE_SUPABASE_URL=" .env.staging | cut -d'=' -f2 | tr -d '[:space:]')
PROJECT_ID=$(echo "$SUPABASE_URL" | sed 's|https://||' | cut -d'.' -f1)

echo "  ✓ .env.staging encontrado"
echo "  → Project ID Staging: ${PROJECT_ID}"

# ─── 2. Login ─────────────────────────────────────────────────────────────────
echo ""
echo "[ 2/5 ] Autenticando no Supabase..."
supabase login
echo "  ✓ Autenticado"

# ─── 3. Linkar ao projeto staging ─────────────────────────────────────────────
echo ""
echo "[ 3/5 ] Linkando ao projeto staging (${PROJECT_ID})..."
supabase link --project-ref "${PROJECT_ID}"
echo "  ✓ Linkado ao staging"

# ─── 4. Rodar migrations ──────────────────────────────────────────────────────
echo ""
echo "[ 4/5 ] Aplicando migrations no staging..."
supabase db push
echo "  ✓ Migrations aplicadas no staging"

# ─── 5. Gerar tipos ───────────────────────────────────────────────────────────
echo ""
echo "[ 5/5 ] Gerando tipos TypeScript..."
supabase gen types typescript --project-id "${PROJECT_ID}" > src/types/database.ts
echo "  ✓ src/types/database.ts atualizado"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║    Staging configurado com sucesso! ✓    ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Configure os Secrets no GitHub:"
echo "  STAGING_SUPABASE_URL, STAGING_SUPABASE_ANON_KEY, STAGING_APP_URL"
echo ""
