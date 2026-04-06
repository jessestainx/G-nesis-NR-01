#!/usr/bin/env bash
# =============================================================================
# Pre-Deploy Validator — Verifica se tudo está pronto para deploy
# Execute antes de rodar deploy-helper.sh
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

ERRORS=0
WARNINGS=0

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║         Portal Gênesis NR-01 — Validação Pré-Deploy     ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ─── 1. Verificar estrutura de arquivos ──────────────────────────────────────
echo -e "${BLUE}▶ Verificando estrutura de arquivos...${NC}"
echo ""

REQUIRED_FILES=(
    "package.json"
    "tsconfig.json"
    "vite.config.ts"
    "index.html"
    "src/main.tsx"
    "src/App.tsx"
    "src/vite-env.d.ts"
    "src/lib/env.ts"
    "src/lib/supabase.ts"
    ".env.example"
    "setup-portal.sh"
    "deploy-helper.sh"
    "DEPLOY-CHECKLIST.md"
    "README.md"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file (AUSENTE)"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""

# ─── 2. Verificar migrations SQL ──────────────────────────────────────────────
echo -e "${BLUE}▶ Verificando migrations...${NC}"
echo ""

MIGRATIONS=(
    "supabase/migrations/001_initial_schema.sql"
    "supabase/migrations/002_rls_policies.sql"
    "supabase/migrations/003_storage.sql"
)

for migration in "${MIGRATIONS[@]}"; do
    if [ -f "$migration" ]; then
        # Verificar se ainda tem role antigo
        if grep -q "genesis_admin\|consultor\|cliente_" "$migration"; then
            echo -e "${RED}✗${NC} $migration (contém roles antigos)"
            ERRORS=$((ERRORS + 1))
        else
            echo -e "${GREEN}✓${NC} $migration"
        fi
    else
        echo -e "${RED}✗${NC} $migration (AUSENTE)"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""

# ─── 3. Verificar scripts bash ────────────────────────────────────────────────
echo -e "${BLUE}▶ Verificando scripts bash...${NC}"
echo ""

SCRIPTS=(
    "scripts/setup-dev.sh"
    "scripts/setup-staging.sh"
    "scripts/setup-prod.sh"
    "scripts/gen-types.sh"
    "scripts/create-admin.sh"
)

for script in "${SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        if [ -x "$script" ]; then
            echo -e "${GREEN}✓${NC} $script (executável)"
        else
            echo -e "${YELLOW}⚠${NC} $script (não executável, rodando chmod +x)"
            chmod +x "$script"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        echo -e "${RED}✗${NC} $script (AUSENTE)"
        ERRORS=$((ERRORS + 1))
    fi
done

# Tornar deploy-helper.sh e setup-portal.sh executáveis
for script in "deploy-helper.sh" "setup-portal.sh"; do
    if [ -f "$script" ]; then
        if [ ! -x "$script" ]; then
            chmod +x "$script"
            echo -e "${YELLOW}⚠${NC} $script (tornado executável)"
            WARNINGS=$((WARNINGS + 1))
        fi
    fi
done

echo ""

# ─── 4. Verificar workflows GitHub Actions ───────────────────────────────────
echo -e "${BLUE}▶ Verificando workflows...${NC}"
echo ""

WORKFLOWS=(
    ".github/workflows/ci.yml"
    ".github/workflows/deploy-production.yml"
    ".github/workflows/deploy-staging.yml"
)

for workflow in "${WORKFLOWS[@]}"; do
    if [ -f "$workflow" ]; then
        # Verificar se usa bun
        if grep -q "setup-bun" "$workflow"; then
            echo -e "${GREEN}✓${NC} $workflow (usa bun)"
        else
            echo -e "${RED}✗${NC} $workflow (ainda usa npm?)"
            ERRORS=$((ERRORS + 1))
        fi
    else
        echo -e "${RED}✗${NC} $workflow (AUSENTE)"
        ERRORS=$((ERRORS + 1))
    fi
done

echo ""

# ─── 5. Verificar .env.example ────────────────────────────────────────────────
echo -e "${BLUE}▶ Verificando variáveis de ambiente...${NC}"
echo ""

if [ -f ".env.example" ]; then
    REQUIRED_VARS=(
        "VITE_SUPABASE_URL"
        "VITE_SUPABASE_ANON_KEY"
        "VITE_APP_ENV"
        "VITE_APP_NAME"
        "VITE_APP_URL"
    )
    
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "$var" ".env.example"; then
            echo -e "${GREEN}✓${NC} $var presente em .env.example"
        else
            echo -e "${RED}✗${NC} $var ausente em .env.example"
            ERRORS=$((ERRORS + 1))
        fi
    done
else
    echo -e "${RED}✗${NC} .env.example não encontrado"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# ─── 6. Verificar .gitignore ──────────────────────────────────────────────────
echo -e "${BLUE}▶ Verificando .gitignore...${NC}"
echo ""

if [ -f ".gitignore" ]; then
    IGNORED=(
        ".env.production"
        ".env.development"
        ".env.staging"
        "node_modules"
        "dist"
    )
    
    for item in "${IGNORED[@]}"; do
        if grep -q "$item" ".gitignore"; then
            echo -e "${GREEN}✓${NC} $item está no .gitignore"
        else
            echo -e "${YELLOW}⚠${NC} $item NÃO está no .gitignore"
            WARNINGS=$((WARNINGS + 1))
        fi
    done
else
    echo -e "${RED}✗${NC} .gitignore não encontrado"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# ─── 7. Verificar package.json ────────────────────────────────────────────────
echo -e "${BLUE}▶ Verificando package.json...${NC}"
echo ""

if [ -f "package.json" ]; then
    # Verificar se tem scripts supabase
    if grep -q "supabase:setup:prod" "package.json"; then
        echo -e "${GREEN}✓${NC} Scripts supabase configurados"
    else
        echo -e "${RED}✗${NC} Scripts supabase ausentes"
        ERRORS=$((ERRORS + 1))
    fi
    
    # Verificar se usa bun como type
    if grep -q '"type": "module"' "package.json"; then
        echo -e "${GREEN}✓${NC} type: module configurado"
    else
        echo -e "${YELLOW}⚠${NC} type: module não encontrado"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${RED}✗${NC} package.json não encontrado"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# ─── 8. Verificar se node_modules existe ──────────────────────────────────────
echo -e "${BLUE}▶ Verificando dependências...${NC}"
echo ""

if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules já existe"
else
    echo -e "${YELLOW}⚠${NC} node_modules não existe (rode: bun install)"
    WARNINGS=$((WARNINGS + 1))
fi

if [ -f "bun.lockb" ]; then
    echo -e "${GREEN}✓${NC} bun.lockb já existe"
else
    echo -e "${YELLOW}⚠${NC} bun.lockb não existe (será gerado pelo deploy-helper.sh)"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# ─── Resumo Final ─────────────────────────────────────────────────────────────
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                    Resumo da Validação                   ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ TUDO OK! Pronto para deploy.${NC}"
    echo ""
    echo "Próximo passo:"
    echo "  bash deploy-helper.sh"
    echo ""
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS avisos encontrados${NC}"
    echo ""
    echo "Avisos não impedem o deploy, mas revise os itens acima."
    echo ""
    echo "Próximo passo:"
    echo "  bash deploy-helper.sh"
    echo ""
    exit 0
else
    echo -e "${RED}✗ $ERRORS erros encontrados${NC}"
    echo -e "${YELLOW}⚠ $WARNINGS avisos${NC}"
    echo ""
    echo "Corrija os erros antes de fazer deploy."
    echo ""
    exit 1
fi
