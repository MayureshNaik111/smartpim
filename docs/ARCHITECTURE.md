# SmartPIM — Architecture Document

## High-Level Flow

```
User
  → Next.js UI (Dashboard / Products / AI Product Agent / Attributes / Sync)
  → API Layer (Next.js Route Handlers)
  → AI Product Agent
       → Analyze
       → Generate
       → Validate
       → Completeness Score
       → Recommendations
  → User Approval
  → Product Catalog (in-memory store)
  → WooCommerce Service
  → WooCommerce REST API (v3)   [Demo Mode when credentials are absent]
```

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                      USER                            │
│              (Browser @ 1366×768)                    │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              NEXT.JS APPLICATION                     │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │              FRONTEND (React)                 │   │
│  │                                               │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐  │   │
│  │  │Dashboard │ │Products  │ │AI Product    │  │   │
│  │  │          │ │Catalog   │ │Agent         │  │   │
│  │  └──────────┘ └──────────┘ └──────────────┘  │   │
│  │  ┌──────────┐ ┌──────────┐                   │   │
│  │  │Attributes│ │Sync Page │                   │   │
│  │  │          │ │          │                   │   │
│  │  └──────────┘ └──────────┘                   │   │
│  └──────────────────────────────────────────────┘   │
│                       │                              │
│                       ▼                              │
│  ┌──────────────────────────────────────────────┐   │
│  │           API LAYER (Route Handlers)          │   │
│  │                                               │   │
│  │  GET/POST /api/products                       │   │
│  │  GET/PUT/DELETE /api/products/[id]            │   │
│  │  POST /api/products/[id]/sync                 │   │
│  │  GET/POST /api/attributes                     │   │
│  │  PUT/DELETE /api/attributes/[id]              │   │
│  │  POST /api/generate-product                   │   │
│  │  POST /api/validate-product                   │   │
│  │  POST /api/sync                               │   │
│  └───────────┬──────────────────┬───────────────┘   │
│              │                  │                    │
│              ▼                  ▼                    │
│  ┌──────────────────┐ ┌────────────────────────┐    │
│  │   AI AGENT       │ │  WOOCOMMERCE SERVICE   │    │
│  │   PIPELINE       │ │                        │    │
│  │                  │ │  getProducts()          │    │
│  │  ┌────────────┐  │ │  getProduct(id)         │    │
│  │  │ Analyzer   │  │ │  createProduct(data)    │    │
│  │  └─────┬──────┘  │ │  updateProduct(id,data) │    │
│  │        ▼         │ │  deleteProduct(id)      │    │
│  │  ┌────────────┐  │ │                        │    │
│  │  │ Structurer │  │ │  ┌──────────────────┐  │    │
│  │  └─────┬──────┘  │ │  │ Demo Mode        │  │    │
│  │        ▼         │ │  │ (Mock Data)      │  │    │
│  │  ┌────────────┐  │ │  └──────────────────┘  │    │
│  │  │ Generator  │  │ │  ┌──────────────────┐  │    │
│  │  └─────┬──────┘  │ │  │ Live Mode        │  │    │
│  │        ▼         │ │  │ (WC REST API)    │  │    │
│  │  ┌────────────┐  │ │  └──────────────────┘  │    │
│  │  │ Validator  │  │ └────────────┬───────────┘    │
│  │  └─────┬──────┘  │              │                │
│  │        ▼         │              ▼                │
│  │  ┌────────────┐  │  ┌───────────────────────┐   │
│  │  │ Scorer     │  │  │  WooCommerce REST API │   │
│  │  └─────┬──────┘  │  │  /wp-json/wc/v3/      │   │
│  │        ▼         │  └───────────────────────┘   │
│  │  ┌────────────┐  │                               │
│  │  │ Recommender│  │                               │
│  │  └────────────┘  │                               │
│  └──────────────────┘                               │
└─────────────────────────────────────────────────────┘
```

## Data Flow

### AI Product Generation Flow

```
User Input (rough product description)
    │
    ▼
