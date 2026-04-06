# Guia Rápido de Comandos

## 🚀 Deploy (Primeira Vez)

```bash
# 1. Validar antes do deploy
bash validate-deploy.sh              # Verifica estrutura e configurações

# 2. Executar deploy
bash deploy-helper.sh                # Assistente automatizado (RECOMENDADO)

# 3. Verificar resultado
bash check-deploy.sh                 # Valida deploy bem-sucedido

# Ou manual:
bun install
git add -A
git commit -m "feat: setup completo"
git push origin main
```

## 🗄️ Supabase Setup

```bash
# Development
bun run supabase:setup:dev
bun run supabase:create-admin        # Criar admin dev

# Staging
bun run supabase:setup:staging
bun run supabase:create-admin:staging

# Production
bun run supabase:setup:prod
bun run supabase:create-admin:prod   # Criar admin prod
```

## 🔧 Desenvolvimento

```bash
# Instalar e rodar
bun install
bun dev                              # http://localhost:5173

# Build
bun run build                        # Produção
bun run build:staging                # Staging
bun run preview                      # Preview do build

# Qualidade
bun run type-check                   # TypeScript (tsc --noEmit)
bun run lint                         # ESLint
bun run lint:fix                     # ESLint com --fix
bun run format                       # Prettier
```

## 🔑 Variáveis de Ambiente

```bash
# Copiar templates
cp .env.example .env.development
cp .env.example .env.staging
cp .env.example .env.production

# Editar
nano .env.production
```

Preencher:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_APP_ENV=production
VITE_APP_NAME=Gênesis NR-01
VITE_APP_URL=https://portal.genesis360care.com.br
```

## 📊 Supabase Types

```bash
# Regenerar tipos após mudança no schema
bun run supabase:gen-types           # Dev
bun run supabase:gen-types:staging   # Staging
bun run supabase:gen-types:prod      # Prod
```

Saída: `src/types/database.ts`

## 🌐 Servidor (Nginx + SSL)

```bash
# Setup completo (primeira vez)
cd /home/genesis360care/htdocs/portal.genesis360care.com.br
CERTBOT_EMAIL=seu@email.com ./setup-portal.sh

# Build e deploy manual
bun install
bun run build
sudo cp -r dist/* /var/www/portal.genesis360care.com.br/
sudo systemctl reload nginx
```

## 🔐 GitHub Secrets (9 obrigatórios)

```bash
# Acessar: https://github.com/jessestainx/G-nesis-NR-01/settings/secrets/actions
# Adicionar:

PROD_SUPABASE_URL
PROD_SUPABASE_ANON_KEY
PROD_SERVER_HOST
PROD_SERVER_USER
PROD_SERVER_SSH_KEY

STAGING_SUPABASE_URL
STAGING_SUPABASE_ANON_KEY
STAGING_APP_URL
STAGING_SERVER_PATH
```

## 🐛 Troubleshooting

```bash
# Erro: bun.lockb not found
bun install
git add bun.lockb
git commit -m "chore: add lockfile"
git push

# Erro: VITE_SUPABASE_URL is required
cp .env.example .env.production
nano .env.production

# Erro: Permission denied (publickey)
# Verifique PROD_SERVER_SSH_KEY no GitHub Secrets

# Limpar node_modules
rm -rf node_modules
bun install

# Resetar Supabase local
supabase db reset
```

## 📚 Arquivos Importantes

```bash
DEPLOY-CHECKLIST.md          # Checklist completo de deploy
IMPLEMENTATION-SUMMARY.md    # Resumo técnico das mudanças
deploy-helper.sh             # Script assistente
setup-portal.sh              # Setup do Nginx + SSL
README.md                    # Visão geral do projeto
```

## 🧪 Git Workflow

```bash
# Feature branch
git checkout -b feat/nova-funcionalidade
# ... desenvolver ...
git add .
git commit -m "feat: descrição"
git push origin feat/nova-funcionalidade
# Abrir PR para main

# Hotfix
git checkout -b hotfix/correcao-urgente
# ... corrigir ...
git commit -m "fix: descrição"
git push origin hotfix/correcao-urgente
# Merge direto para main

# Deploy staging
git checkout staging
git merge main
git push origin staging        # Dispara deploy-staging.yml

# Deploy production
git checkout main
git push origin main           # Dispara deploy-production.yml
```

## ⚡ Atalhos

```bash
# Dev full stack (assumindo Supabase local rodando)
bun dev

# CI local (mesmo que GitHub Actions)
bun run type-check && bun run lint && bun run build

# Setup completo zero to deploy
bash deploy-helper.sh
# ... seguir DEPLOY-CHECKLIST.md ...
CERTBOT_EMAIL=seu@email.com ./setup-portal.sh
```

## 📞 Suporte

- **Documentação completa:** [DEPLOY-CHECKLIST.md](DEPLOY-CHECKLIST.md)
- **Resumo técnico:** [IMPLEMENTATION-SUMMARY.md](IMPLEMENTATION-SUMMARY.md)
- **Issues:** https://github.com/jessestainx/G-nesis-NR-01/issues
