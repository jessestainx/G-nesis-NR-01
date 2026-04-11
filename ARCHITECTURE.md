# Gênesis NR-01 — Arquitetura do Sistema

## Visão Geral

O **Portal Gênesis NR-01** é uma aplicação SaaS multi-tenant para gestão de conformidade com a NR-01 (Norma Regulamentadora de Segurança e Saúde no Trabalho), com foco em riscos psicossociais. Atende 4 perfis de usuário distintos, cada um com painel exclusivo.

```
┌─────────────────────────────────────────────────────────────┐
│                    portal.genesis360care.com.br              │
│                    (React SPA — Vite + TypeScript)           │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────┐
│                  Supabase (ntgdbglvibruhaqfzesx)             │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │  Auth (JWT) │  │  PostgreSQL  │  │  Edge Functions    │  │
│  │  + RLS      │  │  17 tabelas  │  │  send-email (Deno) │  │
│  └─────────────┘  └──────────────┘  └────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │ SMTP
┌──────────────────────────▼──────────────────────────────────┐
│                  Resend (noreply@genesis360care.com.br)       │
└─────────────────────────────────────────────────────────────┘
```

---

## Stack Tecnológico

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + TypeScript + Vite (SWC) |
| UI | Tailwind CSS + Radix UI |
| Estado assíncrono | TanStack Query v5 |
| Formulários | react-hook-form + zod |
| Roteamento | React Router DOM v6 |
| Backend / Banco | Supabase (PostgreSQL + Auth + Storage) |
| Edge Functions | Deno (Supabase Functions) |
| E-mail transacional | Resend |
| Servidor | Nginx + Let's Encrypt (VPS) |
| Package manager | Bun |

---

## Estrutura de Diretórios

```
src/
├── App.tsx                  # Roteamento principal com guards por role
├── pages/
│   ├── Home.tsx             # Landing pública
│   ├── LoginPage.tsx        # Autenticação
│   ├── DashboardRouter.tsx  # Redireciona para painel correto por role
│   ├── genesis/             # Painel Administrador Genesis
│   ├── client/              # Painel Cliente Executivo
│   ├── collaborator/        # Painel Colaborador
│   ├── professional/        # Painel Profissional
│   └── shared/              # Páginas comuns (Perfil)
├── components/
│   ├── auth/                # ProtectedRoute, guards
│   ├── layout/              # DashboardLayout, Sidebar, Header
│   └── ui/                  # Componentes reutilizáveis
├── hooks/
│   ├── useAuth.ts           # Hook principal de autenticação
│   └── queries/             # React Query hooks por entidade
├── contexts/
│   └── AuthContext.tsx      # Contexto global de autenticação
├── utils/
│   ├── cnpj.ts              # Validação + autocomplete CNPJ (Receita Federal)
│   └── format.ts            # Formatadores de data, moeda, CNPJ
├── types/                   # Types TypeScript gerados do schema Supabase
└── lib/
    ├── supabase.ts          # Cliente Supabase
    ├── env.ts               # Variáveis de ambiente tipadas
    └── queryClient.ts       # Configuração do TanStack Query
```

---

## Fluxo de Autenticação

```
1. Usuário acessa /login
2. Supabase Auth valida email + senha → retorna JWT
3. AuthContext carrega profile da tabela profiles (id, role, organization_id)
4. /app redireciona via DashboardRouter:
   ├── genesis           → /dashboard/genesis
   ├── client_executive  → /dashboard/client
   ├── collaborator      → /dashboard/collaborator
   └── professional      → /dashboard/professional
5. ProtectedRoute verifica role a cada navegação
6. Sem role após 8s → redireciona para /login
```

---

## Banco de Dados

### Tabelas principais

