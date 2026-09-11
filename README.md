# ShipSync AI

ShipSync AI is an Indian international trade intelligence and export-import compliance platform engineered for exporters, importers, and Customs House Agents (CHAs). It unifies statutory regulatory intelligence with automated compliance workflows—streamlining customs filing preparations (ICEGATE and e-Sanchit), DGFT notification monitoring, AI-assisted HS Code classification, customs duty and RoDTEP/FTA incentive calculations, and live statutory gazette broadcasting.

---

## System Architecture

```text
                                  +-----------------------+
                                  |    Client Browsers    |
                                  |  (Desktop / Mobile)   |
                                  +-----------+-----------+
                                              |
                                              | HTTPS / JSON
                                              v
+-----------------------------------------------------------------------------------------+
|                               Next.js 14 (App Router)                                   |
|                                                                                         |
|   +--------------------------+  +--------------------------+  +---------------------+   |
|   | Public Gazette & Chat    |  | Protected Dashboard      |  | API Route Handlers  |   |
|   | - Live News Feed (SWR)   |  | - Shipment Workspace     |  | - /api/trade-updates|   |
|   | - Ask Sync AI Chatbot    |  | - Compliance Checks      |  | - /api/ai/*         |   |
|   | - /about, /pricing       |  | - Financial Audit Logs   |  | - /api/documents/*  |   |
|   +--------------------------+  +--------------------------+  +---------------------+   |
+-------------------+-----------------------------+---------------------------+-----------+
                    |                             |                           |
                    v                             v                           v
          +-------------------+         +-------------------+       +-------------------+
          |  Clerk Auth Engine|         | Prisma ORM Layer  |       |  OpenAI API       |
          |  (RBAC & Tenants) |         | (Multi-Tenant DB) |       |  (gpt-4o-mini)    |
          +-------------------+         +---------+---------+       +-------------------+
                                                  |
                                                  v
                                      +-----------------------+
                                      | PostgreSQL (Supabase) |
                                      | - TradeUpdate Gazette |
                                      | - Tariff Schedules    |
                                      | - Shipments & Filings |
                                      +-----------------------+
                                                  ^
                                                  |
                    +-----------------------------+-----------------------------+
                    |                                                           |
                    v                                                           v
       +-------------------------+                                 +-------------------------+
       |   Regulatory Scrapers   |                                 | External Trade Adapters |
       |   - DGFT Gazette Cron   |                                 | - ICEGATE (Mock EDI)    |
       |   - Cheerio HTML Parser |                                 | - e-Sanchit Document    |
       |                         |                                 | - DGFT Licensing Desk   |
       +-------------------------+                                 +-------------------------+
```

---

## Local Setup & Getting Started

### 1. Prerequisites
- **Node.js**: v18.18.0 or v20+
- **Package Manager**: `pnpm` (recommended), `npm`, or `yarn`
- **PostgreSQL**: Local instance or remote provider (e.g. Supabase)

### 2. Clone and Install Dependencies
```bash
# Clone repository
git clone https://github.com/praviinjaiiswal/ShipSync-AI.git
cd ShipSync-AI

# Install project dependencies
pnpm install
```

### 3. Environment Configuration
Copy `.env.example` to create your local `.env`:
```bash
cp .env.example .env
```

Ensure the following variables are configured in `.env`:

| Variable | Description |
| :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string (pooler or transaction url) |
| `DIRECT_URL` | PostgreSQL direct connection string for Prisma migrations |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key for user authentication |
| `CLERK_SECRET_KEY` | Clerk secret key for server-side auth validation |
| `OPENAI_API_KEY` | OpenAI API key for HS classification and trade intelligence |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL for document storage |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase public anonymous API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase administrative service role key |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay payment credentials |
| `RESEND_API_KEY` | Transactional email provider API key |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST credentials for distributed caching |
| `CRON_SECRET` | Bearer token securing scheduled scraper jobs (`/api/cron/*`) |
| `TRADE_GOV_API_KEY` | Trade.gov API access key |
| `NEXT_PUBLIC_APP_URL` | Application root URL (`http://localhost:3000` for local dev) |

### 4. Database Setup & Migrations
Generate the Prisma Client and sync your database schema:
```bash
# Generate Prisma Client types
pnpm prisma generate

# Apply migrations to database
pnpm prisma db push

# (Optional) Seed statutory tariff schedules
npx tsx prisma/seed-tariff.ts
```

### 5. Start Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) to view the live regulatory news feed and application.

---

## Status / Known Limitations

The following constraints are documented transparently and represent the current operational status of the platform:

1. **ICEGATE Integration is a Mock Adapter (Not Live)**
   - The customs filing pipeline (`lib/customs/adapters/mock-customs-adapter.ts`) simulates statutory EDI message transmission, job number generation, and positive/negative acknowledgment status cycles. Direct production transmission into the Indian Customs EDI Gateway (ICEGATE) requires Class-3 digital signature certificate (DSC) signing hardware and official ICEGATE 1.5/2.0 API gateway credentials.

2. **CBIC Scraping is Disabled (DGFT-Only Trade Intelligence Currently)**
   - The automated regulatory scanner (`app/api/cron/trade-updates-scan/route.ts`) actively monitors and indexes public notifications from the official Directorate General of Foreign Trade (DGFT) gazette. Scraping for Central Board of Indirect Taxes and Customs (CBIC) notifications is temporarily paused due to their client-side Angular single-page application rendering and Web Application Firewall (WAF) protections. Phase 2 roadmap includes a dedicated headless browser runner and official RSS ingestion for CBIC.

3. **AI Outputs are Best-Effort and Require User Verification**
   - All AI-generated outputs—including suggested 8-digit HS Codes, document autofill drafts, shipment risk scores, and summarized regulatory updates—are intended solely as compliance aids. They do **not** constitute legal customs advice. Exporters, importers, and Customs House Agents must review and confirm all classifications, duty rates, and statutory declarations with official government notifications before filing shipping bills or bills of entry.
