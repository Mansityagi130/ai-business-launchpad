# Deployment Environment Variables

This document lists the necessary environment variables for the **AI Business Launchpad** application across its various services.

---

## Vercel (apps/web)

| Variable Name                      | Purpose                                                                                             | Required   | Example Value                                        |
| :--------------------------------- | :-------------------------------------------------------------------------------------------------- | :--------- | :--------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`         | The unique URL for your Supabase project's API.                                                     | Required   | `https://your-project-ref.supabase.co`               |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`    | The anonymous (public) key for your Supabase project, safe to expose in the browser.                | Required   | `ey...`                                              |
| `NEXT_PUBLIC_GEMINI_API_KEY`       | The API key for Google Gemini, used for generative AI features on the client side.                  | Required   | `AIza...`                                            |

---

## Supabase (Backend & Database)

| Variable Name                      | Purpose                                                                                             | Required   | Example Value                                        |
| :--------------------------------- | :-------------------------------------------------------------------------------------------------- | :--------- | :--------------------------------------------------- |
| `SUPABASE_URL`                     | The unique URL for your Supabase project. Used for server-side API calls.                           | Required   | `https://your-project-ref.supabase.co`               |
| `SUPABASE_SERVICE_ROLE_KEY`        | The service role key for your Supabase project, granting superuser access. Keep this secret.        | Required   | `ey...`                                              |
| `GEMINI_API_KEY`                   | The API key for Google Gemini, used for server-side generative AI features.                         | Required   | `AIza...`                                            |
| `REDIS_URL`                        | Connection string for the Redis instance used by BullMQ for background job processing.              | Required   | `redis://:password@hostname:port`                    |

---

## BullMQ Worker (apps/api)

| Variable Name                      | Purpose                                                                                             | Required   | Example Value                                        |
| :--------------------------------- | :-------------------------------------------------------------------------------------------------- | :--------- | :--------------------------------------------------- |
| `SUPABASE_URL`                     | The unique URL for your Supabase project. Used for server-side API calls.                           | Required   | `https://your-project-ref.supabase.co`               |
| `SUPABASE_SERVICE_ROLE_KEY`        | The service role key for your Supabase project, granting superuser access. Keep this secret.        | Required   | `ey...`                                              |
| `REDIS_URL`                        | Connection string for the Redis instance used by BullMQ for background job processing.              | Required   | `redis://:password@hostname:port`                    |

---

## Render (Deployment Platform)

| Variable Name                      | Purpose                                                                                             | Required   | Example Value                                        |
| :--------------------------------- | :-------------------------------------------------------------------------------------------------- | :--------- | :--------------------------------------------------- |
| `NODE_VERSION`                     | Specifies the Node.js version for the build environment.                                            | Optional   | `20.11.0`                                            |
| `PNPM_VERSION`                     | Specifies the pnpm version to be used for installing dependencies.                                  | Optional   | `8.6.1`                                              |

---

*Note: This list was generated based on the project's `vercel.json` and common architecture patterns for the specified technologies. A full source code scan would be required to guarantee a complete list.*