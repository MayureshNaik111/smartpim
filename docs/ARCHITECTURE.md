# SmartPIM — Architecture Document

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
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐  │   │
│  │  │Attributes│ │Sync Page │ │Settings      │  │   │
│  │  │          │ │          │ │              │  │   │
│  │  └──────────┘ └──────────┘ └──────────────┘  │   │
│  └──────────────────────────────────────────────┘   │
│                       │                              │
│                       ▼                              │
│  ┌──────────────────────────────────────────────┐   │
│  │           API LAYER (Route Handlers)          │   │
│  │                                               │   │
│  │  GET/POST /api/products                       │   │
│  │  GET/PUT/DELETE /api/products/[id]            │   │
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
        ├── Fetch remote products
        ├── Compare with local catalog
        ├── Detect conflicts
        ├── Push new/updated products
        └── Report results
```

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
│       │       └── route.ts      # GET / PUT / DELETE
│       ├── generate-product/
│       │   └── route.ts          # POST - AI generation
│       ├── validate-product/
│       │   └── route.ts          # POST - Validation
│       └── sync/
│           └── route.ts          # POST - WooCommerce sync
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx           # Navigation sidebar
│   │   └── TopBar.tsx            # Top bar with search, status
│   ├── dashboard/
│   │   ├── StatCard.tsx          # Statistics card
│   │   └── RecentProducts.tsx    # Recent products table
│   ├── products/
│   │   ├── ProductTable.tsx      # Product listing table
│   │   ├── ProductForm.tsx       # Create/edit form
│   │   └── ProductFilters.tsx    # Search and filters
│   ├── ai/
│   │   ├── ProductInput.tsx      # AI input form
│   │   ├── WorkflowSteps.tsx     # Step visualization
│   │   ├── GeneratedProduct.tsx  # AI output display
│   │   └── ApprovalActions.tsx   # Accept/edit/reject
│   └── sync/
│       ├── SyncStatus.tsx        # Connection status
│       └── SyncProgress.tsx      # Sync progress indicator
│
├── lib/
│   ├── ai/
│   │   ├── agent.ts              # AI agent orchestrator
│   │   ├── analyzer.ts           # Step 1: Analyze
│   │   ├── generator.ts          # Step 2-3: Structure & Generate
│   │   ├── validator.ts          # Step 4: Validate
│   │   ├── scorer.ts             # Step 5: Score
│   │   └── demo-mode.ts          # Deterministic mock AI
│   ├── woocommerce/
│   │   ├── client.ts             # WooCommerce API client
│   │   ├── service.ts            # Business logic layer
│   │   └── transform.ts          # Data transformation
│   ├── validation/
│   │   └── product.ts            # Product validation rules
│   └── utils/
│       └── helpers.ts            # Utility functions
│
├── types/
│   └── product.ts                # TypeScript interfaces
│
└── data/
    └── mock-products.ts          # Mock product data
```

## Key Design Decisions

1. **Demo Mode First**: Application works fully without external credentials
2. **Server-side Secrets**: All API keys handled in route handlers only
3. **AI Provider Abstraction**: Clean interface allows swapping AI providers
4. **Service Layer Pattern**: WooCommerce logic separated from API routes
5. **Type Safety**: Strict TypeScript interfaces for all data structures
