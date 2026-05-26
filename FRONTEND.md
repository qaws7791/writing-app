# Next.js Frontend Architecture — Principles & Philosophy

> Architecture design principles for a Next.js 16 App Router frontend. Focuses on **why** and **how** we decide, not specific implementations.

---

## Core Principles Summary

| Principle | Summary |
|---|---|
| Vertical First | Group by feature, not by technical type |
| Colocation | Code that changes together stays together |
| Public API | Limit external exposure to a single entry point |
| Contract-First | The API spec is the single source of truth |
| Dependency Inversion | High-level modules don't depend on low-level implementations |
| Server First | Client adoption is a conscious decision |
| Parse, Don't Validate | Prefer parsing that confirms types over plain validation |
| Test Through Seams | Isolate externals via replaceable adapters |
| YAGNI | Add abstraction only after need is proven |
| Automate Boundaries | Enforce dependency rules with tools |

## 1. Core Philosophy

### 1.1 Organize by Feature, Not by Type

Grouping code by technical type (`components`, `hooks`, `utils`) creates a **horizontal** structure. At scale, navigation cost grows exponentially because unrelated code sits together.

This architecture adopts a **vertical** structure. A `products` vertical contains all components, hooks, types, and utilities related to that domain. Code location answers **what it's for**, not **what it is**.

> **Principle: Code that changes together belongs together (Colocation).**

### 1.2 Low Coupling, High Cohesion

- **Cohesion**: Code inside a vertical is strongly related. A domain change resolves within the same vertical.
- **Coupling**: Cross-vertical dependencies are allowed only through **public interfaces**. Never reference internal implementations directly.

Horizontal structures violate both: no boundaries mean arbitrary imports, and co-located files often have no logical relationship.

### 1.3 Screaming Architecture

Directory structure should instantly reveal **what the app does**. `products`, `orders`, `users`, `dashboard` belong at the top level. If `components` and `hooks` are at the root, you only know it uses React—not what it's for.

### 1.4 Evolutionary Design — YAGNI

Start simple. Add internal structure only when complexity justifies it. This architecture is not fixed; it **evolves continuously**.

> Growth path: single file → flat files → layered files → sub-verticals

---

## 2. Structural Principle: Vertical Codebase

### 2.1 Definition of a Vertical

A vertical is a **logical functional unit**. It need not be a business domain.

- **Domain Verticals**: `products`, `orders`, `users` — contain business rules
- **Feature Verticals**: `dashboard`, `search`, `notifications` — own specific features/screens
- **Shared Verticals**: `design-system`, `auth`, `i18n` — consumed by multiple verticals

### 2.2 Boundary Decisions

Use these questions to define vertical boundaries:

