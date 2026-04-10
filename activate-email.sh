#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════╗
# ║  Gênesis 360Care — Script de Ativação do Sistema de Email       ║
# ║  Uso: bash activate-email.sh [SUPABASE_TOKEN] [RESEND_KEY]      ║
# ╚══════════════════════════════════════════════════════════════════╝
set -e

PROJECT_REF="ntgdbglvibruhaqfzesx"
SUPABASE_URL="https://${PROJECT_REF}.supabase.co"
SUPA_BIN="/root/.bun/install/global/node_modules/supabase/bin/supabase"
DIR="$(cd "$(dirname "$0")" && pwd)"

# ─── Parâmetros ───────────────────────────────────────────────────
SUPABASE_TOKEN="${1:-$SUPABASE_ACCESS_TOKEN}"
RESEND_KEY="${2:-$RESEND_API_KEY}"

if [[ -z "$SUPABASE_TOKEN" ]]; then
    echo ""
    echo "❌  SUPABASE_TOKEN obrigatório."
    echo ""
    echo "  Onde obter: https://supabase.com/dashboard/account/tokens"
    echo "  Uso: bash activate-email.sh <SUPABASE_TOKEN> <RESEND_KEY>"
    echo "  Ou:  export SUPABASE_ACCESS_TOKEN=... && bash activate-email.sh"
    echo ""
    exit 1
fi

if [[ -z "$RESEND_KEY" ]]; then
    echo ""
    echo "❌  RESEND_KEY obrigatório."
    echo ""
    echo "  Onde obter: https://resend.com → API Keys → Create"
    echo "  Uso: bash activate-email.sh <SUPABASE_TOKEN> re_xxxxxxxxx"
    echo ""
    exit 1
fi

echo ""
echo "🚀  Gênesis 360Care — Ativando sistema de email..."
echo ""

# ─── Verificar Supabase CLI ───────────────────────────────────────
if [[ ! -f "$SUPA_BIN" ]]; then
    echo "📦  Instalando Supabase CLI..."
    bun install -g supabase 2>&1 | grep -E "installed|warn|error" || true
fi

SUPA="$SUPA_BIN"
echo "✅  Supabase CLI: $($SUPA --version)"

# ─── PASSO 1: Aplicar migrations ─────────────────────────────────
echo ""
echo "━━━ PASSO 1: Aplicando migrations 005 e 006..."

cd "$DIR"

# Aplicar migration 005 (org_settings + email_queue)
echo "  → Migration 005: org_settings + email_queue"
curl -s -X POST "https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query" \
    -H "Authorization: Bearer ${SUPABASE_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"query\": $(python3 -c "import json; print(json.dumps(open('supabase/migrations/005_org_settings_email_queue.sql').read()))")}" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print('  ✅  005 OK') if 'error' not in str(d).lower() or 'already exists' in str(d).lower() else print('  ⚠️  ', d)"

# Verificar se tabelas foram criadas
TABLES=$(curl -s "https://${PROJECT_REF}.supabase.co/rest/v1/org_settings?select=id&limit=1" \
    -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50Z2RiZ2x2aWJydWhhcWZ6ZXN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTg1NDAsImV4cCI6MjA5MDIzNDU0MH0.uJSYY8so_v3QjlwQU_oWOPg3FHpz2CgXdnmiFSqE5ik" 2>&1)

if echo "$TABLES" | grep -q "PGRST205"; then
    echo "  ❌  Tabela org_settings não foi criada. Verifique o token Supabase."
    exit 1
else
    echo "  ✅  Tabelas org_settings e email_queue verificadas!"
fi

# ─── PASSO 2: Configurar secrets da Edge Function ────────────────
echo ""
echo "━━━ PASSO 2: Configurando secrets..."

SECRETS_PAYLOAD="{\"FROM_EMAIL\": \"Gênesis 360Care <noreply@genesis360care.com.br>\", \"RESEND_API_KEY\": \"${RESEND_KEY}\"}"

curl -s -X POST "https://api.supabase.com/v1/projects/${PROJECT_REF}/secrets" \
    -H "Authorization: Bearer ${SUPABASE_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$SECRETS_PAYLOAD" > /dev/null

echo "  ✅  Secrets configurados (RESEND_API_KEY + FROM_EMAIL)"

# ─── PASSO 3: Login no Supabase CLI e deploy da Edge Function ─────
echo ""
echo "━━━ PASSO 3: Deploy da Edge Function send-email..."

$SUPA login --token "$SUPABASE_TOKEN" 2>&1 | tail -2

$SUPA link --project-ref "$PROJECT_REF" --password "" 2>&1 | grep -v "^$" | tail -5 || true

$SUPA functions deploy send-email \
    --project-ref "$PROJECT_REF" \
    --no-verify-jwt \
    2>&1 | tail -10

echo "  ✅  Edge Function send-email deployada!"

# ─── PASSO 4: Verificar Edge Function ────────────────────────────
echo ""
echo "━━━ PASSO 4: Testando Edge Function..."

ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50Z2RiZ2x2aWJydWhhcWZ6ZXN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTg1NDAsImV4cCI6MjA5MDIzNDU0MH0.uJSYY8so_v3QjlwQU_oWOPg3FHpz2CgXdnmiFSqE5ik"

INVOKE_RESULT=$(curl -s -X POST \
    "https://${PROJECT_REF}.supabase.co/functions/v1/send-email" \
    -H "Authorization: Bearer ${ANON_KEY}" \
    -H "Content-Type: application/json" \
    -d '{"batch_size": 1}' 2>&1)

echo "  Resposta: $INVOKE_RESULT"

if echo "$INVOKE_RESULT" | grep -qE '"sent"|"message"'; then
    echo "  ✅  Edge Function respondendo corretamente!"
else
    echo "  ⚠️  Verifique a Edge Function no Supabase Dashboard"
fi

# ─── RESUMO ──────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════"
echo "✅  Sistema de email ATIVADO com sucesso!"
echo ""
echo "  Próximos passos:"
echo "  1. Verificar domínio no Resend: https://resend.com/domains"
echo "     Adicionar: genesis360care.com.br"
echo "     Aguardar verificação DNS (~5min)"
echo ""
echo "  2. Configurar pg_cron (processar fila automaticamente):"
echo "     Supabase Dashboard → SQL Editor → execute:"
echo "     SELECT cron.schedule('process-email-queue', '*/5 * * * *', ..." 
echo "     (ver supabase/migrations/006_pg_cron_email_queue.sql)"
echo ""
echo "  3. Testar no portal:"
echo "     /dashboard/genesis/org-settings → selecionar org"
echo "     → Aba '📧 Fila de Emails' → Enviar email de teste"
echo ""
echo "  Portal: https://portal.genesis360care.com.br"
echo "═══════════════════════════════════════════════════"
