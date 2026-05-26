# Architecture Overview

Keep this living guide updated so contributors can quickly understand, navigate, and improve the codebase from day one.

## Project Structure

```
[project root]/
├── apps/
│   ├── docs/     # Next.js 16 Fumadocs for documentation
│   ├── website/  # Next.js 16 - Learning platform for users
│   ├── api/  # Hono Server - API Server for learning platform
│   └── admin/    # Next.js 16 - Admin dashboard for managing content and users
├── packages/
│   ├── ui/     # Shared UI components and design system
│   ├── db/     # drizzle schema + db client
│   ├── logger/ # pino logger with pino-pretty
│   └── core/   # Shared types, zod schemas, and business logic
└── docs/
```

## Apps

### Common technology

- frontend: Next.js 16 with App Router
- backend: Hono with OpenAPI 3.1 spec, @hono/zod-openapi
- api client: openapi-typescript
- auth: Better Auth
- database: Drizzle with SQLite
- logging: pino with pino-pretty
- storage: RustFS with presigned uploads

### website

provide learning services to users

- port: `3000 port`
- auth: email/password + Google

### admin

Manages the platform, including content and users

- port: `3001 port`
- auth: id/password
- features:
  - user management
  - content management content editor

### docs

provide knowledge about the project and API documentation

- port: `3002 port`
- framework: fumadocs (Next 16)

## Packages

### UI

- Design System(based shadcn and mui/base-ui) with custom theming and components

### Database

- Drizzle-ORM with SQLite, zod schemas

### Storage

- RustFS with presigned uploads

### AI

- OpenAI Responses API + Structured Outputs

## Deployment

- Ubuntu server with systemd for process management
- Caddy for reverse proxy and TLS
- SQLite backup strategy for data durability
