# Troubleshooting — Portal Gênesis NR-01

## 🚨 Problemas Comuns e Soluções

### 1. CI/CD Falha: "bun.lockb not found"

**Erro:**
```
Error: Cannot find module 'bun install --frozen-lockfile'
```

**Causa:** O `bun.lockb` não foi commitado no repositório.

**Solução:**
```bash
cd /home/genesis360care/htdocs/portal.genesis360care.com.br
bun install
git add bun.lockb
git commit -m "chore: add bun.lockb"
git push origin main
```

---

### 2. Build Falha: "VITE_SUPABASE_URL is required"

**Erro:**
```
[env] Variável obrigatória ausente: VITE_SUPABASE_URL
```

**Causa:** Arquivo `.env.production` ausente ou mal configurado.

**Solução:**
```bash
cp .env.example .env.production
nano .env.production
```

Preencher:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_APP_ENV=production
VITE_APP_URL=https://portal.genesis360care.com.br
```

---

### 3. Deploy SSH Falha: "Permission denied (publickey)"

**Erro no GitHub Actions:**
```
Permission denied (publickey).
rsync: connection unexpectedly closed
```

**Causa:** Secret `PROD_SERVER_SSH_KEY` inválido ou incompleto.

**Solução:**

1. Gerar nova chave SSH no servidor:
```bash
ssh-keygen -t ed25519 -C "deploy-portal" -f ~/.ssh/deploy_portal
cat ~/.ssh/deploy_portal.pub >> ~/.ssh/authorized_keys
```

2. Copiar chave privada COMPLETA (incluindo cabeçalhos):
```bash
cat ~/.ssh/deploy_portal
```

3. Colar no GitHub Secret `PROD_SERVER_SSH_KEY` (Settings → Secrets → Actions)

**IMPORTANTE:** O secret deve incluir:
```
-----BEGIN OPENSSH PRIVATE KEY-----
...conteúdo...
-----END OPENSSH PRIVATE KEY-----
```

---

### 4. Nginx: 502 Bad Gateway

**Causa:** Build não foi gerado ou está incompleto.

**Solução:**
```bash
cd /home/genesis360care/htdocs/portal.genesis360care.com.br
bun run build

# Verificar se dist/ foi criado
ls -la dist/

