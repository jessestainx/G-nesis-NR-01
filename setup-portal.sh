#!/usr/bin/env bash
# =============================================================================
#  setup-portal.sh — Configura o subdomínio portal.genesis360care.com.br
# =============================================================================
set -euo pipefail

SUBDOMAIN="portal.genesis360care.com.br"
PROJECT_DIR="/home/genesis360care/htdocs/${SUBDOMAIN}"
DEPLOY_DIR="/var/www/${SUBDOMAIN}"
NGINX_AVAILABLE="/etc/nginx/sites-available/${SUBDOMAIN}.conf"
NGINX_ENABLED="/etc/nginx/sites-enabled/${SUBDOMAIN}.conf"
SSL_CERT_DIR="/etc/letsencrypt/live/${SUBDOMAIN}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"

check_dns_resolution() {
  getent ahostsv4 "${SUBDOMAIN}" 2>/dev/null | awk '{print $1}' | sort -u
}

write_bootstrap_nginx_config() {
  sudo tee "${NGINX_AVAILABLE}" >/dev/null <<EOF
server {
  listen 80;
  server_name ${SUBDOMAIN};

  root ${DEPLOY_DIR};
  index index.html;

  location ^~ /.well-known/acme-challenge/ {
    root ${DEPLOY_DIR};
    default_type "text/plain";
  }

  location / {
    try_files \$uri \$uri/ /index.html;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires 0;
  }

  access_log /var/log/nginx/portal.genesis360care.access.log;
  error_log  /var/log/nginx/portal.genesis360care.error.log;
}
EOF
}

echo "🚀 Configurando ${SUBDOMAIN}..."

# 1. Instalar dependências do projeto
echo ""
echo "📦 Instalando dependências..."
cd "${PROJECT_DIR}"
bun install

# 2. Build de produção
echo ""
echo "🔨 Gerando build de produção..."
bun run build

# 3. Publicar build no diretório servido pelo Nginx
echo ""
echo "📁 Publicando build em ${DEPLOY_DIR}..."
if [ ! -d "${PROJECT_DIR}/dist" ]; then
  echo "   ❌ Build não gerou a pasta dist/. Abortando."
  exit 1
fi

sudo mkdir -p "${DEPLOY_DIR}"
sudo find "${DEPLOY_DIR}" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
sudo cp -a "${PROJECT_DIR}/dist/." "${DEPLOY_DIR}/"

# 4. Copiar config do Nginx
echo ""
echo "⚙️  Configurando Nginx..."
if [ -f "${SSL_CERT_DIR}/fullchain.pem" ] && [ -f "${SSL_CERT_DIR}/privkey.pem" ]; then
  sudo cp "${PROJECT_DIR}/nginx.conf" "${NGINX_AVAILABLE}"
  echo "   ✅ Configuração HTTPS aplicada"
else
  write_bootstrap_nginx_config
  echo "   ✅ Configuração HTTP inicial aplicada para emissão do SSL"
fi

# 5. Ativar site (criar symlink)
if [ ! -L "${NGINX_ENABLED}" ]; then
  sudo ln -s "${NGINX_AVAILABLE}" "${NGINX_ENABLED}"
  echo "   ✅ Symlink criado em sites-enabled"
else
  echo "   ℹ️  Symlink já existe"
fi

# 6. Testar e recarregar Nginx
echo ""
echo "🔄 Validando e recarregando Nginx..."
sudo nginx -t && sudo systemctl reload nginx

# 7. Gerar certificado SSL com Certbot
echo ""
echo "🔒 Certificado SSL..."
if command -v certbot &>/dev/null; then
  if [ -f "${SSL_CERT_DIR}/fullchain.pem" ] && [ -f "${SSL_CERT_DIR}/privkey.pem" ]; then
    echo "   ℹ️  Certificado já existe."
  elif [ -z "$(check_dns_resolution)" ]; then
    echo "   ⚠️  DNS ainda não aponta para ${SUBDOMAIN}."
    echo "   Crie o registro DNS (A ou CNAME) e aguarde a propagação antes de emitir o SSL."
  elif [ -z "${CERTBOT_EMAIL}" ]; then
    echo "   ⚠️  Defina CERTBOT_EMAIL antes de executar o script para emitir o SSL automaticamente."
    echo "   Exemplo: CERTBOT_EMAIL=seu-email@dominio ./setup-portal.sh"
  else
    sudo certbot --nginx -d "${SUBDOMAIN}" --non-interactive --agree-tos --redirect \
      -m "${CERTBOT_EMAIL}"

    sudo cp "${PROJECT_DIR}/nginx.conf" "${NGINX_AVAILABLE}"
    sudo nginx -t && sudo systemctl reload nginx
    echo "   ✅ Certificado emitido e configuração HTTPS aplicada."
  fi
else
  echo "   ⚠️  Certbot não encontrado. Instale: sudo apt install certbot python3-certbot-nginx"
  echo "   Depois execute: sudo certbot --nginx -d ${SUBDOMAIN}"
fi

echo ""
if [ -f "${SSL_CERT_DIR}/fullchain.pem" ] && [ -f "${SSL_CERT_DIR}/privkey.pem" ]; then
  echo "✅ Pronto! Acesse: https://${SUBDOMAIN}"
else
  echo "✅ Build publicado! Enquanto o SSL não for emitido, teste em: http://${SUBDOMAIN}"
fi
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Próximos passos:"
echo "  1. Adicione o registro DNS: A  portal  →  IP_DO_SERVIDOR"
echo "  2. Se for usar SSL automático, exporte CERTBOT_EMAIL e rode o script novamente"
echo "  3. Verifique se a porta 80/443 está liberada no servidor/firewall"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
