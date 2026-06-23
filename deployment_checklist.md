# Production Deployment Checklist — ₹0 Budget MVP

Follow this checklist to deploy **AI Business Launchpad** completely free.

---

## 1. Prerequisites Setup

- [ ] **GitHub Account**: Create a repository named `ai-business-launchpad`.
- [ ] **Supabase Account**:
  - Sign up at [supabase.com](https://supabase.com).
  - Create a new project (select the free tier).
  - Copy the **API URL** and **Service Role API Key** from Settings > API.
- [ ] **Upstash Account**:
  - Sign up at [upstash.com](https://upstash.com).
  - Create a new Serverless Redis database (select the free tier).
  - Copy the **Redis connection URL** (`redis://...`).
- [ ] **Google AI Studio (Gemini)**:
  - Sign up at [aistudio.google.com](https://aistudio.google.com).
  - Create a new API Key for **Gemini 1.5 Flash** (free tier).
- [ ] **Render Account**:
  - Sign up at [render.com](https://render.com).
- [ ] **Vercel Account**:
  - Sign up at [vercel.com](https://vercel.com).

---

## 2. Database Migration Steps

- [ ] In your Supabase project dashboard, open the **SQL Editor** tab.
- [ ] Copy the contents of the following migration files and execute them sequentially:
  1. [20260623000000_init.sql](file:///c:/Users/mansi/OneDrive/Desktop/websitemaker/apps/api/supabase/migrations/20260623000000_init.sql)
  2. [20260623000001_leads_notifications.sql](file:///c:/Users/mansi/OneDrive/Desktop/websitemaker/apps/api/supabase/migrations/20260623000001_leads_notifications.sql)
  3. [20260623000002_billing_hardening.sql](file:///c:/Users/mansi/OneDrive/Desktop/websitemaker/apps/api/supabase/migrations/20260623000002_billing_hardening.sql)
  4. [20260623000003_billing_tiers_refactor.sql](file:///c:/Users/mansi/OneDrive/Desktop/websitemaker/apps/api/supabase/migrations/20260623000003_billing_tiers_refactor.sql)

---

## 3. Render API Deployment

- [ ] Go to Render dashboard > **New** > **Blueprint**.
- [ ] Connect your GitHub repository.
- [ ] Render will automatically read `render.yaml` and configure the Web Service.
- [ ] In the Render dashboard, populate the following Environment Variables in your Web Service:
  - `SUPABASE_URL`: Your Supabase API URL.
  - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role token.
  - `REDIS_URL`: Your Upstash Redis connection string.
  - `GEMINI_API_KEY`: Your Google Gemini API Key.
  - `NODE_ENV`: `production`
- [ ] Click **Deploy**. Note the URL (e.g. `https://ai-launchpad-api.onrender.com`).

---

## 4. Vercel Frontend Deployment

- [ ] Go to Vercel dashboard > **Add New** > **Project**.
- [ ] Import your GitHub repository.
- [ ] Configure Project settings:
  - **Root Directory**: `.` (if using root `vercel.json` for monorepos) or `apps/web` (if deploying standalone).
  - **Build Command**: `pnpm --filter @launchpad/web build`
- [ ] Add the following Environment Variables:
  - `NEXT_PUBLIC_API_URL`: Your Render Web Service URL (e.g., `https://ai-launchpad-api.onrender.com`).
  - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase API URL.
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon/Public API Key.
- [ ] Click **Deploy**. Note the URL (e.g., `https://ai-business-launchpad.vercel.app`).

---

## 5. First Production Test Steps

- [ ] **Health Check**: Open `https://your-backend.onrender.com/health` in your browser. Verify it returns `{ "status": "OK" }`.
- [ ] **Sign Up & Profile Creation**:
  - Navigate to `https://project-name.vercel.app/signup`.
  - Create a new account.
  - Verify that Supabase triggers automatically initialize a corresponding profile in `public.users` and a usage row in `public.usage_tracking`.
- [ ] **AI Website Generation Test**:
  - Log in and create a business profile.
  - Click **Create New Website**.
  - Verify that the Gemini API returns structured JSON and creates pages/sections inside the Supabase database.
