#!/usr/bin/env bash
# =============================================================================
# Post-Deploy Checker — Verifica se o deploy foi bem-sucedido
# Execute após deploy-helper.sh e setup-portal.sh
# =============================================================================
set -euo pipefail

DOMAIN="portal.genesis360care.com.br"
DEPLOY_DIR="/var/www/${DOMAIN}"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║      Portal Gênesis NR-01 — Verificação Pós-Deploy      ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ─── 1. Verificar arquivos no deploy dir ─────────────────────────────────────
echo -e "${BLUE}▶ Verificando arquivos em ${DEPLOY_DIR}...${NC}"
echo ""

if [ ! -d "$DEPLOY_DIR" ]; then
    echo -e "${RED}✗${NC} Diretório $DEPLOY_DIR não existe"
    ERRORS=$((ERRORS + 1))
else
    # Verificar arquivos essenciais do build
    REQUIRED_BUILD_FILES=(
        "index.html"
        "assets"
    )
    
    for file in "${REQUIRED_BUILD_FILES[@]}"; do
        if [ -e "$DEPLOY_DIR/$file" ]; then
            echo -e "${GREEN}✓${NC} $file presente"
        else
            echo -e "${RED}✗${NC} $file ausente"
            ERRORS=$((ERRORS + 1))
        fi
    done
    
    # Contar arquivos JS e CSS
    JS_COUNT=$(find "$DEPLOY_DIR/assets" -name "*.js" 2>/dev/null | wc -l)
    CSS_COUNT=$(find "$DEPLOY_DIR/assets" -name "*.css" 2>/dev/null | wc -l)
    
    echo -e "${GREEN}✓${NC} $JS_COUNT arquivos JS encontrados"
    echo -e "${GREEN}✓${NC} $CSS_COUNT arquivos CSS encontrados"
    
    if [ "$JS_COUNT" -eq 0 ]; then
        echo -e "${RED}✗${NC} Nenhum arquivo JS! Build pode ter falhado"
        ERRORS=$((ERRORS + 1))
    fi
fi

echo ""

# ─── 2. Verificar Nginx ───────────────────────────────────────────────────────
echo -e "${BLUE}▶ Verificando Nginx...${NC}"
echo ""

if command -v nginx &>/dev/null; then
    # Testar config
    if sudo nginx -t &>/dev/null; then
        echo -e "${GREEN}✓${NC} Configuração do Nginx válida"
    else
        echo -e "${RED}✗${NC} Configuração do Nginx inválida"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Verificar se está rodando
    if systemctl is-active --quiet nginx; then
        echo -e "${GREEN}✓${NC} Nginx está rodando"
    else
        echo -e "${RED}✗${NC} Nginx NÃO está rodando"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Verificar site enabled
    if [ -L "/etc/nginx/sites-enabled/${DOMAIN}.conf" ]; then
        echo -e "${GREEN}✓${NC} Site habilitado no Nginx"
    else
        echo -e "${YELLOW}⚠${NC} Site não está em sites-enabled"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${RED}✗${NC} Nginx não instalado"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# ─── 3. Verificar SSL ─────────────────────────────────────────────────────────
echo -e "${BLUE}▶ Verificando SSL...${NC}"
echo ""

SSL_DIR="/etc/letsencrypt/live/${DOMAIN}"

if [ -f "$SSL_DIR/fullchain.pem" ] && [ -f "$SSL_DIR/privkey.pem" ]; then
    echo -e "${GREEN}✓${NC} Certificados SSL presentes"
    
    # Verificar validade
    EXPIRY=$(sudo openssl x509 -enddate -noout -in "$SSL_DIR/fullchain.pem" 2>/dev/null | cut -d= -f2)
    if [ -n "$EXPIRY" ]; then
        echo -e "${GREEN}✓${NC} Certificado válido até: $EXPIRY"
    fi
else
    echo -e "${YELLOW}⚠${NC} Certificados SSL não encontrados (HTTP apenas)"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# ─── 4. Verificar conectividade HTTP/HTTPS ────────────────────────────────────
echo -e "${BLUE}▶ Testando conectividade...${NC}"
echo ""