# Re-copiar para /var/www
sudo rm -rf /var/www/portal.genesis360care.com.br/*
sudo cp -r dist/* /var/www/portal.genesis360care.com.br/

# Recarregar Nginx
sudo systemctl reload nginx
```

---

### 5. Nginx: 404 Not Found em todas as rotas

**Causa:** Configuração do Nginx não tem `try_files` para SPA.

**Solução:**

Verificar se `nginx.conf` tem:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Se não tiver, copiar config correta:
```bash
sudo cp nginx.conf /etc/nginx/sites-available/portal.genesis360care.com.br.conf
sudo nginx -t
sudo systemctl reload nginx
```

---

### 6. TypeScript: "Cannot find module 'react/jsx-runtime'"

**Causa:** Falta `src/vite-env.d.ts`.

**Solução:**

Criar `src/vite-env.d.ts`:
```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string
    readonly VITE_SUPABASE_ANON_KEY: string
    readonly VITE_APP_ENV: string
    readonly VITE_APP_NAME: string
    readonly VITE_APP_URL: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
```

```bash
git add src/vite-env.d.ts
git commit -m "fix: add vite-env.d.ts"
git push
```

---

### 7. Supabase: Migrations Falham com "genesis_admin does not exist"

**Causa:** Migrations ainda têm roles antigos.

**Solução:**

Verificar se migrations usam os roles corretos:
```bash
grep -r "genesis_admin\|consultor\|cliente_" supabase/migrations/
```

Se encontrar ocorrências, substituir manualmente:
- `genesis_admin` → `genesis`
- `consultor` → `professional`
- `cliente_gestor`, `cliente_rh` → `client_executive`
- `cliente_colaborador` → `collaborator`

```bash
git add supabase/migrations/
git commit -m "fix: update role names in migrations"
git push
```

---

### 8. Login Falha: "Unauthorized" para todos os usuários

**Causa:** Usuário criado com role errado ou RLS policies configuradas com roles antigos.

**Diagnóstico:**
```sql
-- No SQL Editor do Supabase
SELECT id, email, role FROM public.profiles WHERE email = 'admin@genesis360care.com.br';
```

Se role estiver como `genesis_admin` ou `cliente_colaborador`, corrigir:

**Solução:**
```sql
UPDATE public.profiles 
SET role = 'genesis' 
WHERE email = 'admin@genesis360care.com.br';
```

Ou recriar usuário via `create-admin.sh`:
```bash
bun run supabase:create-admin:prod
```

---

### 9. SSL: "Certificate verification failed"

**Causa:** Certbot não conseguiu emitir certificado (DNS não propagado ou portas bloqueadas).

**Diagnóstico:**
```bash
# Verificar DNS
dig portal.genesis360care.com.br +short

# Verificar portas
sudo ss -tlnp | grep -E ':80|:443'
```

**Solução:**

1. Esperar propagação DNS (até 48h)
2. Liberar portas no firewall:
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

3. Reemitir certificado:
```bash
sudo certbot --nginx -d portal.genesis360care.com.br
```

---

### 10. Build Lento ou Falha de Memória

**Erro:**
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**Solução:**

Aumentar limite de memória do Node:
```bash
export NODE_OPTIONS="--max-old-space-size=4096"
bun run build
```

Ou no `package.json`:
```json
{
  "scripts": {
    "build": "NODE_OPTIONS=--max-old-space-size=4096 tsc -b && vite build"
  }
}
```

---

### 11. GitHub Actions: Workflow não dispara

**Causa:** Branch não está configurado no workflow.

**Solução:**

Verificar `.github/workflows/deploy-production.yml`:
```yaml
on:
  push:
    branches: [main]  # Nome correto da branch
```

Se branch principal for `master`:
```yaml
on:
  push:
    branches: [master]
```

---

### 12. Supabase CLI: "Project not linked"

**Erro:**
```
Cannot find project in local config. Run 'supabase link' first.
```

**Solução:**
```bash
supabase link --project-ref [PROJECT_ID]
```

Para obter PROJECT_ID:
- Acessar dashboard.supabase.com
- Abrir projeto
- Copiar ID da URL: `https://supabase.com/dashboard/project/[PROJECT_ID]`

---

## 🔍 Comandos de Diagnóstico

### Verificar status geral
```bash
bash check-deploy.sh
```

### Logs em tempo real
```bash
# Nginx error log
sudo tail -f /var/log/nginx/portal.genesis360care.error.log

# Nginx access log
sudo tail -f /var/log/nginx/portal.genesis360care.access.log

# Systemd (se usando PM2 ou similar)
sudo journalctl -u nginx -f
```

### Testar conectividade
```bash
# HTTP
curl -I http://portal.genesis360care.com.br

# HTTPS
curl -I https://portal.genesis360care.com.br

# Rota específica
curl -I https://portal.genesis360care.com.br/login
```

### Verificar build local
```bash
cd /home/genesis360care/htdocs/portal.genesis360care.com.br
bun run type-check  # TypeScript
bun run lint        # ESLint
bun run build       # Build
bun run preview     # Testar build localmente
```

### Verificar permissões
```bash
ls -la /var/www/portal.genesis360care.com.br/
sudo chown -R www-data:www-data /var/www/portal.genesis360care.com.br/
sudo chmod -R 755 /var/www/portal.genesis360care.com.br/
```

---

## 📞 Suporte

Se nenhuma solução acima resolver:

1. Execute `bash validate-deploy.sh` e `bash check-deploy.sh`
2. Colete logs:
   ```bash
   sudo tail -100 /var/log/nginx/portal.genesis360care.error.log > error-log.txt
   ```
3. Verifique GitHub Actions (tab "Actions" no repositório)
4. Consulte documentação:
   - [DEPLOY-CHECKLIST.md](DEPLOY-CHECKLIST.md)
   - [QUICK-COMMANDS.md](QUICK-COMMANDS.md)
   - [IMPLEMENTATION-SUMMARY.md](IMPLEMENTATION-SUMMARY.md)
