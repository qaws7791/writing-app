/** @type {import("dependency-cruiser").IConfiguration} */
const config = {
  forbidden: [
    {
      name: "no-circular-runtime-dependencies",
      severity: "error",
      from: { path: "^(apps|packages)/" },
      to: { circular: true, dependencyTypesNot: ["type-only"] },
    },
    {
      name: "no-unresolved-dependencies",
      severity: "error",
      from: { path: "^(apps|packages)/" },
      to: { couldNotResolve: true },
    },
    {
      name: "no-unlisted-dependencies",
      severity: "error",
      from: { path: "^(apps|packages)/" },
      to: {
        dependencyTypes: ["npm-no-pkg", "npm-unknown"],
      },
    },
    {
      name: "config-does-not-depend-up",
      severity: "error",
      from: { path: "^packages/config/" },
      to: { path: "^(apps|packages/(modules|infra|shared))/" },
    },
    {
      name: "shared-does-not-depend-up",
      severity: "error",
      from: { path: "^packages/shared/" },
      to: { path: "^(apps|packages/(modules|infra))/" },
    },
    {
      name: "kernel-does-not-import-workspace-runtime",
      severity: "error",
      from: { path: "^packages/shared/kernel/" },
      to: {
        path: "^(apps|packages)/",
        pathNot: "^packages/shared/(kernel|types)/",
      },
    },
    {
      name: "kernel-does-not-import-runtime-frameworks",
      severity: "error",
      from: { path: "^packages/shared/kernel/" },
      to: {
        path: [
          "node_modules/(?:better-auth|drizzle-orm|hono|@hono|@mastra|next|openai|react)(?:/|$)",
          "node_modules/\\.bun/[^/]+/node_modules/(?:better-auth|drizzle-orm|hono|@hono|@mastra|next|openai|react)(?:/|$)",
        ],
      },
    },
    {
      name: "event-contracts-only-import-kernel-and-types",
      severity: "error",
      from: { path: "^packages/shared/event-contracts/" },
      to: {
        path: ["^(apps|packages)/", "node_modules/"],
        pathNot: "^packages/shared/(event-contracts|kernel|types)/",
      },
    },
    {
      name: "infra-does-not-depend-on-modules-or-apps",
      severity: "error",
      from: { path: "^packages/infra/" },
      to: { path: "^(apps|packages/modules)/" },
    },
    {
      name: "modules-do-not-import-other-module-internals",
      severity: "error",
      from: { path: "^packages/modules/([^/]+)/" },
      to: {
        path: "^packages/modules/",
        pathNot: "^packages/modules/$1/",
      },
    },
    {
      name: "identity-does-not-import-auth-runtime",
      severity: "error",
      from: { path: "^packages/modules/identity/" },
      to: { path: "^packages/infra/auth/" },
    },
    {
      name: "domain-is-layer-pure",
      severity: "error",
      from: { path: "^packages/modules/[^/]+/src/domain/" },
      to: {
        path: "^(apps|packages/(infra|modules/[^/]+/src/(application|infrastructure|interface)))/",
      },
    },
    {
      name: "domain-does-not-import-runtime-frameworks",
      severity: "error",
      from: { path: "^packages/modules/[^/]+/src/domain/" },
      to: {
        path: [
          "node_modules/(?:better-auth|drizzle-orm|hono|@hono|@mastra|next|openai|react)(?:/|$)",
          "node_modules/\\.bun/[^/]+/node_modules/(?:better-auth|drizzle-orm|hono|@hono|@mastra|next|openai|react)(?:/|$)",
        ],
      },
    },
    {
      name: "application-does-not-import-concrete-adapters",
      severity: "error",
      from: { path: "^packages/modules/[^/]+/src/application/" },
      to: {
        path: "^packages/modules/[^/]+/src/(infrastructure|interface)/",
      },
    },
    {
      name: "module-domain-and-application-do-not-import-http-contracts",
      severity: "error",
      from: {
        path: "^packages/modules/[^/]+/src/(domain|application)/",
      },
      to: { path: "^packages/shared/contracts/" },
    },
    {
      name: "frontends-do-not-import-server-domain-or-db",
      severity: "error",
      from: { path: "^apps/(web|admin)/" },
      to: {
        path: "^packages/(modules|infra)/",
        pathNot: "^packages/infra/(auth|http-client)/",
      },
    },
    {
      name: "storybook-only-consumes-ui-and-config",
      severity: "error",
      from: { path: "^apps/storybook/" },
      to: {
        path: "^packages/",
        pathNot: ["^packages/shared/ui/", "^packages/config/"],
      },
    },
    {
      name: "module-schema-and-seed-are-tooling-only",
      severity: "error",
      from: {
        path: "^(apps|packages)/",
        pathNot: [
          "^apps/api/src/db/(schema|seed)\\.ts$",
          "^apps/api/src/scripts/",
          "^packages/modules/[^/]+/src/infrastructure/persistence/",
        ],
      },
      to: {
        path: "^packages/modules/[^/]+/src/infrastructure/persistence/(schema|seed)\\.ts$",
      },
    },
    {
      name: "legacy-core-does-not-import-runtime-adapters",
      severity: "error",
      from: { path: "^packages/core/src/" },
      to: {
        path: [
          "^packages/(infra/db|shared/ui)/",
          "node_modules/(?:better-auth|drizzle-orm|hono|@hono|@mastra|next|openai|react)(?:/|$)",
          "node_modules/\\.bun/[^/]+/node_modules/(?:better-auth|drizzle-orm|hono|@hono|@mastra|next|openai|react)(?:/|$)",
        ],
      },
    },
    {
      name: "legacy-core-capabilities-do-not-import-each-other",
      severity: "error",
      from: { path: "^packages/core/src/modules/([^/]+)/" },
      to: {
        path: "^packages/core/src/modules/",
        pathNot: "^packages/core/src/modules/$1/",
      },
    },
    {
      name: "legacy-core-uses-canonical-contract-data",
      severity: "error",
      from: { path: "^packages/core/src/" },
      to: {
        path: "^packages/shared/contracts/src/(identity|learning|operations)/",
        pathNot: [
          "^packages/shared/contracts/src/identity/(data|status)\\.ts$",
          "^packages/shared/contracts/src/learning/(read-data|status|step-data)\\.ts$",
          "^packages/shared/contracts/src/operations/(ai-chat-data|content-reset-data|dashboard-analytics-data|settings-data)\\.ts$",
        ],
      },
    },
    {
      name: "legacy-frontends-do-not-import-core-or-db",
      severity: "error",
      from: { path: "^apps/(web|admin)/" },
      to: {
        path: [
          "^packages/(core|infra/db)/",
          "node_modules/drizzle-orm(?:/|$)",
          "node_modules/\\.bun/[^/]+/node_modules/drizzle-orm(?:/|$)",
        ],
      },
    },
    {
      name: "shared-ui-does-not-import-application-boundaries",
      severity: "error",
      from: { path: "^packages/shared/ui/src/" },
      to: {
        path: [
          "^apps/",
          "^packages/(core|infra/(auth|db|http-client))/",
          "node_modules/better-auth(?:/|$)",
          "node_modules/\\.bun/[^/]+/node_modules/better-auth(?:/|$)",
          "node_modules/next/dist/client/components/navigation",
          "node_modules/\\.bun/[^/]+/node_modules/next/dist/client/components/navigation",
        ],
      },
    },
    {
      name: "better-auth-is-owned-by-auth-package",
      severity: "error",
      from: {
        path: "^(apps|packages)/",
        pathNot: "^packages/infra/auth/",
      },
      to: {
        path: [
          "node_modules/better-auth(?:/|$)",
          "node_modules/\\.bun/[^/]+/node_modules/better-auth(?:/|$)",
        ],
      },
    },
    {
      name: "auth-client-does-not-import-server-runtime",
      severity: "error",
      from: {
        path: "^packages/infra/auth/src/(admin/client|learner/client|shared/client)\\.ts$",
      },
      to: {
        path: [
          "^packages/(core|infra/db)/",
          "^packages/infra/auth/src/(admin|learner|shared)/(?:.*server|auth-database-adapter)",
          "node_modules/drizzle-orm(?:/|$)",
          "node_modules/\\.bun/[^/]+/node_modules/drizzle-orm(?:/|$)",
          "node_modules/better-auth(?:/|$)",
          "node_modules/\\.bun/[^/]+/node_modules/better-auth(?:/|$)",
        ],
        pathNot: [
          "node_modules/better-auth/dist/client",
          "node_modules/\\.bun/[^/]+/node_modules/better-auth/dist/client",
        ],
      },
    },
    {
      name: "api-transport-does-not-import-persistence",
      severity: "error",
      from: {
        path: [
          "^apps/api/src/composition/create-app\\.ts$",
          "^apps/api/src/(admin|http|middleware|routes)/",
        ],
      },
      to: {
        path: [
          "^packages/infra/db/",
          "node_modules/drizzle-orm(?:/|$)",
          "node_modules/\\.bun/[^/]+/node_modules/drizzle-orm(?:/|$)",
        ],
      },
    },
    {
      name: "openai-and-mastra-are-owned-by-ai-infra",
      severity: "error",
      from: {
        path: "^(apps|packages)/",
        pathNot: "^packages/infra/ai/",
      },
      to: {
        path: [
          "node_modules/(?:openai|@mastra)(?:/|$)",
          "node_modules/\\.bun/[^/]+/node_modules/(?:openai|@mastra)(?:/|$)",
        ],
      },
    },
    {
      name: "aws-object-sdk-is-owned-by-storage-infra",
      severity: "error",
      from: {
        path: "^(apps|packages)/",
        pathNot: "^packages/infra/storage/",
      },
      to: {
        path: [
          "node_modules/@aws-sdk/client-s3(?:/|$)",
          "node_modules/\\.bun/[^/]+/node_modules/@aws-sdk/client-s3(?:/|$)",
        ],
      },
    },
    {
      name: "pino-is-owned-by-observability-infra",
      severity: "error",
      from: {
        path: "^(apps|packages)/",
        pathNot: "^packages/infra/observability/",
      },
      to: {
        path: [
          "node_modules/(?:pino|pino-pretty)(?:/|$)",
          "node_modules/\\.bun/[^/]+/node_modules/(?:pino|pino-pretty)(?:/|$)",
        ],
      },
    },
    {
      name: "emittery-is-owned-by-event-bus-infra",
      severity: "error",
      from: {
        path: "^(apps|packages)/",
        pathNot: "^packages/infra/event-bus/",
      },
      to: {
        path: [
          "node_modules/emittery(?:/|$)",
          "node_modules/\\.bun/[^/]+/node_modules/emittery(?:/|$)",
        ],
      },
    },
    {
      name: "api-only-imports-core-public-facades",
      severity: "error",
      from: { path: "^apps/api/src/" },
      to: {
        path: "^packages/core/src/",
        pathNot: "^packages/core/src/modules/admin/api/index\\.ts$",
      },
    },
    {
      name: "frontend-does-not-import-server-env-parser",
      severity: "error",
      from: { path: "^apps/(web|admin)/" },
      to: { path: "^packages/config/env/src/parse-env\\.ts$" },
    },
  ],
  options: {
    exclude: {
      path: "(^|/)(?:\\.next|\\.turbo|coverage|dist|storybook-static)(?:/|$)",
    },
    doNotFollow: {
      path: "node_modules",
      dependencyTypes: [
        "npm",
        "npm-dev",
        "npm-optional",
        "npm-peer",
        "npm-bundled",
        "npm-no-pkg",
      ],
    },
    enhancedResolveOptions: {
      conditionNames: ["types", "import", "node", "default"],
      exportsFields: ["exports"],
    },
    preserveSymlinks: false,
    tsPreCompilationDeps: true,
  },
}

export default config