| Tabela | Descrição |
|---|---|
| `profiles` | Perfil de cada usuário (role, org vinculada) |
| `organizations` | Empresas clientes cadastradas |
| `organization_units` | Departamentos/times das organizações |
| `diagnoses` | Diagnósticos NR-01 por organização |
| `psychosocial_risks` | Riscos identificados nos diagnósticos |
| `action_plans` | Planos de ação para mitigação de riscos |
| `action_items` | Tarefas dentro de cada plano de ação |
| `pulse_surveys` | Pesquisas de pulso |
| `pulse_responses` | Respostas dos colaboradores |
| `trainings` | Treinamentos registrados |
| `documents` | Documentos das organizações |
| `crm_contacts` | Leads e contatos comerciais |
| `contracts` | Contratos das organizações |
| `financial_transactions` | Movimentações financeiras |
| `audit_logs` | Log de auditoria de ações no sistema |
| `org_settings` | Configurações de notificação por organização |
| `email_queue` | Fila de e-mails para envio assíncrono |

### Enums

| Enum | Valores |
|---|---|
| `user_role` | `genesis`, `professional`, `client_executive`, `collaborator` |
| `risk_level` | `low`, `medium`, `high`, `critical` |
| `action_status` | `pending`, `in_progress`, `completed`, `cancelled` |
| `diagnosis_status` | `draft`, `in_progress`, `completed`, `archived` |
| `contract_status` | `active`, `suspended`, `cancelled`, `expired` |

### Row Level Security (RLS)

Todas as 17 tabelas têm RLS habilitado. As regras seguem o padrão:

- **genesis** → acesso total a todos os registros
- **client_executive** → leitura/escrita apenas dos dados da própria organização
- **professional** → leitura dos dados das organizações que atende
- **collaborator** → acesso mínimo (próprias respostas de pesquisa)

Helpers disponíveis em SQL:
- `auth.user_role()` — retorna o role do usuário autenticado
- `auth.user_organization()` — retorna o `organization_id` do usuário

---

## Sistema de E-mail

### Fluxo

```
Evento no app (ex: plano em atraso)
        │
        ▼
  RPC → enqueue_*_email()   ← função SQL SECURITY DEFINER
        │
        ▼
  Insere em email_queue (status = 'pending')
        │
        ▼ a cada 5 minutos
  pg_cron: process-email-queue
        │
        ▼
  Edge Function: send-email (Deno)
        │
        ▼
  Resend API → entrega o e-mail
```

### Triggers de e-mail disponíveis

| Trigger | Função SQL | Descrição |
|---|---|---|
| `action_overdue` | `enqueue_overdue_action_email()` | Plano de ação em atraso |
| `survey_opened` | `enqueue_survey_opened_email()` | Nova pesquisa disponível |
| `diagnosis_done` | *(via enqueue direto)* | Diagnóstico concluído |
| `contract_expiry` | *(via enqueue direto)* | Contrato próximo do vencimento |

### Configuração por organização (`org_settings`)

Cada organização pode ativar/desativar cada tipo de notificação individualmente na tela **Config. por Org**.

---

## Autocomplete de CNPJ

Ao digitar um CNPJ no modal de Nova/Editar Organização:

1. Campo formata automaticamente (`00.000.000/0001-00`) enquanto digita
2. Ao completar 14 dígitos → valida algoritmo oficial
3. Se válido → consulta `https://publica.cnpj.ws/cnpj/{cnpj}` (API pública, sem autenticação)
4. Preenche automaticamente: **Nome**, **Setor (CNAE)**, **Nome do Responsável** (sócio-administrador), **E-mail**
5. Campos já preenchidos pelo usuário **não são sobrescritos**

---

## Rotas do Sistema

### Públicas
| Rota | Página |
|---|---|
| `/` | Home (landing) |
| `/login` | Login |
| `/unauthorized` | Acesso negado |

