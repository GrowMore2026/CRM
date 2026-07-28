CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    campaign TEXT,
    source TEXT DEFAULT 'Facebook Ads',
    status TEXT DEFAULT 'CREATED',
    score INTEGER DEFAULT 0,
    services JSONB, 
    budget NUMERIC DEFAULT 0,
    "managedBy" UUID REFERENCES public.users(id),
    "createdBy" UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view and modify leads
CREATE POLICY "Enable all access to leads for authenticated users" 
    ON public.leads FOR ALL 
    USING (auth.role() = 'authenticated');

-- ==============================================================================
-- OPTIONAL MIGRATION: 
-- The following lines will move all existing clients with 0 payments into the 
-- new leads table. If you want to start fresh, do not run the lines below!
-- ==============================================================================

INSERT INTO public.leads (name, email, phone, company, "managedBy", "createdBy", created_at)
SELECT name, email, phone, company, "managedBy", "createdBy", created_at
FROM public.clients 
WHERE "paymentAmount" = 0 OR "paymentAmount" IS NULL;

DELETE FROM public.clients 
WHERE "paymentAmount" = 0 OR "paymentAmount" IS NULL;
