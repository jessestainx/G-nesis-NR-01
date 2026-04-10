/**
 * Supabase Edge Function — send-email
 *
 * Processa a fila de emails (email_queue) e envia via Resend API.
 *
 * Deploy: supabase functions deploy send-email
 * Invoke via cron (pg_cron) ou manualmente:
 *   supabase.functions.invoke('send-email', { body: { batch_size: 10 } })
 *
 * Env vars necessárias (Supabase Dashboard → Functions → Secrets):
 *   RESEND_API_KEY → sua chave Resend (https://resend.com)
 *   FROM_EMAIL     → ex: "Gênesis 360Care <noreply@genesis360care.com.br>"
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailQueueRow {
    id: string
    organization_id: string | null
    to_email: string
    to_name: string | null
    subject: string
    body_html: string
    trigger_event: string
    attempts: number
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    const FROM_EMAIL    = Deno.env.get('FROM_EMAIL') ?? 'Gênesis 360Care <noreply@genesis360care.com.br>'
    const SUPABASE_URL  = Deno.env.get('SUPABASE_URL')!
    const SERVICE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    if (!RESEND_API_KEY) {
        return new Response(
            JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
            { status: 500, headers: { ...corsHeaders, 'content-type': 'application/json' } },
        )
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

    // Ler parâmetros
    let batch_size = 10
    try {
        const body = await req.json()
        if (body?.batch_size) batch_size = Number(body.batch_size)
    } catch { /* usa default */ }

    // Buscar emails pendentes
    const { data: emails, error: fetchError } = await supabase
        .from('email_queue')
        .select('id, organization_id, to_email, to_name, subject, body_html, trigger_event, attempts')
        .eq('status', 'pending')
        .lte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(batch_size)

    if (fetchError) {
        return new Response(
            JSON.stringify({ error: fetchError.message }),
            { status: 500, headers: { ...corsHeaders, 'content-type': 'application/json' } },
        )
    }

    if (!emails || emails.length === 0) {
        return new Response(
            JSON.stringify({ message: 'No pending emails', sent: 0, failed: 0 }),
            { headers: { ...corsHeaders, 'content-type': 'application/json' } },
        )
    }

    let sent = 0
    let failed = 0

    for (const email of emails as EmailQueueRow[]) {
        try {
            const resendRes = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${RESEND_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: FROM_EMAIL,
                    to: email.to_name
                        ? [`${email.to_name} <${email.to_email}>`]
                        : [email.to_email],
                    subject: email.subject,
                    html: email.body_html,
                }),
            })

            if (resendRes.ok) {
                await supabase.from('email_queue').update({
                    status: 'sent',
                    sent_at: new Date().toISOString(),
                    attempts: email.attempts + 1,
                }).eq('id', email.id)
                sent++
            } else {
                const errBody = await resendRes.text()
                await supabase.from('email_queue').update({
                    status: email.attempts >= 2 ? 'failed' : 'pending',
                    attempts: email.attempts + 1,
                    error_message: errBody,
                    // Retry em 1h se ainda não atingiu 3 tentativas
                    scheduled_at: email.attempts < 2
                        ? new Date(Date.now() + 3600_000).toISOString()
                        : undefined,
                }).eq('id', email.id)
                failed++
            }
        } catch (err) {
            await supabase.from('email_queue').update({
                attempts: email.attempts + 1,
                error_message: String(err),
                scheduled_at: new Date(Date.now() + 3600_000).toISOString(),
            }).eq('id', email.id)
            failed++
        }
    }

    return new Response(
        JSON.stringify({ message: 'Batch processed', sent, failed, total: emails.length }),
        { headers: { ...corsHeaders, 'content-type': 'application/json' } },
    )
})
