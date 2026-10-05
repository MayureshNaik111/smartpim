# SmartPIM — AI-Powered WooCommerce Product Information Management System

SmartPIM turns rough, incomplete product notes into validated, WooCommerce-ready product
data. A multi-step **AI Product Agent** analyzes the input, structures and generates the
product content, validates it, calculates a completeness score, and recommends
improvements — and nothing enters the catalog until a human approves it.

> **Demo Mode is the default.** The application runs fully without any external
> credentials. No live AI API call and no live WooCommerce store was used or verified
> during development — see [Known limitations](#15-known-limitations).

---

## 1. Project overview

| | |
|---|---|
| Name | SmartPIM (`smartpim@0.1.0`) |
| Type | Single-user web application (hackathon MVP) |
| Purpose | Manage product information, enrich it with an AI agent, and synchronize it with WooCommerce |
| Data store | In-memory (resets to seed data on restart) |
| Documentation | [`docs/PLAN.md`](docs/PLAN.md) · [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · [`docs/AI_USAGE.md`](docs/AI_USAGE.md) |

## 2. Problem statement

Product Information Management (PIM) is a recurring pain point for e-commerce teams:

- Product data is incomplete or poorly structured (missing SEO, attributes, specs)
- Data is inconsistent across channels and manually maintained
- WooCommerce store owners juggle hundreds of products with uneven quality
- Writing a complete, optimized product listing from a one-line idea is slow and error-prone

## 3. SmartPIM solution

SmartPIM accepts a rough product description and runs it through an agentic pipeline:

**Analyze → Structure → Generate → Validate → Score → Recommend → Human approval → Catalog → WooCommerce sync**

The result is structured, validated, scored (0–100) product data with SEO metadata,
attributes, tags, and a clear list of what is still missing — ready to approve, review,
or regenerate before it ever reaches the catalog.

## 4. Key features

- **Product catalog (CRUD)** — list, search, filter by category/status, view, edit, delete, create
- **Attribute handling** — attribute definitions with values, per-value usage counts across products
- **AI Product Agent** — multi-step generation workflow with step visualization
- **Missing-information detection** — the agent reports present, missing, and inferred fields
- **Completeness scoring** — weighted 0–100 score, recalculated on every create/update
- **Validation** — required fields, description quality, SEO length rules, warnings and recommendations
- **Human-in-the-loop approval** — generated products enter the catalog only after explicit approval
- **WooCommerce integration** — REST API v3 client, service layer, field transforms
- **Product synchronization** — catalog-wide and per-product sync endpoints + sync UI
- **Demo Mode** — full functionality with zero external credentials
- **Dashboard** — statistics, recent products, quick actions
- **Error handling** — 400/404/409 responses for bad input, try/catch on every route, UI error banners
- **Testing** — 48 unit/integration tests and a 33-check Chrome E2E flow

## 5. AI Product Agent workflow

UI: `/ai-generator` · Endpoint: `POST /api/generate-product`

| Step | What happens |
|---|---|
| 1. Analyze | Parse the rough input; detect present information, missing information (e.g. Brand, Price, SKU, weight, warranty), ambiguities, and inferred attributes (category, color, material) |
| 2. Structure | Map the analysis onto the product schema |
| 3. Generate | Produce title, full description, short description, category, tags, attributes, suggested price range, and SEO title/description |
| 4. Validate | Check required fields, description quality, attribute completeness, SEO lengths |
| 5. Score | Calculate the completeness score (0–100) |
| 6. Recommend | Generate improvement suggestions (add weight, warranty, images, more tags, …) |

The UI shows the workflow steps live, the generated product, an **Input Analysis** panel
(detected / missing / inferred information), validation results, and recommendations.
The user can **Approve & Add to Catalog**, **Regenerate**, or **Start Over**.

Generation runs on the deterministic demo engine (`src/lib/ai/demo-mode.ts`). See
[Known limitations](#15-known-limitations) regarding `AI_API_KEY`.

## 6. Product catalog and attribute management

- **Catalog** (`/products`) — table with search, category and status filters, completeness bars, status badges, view/edit/delete actions
- **Detail/edit** (`/products/[id]`) — product information, attributes, SEO, status, completeness score, source; edit mode recalculates the score on save
- **Attributes** (`/attributes`) — attribute definitions (Color, Size, Material, Brand by default) with slugs, values, usage counts per value, and create/add-value/delete management (`/api/attributes`)
- **Seed data** — 12 realistic mock products and 4 attribute definitions (`src/data/mock-products.ts`)

## 7. WooCommerce integration

- `src/lib/woocommerce/client.ts` — REST API v3 client (Basic auth from consumer key/secret, server-side only)
- `src/lib/woocommerce/service.ts` — business layer: fetch, push, sync, connected/demo detection
- `src/lib/woocommerce/transform.ts` — local ⇄ WooCommerce field mapping (status, stock, categories, tags, attributes, SEO meta)
- Endpoints — `POST /api/sync` (catalog-wide), `POST /api/products/[id]/sync` (single product)
- UI — `/sync` with connection status, workflow steps, results, and last-sync timestamp

**Credentials were not used during development or testing.** The live path is
implemented and unit-tested (transforms) but has not been exercised against a real
store; the demo path simulates the sync and reports issues found in the actual catalog.

## 8. Demo Mode

Demo Mode activates automatically when credentials are absent:

- **AI** — deterministic, keyword-driven generation with a visible "AI Demo Mode" banner
- **WooCommerce** — "Demo Mode" badge in the top bar and sync page; `POST /api/sync` simulates the run (e.g. skips drafts, reports missing SEO)
- **Data** — in-memory store seeded with mock products; no database required

To move beyond Demo Mode, fill in [environment variables](#12-environment-variables).

## 9. Technology stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.3.8 (App Router, Turbopack) |
| UI | React 19.2.8, TypeScript 5, Tailwind CSS 4 |
| Icons | lucide-react |
| API | Next.js Route Handlers |
| Data | In-memory store (no database) |
| Unit/integration tests | Vitest 3 |
| E2E tests | Puppeteer Core + installed Chrome |
| Lint / types | ESLint 9 (`eslint-config-next`), `tsc --noEmit` |

## 10. Project structure

```
smartpim/
├── docs/
│   ├── PLAN.md                 # Hackathon plan, timeline, risks
│   ├── ARCHITECTURE.md         # System architecture and data flow
│   └── AI_USAGE.md             # AI tool usage (judging criterion)
├── .env.example                # Environment variable placeholders
├── vitest.config.ts            # Test config (@/ alias)
├── scripts/
│   └── e2e.mjs                 # Chrome E2E demo-flow test
└── src/
    ├── app/
    │   ├── page.tsx            # Dashboard
    │   ├── layout.tsx          # Root layout (Sidebar + TopBar)
    │   ├── products/
    │   │   ├── page.tsx        # Catalog (search/filter)
    │   │   └── [id]/page.tsx   # Detail + edit
    │   ├── ai-generator/page.tsx
    │   ├── attributes/page.tsx
    │   ├── sync/page.tsx
    │   └── api/
    │       ├── products/route.ts              # GET list / POST create
    │       ├── products/[id]/route.ts         # GET / PUT / DELETE
    │       ├── products/[id]/sync/route.ts    # POST per-product sync
    │       ├── attributes/route.ts            # GET / POST
    │       ├── attributes/[id]/route.ts       # PUT / DELETE
    │       ├── generate-product/route.ts      # POST AI pipeline
    │       ├── validate-product/route.ts      # POST validation
    │       └── sync/route.ts                  # POST catalog sync
    ├── components/layout/       # Sidebar, TopBar
    ├── lib/
    │   ├── ai/agent.ts          # Pipeline orchestrator
    │   ├── ai/demo-mode.ts      # Analysis + deterministic generation
    │   ├── validation/product.ts# Scoring + validation
    │   ├── woocommerce/         # client, service, transform
    │   └── utils/helpers.ts     # Formatting, stats, helpers
    ├── data/mock-products.ts    # Seed products + attribute definitions
    └── types/product.ts         # Shared TypeScript interfaces
```

## 11. Installation / setup

```bash
git clone <repo-url> smartpim
cd smartpim
npm install
```

Requires **Node.js 22+** and a Chrome/Chromium installation for the E2E test.

## 12. Environment variables

All variables are **optional** — the app runs in Demo Mode without them. Copy the
placeholder file and fill in values only if you have credentials:

```bash
cp .env.example .env.local
```

| Variable | Purpose | Used by |
|---|---|---|
| `AI_API_KEY` | Presence switches the pipeline's `useAI` flag | `POST /api/generate-product` |
| `WOOCOMMERCE_URL` | Store base URL (e.g. `https://shop.example.com`) | `src/lib/woocommerce/client.ts` |
| `WOOCOMMERCE_CONSUMER_KEY` | WooCommerce REST consumer key | `src/lib/woocommerce/client.ts` |
| `WOOCOMMERCE_CONSUMER_SECRET` | WooCommerce REST consumer secret | `src/lib/woocommerce/client.ts` |

`.env.local` is git-ignored; `.env.example` contains empty placeholders only.

## 13. Running the application

```bash
npm run dev      # development server → http://localhost:3000
npm run build    # production build
npm start        # serve the production build
```

## 14. Testing

```bash
npm run lint        # ESLint
npx tsc --noEmit    # TypeScript type check
npm test            # 48 unit/integration tests (Vitest)
npm run build       # production build
npm run test:e2e    # 33-check Chrome E2E flow
```

The E2E test needs a running server (dev or production) on `http://localhost:3000`
(override with `E2E_BASE_URL`; Chrome location with `CHROME_PATH`). It drives the real
demo flows — Dashboard → Catalog search/edit → AI generate/approve → Attributes →
Demo sync — collects console and page errors, and cleans up the product it creates.

Last verified state: **lint 0, tsc 0, 48/48 tests, build 0, 33/33 E2E checks, zero
browser console/runtime errors.**

Coverage areas: completeness scoring, validation rules, AI analysis/generation,
agent pipeline, WooCommerce transforms (including sparse payloads), and API route
handlers for products, attributes, generation, and validation.

## 15. Known limitations

- **In-memory data** — products and attributes reset to seed data on server restart; no persistence layer.
- **No live AI provider call** — the agent pipeline exposes an `AI_API_KEY` flag and a step-by-step workflow, but generation currently uses the deterministic demo engine (`generateDemoProduct`). No external LLM was called or verified.
- **Live WooCommerce sync unverified** — the client/service/transform code is implemented and unit-tested, but no real store credentials were used, so the live path has not been exercised end-to-end.
- **Simulated workflow timing** — the UI animates workflow steps client-side while the API call runs.
- **Single user, no authentication** — explicitly out of scope (see [`docs/PLAN.md`](docs/PLAN.md)).
- **Demo sync results are simulated** — Demo Mode reports issues derived from the catalog (draft status, missing SEO) rather than contacting a store.

## Further reading

- [`docs/PLAN.md`](docs/PLAN.md) — problem, scope, timeline, risks, fallback strategy
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — architecture, API routes, data flow
- [`docs/AI_USAGE.md`](docs/AI_USAGE.md) — how AI tools were used to build this project
