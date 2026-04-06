# 🚀 INSTRUÇÕES DE DEPLOY RÁPIDO

## Execute APENAS este comando:

```bash
bash one-click-deploy.sh
```

Esse script executa automaticamente:
1. ✅ Torna todos os scripts executáveis
2. ✅ Valida estrutura do projeto
3. ✅ Instala dependências (gera bun.lockb)
4. ✅ Faz commit de tudo
5. ✅ Pergunta se quer fazer push
6. ✅ Configura Nginx + SSL
7. ✅ Verifica se deploy funcionou

---

## OU execute manualmente (3 comandos):

```bash
bash validate-deploy.sh   # Validar estrutura
bash deploy-helper.sh     # Deploy automático  
bash check-deploy.sh      # Verificar resultado
```

---

## Documentação Completa

- **[DEPLOY-CHECKLIST.md](DEPLOY-CHECKLIST.md)** — Guia passo a passo detalhado
- **[QUICK-COMMANDS.md](QUICK-COMMANDS.md)** — Referência rápida de comandos
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** — Soluções para problemas comuns
- **[STATUS.md](STATUS.md)** — Estado atual do projeto
- **[README.md](README.md)** — Documentação técnica completa

---

## Status Atual

✅ **CÓDIGO: 100% PRONTO**
- Migrations SQL corrigidas (roles atualizados)
- Workflows CI/CD convertidos para Bun
- TypeScript strict mode sem erros
- Scripts de automação criados
- Documentação completa

⏳ **AGUARDANDO: Execução do deploy**

---

## Requisitos

- **Bun** instalado: `curl -fsSL https://bun.sh/install | bash`
- **Git** configurado
- **Nginx** rodando no servidor
- **Domínio DNS** apontando: `portal.genesis360care.com.br` → IP do servidor

---

## Após o Deploy

1. Criar 3 projetos no Supabase (dev/staging/prod)
2. Preencher `.env.production`
3. Aplicar migrations: `bun run supabase:setup:prod`
4. Criar admin: `bun run supabase:create-admin:prod`
5. Configurar 9 GitHub Secrets

Consulte **[DEPLOY-CHECKLIST.md](DEPLOY-CHECKLIST.md)** para detalhes.

---

**Última atualização:** 2 de abril de 2026  
**Repositório:** https://github.com/jessestainx/G-nesis-NR-01
