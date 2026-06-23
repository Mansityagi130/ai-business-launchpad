-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. USERS PROFILE
create table public.users (
    id uuid references auth.users on delete cascade primary key,
    email varchar(255) not null unique,
    full_name varchar(255),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Sync user profile on auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. SUBSCRIPTIONS
create table public.subscriptions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    status varchar(50) not null check (status in ('active', 'trialing', 'canceled', 'past_due')),
    plan_type varchar(50) not null check (plan_type in ('free', 'pro', 'enterprise')),
    current_period_end timestamp with time zone not null,
    stripe_subscription_id varchar(255) unique,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index idx_subscriptions_user on public.subscriptions(user_id);

-- 3. BUSINESSES
create table public.businesses (
    id uuid default uuid_generate_v4() primary key,
    owner_id uuid references public.users(id) on delete cascade not null,
    name varchar(255) not null,
    category varchar(100) not null,
    description text not null,
    phone varchar(50),
    whatsapp varchar(50),
    address text,
    business_hours jsonb default '{}'::jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index idx_businesses_owner on public.businesses(owner_id);

-- 4. WEBSITE_TEMPLATES
create table public.website_templates (
    id uuid default uuid_generate_v4() primary key,
    name varchar(255) not null,
    description text not null,
    category varchar(100) not null,
    theme_config jsonb not null,
    pages_layout jsonb not null,
    thumbnail_url varchar(512) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index idx_templates_category on public.website_templates(category);

-- 5. WEBSITES
create table public.websites (
    id uuid default uuid_generate_v4() primary key,
    business_id uuid references public.businesses(id) on delete cascade not null,
    owner_id uuid references public.users(id) on delete cascade not null,
    template_id uuid references public.website_templates(id) on delete set null,
    status varchar(20) default 'draft' check (status in ('draft', 'published')) not null,
    active_version_id uuid,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index idx_websites_owner on public.websites(owner_id);

-- 6. DOMAINS
create table public.domains (
    id uuid default uuid_generate_v4() primary key,
    website_id uuid references public.websites(id) on delete cascade not null,
    domain_name varchar(255) not null unique,
    type varchar(20) not null check (type in ('subdomain', 'custom')),
    verification_status varchar(50) default 'pending' check (verification_status in ('pending', 'verified', 'failed')) not null,
    dns_records jsonb default '{}'::jsonb not null,
    ssl_status varchar(20) default 'inactive' check (ssl_status in ('active', 'inactive')) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index idx_domains_website on public.domains(website_id);
create index idx_domains_lookup on public.domains(domain_name);

-- 7. THEMES
create table public.themes (
    id uuid default uuid_generate_v4() primary key,
    website_id uuid references public.websites(id) on delete cascade not null unique,
    mode varchar(10) default 'light' check (mode in ('light', 'dark')) not null,
    colors jsonb not null,
    typography jsonb not null,
    ui_config jsonb default '{}'::jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. PAGES
create table public.pages (
    id uuid default uuid_generate_v4() primary key,
    website_id uuid references public.websites(id) on delete cascade not null,
    slug varchar(100) not null,
    title varchar(255) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (website_id, slug)
);
create index idx_pages_lookup on public.pages(website_id, slug);

-- 9. SECTIONS
create table public.sections (
    id uuid default uuid_generate_v4() primary key,
    page_id uuid references public.pages(id) on delete cascade not null,
    type varchar(50) not null check (type in ('hero', 'features', 'testimonials', 'pricing', 'faq', 'contact', 'about')),
    order_index decimal(10,4) not null,
    component_version varchar(10) default '1.0' not null,
    content jsonb not null,
    styles_override jsonb default '{}'::jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (page_id, order_index)
);
create index idx_sections_page_order on public.sections(page_id, order_index);

-- 10. ASSETS
create table public.assets (
    id uuid default uuid_generate_v4() primary key,
    website_id uuid references public.websites(id) on delete cascade not null,
    owner_id uuid references public.users(id) on delete cascade not null,
    file_name varchar(255) not null,
    file_type varchar(100) not null,
    storage_path varchar(512) not null,
    public_url varchar(512) not null,
    file_size integer not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index idx_assets_website on public.assets(website_id);

-- 11. RAW_ANALYTICS_EVENTS
create table public.raw_analytics_events (
    id uuid default uuid_generate_v4() primary key,
    website_id uuid references public.websites(id) on delete cascade not null,
    event_type varchar(50) not null check (event_type in ('pageview', 'click', 'lead')),
    page_slug varchar(100) not null,
    visitor_ip_hash varchar(64) not null,
    user_agent text,
    referrer varchar(255),
    event_metadata jsonb default '{}'::jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index idx_raw_analytics_aggregate on public.raw_analytics_events(website_id, event_type, created_at desc);

-- 12. ANALYTICS_SUMMARIES
create table public.analytics_summaries (
    id uuid default uuid_generate_v4() primary key,
    website_id uuid references public.websites(id) on delete cascade not null,
    event_date date not null,
    page_slug varchar(100) not null,
    event_type varchar(50) not null,
    total_count integer default 0 not null,
    unique_visitor_count integer default 0 not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (website_id, event_date, page_slug, event_type)
);
create index idx_summaries_lookup on public.analytics_summaries(website_id, event_date);

-- 13. FEATURE_FLAGS
create table public.feature_flags (
    id uuid default uuid_generate_v4() primary key,
    key varchar(100) not null unique,
    name varchar(255) not null,
    description text,
    is_enabled boolean default false not null,
    rollout_percentage integer default 0 check (rollout_percentage >= 0 and rollout_percentage <= 100) not null,
    target_plans varchar(50)[] default '{}'::varchar[] not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index idx_feature_flags_key on public.feature_flags(key);

-- 14. WEBSITE_VERSIONS
create table public.website_versions (
    id uuid default uuid_generate_v4() primary key,
    website_id uuid references public.websites(id) on delete cascade not null,
    version_number integer not null,
    pages_snapshot jsonb not null,
    change_summary text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique (website_id, version_number)
);
create index idx_website_versions_lookup on public.website_versions(website_id, version_number);

-- Complete circular reference
alter table public.websites 
add constraint fk_websites_active_version 
foreign key (active_version_id) references public.website_versions(id) on delete set null;

-- 15. AI_GENERATIONS
create table public.ai_generations (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    website_id uuid references public.websites(id) on delete set null,
    prompt text not null,
    raw_response jsonb not null,
    token_usage integer default 0 not null,
    status varchar(20) not null check (status in ('success', 'failed')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 16. ACTIVITY LOGS
create table public.activity_logs (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    action varchar(100) not null,
    metadata jsonb default '{}'::jsonb not null,
    ip_address varchar(45),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Timestamps update helper function
create or replace function update_modified_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_users_modtime before update on public.users for each row execute procedure update_modified_column();
create trigger update_subscriptions_modtime before update on public.subscriptions for each row execute procedure update_modified_column();
create trigger update_businesses_modtime before update on public.businesses for each row execute procedure update_modified_column();
create trigger update_website_templates_modtime before update on public.website_templates for each row execute procedure update_modified_column();
create trigger update_websites_modtime before update on public.websites for each row execute procedure update_modified_column();
create trigger update_domains_modtime before update on public.domains for each row execute procedure update_modified_column();
create trigger update_themes_modtime before update on public.themes for each row execute procedure update_modified_column();
create trigger update_pages_modtime before update on public.pages for each row execute procedure update_modified_column();
create trigger update_sections_modtime before update on public.sections for each row execute procedure update_modified_column();
create trigger update_feature_flags_modtime before update on public.feature_flags for each row execute procedure update_modified_column();

-- Enable RLS
alter table public.users enable row level security;
alter table public.subscriptions enable row level security;
alter table public.businesses enable row level security;
alter table public.website_templates enable row level security;
alter table public.websites enable row level security;
alter table public.domains enable row level security;
alter table public.themes enable row level security;
alter table public.pages enable row level security;
alter table public.sections enable row level security;
alter table public.assets enable row level security;
alter table public.raw_analytics_events enable row level security;
alter table public.analytics_summaries enable row level security;
alter table public.feature_flags enable row level security;
alter table public.website_versions enable row level security;
alter table public.ai_generations enable row level security;
alter table public.activity_logs enable row level security;

-- RLS Policies Setup
create policy "Users can view and edit their own profiles" on public.users for all using (auth.uid() = id);

create policy "Owners can view and modify their businesses" on public.businesses for all using (auth.uid() = owner_id);

create policy "Owners can view and modify their websites" on public.websites for all using (auth.uid() = owner_id);

create policy "Anyone can read published website pages" on public.pages for select using (
    exists (select 1 from public.websites where websites.id = pages.website_id and websites.status = 'published')
);
create policy "Owners can modify their website pages" on public.pages for all using (
    exists (select 1 from public.websites where websites.id = pages.website_id and websites.owner_id = auth.uid())
);

create policy "Anyone can read published sections" on public.sections for select using (
    exists (select 1 from public.pages join public.websites on websites.id = pages.website_id where pages.id = sections.page_id and websites.status = 'published')
);
create policy "Owners can modify their page sections" on public.sections for all using (
    exists (select 1 from public.pages join public.websites on websites.id = pages.website_id where pages.id = sections.page_id and websites.owner_id = auth.uid())
);

create policy "Anyone can view templates" on public.website_templates for select using (true);
create policy "Admins only manage templates" on public.website_templates for all using (false);

create policy "Admins only manage feature flags" on public.feature_flags for all using (false);

create policy "Anyone can insert raw analytics" on public.raw_analytics_events for insert with check (true);
create policy "Owners view raw analytics" on public.raw_analytics_events for select using (
    exists (select 1 from public.websites where websites.id = raw_analytics_events.website_id and websites.owner_id = auth.uid())
);

create policy "Owners view analytics summaries" on public.analytics_summaries for select using (
    exists (select 1 from public.websites where websites.id = analytics_summaries.website_id and websites.owner_id = auth.uid())
);
