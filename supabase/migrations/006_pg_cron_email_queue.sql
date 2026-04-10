-- ─── Migration 006: pg_cron para processar fila de emails ────────────────────
-- PASSO 1: habilitar extensões necessárias (execute como superuser)
-- Habilitar pg_cron (disponível em Supabase Cloud por padrão)
CREATE EXTENSION IF NOT EXISTS pg_cron;
-- Habilitar pg_net para HTTP requests (necessário para chamar Edge Function)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ─── Cron job: processar fila de emails a cada 5 minutos ─────────────────────
-- Substitua <SERVICE_ROLE_KEY> pela sua service role key do Supabase
-- (Dashboard → Settings → API → service_role key)
--
-- Para adicionar após configurar a service role key, execute:
--
--   SELECT cron.schedule(
--     'process-email-queue',
--     '*/5 * * * *',
--     $$
--       SELECT net.http_post(
--         url     := 'https://ntgdbglvibruhaqfzesx.supabase.co/functions/v1/send-email',
--         headers := json_build_object(
--           'Content-Type',  'application/json',
--           'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
--         )::jsonb,
--         body    := '{"batch_size": 20}'::jsonb
--       );
--     $$
--   );
--
-- Para verificar o cron:
--   SELECT * FROM cron.job;
-- Para remover:
--   SELECT cron.unschedule('process-email-queue');

-- ─── Helper view para monitorar emails ───────────────────────────────────────
CREATE OR REPLACE VIEW email_queue_stats AS
    SELECT
        status,
        trigger_event,
        COUNT(*)                                     AS total,
        MIN(created_at)                              AS oldest,
        MAX(created_at)                              AS newest,
        COUNT(*) FILTER (WHERE attempts >= 3)        AS permanently_failed
    FROM email_queue
    GROUP BY status, trigger_event
    ORDER BY status, trigger_event;

-- Apenas genesis pode ver a view
GRANT SELECT ON email_queue_stats TO authenticated;

COMMENT ON VIEW email_queue_stats IS
    'Estatísticas da fila de emails agrupadas por status e evento.';