POST /api/generate-product
    │
    ├── Step 1: ANALYZE
    │   - Parse input text
    │   - Identify present information
    │   - Identify missing information
    │   - Detect ambiguities
    │
    ├── Step 2: STRUCTURE
    │   - Convert to structured data
    │   - Map to product schema
    │
    ├── Step 3: GENERATE
    │   - AI generates title, descriptions
    │   - Generate category & tags
    │   - Generate attributes
    │   - Generate SEO metadata
    │   - Suggest price range
    │
    ├── Step 4: VALIDATE
    │   - Check required fields
    │   - Validate description quality
    │   - Check attribute completeness
    │   - Validate SEO metadata lengths
    │
    ├── Step 5: SCORE
    │   - Calculate completeness score (0-100)
    │   - Count complete/missing/review fields
    │
    └── Step 6: RECOMMEND
        - Generate improvement suggestions
        │
        ▼
    Response to Frontend
        │
        ▼
    User Reviews & Approves
        │
        ▼
    Product Added to Catalog
        │
        ▼
    Optional: Sync to WooCommerce
```

### WooCommerce Sync Flow

```
Sync Initiated
    │
    ▼
Check Connection Status
    │
    ├── No Credentials → Demo Mode (simulated sync)
    │
    └── Credentials Found → Live Mode
        │
        ├── Transform products to WooCommerce format
        ├── Push new/updated products (per-product or catalog-wide)
        ├── Collect successes and failures
        └── Report results
```

## Demo Mode

Demo Mode is the default and is selected automatically when credentials are missing:

| Area | Behaviour without credentials |
|------|-------------------------------|
| AI generation | `src/lib/ai/demo-mode.ts` — deterministic, keyword-driven analysis and generation; the UI shows an "AI Demo Mode" banner |
| WooCommerce | `wooService.isConnected()` is false; `POST /api/sync` simulates the run and reports issues found in the real catalog (draft status, missing SEO); per-product sync returns a demo confirmation |
| UI | Top bar and sync page show a "Demo Mode" badge |
| Data | In-memory store seeded with mock data — no database required |

No external credentials were used or verified during development; Demo Mode is the
path exercised by the tests and the demo.

## In-Memory Product Store

- `src/app/api/products/route.ts` holds `let products: Product[] = [...mockProducts]` and exposes `getProductStore()` / `setProductStore()` — shared by every product route (list, detail, update, delete, sync).
- `src/app/api/attributes/route.ts` does the same for attribute definitions, seeded from `mockAttributes`.
- Consequence: data lives for the lifetime of the server process and resets to seed data on restart. No persistence layer is used (documented MVP trade-off).

## API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/products` | List products; supports `search`, `category`, `status`, `sort`, `order` query params; returns `mode` (`demo`/`live`) |
| POST | `/api/products` | Create a product; completeness score is calculated server-side |
| GET | `/api/products/[id]` | Fetch one product (404 if unknown) |
| PUT | `/api/products/[id]` | Update a product; score recalculated |
| DELETE | `/api/products/[id]` | Delete a product |
| POST | `/api/products/[id]/sync` | Sync one product; demo fallback when not connected |
| GET | `/api/attributes` | List attribute definitions |
| POST | `/api/attributes` | Create an attribute (400 empty name, 409 duplicate) |
| PUT | `/api/attributes/[id]` | Rename / replace values |
| DELETE | `/api/attributes/[id]` | Delete an attribute |
| POST | `/api/generate-product` | Run the AI agent pipeline (400 for empty or malformed input) |
| POST | `/api/validate-product` | Validate a product payload and return score/warnings |
| POST | `/api/sync` | Synchronize the catalog (demo simulation or live push) |

## AI Agent Components

| Step | Implemented in | Responsibility |
|------|----------------|----------------|
| Analyze | `src/lib/ai/demo-mode.ts` → `analyzeInput()` | Present / missing / ambiguous information, inferred attributes |
| Structure + Generate | `src/lib/ai/demo-mode.ts` → `generateDemoProduct()` | Title, descriptions, category, tags, attributes, price range, SEO, recommendations, score |
| Validate | `src/lib/validation/product.ts` → `validateProduct()` | Required fields, description quality, SEO length rules |
| Score | `src/lib/validation/product.ts` → `calculateCompletenessScore()` | Weighted 0–100 completeness score |
| Recommend | `generateDemoProduct()` + `validateProduct()` | Improvement suggestions returned with the product |
| Orchestration | `src/lib/ai/agent.ts` → `runAgentPipeline()` | Runs all steps, records step results, returns `{steps, analysis, product, validation, mode}` |
| Approval | `src/app/ai-generator/page.tsx` | User approves before `POST /api/products` inserts into the catalog |