# Testar HTTP
if command -v curl &>/dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://${DOMAIN}" 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" -eq 301 ] || [ "$HTTP_CODE" -eq 302 ]; then
        echo -e "${GREEN}✓${NC} HTTP redireciona para HTTPS (${HTTP_CODE})"
    elif [ "$HTTP_CODE" -eq 200 ]; then
        echo -e "${YELLOW}⚠${NC} HTTP responde 200 (deveria redirecionar para HTTPS?)"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${RED}✗${NC} HTTP retornou ${HTTP_CODE}"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Testar HTTPS
    HTTPS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://${DOMAIN}" 2>/dev/null || echo "000")
    
    if [ "$HTTPS_CODE" -eq 200 ]; then
        echo -e "${GREEN}✓${NC} HTTPS responde 200"
    elif [ "$HTTPS_CODE" -eq "000" ]; then
        echo -e "${YELLOW}⚠${NC} HTTPS não acessível (SSL não configurado ou DNS não propagado)"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${RED}✗${NC} HTTPS retornou ${HTTPS_CODE}"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Testar rota /api ou /login
    LOGIN_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://${DOMAIN}/login" 2>/dev/null || echo "000")
    if [ "$LOGIN_CODE" -eq 200 ]; then
        echo -e "${GREEN}✓${NC} Rota /login acessível"
    elif [ "$LOGIN_CODE" -eq "000" ]; then
        echo -e "${YELLOW}⚠${NC} /login não testável (HTTPS indisponível)"
    else
        echo -e "${YELLOW}⚠${NC} /login retornou ${LOGIN_CODE}"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${YELLOW}⚠${NC} curl não instalado, pulando testes HTTP"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# ─── 5. Verificar logs de erro ───────────────────────────────────────────────
echo -e "${BLUE}▶ Verificando logs de erro...${NC}"
echo ""

ERROR_LOG="/var/log/nginx/portal.genesis360care.error.log"
if [ -f "$ERROR_LOG" ]; then
    # Pegar últimas 5 linhas de erro (se houver)
    RECENT_ERRORS=$(sudo tail -5 "$ERROR_LOG" 2>/dev/null | grep -i "error" | wc -l)
    
    if [ "$RECENT_ERRORS" -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Sem erros recentes no log do Nginx"
    else
        echo -e "${YELLOW}⚠${NC} $RECENT_ERRORS erros encontrados no log"
        echo ""
        echo "Últimas linhas:"
        sudo tail -3 "$ERROR_LOG" 2>/dev/null | sed 's/^/  /'
        echo ""
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${YELLOW}⚠${NC} Log de erro não encontrado"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# ─── 6. Verificar bun.lockb no repositório ───────────────────────────────────
echo -e "${BLUE}▶ Verificando repositório Git...${NC}"
echo ""

PROJECT_DIR="/home/genesis360care/htdocs/${DOMAIN}"
if [ -d "$PROJECT_DIR/.git" ]; then
    cd "$PROJECT_DIR"
    
    # Verificar se bun.lockb está commitado
    if git ls-files --error-unmatch bun.lockb &>/dev/null; then
        echo -e "${GREEN}✓${NC} bun.lockb está commitado no Git"
    else
        echo -e "${YELLOW}⚠${NC} bun.lockb NÃO está commitado"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    # Verificar branch
    CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
    echo -e "${GREEN}✓${NC} Branch atual: $CURRENT_BRANCH"
    
    # Verificar se há commits não enviados
    if git status | grep -q "Your branch is ahead"; then
        echo -e "${YELLOW}⚠${NC} Há commits locais não enviados ao GitHub"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${GREEN}✓${NC} Repositório sincronizado com origin"
    fi
else
    echo -e "${YELLOW}⚠${NC} Diretório não é um repositório Git"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# ─── Resumo Final ─────────────────────────────────────────────────────────────
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                  Resumo Pós-Deploy                       ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ DEPLOY BEM-SUCEDIDO!${NC}"
    echo ""
    echo "Acesse: https://${DOMAIN}"
    echo ""
    echo "Próximos passos:"
    echo "  1. Criar usuário admin no Supabase Dashboard"
    echo "  2. Testar login em https://${DOMAIN}/login"
    echo "  3. Configurar monitoramento (opcional)"
    echo ""
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ Deploy OK, mas com $WARNINGS avisos${NC}"
    echo ""
    echo "Revise os avisos acima. O site provavelmente está funcional."
    echo ""
    echo "Acesse: https://${DOMAIN}"
    echo ""
    exit 0
else
    echo -e "${RED}✗ $ERRORS erros encontrados${NC}"
    echo -e "${YELLOW}⚠ $WARNINGS avisos${NC}"
    echo ""
    echo "Verifique os erros acima antes de acessar o site."
    echo ""
    echo "Logs úteis:"
    echo "  sudo tail -f /var/log/nginx/portal.genesis360care.error.log"
    echo "  sudo tail -f /var/log/nginx/portal.genesis360care.access.log"
    echo ""
    exit 1
fi
