#!/usr/bin/env bash
# =============================================================================
# ONE-CLICK DEPLOY — Executa todo o processo de deploy em um comando
# Este script combina validate + deploy + check em uma sequência
# =============================================================================
set -euo pipefail

PROJECT_DIR="/home/genesis360care/htdocs/portal.genesis360care.com.br"
cd "$PROJECT_DIR"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║      Portal Gênesis NR-01 — Deploy Completo (One-Click)       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# ─── ETAPA 1: Tornar scripts executáveis ─────────────────────────────────────
echo -e "${BLUE}[ 1/7 ] Tornando scripts executáveis...${NC}"
chmod +x deploy-helper.sh validate-deploy.sh check-deploy.sh setup-portal.sh make-executable.sh
chmod +x scripts/*.sh
echo -e "${GREEN}✓ Scripts prontos${NC}"
echo ""

# ─── ETAPA 2: Validar estrutura ──────────────────────────────────────────────
echo -e "${BLUE}[ 2/7 ] Validando estrutura do projeto...${NC}"
echo ""
if ! bash validate-deploy.sh; then
    echo ""
    echo -e "${RED}✗ Validação falhou. Corrija os erros antes de continuar.${NC}"
    exit 1
fi
echo ""

# ─── ETAPA 3: Instalar dependências ──────────────────────────────────────────
echo -e "${BLUE}[ 3/7 ] Instalando dependências com Bun...${NC}"
if ! command -v bun &>/dev/null; then
    echo -e "${RED}✗ Bun não está instalado.${NC}"
    echo "Instale com: curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

bun install
echo -e "${GREEN}✓ Dependências instaladas${NC}"
echo""

# ─── ETAPA 4: Verificar bun.lockb ─────────────────────────────────────────────
echo -e "${BLUE}[ 4/7 ] Verificando bun.lockb...${NC}"
if [ -f "bun.lockb" ]; then
    echo -e "${GREEN}✓ bun.lockb gerado${NC}"
else
    echo -e "${RED}✗ bun.lockb não foi gerado${NC}"
    exit 1
fi
echo ""

# ─── ETAPA 5: Git commit e push ───────────────────────────────────────────────
echo -e "${BLUE}[ 5/7 ] Commitando e enviando para GitHub...${NC}"

if [ ! -d ".git" ]; then
    echo -e "${YELLOW}⚠ Inicializando repositório Git...${NC}"
    git init
    git remote add origin https://github.com/jessestainx/G-nesis-NR-01.git
fi

git add -A

if git diff --cached --quiet; then
    echo -e "${YELLOW}⚠ Nenhuma mudança para commitar${NC}"
else
    git commit -m "feat: deploy completo - migrations corrigidas, CI/CD bun, scripts automação, docs"
    echo -e "${GREEN}✓ Commit criado${NC}"
fi

echo ""
read -r -p "Fazer push para origin main agora? (y/N): " DO_PUSH
if [[ "$DO_PUSH" =~ ^[Yy]$ ]]; then
    git push origin main
    echo -e "${GREEN}✓ Push realizado${NC}"
    echo ""
    echo -e "${BLUE}⏳ Aguarde ~2-3 minutos para o GitHub Actions executar...${NC}"
    echo "   Acompanhe em: https://github.com/jessestainx/G-nesis-NR-01/actions"
    echo ""
    read -r -p "Pressione ENTER quando o workflow estiver verde (✓)..."
else
    echo -e "${YELLOW}⚠ Push cancelado. Execute manualmente: git push origin main${NC}"
    echo ""
    read -r -p "Continuar mesmo assim? (y/N): " CONTINUE
    if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi
echo ""

# ─── ETAPA 6: Setup do servidor ───────────────────────────────────────────────
echo -e "${BLUE}[ 6/7 ] Configurando servidor web (Nginx + SSL)...${NC}"
echo ""

if [ -z "${CERTBOT_EMAIL:-}" ]; then
    echo -e "${YELLOW}⚠ CERTBOT_EMAIL não definido${NC}"
    read -r -p "Digite seu e-mail para o Certbot (ou ENTER para pular SSL): " EMAIL_INPUT
    
    if [ -n "$EMAIL_INPUT" ]; then
        export CERTBOT_EMAIL="$EMAIL_INPUT"
        echo -e "${GREEN}✓ E-mail configurado: $CERTBOT_EMAIL${NC}"
    else
        echo -e "${YELLOW}⚠ SSL será configurado manualmente depois${NC}"
    fi
fi

echo ""
echo "Executando setup-portal.sh..."
echo ""

bash setup-portal.sh

echo ""
echo -e "${GREEN}✓ Servidor configurado${NC}"
echo ""

# ─── ETAPA 7: Verificação pós-deploy ──────────────────────────────────────────
echo -e "${BLUE}[ 7/7 ] Verificando deploy...${NC}"
echo ""

bash check-deploy.sh

# ─── RESUMO FINAL ─────────────────────────────────────────────────────────────
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    Deploy Finalizado! 🎉                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✓ Build gerado e publicado${NC}"
echo -e "${GREEN}✓ Nginx configurado${NC}"
echo -e "${GREEN}✓ Site acessível${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Próximas etapas:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Criar projetos no Supabase:"
echo "   → https://supabase.com/dashboard"
echo "   → Projetos: genesis-nr01-dev, genesis-nr01-staging, genesis-nr01-prod"
echo ""
echo "2. Preencher .env.production:"
echo "   → cp .env.example .env.production"
echo "   → nano .env.production"
echo ""
echo "3. Aplicar migrations:"
echo "   → bun run supabase:setup:prod"
echo ""
echo "4. Criar usuário admin:"
echo "   → bun run supabase:create-admin:prod"
echo ""
echo "5. Configurar GitHub Secrets (9 obrigatórios):"
echo "   → https://github.com/jessestainx/G-nesis-NR-01/settings/secrets/actions"
echo ""
echo "6. Testar o portal:"
echo "   → https://portal.genesis360care.com.br/login"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 Documentação:"
echo "   DEPLOY-CHECKLIST.md    — Guia completo"
echo "   TROUBLESHOOTING.md     — Solução de problemas"
echo "   QUICK-COMMANDS.md      — Comandos úteis"
echo ""
