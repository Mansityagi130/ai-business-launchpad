-- 1. USAGE TRACKING TABLE
create table public.usage_tracking (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users(id) on delete cascade not null unique,
    website_creation_count integer default 0 check (website_creation_count >= 0) not null,
    ai_edit_count integer default 0 check (ai_edit_count >= 0) not null,
    billing_cycle_start timestamp with time zone default timezone('utc'::text, now()) not null,
    billing_cycle_end timestamp with time zone default timezone('utc'::text, now() + interval '1 month') not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_usage_tracking_user on public.usage_tracking(user_id);

-- Trigger to automatically create usage tracking record on new profile creation
create or replace function public.handle_new_user_usage()
returns trigger as $$
begin
  insert into public.usage_tracking (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created_usage
  after insert on public.users
  for each row execute procedure public.handle_new_user_usage();

-- 2. AUDIT LOGS TABLE
create table public.audit_logs (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users(id) on delete set null,
    action varchar(255) not null,
    ip_address varchar(45) not null,
    metadata jsonb default '{}'::jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_audit_logs_user_action on public.audit_logs(user_id, action, created_at desc);

-- Timestamp trigger for usage_tracking
create trigger update_usage_tracking_modtime before update on public.usage_tracking for each row execute procedure update_modified_column();

-- Enable RLS
alter table public.usage_tracking enable row level security;
alter table public.audit_logs enable row level security;

-- RLS Policies
create policy "Users can view their own usage details" 
on public.usage_tracking for select using (auth.uid() = user_id);

create policy "Admins only manage audit logs" 
on public.audit_logs for all using (false);
