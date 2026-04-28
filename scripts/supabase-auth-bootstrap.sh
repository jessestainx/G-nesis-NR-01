#!/usr/bin/env bash
set -euo pipefail

# Supabase project: ntgdbglvibruhaqfzesx
SUPABASE_URL="https://ntgdbglvibruhaqfzesx.supabase.co"

# Inputs (do incidente)
ORG_TEST_ID="4c5e2209-4e84-44bf-9717-a82bad523b01"  # Empresa Teste
ADMIN_UID="e848bd22-1fb6-4b67-85e6-a4406feddbca"     # admin@genesis360care.com.br

# Credenciais desejadas
ADMIN_EMAIL="admin@genesis360care.com.br"
ADMIN_PASSWORD="Genesis@NR01#2026!"

CLIENT_EMAIL="cliente@empresateste.com.br"
CLIENT_PASSWORD="Cliente@Test123"

COLLAB_EMAIL="colaborador@empresateste.com.br"
COLLAB_PASSWORD="Colab@Test123"

PRO_EMAIL="profissional@genesis360care.com.br"
PRO_PASSWORD="Prof@Test123"

need() {
  command -v "$1" >/dev/null 2>&1 || { echo "ERRO: comando '$1' não encontrado" >&2; exit 1; }
}

need curl
need python3

urlencode() {
  python3 - "$1" <<'PY'
import sys, urllib.parse
print(urllib.parse.quote(sys.argv[1], safe=''))
PY
}

TMP_HDR=""
cleanup() {
  [ -n "${TMP_HDR}" ] && rm -f "${TMP_HDR}" || true
}
trap cleanup EXIT

read_secret() {
  local var_name="$1"
  local prompt="$2"
  local value
  read -r -s -p "$prompt" value
  echo
  if [ -z "$value" ]; then
    echo "ERRO: valor vazio" >&2
    exit 1
  fi
  printf -v "$var_name" '%s' "$value"
}

# Escreve headers em arquivo temporário (evita expor o token no argv/ps)
write_headers() {
  local key="$1"
  TMP_HDR="$(mktemp)"
  chmod 600 "$TMP_HDR"
  cat >"$TMP_HDR" <<HDR
header = "apikey: ${key}"
header = "Authorization: Bearer ${key}"
header = "Content-Type: application/json"
header = "Accept: application/json"
HDR
}

curl_json() {
  local method="$1"; shift
  local url="$1"; shift
  local data="${1:-}"

  local tmp
  tmp="$(mktemp)"
  local code

  set +e
  if [ -n "$data" ]; then
    code=$(curl -sS --config "$TMP_HDR" -o "$tmp" -w "%{http_code}" -X "$method" "$url" --data "$data")
  else
    code=$(curl -sS --config "$TMP_HDR" -o "$tmp" -w "%{http_code}" -X "$method" "$url")
  fi
  local rc=$?
  set -e

  if [ "$rc" -ne 0 ]; then
    echo "ERRO: falha de rede ao chamar $method $url" >&2
    cat "$tmp" >&2 || true
    rm -f "$tmp" || true
    return "$rc"
  fi

  if [ "$code" -ge 200 ] && [ "$code" -lt 300 ]; then
    cat "$tmp"
    rm -f "$tmp" || true
    return 0
  fi

  echo "ERRO: HTTP $code ao chamar $method $url" >&2
  cat "$tmp" >&2 || true
  rm -f "$tmp" || true
  return 22
}

parse_json_or_die() {
  python3 - <<'PY'
import json,sys
raw=sys.stdin.read()
if not raw.strip():
  sys.stderr.write('ERRO: resposta vazia da API\n')
  sys.exit(2)
try:
  obj=json.loads(raw)
except Exception:
  sys.stderr.write('ERRO: resposta não-JSON da API\n')
  sys.stderr.write(raw[:800]+'\n')
  sys.exit(2)
print(json.dumps(obj))
PY
}

# Retorna UUID do user no auth por email (ou vazio)
find_user_id_by_email() {
  local email="$1"
  local resp
  resp="$(curl_json GET "${SUPABASE_URL}/auth/v1/admin/users?per_page=1000&page=1")"

  printf '%s' "$resp" | python3 - "$email" <<'PY'
import json, sys
email = sys.argv[1].strip().lower()
raw = sys.stdin.read()
if not raw.strip():
  print('')
  sys.exit(0)
try:
  obj = json.loads(raw)
except Exception:
  sys.stderr.write('ERRO: resposta inesperada (não-JSON) ao listar usuários do Supabase Admin API\n')
  sys.stderr.write(raw[:800] + '\n')
  sys.exit(2)
users = obj.get('users', []) if isinstance(obj, dict) else obj
for u in users:
  if (u.get('email') or '').strip().lower() == email:
    print(u.get('id') or '')
    sys.exit(0)
print('')
PY
}

update_admin_password() {
  echo "[1/5] Resetando senha do admin (${ADMIN_EMAIL})..."
  local payload
  payload=$(python3 - <<PY
import json
print(json.dumps({"password": "${ADMIN_PASSWORD}", "email_confirm": True}))
PY
)
  curl_json PUT "${SUPABASE_URL}/auth/v1/admin/users/${ADMIN_UID}" "$payload" >/dev/null
  echo "OK: senha do admin atualizada"
}

