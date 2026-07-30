import { existsSync, readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repositoryRoot = path.dirname(fileURLToPath(import.meta.url))
const frontendSourcePath = "^apps/(web|admin)/"
const frontendAppTargetPath = "^apps/(?:web|admin)/"
const moduleSourcePath = "^packages/modules/([^/]+)/"
const moduleTargetPath = "^packages/modules/[^/]+/src/"
const nextFrameworkPaths = [
  "^next(?:/|$)",
  "^node_modules/next(?:/|$)",
  "^node_modules/\\.bun/[^/]+/node_modules/next(?:/|$)",
]
const frameworkAndDatabasePaths = [
  "^(?:@hono/[^/]+|drizzle-orm|hono|next)(?:/|$)",
  "^node_modules/(?:@hono/[^/]+|drizzle-orm|hono|next)(?:/|$)",
  "^node_modules/\\.bun/[^/]+/node_modules/(?:@hono/[^/]+|drizzle-orm|hono|next)(?:/|$)",
  "^(?:node:)?sqlite$",
]
const approvedFrontendWorkspacePath = [
  "^packages/infra/(?:auth|http-client)/",
  "^packages/shared/(?:contracts|ui)/",
  "^packages/config/",
]
const modulePublicTargetPattern = readModulePublicTargetPattern()
const modulePublicTargetPath = `^(?:${modulePublicTargetPattern})$`

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
      name: "no-unlisted-dependencies",
      severity: "error",
      from: { path: "^(apps|packages)/" },
      to: {
        dependencyTypes: ["npm-no-pkg", "npm-unknown"],
      },
    },
    {
      name: "frontends-import-approved-workspace-packages-only",
      severity: "error",
      comment:
        "Frontend workspace imports are limited to http-client, auth, contracts, ui, and config. The same app and Next framework are explicit exceptions.",
      from: { path: frontendSourcePath },
      to: {
        path: ["^packages/", frontendAppTargetPath, ...nextFrameworkPaths],
        pathNot: [
          ...approvedFrontendWorkspacePath,
          "^apps/$1/",
          ...nextFrameworkPaths,
        ],
      },
    },
    {
      name: "module-domain-application-do-not-import-framework-or-db",
      severity: "error",
      from: {
        path: "^packages/modules/[^/]+/src/(?:domain|application)/",
      },
      to: {
        path: [
          "^packages/infra/(?:db|http-platform)/",
          "^packages/modules/[^/]+/src/infrastructure/",
          ...frameworkAndDatabasePaths,
        ],
      },
    },
    {
      name: "external-consumers-use-module-public-exports",
      severity: "error",
      from: {
        pathNot: "^packages/modules/",
      },
      to: {
        path: moduleTargetPath,
        pathNot: modulePublicTargetPath,
      },
    },
    {
      name: "modules-use-other-module-public-exports",
      severity: "error",
      from: {
        path: moduleSourcePath,
      },
      to: {
        path: moduleTargetPath,
        pathNot: `^(?:packages/modules/$1/|${modulePublicTargetPattern})`,
      },
    },
    {
      name: "migration-schema-is-app-database-only",
      severity: "error",
      comment:
        "Module table definitions exist for the single migration lineage. Only the API database entry, other modules declaring foreign keys, and isolated E2E content fixtures may consume them.",
      from: {
        pathNot: [
          "^apps/api/src/db/",
          "^apps/api/src/test-support/(?:assert-e2e|setup-e2e)",
          "^packages/modules/[^/]+/src/infrastructure/persistence/",
        ],
      },
      to: {
        path: "^packages/modules/[^/]+/src/infrastructure/persistence/schema\\.ts$",
      },
    },
    {
      name: "operations-reporting-does-not-import-module-implementations",
      severity: "error",
      from: {
        path: "^packages/modules/operations/src/infrastructure/persistence/operations-reporting-sqlite-repository\\.ts$",
      },
      to: {
        path: "^packages/modules/(ai-feedback|content|identity|learning)/src/",
      },
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

function readModulePublicTargetPattern() {
  const modulesDirectory = path.join(repositoryRoot, "packages/modules")
  const targets = readdirSync(modulesDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      const manifestPath = path.join(
        modulesDirectory,
        entry.name,
        "package.json"
      )
      if (!existsSync(manifestPath)) return []
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8"))
      return readExportTargets(manifest.exports)
        .filter((target) => target.startsWith("./src/"))
        .map((target) =>
          escapeRegExp(
            path.posix.join("packages/modules", entry.name, target.slice(2))
          )
        )
    })
    .sort(compareCodeUnits)

  if (targets.length === 0) {
    throw new Error("Module public export target을 찾을 수 없습니다.")
  }

  return targets.join("|")
}

function readExportTargets(value) {
  if (typeof value === "string") return [value]
  if (Array.isArray(value)) return value.flatMap(readExportTargets)
  if (value !== null && typeof value === "object") {
    return Object.values(value).flatMap(readExportTargets)
  }
  return []
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")
}

function compareCodeUnits(left, right) {
  return left < right ? -1 : left > right ? 1 : 0
}
