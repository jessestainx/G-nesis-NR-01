#!/usr/bin/env bash
# =============================================================
# Gênesis NR-01 — Regenerar tipos TypeScript do Supabase
# Execute após qualquer mudança no schema do banco:
#   ./scripts/gen-types.sh             # dev (padrão)
#   ./scripts/gen-types.sh staging
#   ./scripts/gen-types.sh prod
# =============================================================
set -euo pipefail

ENV="${1:-dev}"

ENV_FILE=""
case "$ENV" in
  dev)     ENV_FILE=".env.development" ;;
  staging) ENV_FILE=".env.staging"     ;;
  prod)    ENV_FILE=".env.production"  ;;
  *)
    echo "  ✗ Ambiente inválido: '$ENV'. Use: dev | staging | prod"
    exit 1
    ;;
esac

echo ""
echo "[ gen-types ] Ambiente: ${ENV} → ${ENV_FILE}"

if [ ! -f "$ENV_FILE" ]; then
  echo "  ✗ ${ENV_FILE} não encontrado."
  exit 1
fi

SUPABASE_URL=$(grep "VITE_SUPABASE_URL=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '[:space:]')
PROJECT_ID=$(echo "$SUPABASE_URL" | sed 's|https://||' | cut -d'.' -f1)

echo "  Project ID: ${PROJECT_ID}"
echo "  Gerando src/types/database.ts..."

supabase gen types typescript --project-id "${PROJECT_ID}" > src/types/database.ts

echo "  ✓ Tipos gerados com sucesso!"
echo ""
