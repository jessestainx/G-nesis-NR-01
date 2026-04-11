# Gênesis NR-01 — Perfis de Usuário (Roles)

## Resumo

O sistema possui **4 tipos de usuário**. Cada tipo tem acesso a um painel exclusivo com funcionalidades específicas para seu contexto.

| Role | Painel | Descrição |
|---|---|---|
| `genesis` | `/dashboard/genesis` | Administrador da Genesis360Care |
| `client_executive` | `/dashboard/client` | Executivo da empresa contratante |
| `professional` | `/dashboard/professional` | Médico/psicólogo/consultor parceiro |
| `collaborator` | `/dashboard/collaborator` | Funcionário da empresa cliente |

---

## 1. Genesis (Administrador)

**Quem usa:** Equipe interna da Genesis360Care  
**URL:** `https://portal.genesis360care.com.br/dashboard/genesis`

### Acesso no banco
- Leitura e escrita em **todas** as tabelas de **todas** as organizações
- Gerenciamento completo de usuários, contratos e configurações

### Funcionalidades

| Módulo | Rota | O que faz |
|---|---|---|
| Visão Geral | `/` | Dashboard com KPIs consolidados de todas as orgs |
| Organizações | `/organizations` | CRUD de empresas clientes (com autocomplete CNPJ) |
| Usuários | `/users` | CRUD de usuários e atribuição de roles |
| Diagnósticos | `/diagnosis` | Criação e acompanhamento de diagnósticos NR-01 |
| Planos de Ação | `/action-plans` | Gestão de planos e itens de ação |
| Pesquisas de Pulso | `/pulse` | Criação e análise de pesquisas de clima |
| Treinamentos | `/trainings` | Registro de treinamentos realizados |
| Maturidade NR-01 | `/maturity` | Score de maturidade de conformidade |
| CRM | `/crm` | Gestão de leads e pipeline comercial |
| Financeiro | `/finance` | Contratos, receitas e transações |
| Auditoria | `/audit` | Log de todas as ações no sistema |
| Config. por Org | `/org-settings` | Notificações de e-mail por organização |
| Status do Sistema | `/system-status` | Monitoramento da infraestrutura |
| Perfil | `/profile` | Dados pessoais do usuário |

### Como criar um usuário Genesis
```sql
-- Via Supabase SQL Editor:
UPDATE public.profiles SET role = 'genesis' WHERE email = 'usuario@genesis360care.com.br';
```

---

## 2. Cliente Executivo

**Quem usa:** Diretor de RH, gerente de SST ou responsável pela empresa contratante  
**URL:** `https://portal.genesis360care.com.br/dashboard/client`

### Acesso no banco
- Leitura e escrita apenas nos dados da **própria organização**
- Filtrado automaticamente via RLS pelo `organization_id` do perfil

### Funcionalidades

| Módulo | Rota | O que faz |
|---|---|---|
| Visão Geral | `/` | Dashboard com status da organização |
| Diagnóstico | `/diagnosis` | Acompanhar diagnósticos NR-01 da empresa |
| Riscos | `/risks` | Visualizar riscos psicossociais identificados |
| Planos de Ação | `/action-plans` | Acompanhar e atualizar planos de ação |
| Documentos | `/documents` | Acessar documentos gerados (laudos, relatórios) |
| Treinamentos | `/trainings` | Ver treinamentos realizados pela equipe |
| Pesquisas de Pulso | `/pulse` | Visualizar resultados das pesquisas de clima |
| Perfil | `/profile` | Dados pessoais |

### Como criar um usuário Cliente Executivo
1. No painel Genesis → **Usuários** → **Novo Usuário**
2. Definir role `client_executive`
3. Vincular à organização correspondente

---

## 3. Profissional

**Quem usa:** Médico do trabalho, psicólogo organizacional ou consultor parceiro  
**URL:** `https://portal.genesis360care.com.br/dashboard/professional`

### Acesso no banco
- Leitura dos dados das organizações às quais está vinculado
- Pode registrar diagnósticos e riscos, mas não altera dados financeiros/CRM

### Funcionalidades

