#!/usr/bin/env bash
# =============================================================================
# Make Scripts Executable — Torna todos os scripts bash executáveis
# Execute uma vez após clonar o repositório
# =============================================================================

echo "Tornando scripts executáveis..."

chmod +x deploy-helper.sh
chmod +x validate-deploy.sh
chmod +x check-deploy.sh
chmod +x setup-portal.sh

chmod +x scripts/setup-dev.sh
chmod +x scripts/setup-staging.sh
chmod +x scripts/setup-prod.sh
chmod +x scripts/gen-types.sh
chmod +x scripts/create-admin.sh

echo "✓ Todos os scripts agora são executáveis"
echo ""
echo "Scripts disponíveis:"
echo "  ./deploy-helper.sh      — Assistente de deploy"
echo "  ./validate-deploy.sh    — Validação pré-deploy"
echo "  ./check-deploy.sh       — Verificação pós-deploy"
echo "  ./setup-portal.sh       — Setup do servidor (Nginx + SSL)"
echo ""
echo "Scripts Supabase (via bun run):"
echo "  bun run supabase:setup:dev"
echo "  bun run supabase:setup:prod"
echo "  bun run supabase:create-admin:prod"
echo ""
