#!/usr/bin/env bash
# =============================================================
# Gênesis NR-01 — Setup do ambiente de Production
# Execute: ./scripts/setup-prod.sh
# ATENÇÃO: Este script altera o banco de PRODUÇÃO.
# =============================================================
set -euo pipefail

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║     Gênesis NR-01 — Setup PRODUÇÃO       ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "  ⚠ ATENÇÃO: Este script aplica migrations em PRODUÇÃO."
echo ""

read -r -p "  Digite 'PRODUCAO' para confirmar: " confirm
if [ "$confirm" != "PRODUCAO" ]; then
  echo "  Operação cancelada."
  exit 0
fi

# ─── 1. Verificar .env.production ─────────────────────────────────────────────
echo ""
echo "[ 1/5 ] Verificando .env.production..."
if [ ! -f ".env.production" ]; then
  echo "  ✗ .env.production não encontrado."
  exit 1
fi
if grep -q "SEU_PROJECT" ".env.production"; then
  echo "  ✗ .env.production ainda tem valores placeholder."
  exit 1
fi

SUPABASE_URL=$(grep "VITE_SUPABASE_URL=" .env.production | cut -d'=' -f2 | tr -d '[:space:]')
PROJECT_ID=$(echo "$SUPABASE_URL" | sed 's|https://||' | cut -d'.' -f1)

echo "  ✓ .env.production encontrado"
echo "  → Project ID Prod: ${PROJECT_ID}"

# ─── 2. Login ─────────────────────────────────────────────────────────────────
echo ""
echo "[ 2/5 ] Autenticando no Supabase..."
supabase login
echo "  ✓ Autenticado"

# ─── 3. Linkar ao projeto prod ────────────────────────────────────────────────
echo ""
echo "[ 3/5 ] Linkando ao projeto de produção (${PROJECT_ID})..."
supabase link --project-ref "${PROJECT_ID}"
echo "  ✓ Linkado à produção"

# ─── 4. Rodar migrations ──────────────────────────────────────────────────────
echo ""
echo "[ 4/5 ] Aplicando migrations em PRODUÇÃO..."
supabase db push
echo "  ✓ Migrations aplicadas em produção"

# ─── 5. Gerar tipos ───────────────────────────────────────────────────────────
echo ""
echo "[ 5/5 ] Gerando tipos TypeScript..."
supabase gen types typescript --project-id "${PROJECT_ID}" > src/types/database.ts
echo "  ✓ src/types/database.ts atualizado"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║    Produção configurada com sucesso! ✓   ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Lembre-se de configurar os Secrets no GitHub:"
echo "  PROD_SUPABASE_URL, PROD_SUPABASE_ANON_KEY"
echo "  PROD_SERVER_HOST, PROD_SERVER_USER, PROD_SERVER_SSH_KEY"
echo ""