| Módulo | Rota | O que faz |
|---|---|---|
| Visão Geral | `/` | Dashboard com casos e organizações atendidas |
| Casos | `/cases` | Lista de atendimentos e casos clínicos |
| Diagnósticos | `/diagnosis` | Elaborar e acompanhar diagnósticos NR-01 |
| Riscos | `/risks` | Registrar e classificar riscos psicossociais |
| Planos de Ação | `/action-plans` | Sugerir e acompanhar planos de mitigação |
| Perfil | `/profile` | Dados profissionais e especialidades |

### Como criar um usuário Profissional
1. No painel Genesis → **Usuários** → **Novo Usuário**
2. Definir role `professional`
3. Vincular às organizações que irá atender

---

## 4. Colaborador

**Quem usa:** Funcionário de uma empresa cliente  
**URL:** `https://portal.genesis360care.com.br/dashboard/collaborator`

### Acesso no banco
- Acesso **mínimo e anônimo** — não vê dados de outros colaboradores
- Pode responder pesquisas; respostas são anonimizadas na análise

### Funcionalidades

| Módulo | Rota | O que faz |
|---|---|---|
| Visão Geral | `/` | Boas-vindas, pesquisas pendentes |
| Responder Pesquisa | `/survey` | Participar das pesquisas de pulso ativas |
| Política de Privacidade | `/privacy` | Visualizar política de privacidade e LGPD |
| Perfil | `/profile` | Dados básicos do colaborador |

### Privacidade e LGPD
- Respostas de pesquisa são **agrupadas** — jama expostas individualmente para o cliente
- O colaborador pode consultar sua política de privacidade a qualquer momento
- Conforme LGPD: mínimo de dados coletados, finalidade específica declarada

### Como criar um usuário Colaborador
```
Método automático (futuro): link de convite enviado por e-mail pela empresa
Método manual: Genesis cria o usuário e vincula à organização
Role padrão ao signup: 'collaborator' (definido no trigger on_auth_user_created)
```

---

## Fluxo de Redirecionamento por Role

```
POST /login
    │
    ▼ Supabase Auth retorna JWT
    │
    ▼ AuthContext carrega profiles (role, organization_id)
    │
GET /app → DashboardRouter
    │
    ├── role = 'genesis'           → /dashboard/genesis
    ├── role = 'client_executive'  → /dashboard/client
    ├── role = 'collaborator'      → /dashboard/collaborator
    ├── role = 'professional'      → /dashboard/professional
    └── role = null / desconhecido → /unauthorized
```

---

## Segurança: ProtectedRoute

Toda rota de painel é envolvida por `<ProtectedRoute allowedRoles={[...]}>`  
Se o usuário autenticado tentar acessar o painel de outro role → redirecionado para `/unauthorized`

```tsx
// Exemplo: apenas genesis acessa
<ProtectedRoute allowedRoles={['genesis']}>
  <DashboardLayout />
</ProtectedRoute>
```

---

## Tabela Completa de Permissões

| Funcionalidade | genesis | client_executive | professional | collaborator |
|---|:---:|:---:|:---:|:---:|
| Ver todas as orgs | ✅ | ❌ | ❌ | ❌ |
| Criar/editar org | ✅ | ❌ | ❌ | ❌ |
| Ver diagnósticos da própria org | ✅ | ✅ | ✅ | ❌ |
| Criar diagnósticos | ✅ | ❌ | ✅ | ❌ |
| Ver riscos | ✅ | ✅ | ✅ | ❌ |
| Criar/editar riscos | ✅ | ❌ | ✅ | ❌ |
| Planos de ação (leitura) | ✅ | ✅ | ✅ | ❌ |
| Planos de ação (escrita) | ✅ | ✅ | ✅ | ❌ |
| Responder pesquisas | ✅ | ❌ | ❌ | ✅ |
| Ver resultados de pesquisas | ✅ | ✅ | ✅ | ❌ |
| Acessar CRM | ✅ | ❌ | ❌ | ❌ |
| Acessar financeiro | ✅ | ❌ | ❌ | ❌ |
| Ver log de auditoria | ✅ | ❌ | ❌ | ❌ |
| Gerenciar usuários | ✅ | ❌ | ❌ | ❌ |
| Config. de e-mail por org | ✅ | ✅ | ❌ | ❌ |
