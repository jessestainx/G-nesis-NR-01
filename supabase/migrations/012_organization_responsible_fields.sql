ALTER TABLE public.organizations
    ADD COLUMN IF NOT EXISTS responsible_phone text,
    ADD COLUMN IF NOT EXISTS responsible_role text;
