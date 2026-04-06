# 🚀 Checklist de Deploy — Portal Gênesis NR-01

**Status:** Projeto 100% implementado em código. Pendente: execução manual de comandos de infraestrutura.

---

## ✅ Concluído (Automatizado)

- [x] Migrations SQL corrigidas (001, 002, 003) — roles atualizados para `genesis`, `professional`, `client_executive`, `collaborator`
- [x] Workflows GitHub Actions convertidos de npm para bun (`ci.yml`, `deploy-production.yml`, `deploy-staging.yml`)
- [x] Scripts bash criados (`setup-dev.sh`, `setup-staging.sh`, `setup-prod.sh`, `gen-types.sh`, `create-admin.sh`)
- [x] TypeScript strict mode corrigido (`vite-env.d.ts` criado, `env.ts` reescrito)
- [x] Assets criados (`favicon.svg`, correções de comentários)
- [x] `package.json` atualizado com comandos `supabase:*`

---

## 📋 Pendente (Execução Manual Obrigatória)

### **ETAPA 1: Gerar Lockfile e Commitar**

No terminal da pasta do projeto:

```bash
cd /home/genesis360care/htdocs/portal.genesis360care.com.br

# Instalar dependências (gera bun.lockb)
bun install

# Verificar arquivos modificados
git status

# Adicionar tudo
git add -A

# Commitar
git commit -m "feat: setup completo - migrations, CI/CD, scripts bash, vite-env.d.ts"

# Enviar para GitHub
git push origin main
```

**⚠️ IMPORTANTE:** Sem o `bun.lockb`, o CI vai falhar com erro `--frozen-lockfile requires bun.lockb`.

---

### **ETAPA 2: Criar Projetos no Supabase**

