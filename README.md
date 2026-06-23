# AI Business Launchpad — SaaS Platform Monorepo

AI Business Launchpad is a premium, high-scale SaaS website generation and editing engine. Using relational Supabase PostgreSQL, Redis caching, BullMQ background job queues, and OpenAI APIs, it lets users bootstrap fully-functional websites and make section-by-section AI edits on the fly.

---

## 📁 Repository Folder Structure

This workspace is structured as a **pnpm monorepo**:

```text
├── .github/
│   └── workflows/
│       ├── ci-cd.yml          # Pull request linting, compiler builds & unit tests
│       └── release.yml         # Tag-driven production deployment and release compiler
├── apps/
│   ├── api/                   # Express TypeScript API server & background workers
│   │   ├── src/
│   │   │   ├── config/        # Database, Redis, and BullMQ initializations
│   │   │   ├── controllers/   # Route handler controllers (website, billing, system, CRM)
│   │   │   ├── middleware/    # Auth verification, rate limits, security, and billing gates
│   │   │   ├── services/      # AI orchestration, cache management, audit logging
│   │   │   └── workers/       # BullMQ worker consumers (AI generation, AI edits)
│   │   ├── supabase/          # PostgreSQL schemas, triggers, and migrations
│   │   └── tests/             # Native Node.js test suites
│   ├── web/                   # Next.js App Router portal (dashboard & editor canvas)
│   └── mobile/                # Expo React Native mobile dashboard wrapper
├── packages/
│   ├── config/                # Global shared TSConfig compiler parameters
│   ├── types/                 # Shared TypeScript interfaces & Zod validation schemas
│   └── ui/                    # Shared design system components (buttons, cards)
├── package.json               # Root monorepo workspace configuration
├── pnpm-workspace.yaml        # Monorepo workspaces definition glob
└── tsconfig.json              # Global typescript configurations
```

---

## ⚙️ Environment Variables

### 1. Backend API (`apps/api/.env`)
Create `apps/api/.env` matching these parameters:
```env
PORT=4000
NODE_ENV=development

# Supabase Configurations
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=ey... # Kept secret, bypasses RLS for backend tasks

# Cache & Queues (Redis)
REDIS_URL=redis://127.0.0.1:6379

# LLM Integrations
OPENAI_API_KEY=sk-proj-...
```

### 2. Frontend Portal (`apps/web/.env.local`)
Create `apps/web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ey... # Safe for client browser exposure
```

---

## 🚀 Installation & Local Development

### Prerequisites
- Node.js v18 or v20+
- pnpm (Run `npm install -g pnpm` or use `npx pnpm`)

### 1. Bootstrapping dependencies
From the root workspace directory, run:
```bash
pnpm install
```

### 2. Building packages
Compile types and UI packages to prepare references:
```bash
pnpm build
```

### 3. Startup development servers
Run the Express API and Next.js portal concurrently:
```bash
# Start API (Port 4000)
pnpm dev:api

# Start Web Portal (Port 3000)
pnpm dev:web
```

---

## 🧪 Testing Suites
Run the aggregated native Node.js test runner suite (validating auth verify, billing gates, usage resets, and spends protection):
```bash
pnpm --filter @launchpad/api exec node --test dist/tests/run-tests.js
```
*Note: Ensure the project is compiled (`pnpm build`) before running the tests.*

---

## 🛡️ Production Security & Optimizations
- **Rate Limiting**: Public gateways resolutions are throttled using a Redis-backed rate-limiting bucket.
- **XSS & Prompt Sanitizer**: Inputs are scanned recursively to block injection.
- **Observability**: Supports deep `/ready` connectivity tests, BullMQ queue status dashboards, and Sentry logger integrations.
