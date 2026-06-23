-- 1. LEADS CRM TABLE
create table public.leads (
    id uuid default uuid_generate_v4() primary key,
    website_id uuid references public.websites(id) on delete cascade not null,
    name varchar(255) not null,
    email varchar(255) not null,
    phone varchar(50),
    message text,
    status varchar(50) default 'new' check (status in ('new', 'contacted', 'qualified', 'won', 'lost')) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_leads_website on public.leads(website_id);
create index idx_leads_status on public.leads(status);

-- 2. NOTIFICATIONS TABLE
create table public.notifications (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    title varchar(255) not null,
    message text not null,
    type varchar(50) not null check (type in ('LeadCaptured', 'WebsitePublished', 'AIGenerationCompleted')),
    is_read boolean default false not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_notifications_user_read on public.notifications(user_id, is_read, created_at desc);

-- Timestamp trigger for leads
create trigger update_leads_modtime before update on public.leads for each row execute procedure update_modified_column();

-- Enable RLS
alter table public.leads enable row level security;
alter table public.notifications enable row level security;

-- Policies for public.leads
create policy "Anyone can insert leads from contact forms" 
on public.leads for insert with check (true);

create policy "Website owners can manage website leads" 
on public.leads for all using (
    exists (
        select 1 from public.websites 
        where websites.id = leads.website_id 
        and websites.owner_id = auth.uid()
    )
);

-- Policies for public.notifications
create policy "Users can manage their own notifications" 
on public.notifications for all using (auth.uid() = user_id);
