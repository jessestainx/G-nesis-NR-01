#!/usr/bin/env bash
# =============================================================================
# Deploy Helper — Automação máxima do checklist de deploy
# Execute: ./deploy-helper.sh
# =============================================================================
set -euo pipefail

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   Portal Gênesis NR-01 — Assistente de Deploy           ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

PROJECT_DIR="/home/genesis360care/htdocs/portal.genesis360care.com.br"
cd "$PROJECT_DIR"

# ─── Cores ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ─── Funções auxiliares ───────────────────────────────────────────────────────
print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

check_command() {
    if command -v "$1" &>/dev/null; then
        print_success "$1 está instalado"
        return 0
    else
        print_error "$1 não encontrado"
        return 1
    fi
}

# ─── ETAPA 1: Verificar dependências ─────────────────────────────────────────
print_step "Verificando dependências..."
echo ""

MISSING_DEPS=0

check_command "bun" || MISSING_DEPS=$((MISSING_DEPS + 1))
check_command "git" || MISSING_DEPS=$((MISSING_DEPS + 1))
check_command "supabase" || {
    print_warning "Supabase CLI não instalado (necessário para ETAPA 4)"
}

echo ""

if [ $MISSING_DEPS -gt 0 ]; then
    print_error "Faltam dependências obrigatórias. Instale-as antes de continuar."
    echo ""
    echo "Instalar Bun: https://bun.sh/docs/installation"
    echo "Instalar Git: sudo apt install git"
    exit 1
fi

# ─── ETAPA 2: Gerar bun.lockb ─────────────────────────────────────────────────
print_step "Gerando bun.lockb..."
echo ""

if [ -f "bun.lockb" ]; then
    print_warning "bun.lockb já existe. Pulando instalação."
else
    bun install
    if [ -f "bun.lockb" ]; then
        print_success "bun.lockb gerado com sucesso"
    else
        print_error "Falha ao gerar bun.lockb"
        exit 1
    fi
fi

echo ""

# ─── ETAPA 3: Verificar Git ───────────────────────────────────────────────────
print_step "Verificando repositório Git..."
echo ""

if [ ! -d ".git" ]; then
    print_error "Este diretório não é um repositório Git"
    echo ""
    read -r -p "Deseja inicializar? (y/N): " INIT_GIT
    if [[ "$INIT_GIT" =~ ^[Yy]$ ]]; then
        git init
        git remote add origin https://github.com/jessestainx/G-nesis-NR-01.git
        print_success "Git inicializado"
    else
        print_error "Abortado pelo usuário"
        exit 1
    fi
fi

# ─── ETAPA 4: Commit e Push ───────────────────────────────────────────────────
print_step "Preparando commit..."
echo ""

git add -A

if git diff --cached --quiet; then
    print_warning "Nenhuma mudança para commitar"
else
    git commit -m "feat: setup completo - migrations, CI/CD, scripts bash, vite-env.d.ts, deploy-helper"
    print_success "Commit criado"
    
    echo ""
    read -r -p "Deseja fazer push para origin main? (y/N): " DO_PUSH
    if [[ "$DO_PUSH" =~ ^[Yy]$ ]]; then
        git push origin main
        print_success "Push realizado com sucesso"
    else
        print_warning "Push cancelado. Execute manualmente: git push origin main"
    fi
fi

echo ""

# ─── ETAPA 5: Verificar .env.production ───────────────────────────────────────
print_step "Verificando .env.production..."
echo ""

if [ ! -f ".env.production" ]; then
    print_warning ".env.production não existe"
    echo ""
    echo "Copie o template e preencha as credenciais do Supabase:"
    echo "  cp .env.example .env.production"
    echo "  nano .env.production"
    echo ""
    ENV_READY=false
else
    if grep -q "SEU_PROJECT" ".env.production"; then
        print_warning ".env.production ainda tem valores placeholder"
        echo ""
        echo "Edite o arquivo e substitua os valores:"
        echo "  nano .env.production"
        echo ""
        ENV_READY=false
    else
        print_success ".env.production configurado"
        ENV_READY=true
    fi
fi

# ─── ETAPA 6: Supabase Setup (Opcional) ───────────────────────────────────────
if [ "$ENV_READY" = true ] && command -v supabase &>/dev/null; then
    echo ""
    read -r -p "Deseja aplicar migrations no Supabase PRODUÇÃO agora? (y/N): " DO_MIGRATIONS
    if [[ "$DO_MIGRATIONS" =~ ^[Yy]$ ]]; then
        print_step "Executando setup-prod.sh..."
        echo ""
        bash scripts/setup-prod.sh
        
        echo ""
        read -r -p "Deseja criar o usuário admin agora? (y/N): " DO_ADMIN
        if [[ "$DO_ADMIN" =~ ^[Yy]$ ]]; then
            bash scripts/create-admin.sh prod
        fi
    fi
fi

# ─── RESUMO FINAL ─────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║               Resumo da Execução                         ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

print_success "bun.lockb criado/verificado"
print_success "Dependências instaladas"

if git diff --cached --quiet && [ ! -f "bun.lockb" ]; then
    print_warning "Código não commitado ainda"
else
    print_success "Código commitado"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Próximas etapas manuais:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Criar 3 projetos no Supabase:"
echo "   https://supabase.com/dashboard"
echo ""
echo "2. Preencher os .env files:"
echo "   cp .env.example .env.development"
echo "   cp .env.example .env.staging"
echo "   cp .env.example .env.production"
echo ""
echo "3. Configurar GitHub Secrets (9 no total):"
echo "   https://github.com/jessestainx/G-nesis-NR-01/settings/secrets/actions"
echo ""
echo "4. Executar no servidor:"
echo "   CERTBOT_EMAIL=seu@email.com ./setup-portal.sh"
echo ""
echo "📖 Consulte DEPLOY-CHECKLIST.md para instruções detalhadas"
echo ""