## Validation & Scoring

- **Completeness score** — weighted fields (name 15, description 15, price 10, short description 10, category 10, attributes 10, SEO title 8, SEO description 7, tags 5, sku 5, stock 5) summing to 100; recalculated on every create and update.
- **Validation** — required: name, description, short description, category, valid price; warnings for short descriptions, over-long SEO title/description, unset stock; recommendations for missing tags, SKU, SEO metadata.

## Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout with sidebar
│   ├── page.tsx                  # Dashboard
│   ├── products/
│   │   ├── page.tsx              # Product catalog
│   │   └── [id]/
│   │       └── page.tsx          # Product detail/edit
│   ├── ai-generator/
│   │   └── page.tsx              # AI Product Agent
│   ├── attributes/
│   │   └── page.tsx              # Attribute management
│   ├── sync/
│   │   └── page.tsx              # Synchronization
│   └── api/
│       ├── products/
│       │   ├── route.ts          # GET (list) / POST (create)
│       │   └── [id]/
│       │       ├── route.ts      # GET / PUT / DELETE
│       │       └── sync/route.ts # POST - per-product sync
│       ├── attributes/
│       │   ├── route.ts          # GET (list) / POST (create)
│       │   └── [id]/route.ts     # PUT / DELETE
│       ├── generate-product/
│       │   └── route.ts          # POST - AI agent pipeline
│       ├── validate-product/
│       │   └── route.ts          # POST - Validation
│       └── sync/
│           └── route.ts          # POST - WooCommerce sync
│
├── components/
│   └── layout/
│       ├── Sidebar.tsx           # Navigation sidebar
│       └── TopBar.tsx            # Top bar with search, connection status
│
├── lib/
│   ├── ai/
│   │   ├── agent.ts              # Pipeline orchestrator (analyze → … → recommend)
│   │   └── demo-mode.ts          # Deterministic analysis + generation (Demo Mode)
│   ├── woocommerce/
│   │   ├── client.ts             # WooCommerce REST v3 client
│   │   ├── service.ts            # Business logic layer (live/demo)
│   │   └── transform.ts          # Local ⇄ WooCommerce data transformation
│   ├── validation/
│   │   └── product.ts            # Completeness scoring + validation rules
│   └── utils/
│       └── helpers.ts            # Formatting, stats, helpers
│
├── types/
│   └── product.ts                # TypeScript interfaces
│
└── data/
    └── mock-products.ts          # 12 mock products + attribute definitions

# Tests live next to the code they cover (Vitest):
#   src/lib/validation/product.test.ts
#   src/lib/ai/agent.test.ts
#   src/lib/woocommerce/transform.test.ts
#   src/app/api/{products,attributes,generate-product}/route.test.ts
```

```
project root
├── vitest.config.ts              # Vitest config (@/ alias)
├── .env.example                  # Environment variable placeholders (no credentials)
├── docs/                         # PLAN.md, ARCHITECTURE.md, AI_USAGE.md
└── scripts/
    └── e2e.mjs                   # Chrome E2E demo-flow test
```

## Key Design Decisions

1. **Demo Mode First**: Application works fully without external credentials
2. **Server-side Secrets**: All credentials are read from environment variables in route handlers / server modules only
3. **Deterministic Generation Engine**: the pipeline exposes an `AI_API_KEY` switch and a provider-ready structure, but generation currently runs on the deterministic demo engine — no external LLM call was made or verified
4. **Service Layer Pattern**: WooCommerce logic separated from API routes
5. **Type Safety**: Strict TypeScript interfaces for all data structures
6. **Human in the Loop**: generated products are inserted only after explicit user approval