1. **Changed together?** If one requirement touches both, they belong together.
2. **Owned by the same team?** Align boundaries with team ownership (Conway's Law).
3. **Independently understandable?** The vertical alone should explain the full feature.
4. **Big enough, small enough?** Too small is over-engineering; too big becomes another monolith.

### 2.3 Shared Code Principles

When asking "where does this shared code go?", first check if it deserves its own vertical. Dumping utilities into `shared` or `common` is just a horizontal structure in disguise.

- **Design System**: Domain-agnostic, reusable UI. Its own vertical.
- **Infrastructure**: HTTP client abstraction, error types, logging. No business logic.
- **Domain Shared**: Business logic used by multiple verticals. If this grows, reconsider your boundaries.

> **Sharing is a cost.** More sharing increases coupling. Minimize it, and make it explicit when unavoidable.

### 2.4 Internal Freedom, External Contract

Teams freely organize inside a vertical. But its **public interface** must be clearly defined and stable.

---

## 3. Boundary Principle: Modular Monolith in Monorepo

### 3.1 Monorepo as Enforcement

Monorepo exists to **enforce boundaries**, not just colocate code. Each vertical is an independent package. The `exports` field in `package.json` defines the public API. Anything not exported is inaccessible.

Deployment is unified: logical separation, physical integration. Monorepo, not microservices.

### 3.2 Public API Principles

Each vertical exposes itself through a single entry point (`index.ts`)—its **public contract**.

- **Included**: Components, types, and functions other verticals actually need
- **Excluded**: Internal implementations, private utilities, intermediate states

Keep the public API small. Exposed surfaces increase change cost as consumers grow. Start minimal, expand as needed.

### 3.3 Dependency Direction

Cross-vertical dependencies must be **unidirectional**. Circular dependencies are the worst enemy of a modular monolith—they prevent independent understanding, testing, and change.

Enforce this with lint rules (`eslint-plugin-boundaries`) and build tools. Documentation alone is insufficient.

### 3.4 App Package Role

The Next.js app package is an **orchestrator**. It contains no business logic. It composes vertical packages into routes, layouts, and pages.

---

## 4. Layer Principles

### 4.1 Four Concerns

Inside each vertical, separate these four concerns:

| Layer | Description |
|---|---|
| **Utilities** | Pure functions. No business logic, no external deps. Always testable. |
| **Domain Logic** | Business rules. Framework-agnostic, React-agnostic, API-agnostic. Pure TypeScript. |
| **Application Logic** | Connects domain logic to the outside world. Query options, mutations, form schemas. Depends on React and API clients, but not on specific UI components. |
| **External Adapters** | API clients, browser APIs, local storage. Hidden behind interfaces (ports). Replaceable with mocks or fakes for testing. |

### 4.2 Dependency Direction

```
External Adapters ← Application Logic ← Domain Logic ← Utilities
```

Arrows mean **"the left knows nothing about the right."** Domain logic doesn't know adapters exist. Adapters implement ports; the application layer or DI container decides which adapter to use.

### 4.3 Server/Client Separation

In Next.js App Router, Server and Client Components run in different environments. Manage this boundary explicitly.

- **Server-only**: Direct API calls, sensitive logic, session access
- **Client-only**: Event handlers, interaction state
- **Shared**: Pure utilities, Zod schemas, domain logic

Use the `server-only` package to prevent server code from leaking to the client. Violations cause runtime errors—block them at build time.

---

## 5. API Layer Principles

### 5.1 Contract-First Design

The API is a **contract** between frontend and backend. This contract is explicit as an OpenAPI spec. Backend generates specs with Hono + `hono/zod-openapi`; frontend consumes types via `openapi-typescript`.

**Types derive from the document**, not the other way around. The spec is the single source of truth.

### 5.2 API Client Abstraction

Frontend code never depends directly on a specific HTTP client (fetch, axios, etc.). The API client lives behind an abstraction layer acting as a **port**.

The core goal is **testability**. It must be replaceable with a mock or fake without real HTTP requests. The app should run without external APIs.

### 5.3 Internal Domain Model Separation

Types generated by `openapi-typescript` are **external contract types**. Never use them directly in components or domain logic. An **Anti-Corruption Layer** transforms API responses into internal domain models.

This confines backend API changes to the transformation layer. Code outside remains unaware of API changes.

### 5.4 Runtime Validation with Zod

OpenAPI types provide compile-time safety. Runtime safety requires separate validation. Parse API responses through Zod schemas. Parsing failures indicate contract violations and are handled as explicit errors.

> **Parse, don't validate.** Deriving types through parsing is safer than validating and reusing raw types.

---

## 6. Rendering Strategy Principles

### 6.1 Server Components First

Default to Server Components. Use `'use client'` only when the cost (bundle size, hydration, client-state complexity) is justified. Moving to Client Components is a **conscious decision**.

Server Components enable:

- Direct data fetching (API calls happen on the server)
- Isolation of sensitive logic
- Rich initial HTML (SEO, LCP)
- Zero client bundle for the component

### 6.2 Client Component Criteria

Use Client Components + TanStack Query when any of the following apply:

- User interaction requires reactive state
- Optimistic updates are needed
- Polling or real-time sync is required
- Infinite queries are needed
- Complex cross-query cache synchronization is needed
- Mutation progress (loading, error, success) must be reflected in UI

If none apply, fetch data directly in Server Components.

### 6.3 Suspense & Streaming

Pair Server Component data fetching with Suspense. Wrap slow-data-dependent components in Suspense boundaries. Default to **parallel fetching and streaming** so slow APIs don't block the entire page.

Client Components can also use TanStack Query with Suspense to reduce loading-state boilerplate. Suspense boundary placement is a UX decision, not just performance.

### 6.4 No Server Actions

This architecture does not use Server Actions.

- They obscure the API contract, bypassing client abstraction
- They are hard to test outside the Next.js runtime
- They fragment the single source of truth (OpenAPI spec)
- Mutations are consistently handled via Hono API + TanStack Query

All mutations go through the Hono API; the frontend calls them via TanStack Query mutations.

### 6.5 Auth/Session Handling

Backend uses `better-auth`, but the frontend doesn't need to know. Authentication is abstracted as:

- **Session presence**: Checked in Server Components via session cookies; redirect in middleware or server layer if absent
- **Auth state**: Queried in Client Components via TanStack Query (`/me` or session endpoint)
- **Auth UI**: Login, logout, profile managed by the `auth` vertical

Keep auth logic from scattering across verticals. Access auth state only through the `auth` vertical's public API.

---

## 7. State & Data Fetching Principles

### 7.1 State Kinds & Placement

| State | Tool | Location |
|---|---|---|
| Server State | TanStack Query | Client cache |
| UI State | `useState`, `useReducer` | Component or Context |
| URL State | `searchParams`, `useRouter` | URL |
| Form State | React Hook Form | Form component |

Never treat server state as client state (`useState`). Data from the server is managed by TanStack Query.

### 7.2 Query Options Pattern

Don't inline query definitions (`queryKey`, `queryFn`, `staleTime`) inside components. Use the Query Options Factory pattern, placing definitions in the vertical's application layer.

Benefits:

- Reuse across components consistently
- Reference identical keys for `invalidateQueries`
- Remove direct API client dependency from components
- Test query options in isolation

### 7.3 Query Key Strategy

Query keys are hierarchical: `vertical → entity → action/params`. This enables bulk invalidation for a vertical or entity.

Query keys must be **constants or factory functions managed in the vertical's public API**, not arbitrary string literals repeated across files.

### 7.4 Mutation Strategy

Always use TanStack Query `useMutation`. The default post-mutation strategy is invalidating related queries (`invalidateQueries`).

Advanced strategies:

- **Invalidation**: Simple CRUD. Default. Consistency guaranteed.
- **Optimistic Update**: Use only when UX is critical and rollback is acceptable. High complexity.
- **Direct Cache Update**: Use when the server response contains the updated entity.

Optimistic updates are complex. Use only after measuring a real performance problem. Default to invalidation.

### 7.5 Cache Synchronization

The vertical that **writes** (the mutation source) owns cache invalidation. If a `products` mutation must invalidate a `cart` query, that's a coupling signal. Reconsider dependency direction or introduce a shared event mechanism.

---

## 8. Form & Validation Principles

### 8.1 Zod as Single Source of Truth

Validation rules live in Zod schemas. This schema is the single source of truth. Don't duplicate rules separately for React Hook Form or the server.

Schemas serve three purposes:

1. **Form validation**: Wired to React Hook Form via `zodResolver`
2. **API response parsing**: Runtime validation of server responses
3. **Type derivation**: `z.infer<<typeof schema>` for TypeScript types

### 8.2 Form Schema vs. API Schema

Form schemas and API request schemas are similar but not identical. For example, a form has a "confirm password" field the API doesn't. Don't force them together.

- **Form schema**: Validates user input. UX perspective.
- **API request schema**: Validates payload sent to the server. Contract perspective.
- **Transform function**: Pure function converting form data to API request shape.

### 8.3 Form State Scope

React Hook Form state stays inside the form component. Never lift form state to global state (Context, external stores). If a parent needs the result, pass it via a callback (`onSuccess`).

---

## 9. Error Handling Principles

### 9.1 Error Types & Handling Location

| Error | Handler |
|---|---|
| Network/API errors | TanStack Query `onError` or Error Boundary |
| Validation errors | Detected early at Zod parsing, converted to proper error types |
| Expected business errors | API `4xx` responses; modeled as domain error types |
| Unexpected errors | Error Boundary as last defense |

### 9.2 Error Boundary Principles

Place Error Boundaries alongside Suspense boundaries. Specific areas of the component tree should fail independently. Don't let one error collapse the entire page.

### 9.3 Explicit Error Types

Never use `catch (e: unknown)` directly. An adapter layer converts errors into explicit error classes or Result types. Callers should know at the type level which errors are possible.

---

## 10. Testing Strategy Principles

### 10.1 Testability Is a Design Outcome

Testability isn't added later; the architecture guarantees it. Dependency inversion, adapter patterns, and pure-function separation all serve testability.

> **"The app must run without external APIs"** — this is the key indicator of a testable structure.

### 10.2 Test Pyramid & Layer Rules

| Test | Target |
|---|---|
| **Unit** | Pure functions, Zod schemas, domain logic. Zero external deps. Fast, stable. Should be the majority. |
| **Integration** | Query options and components with Mock Service Worker (MSW). Simulate actual fetch without real HTTP. Verify "when API returns X, component renders Y." |
| **Contract** | Verify frontend expectations match actual backend responses against the Hono OpenAPI spec. Fails when backend breaks the contract. Essential safety net when frontend and backend are separate apps. |
| **E2E** | Only critical paths. Sign-up → login → core purchase flow. E2E is expensive and slow. |

### 10.3 Mock Strategy

**MSW** mocks the network layer, not the API client code. It intercepts real HTTP requests. This exercises actual client code in tests, making them more realistic.

Write mock handlers using **types generated from the OpenAPI spec**. If a mock response diverges from the contract, TypeScript errors. This prevents "tests pass but production fails because mocks were unrealistic."

A single environment variable should switch the entire app to mock mode, enabling backend-free development or demos.

### 10.4 Test Design Rules

- Verify **behavior**, not implementation. Don't inspect internal component state.
- Write from the **user's perspective**: "Clicking this button shows this text."
- Tests must be **independent**; no test depends on another.
- Use **minimal mocking**. Excessive mocking tests implementation and becomes brittle.

---

## 11. Dependency Direction Principles

### 11.1 Dependency Hierarchy

Dependencies flow from **less stable to more stable** code. Frequently changing code depends on infrequently changing code.

```
App Package (frequently changes)
    ↓
Domain Vertical Packages
    ↓
Shared Vertical Packages (design system, infra)
    ↓
External Libraries (Next.js, TanStack Query, ...)
```

### 11.2 Allowed Directions

- App → any vertical package (allowed)
- Domain vertical → shared vertical (allowed)
- Domain vertical → another domain vertical's public API (allowed, unidirectional only)
- Domain vertical → another domain vertical's internal files (forbidden)
- Domain vertical A ↔ domain vertical B (circular, forbidden)
- Shared vertical → domain vertical (forbidden)

### 11.3 Automated Enforcement

Dependency rules must be enforced by tools, not just documentation.

- **Turborepo**: Explicit package dependency graph; undeclared deps blocked at build time
- **eslint-plugin-boundaries**: Lint-level enforcement of intra-package dependency rules
- **TypeScript**: Modules not in `exports` are inaccessible; blocked by type errors

---

## 12. Growth & Evolution Principles

### 12.1 Start Simple

New verticals begin as a single file or flat file collection. Add layers, sub-verticals, or abstractions only **after need is proven**. Don't build structure for complexity you haven't experienced yet.

### 12.2 Boundaries Move

Vertical boundaries aren't fixed. If `payment` code inside `orders` grows large enough, split it into a `payment` vertical. This should be easy.

It is easy only when internal code is exposed **solely through the public API**. If other packages import internal files directly, boundary moves require hunting down every import.

### 12.3 Explicit Technical Debt

Incomplete designs and temporary hacks are marked with `// TODO`, `// FIXME`, `// HACK` and tracked in issues. Explicit debt is far better than implicit debt.

### 12.4 Team Communication Is Part of Architecture

Vertical boundaries are most effective when aligned with team ownership. Creating new verticals or moving boundaries requires code review and team discussion. Document architecture decisions as **ADRs (Architecture Decision Records)** to preserve context and rationale.
