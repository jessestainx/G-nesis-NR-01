#!/usr/bin/env bash
# =============================================================
# Gênesis NR-01 — Criar usuário administrador genesis
# Execute após rodar as migrations:
#   ./scripts/create-admin.sh
#   ./scripts/create-admin.sh staging
#   ./scripts/create-admin.sh prod
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
echo "╔══════════════════════════════════════════════╗"
echo "║    Gênesis NR-01 — Criar Admin Genesis       ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "  Ambiente : ${ENV} → ${ENV_FILE}"
echo ""

# ─── Verificar .env ───────────────────────────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
  echo "  ✗ ${ENV_FILE} não encontrado."
  exit 1
fi
if grep -q "SEU_PROJECT" "$ENV_FILE"; then
  echo "  ✗ ${ENV_FILE} ainda tem valores placeholder."
  exit 1
fi

SUPABASE_URL=$(grep "VITE_SUPABASE_URL=" "$ENV_FILE" | cut -d'=' -f2 | tr -d '[:space:]')
PROJECT_ID=$(echo "$SUPABASE_URL" | sed 's|https://||' | cut -d'.' -f1)

# ─── Coletar dados do admin ───────────────────────────────────────────────────
read -r -p "  E-mail do admin: " ADMIN_EMAIL
read -r -s -p "  Senha do admin (mín. 8 chars): " ADMIN_PASSWORD
echo ""
read -r -p "  Nome completo: " ADMIN_NAME

if [ ${#ADMIN_PASSWORD} -lt 8 ]; then
  echo "  ✗ Senha deve ter pelo menos 8 caracteres."
  exit 1
fi

# ─── Criar usuário via Supabase CLI ──────────────────────────────────────────
echo ""
echo "  Criando usuário no Supabase Auth (${PROJECT_ID})..."

supabase link --project-ref "${PROJECT_ID}" 2>/dev/null || true

USER_JSON=$(supabase auth admin create-user \
  --email "${ADMIN_EMAIL}" \
  --password "${ADMIN_PASSWORD}" \
  --user-metadata "{\"name\":\"${ADMIN_NAME}\",\"role\":\"genesis\"}" \
  --project-ref "${PROJECT_ID}" 2>&1)

if echo "$USER_JSON" | grep -q '"id"'; then
  USER_ID=$(echo "$USER_JSON" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "  ✓ Usuário criado — ID: ${USER_ID}"
else
  echo "  ✗ Falha ao criar usuário:"
  echo "$USER_JSON"
  exit 1
fi

# ─── Confirmar e-mail do admin automaticamente ───────────────────────────────
echo ""
echo "  Confirmando e-mail..."
supabase auth admin update-user "${USER_ID}" \
  --email-confirm \
  --project-ref "${PROJECT_ID}" >/dev/null 2>&1 && \
  echo "  ✓ E-mail confirmado" || \
  echo "  ⚠ Não foi possível confirmar e-mail automaticamente (confirme pelo dashboard)"

# ─── Garantir role genesis na tabela profiles via SQL ────────────────────────
echo ""
echo "  Garantindo role 'genesis' no profiles..."
supabase db execute \
  --project-ref "${PROJECT_ID}" \
  "UPDATE public.profiles SET role = 'genesis', name = '${ADMIN_NAME}' WHERE id = '${USER_ID}';" \
  2>/dev/null && echo "  ✓ Role atualizado" || \
  echo "  ⚠ Execute manualmente no SQL Editor do Supabase:"  && \
  echo "    UPDATE public.profiles SET role = 'genesis', name = '${ADMIN_NAME}' WHERE id = '${USER_ID}';"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║    Admin criado com sucesso! ✓               ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "  E-mail : ${ADMIN_EMAIL}"
echo "  Role   : genesis"
echo "  ID     : ${USER_ID}"
echo ""
if [ "$ENV" = "prod" ]; then
  echo "  Acesse: https://portal.genesis360care.com.br"
else
  echo "  Acesse: http://localhost:5173"
fi
echo ""