create_or_update_user() {
  local email="$1" password="$2" name="$3" role="$4" org_id="${5:-}"

  local uid
  uid="$(find_user_id_by_email "$email")"

  if [ -z "$uid" ]; then
    echo "Criando usuário: $email"
    local payload
    payload=$(python3 - <<PY
import json
meta = {"name": "${name}", "role": "${role}"}
if "${org_id}":
  meta["organization_id"] = "${org_id}"
print(json.dumps({
  "email": "${email}",
  "password": "${password}",
  "email_confirm": True,
  "user_metadata": meta
}))
PY
)
    local resp
    resp="$(curl_json POST "${SUPABASE_URL}/auth/v1/admin/users" "$payload")"
    printf '%s' "$resp" | python3 - <<'PY'
import json,sys
raw=sys.stdin.read()
try:
  obj=json.loads(raw)
except Exception:
  sys.stderr.write('ERRO: falha ao criar usuário (resposta não-JSON)\n')
  sys.stderr.write(raw[:800]+'\n')
  sys.exit(2)
print(obj.get('id',''))
PY
  else
    echo "Atualizando usuário existente: $email"
    local payload
    payload=$(python3 - <<PY
import json
meta = {"name": "${name}", "role": "${role}"}
if "${org_id}":
  meta["organization_id"] = "${org_id}"
print(json.dumps({
  "password": "${password}",
  "email_confirm": True,
  "user_metadata": meta
}))
PY
)
    curl_json PUT "${SUPABASE_URL}/auth/v1/admin/users/${uid}" "$payload" >/dev/null
    echo "$uid"
  fi
}

patch_profile() {
  local email="$1" role="$2" org_id="${3:-}"
  local email_q
  email_q="$(urlencode "$email")"
  local payload
  payload=$(python3 - <<PY
import json
body = {"role": "${role}", "active": True}
if "${org_id}":
  body["organization_id"] = "${org_id}"
print(json.dumps(body))
PY
)
  curl_json PATCH "${SUPABASE_URL}/rest/v1/profiles?email=eq.${email_q}" "$payload" >/dev/null || true
}

show_profiles() {
  echo "[4/5] Verificando profiles..."
  # Usa --get + --data-urlencode para lidar com emails contendo '@' etc.
  local resp
  resp=$(curl -sS --fail-with-body --config "$TMP_HDR" \
    --get "${SUPABASE_URL}/rest/v1/profiles" \
    --data-urlencode "select=id,email,name,role,organization_id,active" \
    --data-urlencode "email=in.(${ADMIN_EMAIL},${CLIENT_EMAIL},${COLLAB_EMAIL},${PRO_EMAIL})")

  printf '%s' "$resp" | python3 - <<'PY'
import json,sys
raw=sys.stdin.read()
try:
  obj=json.loads(raw)
except Exception:
  sys.stderr.write('ERRO: falha ao ler profiles (resposta não-JSON)\n')
  sys.stderr.write(raw[:800]+'\n')
  sys.exit(2)
print(json.dumps(obj, indent=2, ensure_ascii=False))
PY
}

main() {
  echo "=== Supabase Auth Bootstrap (test users) ==="
  echo "Projeto: ${SUPABASE_URL}"
  echo "Org teste: ${ORG_TEST_ID}"
  echo

  local SRK
  read_secret SRK "Cole a SERVICE_ROLE key (não será exibida): "
  write_headers "$SRK"

  update_admin_password

  echo "[2/5] Criando/atualizando usuários de teste..."
  create_or_update_user "$CLIENT_EMAIL" "$CLIENT_PASSWORD" "João Cliente" "client_executive" "$ORG_TEST_ID" >/dev/null
  create_or_update_user "$COLLAB_EMAIL" "$COLLAB_PASSWORD" "Maria Colaboradora" "collaborator" "$ORG_TEST_ID" >/dev/null
  create_or_update_user "$PRO_EMAIL" "$PRO_PASSWORD" "Dr. Profissional" "professional" "" >/dev/null
  echo "OK: usuários prontos"

  echo "[3/5] Ajustando profiles (role/org/active)..."
  patch_profile "$CLIENT_EMAIL" "client_executive" "$ORG_TEST_ID"
  patch_profile "$COLLAB_EMAIL" "collaborator" "$ORG_TEST_ID"
  patch_profile "$PRO_EMAIL" "professional" ""
  patch_profile "$ADMIN_EMAIL" "genesis" ""
  echo "OK: profiles patch aplicados (se existiam)"

  show_profiles

  echo "[5/5] Próximo: testar logins em https://portal.genesis360care.com.br/login"
  echo "- Consultor: ${ADMIN_EMAIL} (senha resetada para o valor combinado) -> /dashboard/genesis"
  echo "- Empresa:   ${CLIENT_EMAIL} (senha definida) -> /dashboard/client"
  echo "- Colab:     ${COLLAB_EMAIL} (senha definida) -> /dashboard/collaborator"
  echo "- Prof:      ${PRO_EMAIL} (senha definida) -> /dashboard/professional"
  echo
  echo "IMPORTANTE: depois de finalizar, rotacione a service_role key no Supabase (Settings → API)."
}

main "$@"
