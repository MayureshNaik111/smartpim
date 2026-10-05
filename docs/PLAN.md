# SmartPIM — Planning Document

## Problem

Product Information Management (PIM) is a critical challenge for e-commerce businesses. Product data is often:
- Incomplete or poorly structured
- Missing SEO metadata
- Inconsistent across channels
- Manually managed, leading to errors

WooCommerce store owners frequently deal with hundreds or thousands of products that need consistent, complete, and optimized product information.

## Scope

Build an AI-powered PIM system that:
1. Accepts rough/incomplete product descriptions
2. Uses an AI agent workflow to analyze, generate, validate, and score product data
3. Produces structured, WooCommerce-ready product information
4. Synchronizes products with WooCommerce via REST API
5. Provides a clean dashboard for product management

### In Scope
- Product catalog management (CRUD)
- AI-powered product data generation and optimization
- Product attribute management
- WooCommerce REST API integration (v3)
- Product completeness scoring
- Data validation
- Demo mode (works without external credentials)
- Synchronization workflow

### Out of Scope
- Authentication / user roles
- Order management
- Customer management
- Payment processing
- Multi-tenant architecture
- Complex analytics
- Email notifications

## Assumptions

1. **WooCommerce credentials may not be available** during development or judging — Demo Mode is the primary fallback.
2. **AI API key may not be available** — deterministic mock AI results serve as fallback.
3. **Desktop-first presentation** at 1366×768 resolution.
4. **Single-user application** — no auth required for hackathon scope.
5. **Local/in-memory data store** is acceptable for the MVP.

## AI-Assisted Development

This project was built with AI assistance from three tools:

- **ChatGPT** — planning, architecture decisions, prompt creation, debugging guidance, documentation guidance, and review of implementation/testing results.
- **Google Antigravity** — initial project setup and substantial implementation; it generated/modified the initial SmartPIM codebase, which was subsequently inspected and verified.
- **Freebuff** — inspection of the existing codebase; identification and fixing of missing Attributes/Synchronization functionality and other issues; authoring and running of unit, integration, and E2E tests; API, runtime, build, TypeScript, and ESLint verification; the final demo-readiness audit.

AI-generated code was reviewed and tested by a human before acceptance. Full details: [`docs/AI_USAGE.md`](AI_USAGE.md).

## Agentic AI Workflow

The AI Product Agent follows a six-step agentic workflow with a human gate at the end:

1. **Analyze** rough input → present / missing / ambiguous information, inferred attributes
2. **Structure** → map the analysis to the product schema
3. **Generate** → title, descriptions, category, tags, attributes, price range, SEO
4. **Validate** → required fields, description quality, SEO length rules
5. **Score** → completeness score (0–100)
6. **Recommend** → improvement suggestions
7. **User approval** → only an approved product is inserted into the catalog, which can then be synchronized to WooCommerce

Demo Mode (deterministic generation) is used whenever an AI API key is unavailable; see [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) for the component mapping.

## Architecture

```
User
 ↓
Next.js UI (React + TypeScript + Tailwind)
 ↓
API Layer (Next.js Route Handlers)
 ├── AI Agent Pipeline
 │    ├── Step 1: Analyzer
 │    ├── Step 2: Structurer
 │    ├── Step 3: Generator
 │    ├── Step 4: Validator
 │    ├── Step 5: Scorer
 │    ├── Step 6: Recommender
 │    └── Step 7: Approval → Catalog
 │
 └── WooCommerce Service
      ↓
   WooCommerce REST API v3
```

## Implementation Plan

### Phase 1 — Setup & Planning (0:00–0:30)
- Initialize Next.js project with TypeScript, Tailwind, App Router
- Create project structure
- Define TypeScript types/interfaces
- Create documentation (PLAN.md, ARCHITECTURE.md)

### Phase 2 — Core UI & CRUD (0:30–1:30)
- Build layout (sidebar, top bar)
- Dashboard with statistics and recent products
- Products page with table, search, filters
- Product detail/edit views
- Attributes management page
- Mock data (10+ realistic products)

### Phase 3 — AI Product Agent (1:30–2:30)
- AI agent input page
- Multi-step agentic workflow (analyze → generate → validate → score → recommend)
- Structured AI output rendering
- User approval flow
- Demo mode AI (deterministic mock results)
- API route: POST /api/generate-product
- API route: POST /api/validate-product

### Phase 4 — WooCommerce Integration (2:30–3:00)
- WooCommerce service layer
- API routes for products CRUD
- Sync page and workflow
- Demo mode sync fallback
- Conflict detection (simple)

### Phase 5 — Testing (3:00–3:30)
- Unit tests (validation, scoring, transformation)
- E2E test flow
- Build verification
- Bug fixes

### Phase 6 — Documentation & Polish (3:30–4:00)
- Complete README.md
- AI_USAGE.md
- Final UI polish
- Demo flow verification

## Risks

| Risk | Mitigation |
|------|-----------|
| AI API unavailable | Demo mode with deterministic mock results |
| WooCommerce store unavailable | Demo mode with mock data |
| Time overrun on AI workflow | Simplify to fewer steps if needed |
| Build errors | Test incrementally, fix early |

## Fallback Strategy

1. If AI API fails → Use demo mode with realistic mock AI output
2. If WooCommerce fails → Use local mock data store
3. If time is short → Cut attributes page, focus on AI agent + sync demo
4. If tests fail → Fix critical path first, document known issues

## Testing Plan

### Unit Tests
- Product validation logic
- Completeness score calculation
- AI output schema validation
- Product data transformation (local ↔ WooCommerce format)

### Integration Tests
- API route responses
- AI generation pipeline

### E2E Test
- Full demo flow: Dashboard → AI Agent → Generate → Approve → Catalog → Sync
