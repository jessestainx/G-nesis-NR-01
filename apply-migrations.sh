#!/usr/bin/env bash
# apply-migrations.sh — Aplica todas as migrations no Supabase Cloud
# Uso: bash apply-migrations.sh
# Requer: psql instalado no servidor
set -euo pipefail

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✅ $1${NC}"; }
fail() { echo -e "${RED}❌ $1${NC}"; exit 1; }
info() { echo -e "${YELLOW}ℹ️  $1${NC}"; }
step() { echo -e "\n${BLUE}===== $1 =====${NC}"; }

PROJECT_ID="ntgdbglvibruhaqfzesx"
PORTAL_DIR="/home/genesis360care/htdocs/portal.genesis360care.com.br"

# Supabase Database Connection (Transaction pooler - porta 6543)
# Senha = service_role JWT secret ou database password do projeto
# A URL de conexão fica em: Supabase Dashboard → Settings → Database → Connection string
DB_HOST="aws-0-sa-east-1.pooler.supabase.com"
DB_PORT="6543"
DB_NAME="postgres"
DB_USER="postgres.${PROJECT_ID}"

step "Verificando psql"
if ! command -v psql &>/dev/null; then
  info "psql não encontrado — instalando..."
  sudo apt-get install -y postgresql-client 2>&1 | tail -5
fi
ok "psql disponível"

step "Verificando migrations"
ls -la "${PORTAL_DIR}/supabase/migrations/"

step "Instruções para aplicar via Supabase Dashboard"
echo ""
echo "  Como as migrations requerem senha do banco, execute via:"
echo ""
echo "  OPÇÃO 1 — Supabase Dashboard (mais fácil):"
echo "    1. Acesse: https://supabase.com/dashboard/project/${PROJECT_ID}/sql/new"
echo "    2. Cole e execute cada arquivo SQL na ordem:"
for f in "${PORTAL_DIR}/supabase/migrations/"*.sql; do
  echo "       - $(basename $f)"
done
echo ""
echo "  OPÇÃO 2 — supabase CLI (se instalado):"
echo "    supabase link --project-ref ${PROJECT_ID}"
echo "    supabase db push"
echo ""
echo "  OPÇÃO 3 — psql direto (requer DB password):"
echo "    DB_PASSWORD='sua-db-password' psql \\"
echo "      postgresql://${DB_USER}:\${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require \\"
echo "      -f ${PORTAL_DIR}/supabase/migrations/001_initial_schema.sql"
echo ""

step "Conteúdo dos arquivos prontos para copiar"
for f in "${PORTAL_DIR}/supabase/migrations/"*.sql; do
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  ARQUIVO: $(basename $f)"
  echo "  URL: https://supabase.com/dashboard/project/${PROJECT_ID}/sql/new"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  wc -l < "$f" && echo "  linhas no arquivo"
done
echo ""
ok "Script concluído — aplique as migrations via Dashboard"