Acesse [supabase.com/dashboard](https://supabase.com/dashboard) e crie **3 projetos**:

1. **`genesis-nr01-dev`** (Development)
2. **`genesis-nr01-staging`** (Staging)  
3. **`genesis-nr01-prod`** (Production)

Para cada projeto, anote:
- **Project ID** (aparece na URL: `https://supabase.com/dashboard/project/[PROJECT_ID]`)
- **API URL** (Settings → API → Project URL)
- **Anon Key** (Settings → API → `anon` `public`)

---

### **ETAPA 3: Preencher Arquivos `.env.*`**

No terminal do projeto:

```bash
# Copiar templates
cp .env.example .env.development
cp .env.example .env.staging
cp .env.example .env.production
```

Editar cada arquivo e substituir os placeholders:

#### `.env.development`
```bash
VITE_SUPABASE_URL=https://[PROJECT_ID_DEV].supabase.co
VITE_SUPABASE_ANON_KEY=[ANON_KEY_DEV]
VITE_APP_ENV=development
VITE_APP_NAME=Gênesis NR-01
VITE_APP_URL=http://localhost:5173
```

#### `.env.staging`
```bash
VITE_SUPABASE_URL=https://[PROJECT_ID_STAGING].supabase.co
VITE_SUPABASE_ANON_KEY=[ANON_KEY_STAGING]
VITE_APP_ENV=staging
VITE_APP_NAME=Gênesis NR-01 [STAGING]
VITE_APP_URL=https://staging.portal.genesis360care.com.br
```

#### `.env.production`
```bash
VITE_SUPABASE_URL=https://[PROJECT_ID_PROD].supabase.co
VITE_SUPABASE_ANON_KEY=[ANON_KEY_PROD]
VITE_APP_ENV=production
VITE_APP_NAME=Gênesis NR-01
VITE_APP_URL=https://portal.genesis360care.com.br
```

**⚠️ NUNCA COMMITE ESSES ARQUIVOS!** (já estão no `.gitignore`)

---

### **ETAPA 4: Aplicar Migrations no Supabase Prod**

No terminal:

```bash
# Fazer login no Supabase CLI (abre browser)
supabase login

# Aplicar migrations + gerar tipos
bun run supabase:setup:prod
```

O script vai:
1. Pedir confirmação (digite `PRODUCAO`)
2. Validar `.env.production`
3. Linkar ao projeto `genesis-nr01-prod`
4. Aplicar as 3 migrations via `supabase db push`
5. Gerar `src/types/database.ts` atualizado

---

### **ETAPA 5: Criar Usuário Admin Genesis**

No terminal:

```bash
bun run supabase:create-admin:prod
```

O script vai pedir:
- **E-mail do admin:** (ex: `admin@genesis360care.com.br`)
- **Senha:** (mínimo 8 caracteres)
- **Nome completo:** (ex: `Administrador Genesis`)

Ele vai:
1. Criar o usuário no Supabase Auth
2. Confirmar o e-mail automaticamente
3. Setar o role `genesis` na tabela `profiles`

**Fallback manual:** Se o script falhar, use o SQL em `supabase/seed/002_seed_prod.sql` no SQL Editor do Supabase.

---

### **ETAPA 6: Configurar GitHub Secrets**

Acesse: `https://github.com/jessestainx/G-nesis-NR-01/settings/secrets/actions`

Clique em **New repository secret** e adicione:

#### **Secrets de Produção:**
| Nome | Valor |
|------|-------|
| `PROD_SUPABASE_URL` | URL do projeto prod (da ETAPA 2) |
| `PROD_SUPABASE_ANON_KEY` | Anon key do projeto prod |
| `PROD_SERVER_HOST` | IP ou domínio do servidor (ex: `200.123.45.67`) |
| `PROD_SERVER_USER` | Usuário SSH (ex: `genesis360care`) |
| `PROD_SERVER_SSH_KEY` | Chave privada SSH (conteúdo completo do arquivo `~/.ssh/id_rsa`) |

#### **Secrets de Staging:**
| Nome | Valor |
|------|-------|
| `STAGING_SUPABASE_URL` | URL do projeto staging |
| `STAGING_SUPABASE_ANON_KEY` | Anon key do projeto staging |
| `STAGING_APP_URL` | `https://staging.portal.genesis360care.com.br` |
| `STAGING_SERVER_PATH` | `/var/www/staging.portal.genesis360care.com.br` |

**Total:** 9 secrets

---

### **ETAPA 7: Gerar Chave SSH (se não existir)**

No servidor onde o Nginx roda:

```bash
# Gerar chave SSH
ssh-keygen -t ed25519 -C "deploy-portal-genesis" -f ~/.ssh/deploy_portal

# Adicionar chave pública ao authorized_keys
cat ~/.ssh/deploy_portal.pub >> ~/.ssh/authorized_keys

# COPIAR A CHAVE PRIVADA (usar no GitHub Secret PROD_SERVER_SSH_KEY)
cat ~/.ssh/deploy_portal
```

Copie **TODO** o conteúdo (incluindo `-----BEGIN OPENSSH PRIVATE KEY-----` e `-----END OPENSSH PRIVATE KEY-----`) e cole no secret `PROD_SERVER_SSH_KEY`.

---

### **ETAPA 8: Setup do Servidor Web (Nginx + SSL)**

No servidor:

```bash
cd /home/genesis360care/htdocs/portal.genesis360care.com.br

# Executar setup (substitua o e-mail)
CERTBOT_EMAIL=seu-email@dominio.com ./setup-portal.sh
```

O script vai:
1. ✅ Instalar dependências (`bun install`)
2. ✅ Gerar build de produção (`bun run build`)
3. ✅ Publicar em `/var/www/portal.genesis360care.com.br/`
4. ✅ Configurar Nginx (HTTP bootstrap ou HTTPS se certificado existir)
5. ✅ Criar symlink em `sites-enabled`
6. ✅ Recarregar Nginx
7. ✅ Emitir certificado SSL via Certbot (se `CERTBOT_EMAIL` fornecido)

**Pré-requisitos:**
- Registro DNS `A` apontando `portal` → IP do servidor
- Portas 80 e 443 abertas no firewall
- Nginx instalado e rodando

---

### **ETAPA 9: Primeiro Deploy via GitHub Actions**

Qualquer push para `main` vai disparar o workflow `deploy-production.yml`:

```bash
# Fazer uma mudança qualquer (exemplo)
echo "# Deploy ready" >> README.md
git add README.md
git commit -m "chore: trigger first deploy"
git push origin main
```

Acompanhe em: `https://github.com/jessestainx/G-nesis-NR-01/actions`

O workflow vai:
1. Checkout do código
2. Setup do Bun
3. `bun install --frozen-lockfile`
4. `bun run build` (com env vars de produção)
5. Rsync do `dist/` → `/var/www/portal.genesis360care.com.br/`
6. Reload do Nginx via SSH

---

## 🧪 Testar o Portal

Após o deploy:

1. **Acesse:** `https://portal.genesis360care.com.br`
2. **Login:** Use o e-mail/senha do admin criado na ETAPA 5
3. **Dashboard Genesis:** Deve aparecer com as 7 páginas (Overview, Organizações, Usuários, Diagnósticos, Planos de Ação, CRM, Financeiro, Auditoria)

---

## 🔧 Comandos Úteis

```bash
# Dev local
bun dev                             # Servidor dev (porta 5173)

# Build
bun run build                       # Produção
bun run build:staging               # Staging

# Qualidade
bun run type-check                  # TypeScript
bun run lint                        # ESLint
bun run lint:fix                    # ESLint --fix

# Supabase
bun run supabase:setup:dev          # Setup banco dev
bun run supabase:setup:staging      # Setup banco staging
bun run supabase:setup:prod         # Setup banco prod

bun run supabase:gen-types          # Regenerar types (dev)
bun run supabase:gen-types:staging  # Regenerar types (staging)
bun run supabase:gen-types:prod     # Regenerar types (prod)

bun run supabase:create-admin       # Criar admin (dev)
bun run supabase:create-admin:prod  # Criar admin (prod)
```

---

## 📚 Documentação Adicional

- **README.md** — Visão geral do projeto
- **supabase/migrations/** — SQL schemas e RLS policies
- **.github/workflows/** — Pipelines de CI/CD
- **scripts/** — Bash scripts de setup

---

## 🆘 Troubleshooting

### Erro: `bun.lockb not found`
```bash
cd /home/genesis360care/htdocs/portal.genesis360care.com.br
bun install
git add bun.lockb
git commit -m "chore: add lockfile"
git push
```

### Erro: `VITE_SUPABASE_URL is required`
Certifique-se de que `.env.production` existe e está preenchido corretamente.

### Erro: `Permission denied (publickey)`
Verifique se a chave SSH privada no secret `PROD_SERVER_SSH_KEY` está correta e completa.

### Build falha no TypeScript
```bash
bun run type-check
```
Corrija os erros reportados.

---

**Última atualização:** 2 de abril de 2026  
**Status:** Pronto para execução das etapas manuais
