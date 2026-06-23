-- 1. MIGRATE EXISTING ENTERPRISE PLAN USERS TO BUSINESS
UPDATE public.subscriptions 
SET plan_type = 'business' 
WHERE plan_type = 'enterprise';

-- 2. ALTER CONSTRAINT ON SUBSCRIPTIONS PLAN TYPE
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_type_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_type_check CHECK (plan_type IN ('free', 'pro', 'business', 'agency'));

-- 3. RECREATE USAGE TRACKING TABLE
DROP TRIGGER IF EXISTS update_usage_tracking_modtime ON public.usage_tracking;
DROP TRIGGER IF EXISTS on_auth_user_created_usage ON public.users;
DROP TABLE IF EXISTS public.usage_tracking;

CREATE TABLE public.usage_tracking (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    websites_created integer DEFAULT 0 CHECK (websites_created >= 0) NOT NULL,
    ai_generations integer DEFAULT 0 CHECK (ai_generations >= 0) NOT NULL,
    ai_edits integer DEFAULT 0 CHECK (ai_edits >= 0) NOT NULL,
    billing_cycle_start timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    billing_cycle_end timestamp with time zone DEFAULT timezone('utc'::text, now() + interval '1 month') NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_usage_tracking_user ON public.usage_tracking(user_id);

-- Enforce RLS on usage_tracking
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own usage details" 
ON public.usage_tracking FOR SELECT USING (auth.uid() = user_id);

-- Recreate trigger function to instantiate usage tracking automatically
CREATE OR REPLACE FUNCTION public.handle_new_user_usage()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.usage_tracking (user_id, billing_cycle_start, billing_cycle_end) 
  VALUES (new.id, now(), now() + interval '1 month');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_usage
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_usage();

-- Trigger for auto-modified column updated_at
CREATE TRIGGER update_usage_tracking_modtime 
  BEFORE UPDATE ON public.usage_tracking 
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- 4. CREATE PLATFORM SETTINGS TABLE (spending protection)
DROP TABLE IF EXISTS public.platform_settings;
CREATE TABLE public.platform_settings (
    id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    monthly_ai_budget numeric(10,2) DEFAULT 200.00 NOT NULL,
    monthly_ai_spend numeric(10,4) DEFAULT 0.00 NOT NULL,
    ai_generation_enabled boolean DEFAULT true NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed platform settings
INSERT INTO public.platform_settings (id, monthly_ai_budget, monthly_ai_spend, ai_generation_enabled)
VALUES (1, 200.00, 0.00, true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS (Admins only)
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow select for authenticated users" ON public.platform_settings FOR SELECT USING (auth.role() = 'authenticated');

-- 5. SEED FEATURE FLAGS
INSERT INTO public.feature_flags (key, name, description, is_enabled, rollout_percentage, target_plans)
VALUES (
    'EARLY_ACCESS_V1',
    'Early Access Pricing Tier Custom Domains Flag',
    'When enabled, Free users can hook custom domains. When disabled, Custom domains require Pro or higher.',
    true,
    100,
    '{free,pro,business,agency}'::varchar[]
)
ON CONFLICT (key) DO UPDATE 
SET is_enabled = EXCLUDED.is_enabled;
