-- ─── org_settings: configurações por organização ─────────────────────────────
CREATE TABLE IF NOT EXISTS org_settings (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    -- Branding
    logo_url        text,
    primary_color   text DEFAULT '#00A898',
    company_tagline text,
    -- Email notifications
    email_notify_action_overdue   boolean NOT NULL DEFAULT true,
    email_notify_survey_opened    boolean NOT NULL DEFAULT true,
    email_notify_diagnosis_done   boolean NOT NULL DEFAULT true,
    email_notify_contract_expiry  boolean NOT NULL DEFAULT true,
    -- Responsável por notificações (padrão: responsible_email da organização)
    notification_email  text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    UNIQUE (organization_id)
);

-- ─── email_queue: fila de emails para envio assíncrono ────────────────────────
CREATE TABLE IF NOT EXISTS email_queue (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
    to_email        text NOT NULL,
    to_name         text,
    subject         text NOT NULL,
    body_html       text NOT NULL,
    trigger_event   text NOT NULL, -- 'action_overdue' | 'survey_opened' | 'diagnosis_done' | 'contract_expiry'
    status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
    attempts        int  NOT NULL DEFAULT 0,
    error_message   text,
    scheduled_at    timestamptz NOT NULL DEFAULT now(),
    sent_at         timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- Índice para processamento eficiente da fila
CREATE INDEX IF NOT EXISTS idx_email_queue_status_scheduled
    ON email_queue (status, scheduled_at)
    WHERE status = 'pending';

-- ─── RLS para org_settings ────────────────────────────────────────────────────
ALTER TABLE org_settings ENABLE ROW LEVEL SECURITY;

-- Genesis pode ler e escrever tudo
CREATE POLICY "genesis_all_org_settings" ON org_settings
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'genesis')
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'genesis')
    );

-- Client executive pode ler as settings da própria org
CREATE POLICY "client_read_own_org_settings" ON org_settings
    FOR SELECT TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles
            WHERE id = auth.uid() AND role IN ('client_executive','collaborator','professional')
        )
    );

-- ─── RLS para email_queue ─────────────────────────────────────────────────────
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Apenas genesis pode ver/gerenciar a fila
CREATE POLICY "genesis_all_email_queue" ON email_queue
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'genesis')
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'genesis')
    );

-- ─── updated_at trigger para org_settings ────────────────────────────────────
CREATE OR REPLACE FUNCTION update_org_settings_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_org_settings_updated_at
    BEFORE UPDATE ON org_settings
    FOR EACH ROW EXECUTE FUNCTION update_org_settings_updated_at();

-- ─── Função: enfileirar email de ação em atraso ───────────────────────────────
-- Chamada manualmente via supabase.rpc() pelo frontend
CREATE OR REPLACE FUNCTION enqueue_overdue_action_email(
    p_org_id    uuid,
    p_plan_title text,
    p_due_date   text,
    p_to_email   text,
    p_to_name    text DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_settings org_settings;
    v_subject  text;
    v_body     text;
BEGIN
    SELECT * INTO v_settings FROM org_settings WHERE organization_id = p_org_id;

    -- Se org não tem settings ou desativou essa notificação, sai
    IF NOT FOUND OR NOT v_settings.email_notify_action_overdue THEN
        RETURN;
    END IF;

    v_subject := '⚠️ Plano de ação em atraso: ' || p_plan_title;
    v_body    := format(
        '<h2 style="color:#162136">Plano de Ação em Atraso</h2>
         <p>Olá%s,</p>
         <p>O plano de ação <strong>"%s"</strong> estava previsto para <strong>%s</strong> e ainda não foi concluído.</p>
         <p>Acesse o portal para atualizar o status.</p>
         <p style="margin-top:24px"><a href="https://portal.genesis360care.com.br" style="background:#00A898;color:white;padding:10px 20px;border-radius:6px;text-decoration:none">Abrir Portal</a></p>
         <hr style="margin-top:32px"/><p style="font-size:11px;color:#6b7280">Gênesis 360Care — Portal NR-01</p>',
        CASE WHEN p_to_name IS NOT NULL THEN ' ' || p_to_name ELSE '' END,
        p_plan_title, p_due_date
    );

    INSERT INTO email_queue (organization_id, to_email, to_name, subject, body_html, trigger_event)
    VALUES (p_org_id, p_to_email, p_to_name, v_subject, v_body, 'action_overdue');
END;
$$;

-- ─── Função: enfileirar email de pesquisa aberta ──────────────────────────────
CREATE OR REPLACE FUNCTION enqueue_survey_opened_email(
    p_org_id       uuid,
    p_survey_title text,
    p_to_email     text,
    p_to_name      text DEFAULT NULL
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_settings org_settings;
    v_body     text;
BEGIN
    SELECT * INTO v_settings FROM org_settings WHERE organization_id = p_org_id;
    IF NOT FOUND OR NOT v_settings.email_notify_survey_opened THEN RETURN; END IF;

    v_body := format(
        '<h2 style="color:#162136">Nova Pesquisa de Pulso</h2>
         <p>Olá%s,</p>
         <p>Uma nova pesquisa de pulso está disponível: <strong>"%s"</strong>.</p>
         <p>Participe agora e contribua com a melhoria do ambiente de trabalho.</p>
         <p style="margin-top:24px"><a href="https://portal.genesis360care.com.br/dashboard/collaborator/survey" style="background:#00A898;color:white;padding:10px 20px;border-radius:6px;text-decoration:none">Responder Pesquisa</a></p>
         <hr style="margin-top:32px"/><p style="font-size:11px;color:#6b7280">Gênesis 360Care — Portal NR-01</p>',
        CASE WHEN p_to_name IS NOT NULL THEN ' ' || p_to_name ELSE '' END,
        p_survey_title
    );

    INSERT INTO email_queue (organization_id, to_email, to_name, subject, body_html, trigger_event)
    VALUES (p_org_id, p_to_email, p_to_name,
            '📊 Nova pesquisa disponível: ' || p_survey_title, v_body, 'survey_opened');
END;
$$;