### Protegidas — Genesis (`/dashboard/genesis/*`)
| Rota | Página |
|---|---|
| `/dashboard/genesis` | Visão Geral |
| `/dashboard/genesis/organizations` | Organizações |
| `/dashboard/genesis/users` | Usuários |
| `/dashboard/genesis/diagnosis` | Diagnósticos |
| `/dashboard/genesis/action-plans` | Planos de Ação |
| `/dashboard/genesis/pulse` | Pesquisas de Pulso |
| `/dashboard/genesis/trainings` | Treinamentos |
| `/dashboard/genesis/maturity` | Maturidade NR-01 |
| `/dashboard/genesis/crm` | CRM |
| `/dashboard/genesis/finance` | Financeiro |
| `/dashboard/genesis/audit` | Auditoria |
| `/dashboard/genesis/org-settings` | Config. por Org |
| `/dashboard/genesis/system-status` | Status do Sistema |
| `/dashboard/genesis/profile` | Perfil |

### Protegidas — Cliente Executivo (`/dashboard/client/*`)
| Rota | Página |
|---|---|
| `/dashboard/client` | Visão Geral |
| `/dashboard/client/diagnosis` | Diagnóstico |
| `/dashboard/client/risks` | Riscos |
| `/dashboard/client/action-plans` | Planos de Ação |
| `/dashboard/client/documents` | Documentos |
| `/dashboard/client/trainings` | Treinamentos |
| `/dashboard/client/pulse` | Pesquisas de Pulso |
| `/dashboard/client/profile` | Perfil |

### Protegidas — Colaborador (`/dashboard/collaborator/*`)
| Rota | Página |
|---|---|
| `/dashboard/collaborator` | Visão Geral |
| `/dashboard/collaborator/survey` | Responder Pesquisa |
| `/dashboard/collaborator/privacy` | Política de Privacidade |
| `/dashboard/collaborator/profile` | Perfil |

### Protegidas — Profissional (`/dashboard/professional/*`)
| Rota | Página |
|---|---|
| `/dashboard/professional` | Visão Geral |
| `/dashboard/professional/cases` | Casos |
| `/dashboard/professional/diagnosis` | Diagnósticos |
| `/dashboard/professional/risks` | Riscos |
| `/dashboard/professional/action-plans` | Planos de Ação |
| `/dashboard/professional/profile` | Perfil |

---

## Variáveis de Ambiente

| Variável | Descrição |
|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave anon pública |
| `VITE_APP_ENV` | `development` \| `staging` \| `production` |
| `VITE_APP_NAME` | Nome da aplicação |
| `VITE_APP_URL` | URL pública da aplicação |

**Secrets no Supabase (Edge Functions):**
- `RESEND_API_KEY` — chave da API Resend
- `FROM_EMAIL` — remetente dos e-mails (`Genesis 360Care <noreply@genesis360care.com.br>`)

---

## Comandos Úteis

```bash
# Desenvolvimento
bun dev                  # Servidor local em :5173
bun run build            # Build de produção
bun run type-check       # Verificar tipos TypeScript
bun run lint             # ESLint (zero warnings)

# Deploy no servidor
cp -r dist/. /var/www/portal.genesis360care.com.br/

# Banco de dados
supabase db push --project-ref ntgdbglvibruhaqfzesx

# Edge functions
supabase functions deploy send-email --project-ref ntgdbglvibruhaqfzesx

# Secrets
supabase secrets set RESEND_API_KEY="..." --project-ref ntgdbglvibruhaqfzesx
```

---

## Infraestrutura de Produção

| Serviço | Endereço |
|---|---|
| Portal | `https://portal.genesis360care.com.br` |
| Landing Page | `https://www.genesis360care.com.br` |
| Supabase API | `https://ntgdbglvibruhaqfzesx.supabase.co` |
| E-mail remetente | `noreply@genesis360care.com.br` |

**Servidor:** VPS com Nginx + Certbot (Let's Encrypt)  
**Cron:** `pg_cron` — `process-email-queue` a cada 5 minutos  
**CI/CD:** GitHub Actions (`.github/workflows/`) — deploy automático no push para `main`
