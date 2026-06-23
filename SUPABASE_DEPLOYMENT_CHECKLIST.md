# Supabase Database Deployment Checklist

This document details the step-by-step database deployment process for **AI Business Launchpad** using the Supabase SQL Editor.

---

## 1. Migration Execution Order

You must execute the migration scripts sequentially in the following order. Open your Supabase Dashboard > **SQL Editor** > **New Query**, copy the contents of each file, and run it.

### Milestone 1: Core System Schema
- **File**: `apps/api/supabase/migrations/20260623000000_init.sql`
- **Purpose**: Creates core tables for profiles, subscriptions, templates, pages, sections, and metadata.
- **Expected Tables Created**:
  - `public.users`
  - `public.subscriptions`
  - `public.businesses`
  - `public.website_templates`
  - `public.websites`
  - `public.domains`
  - `public.themes`
  - `public.pages`
  - `public.sections`
  - `public.assets`
  - `public.raw_analytics_events`
  - `public.analytics_summaries`
  - `public.feature_flags`
  - `public.website_versions`
  - `public.ai_generations`
  - `public.activity_logs`

### Milestone 2: Leads & Notification Channels
- **File**: `apps/api/supabase/migrations/20260623000001_leads_notifications.sql`
- **Purpose**: Instantiates tables for Leads CRM and notification storage.
- **Expected Tables Created**:
  - `public.leads`
  - `public.notifications`

### Milestone 3: Hardening & Staging Metrics
- **File**: `apps/api/supabase/migrations/20260623000002_billing_hardening.sql`
- **Purpose**: Configures audit logging and the initial billing limits tracking setup.
- **Expected Tables Created**:
  - `public.usage_tracking`
  - `public.audit_logs`

### Milestone 4: Billing Tiers & Spending Protection Refactor
- **File**: `apps/api/supabase/migrations/20260623000003_billing_tiers_refactor.sql`
- **Purpose**: Alters user plans, aligns usage counters to websites/generations/edits, sets up early access flags, and inserts platform settings.
- **Expected Tables Altered / Created**:
  - `public.platform_settings`
- **Expected Alterations**:
  - `public.usage_tracking` (altered to add new columns, non-destructively)
- **Expected Seeding**:
  - Seeding record ID 1 into `public.platform_settings` (AI Budget limits)
  - Seeding key `EARLY_ACCESS_V1` into `public.feature_flags`

### Milestone 5: Database Seeding
- **File**: `apps/api/supabase/seed.sql`
- **Purpose**: Seeds baseline feature flags and website templates.
- **Expected Seeding**:
  - Seeding keys `ai-logo-generation` and `whatsapp-catalog-sync` into `public.feature_flags`
  - Seeding `Consulting Minimalist` and `Local Food Bakery` templates into `public.website_templates`

---

## 2. Table Verification Checklist

After running the migrations and seed script, execute the following SQL to verify all 20 tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Expected Output**:
1. `activity_logs`
2. `ai_generations`
3. `analytics_summaries`
4. `assets`
5. `audit_logs`
6. `businesses`
7. `domains` 
8. `feature_flags` 
9. `leads` 
10. `notifications` 
11. `pages` 
12. `platform_settings` 
13. `raw_analytics_events` 
14. `sections` 
15. `subscriptions` 
16. `themes` 
17. `usage_tracking` 
18. `users` 
19. `website_templates` 
20. `website_versions` 
21. `websites`

---

## 3. Common Migration Errors & Recovery Steps

### Error 1: "relation ... does not exist"
- **Cause**: Trying to run a migration out of order. For example, running `leads_notifications.sql` before `init.sql`.
- **Recovery**: Delete the query text, ensure you open `20260623000000_init.sql` first, run it, and then proceed down the list.

### Error 2: "duplicate check constraint" or "relation ... already exists"
- **Cause**: Re-running a migration script on a database that already has those tables.
- **Recovery**: If you need to refresh the database completely, run a drop script to clear the schema:
  ```sql
  drop table if exists public.audit_logs cascade;
  drop table if exists public.usage_tracking cascade;
  drop table if exists public.leads cascade;
  drop table if exists public.notifications cascade;
  drop table if exists public.activity_logs cascade;
  drop table if exists public.ai_generations cascade;
  drop table if exists public.website_versions cascade;
  drop table if exists public.feature_flags cascade;
  drop table if exists public.analytics_summaries cascade;
  drop table if exists public.raw_analytics_events cascade;
  drop table if exists public.assets cascade;
  drop table if exists public.sections cascade;
  drop table if exists public.pages cascade;
  drop table if exists public.themes cascade;
  drop table if exists public.domains cascade;
  drop table if exists public.websites cascade;
  drop table if exists public.website_templates cascade;
  drop table if exists public.businesses cascade;
  drop table if exists public.subscriptions cascade;
  drop table if exists public.platform_settings cascade;
  drop table if exists public.users cascade;
  ```
  Once dropped, restart the migration order from step 1.
