# Gênesis NR-01 — Portal

Portal web para gestão de conformidade com NR-01 e riscos psicossociais.

**URL:** https://portal.genesis360care.com.br

## Stack

| Camada | Tecnologia |
|---|---|
| Runtime | Bun |
| Framework | React 19 + TypeScript |
| Build | Vite |
| Estilo | Tailwind CSS |
| State / Data | TanStack React Query v5 |
| Backend | Supabase (Auth + DB + Storage) |
| Roteamento | React Router DOM v7 |

## Estrutura de Roles

| Role | Dashboard | Acesso |
|---|---|---|
| `genesis` | `/dashboard/genesis` | Admin completo |
| `client_executive` | `/dashboard/client` | Dados da própria empresa |
| `collaborator` | `/dashboard/collaborator` | Pesquisas (anônimo) |
| `professional` | `/dashboard/professional` | Casos e diagnósticos |

## Desenvolvimento local

```bash
# 1. Instalar dependências
bun install

# 2. Copiar e preencher variáveis de ambiente
cp .env.example .env.development
# edite .env.development com suas credenciais Supabase

# 3. Iniciar servidor de desenvolvimento
bun dev
```

## Variáveis de ambiente obrigatórias

```env
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_APP_ENV=development   # development | staging | production
```

## Scripts disponíveis

```bash
bun dev                        # Dev server (porta 5173)
bun run build                  # Build de produção
bun run build:staging          # Build de staging
bun run type-check             # tsc --noEmit
bun run lint                   # eslint --max-warnings 0
bun run format                 # prettier (src/**/*.{ts,tsx,css})

bun run supabase:setup:dev             # Configura ambiente dev
bun run supabase:setup:staging         # Configura staging
bun run supabase:setup:prod            # Configura produção
bun run supabase:gen-types             # Gera tipos TypeScript (dev)
bun run supabase:gen-types:staging     # Gera tipos TypeScript (staging)
bun run supabase:gen-types:prod        # Gera tipos TypeScript (prod)
bun run supabase:create-admin          # Cria usuário genesis admin (dev)
bun run supabase:create-admin:staging  # Cria usuário genesis admin (staging)
bun run supabase:create-admin:prod     # Cria usuário genesis admin (prod)
```

## Arquitetura de camadas

```
Supabase
  └── repositories/   (acesso direto ao banco via supabase-js)
        └── services/   (regras de negócio + audit logging)
              └── hooks/queries/  (TanStack Query — loading/error/cache)
                    └── pages/    (React — renderização)
```

## Regras de qualidade

- Zero avisos: `bun run lint`
- Zero erros TS: `bun run type-check`
- Sem `as any` (exceto `base.repository.ts`)
- Sem `@ts-ignore`
- Variáveis não usadas prefixadas com `_`
- `import type` sempre que possível
- Máximo 200–300 linhas por arquivo

## Deploy

### 🚀 Deploy automatizado via GitHub Actions

| Branch | Ambiente | Workflow |
|---|---|---|
| `main` | Produção | `deploy-production.yml` |
| `staging` | Staging | `deploy-staging.yml` |
| `*` (any) | CI/CD (lint + build) | `ci.yml` |

### 📋 Primeiro deploy (Setup completo)

**Fluxo recomendado:**
```bash
# 1. Validar código antes do deploy
bash validate-deploy.sh

# 2. Executar assistente de deploy
bash deploy-helper.sh

# 3. Verificar resultado
bash check-deploy.sh
```

**Documentação detalhada:**
- **[DEPLOY-CHECKLIST.md](DEPLOY-CHECKLIST.md)** — Guia passo a passo com 9 etapas
- **[QUICK-COMMANDS.md](QUICK-COMMANDS.md)** — Referência rápida de comandos
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** — Soluções para problemas comuns

### 🖥️ Setup do servidor

```bash
CERTBOT_EMAIL=seu@email.com bash setup-portal.sh
```

O script executa: `bun install` → `bun run build` → copia `dist/` para `/var/www/portal.genesis360care.com.br/` → configura Nginx → emite certificado SSL.

## Supabase

Migrações em `supabase/migrations/`. Para aplicar:

```bash
bun run supabase:setup:prod          # aplica migrations + gera tipos
supabase db push                     # apenas migrations
```

Seed de desenvolvimento:

```bash
supabase db reset                   # aplica migrações + seed
```
