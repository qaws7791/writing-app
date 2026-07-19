import { existsSync, readFileSync } from "node:fs"
import path from "node:path"

export type RuntimeSourceFile = {
  readonly content: string
  readonly path: string
}

const forbiddenPaths = [
  "apps/admin-api",
  "deploy/caddy/admin-traffic-rollback.caddyfile",
  "deploy/docker/admin-api.dockerfile",
  "infra/ansible/playbooks/admin-traffic-rollback.yaml",
  "infra/ansible/roles/writing_app_deploy/templates/admin-api.env.j2",
  "infra/ansible/roles/writing_app_deploy/templates/admin.rollback.env.j2",
] as const

const forbiddenRuntimeTokens = [
  "@workspace/admin-api",
  "apps/admin-api",
  "ADMIN_API_IMAGE",
  "ADMIN_API_PORT",
  "admin-api:4101",
  "admin-api.dockerfile",
  "admin-api.env",
  "admin-traffic-rollback",
  "admin.rollback.env",
  "writing_app_admin_api_image",
] as const

const scannedDirectories = [
  ".github",
  "apps",
  "deploy",
  "docs/design",
  "docs/engineering",
  "docs/product",
  "infra",
  "packages",
  "scripts",
] as const

const scannedRootFiles = [
  "ARCHITECTURE.md",
  "BACKEND.md",
  "CONTEXT.md",
  "DOMAIN.md",
  "FRONTEND.md",
  "GLOSSARY.md",
  "README.md",
  "bun.lock",
  "lefthook.yml",
  "package.json",
  "vitest.workspace.ts",
] as const

export function findAdminApiRuntimeResiduals(
  files: readonly RuntimeSourceFile[]
): readonly string[] {
  return files.flatMap((file) =>
    forbiddenRuntimeTokens
      .filter((token) => file.content.includes(token))
      .map((token) => `${file.path}: ${token}`)
  )
}

export function isCurrentArchitectureFile(relativePath: string): boolean {
  const normalizedPath = relativePath.replaceAll("\\", "/")

  if (
    normalizedPath === "scripts/check-admin-api-runtime-removal.ts" ||
    normalizedPath === "scripts/check-admin-api-runtime-removal.test.ts"
  ) {
    return false
  }

  return ![
    "/.next/",
    "/.turbo/",
    "/coverage/",
    "/node_modules/",
    "docs/engineering/adr/",
    "docs/engineering/monorepo-target-architecture-plan/",
  ].some((segment) => `/${normalizedPath}`.includes(segment))
}

export function readCurrentArchitectureFiles(
  repositoryRoot: string
): readonly RuntimeSourceFile[] {
  const filePaths = [
    ...scannedRootFiles.filter((relativePath) =>
      existsSync(path.join(repositoryRoot, relativePath))
    ),
    ...scannedDirectories.flatMap((directory) => {
      const absoluteDirectory = path.join(repositoryRoot, directory)
      if (!existsSync(absoluteDirectory)) return []

      return Array.from(
        new Bun.Glob("**/*").scanSync({
          cwd: absoluteDirectory,
          dot: true,
          onlyFiles: true,
        }),
        (relativePath) =>
          path.posix.join(directory, relativePath.replaceAll("\\", "/"))
      )
    }),
  ]

  return filePaths
    .filter(isCurrentArchitectureFile)
    .filter(isTextSourceFile)
    .sort()
    .map((relativePath) => ({
      content: readFileSync(path.join(repositoryRoot, relativePath), "utf8"),
      path: relativePath,
    }))
}

export function findForbiddenAdminApiRuntimePaths(
  repositoryRoot: string
): readonly string[] {
  return forbiddenPaths.filter((relativePath) =>
    existsSync(path.join(repositoryRoot, relativePath))
  )
}

function isTextSourceFile(relativePath: string): boolean {
  return (
    scannedRootFiles.includes(
      relativePath as (typeof scannedRootFiles)[number]
    ) ||
    /(?:^|\/)(?:dockerfile|[^/]+\.(?:example|json|md|mjs|ts|tsx|yaml|yml))$/u.test(
      relativePath
    )
  )
}

if (import.meta.main) {
  const repositoryRoot = path.resolve(import.meta.dir, "..")
  const violations = [
    ...findForbiddenAdminApiRuntimePaths(repositoryRoot).map(
      (relativePath) => `${relativePath}: forbidden path`
    ),
    ...findAdminApiRuntimeResiduals(
      readCurrentArchitectureFiles(repositoryRoot)
    ),
  ]

  if (violations.length > 0) {
    throw new Error(
      `legacy admin-api runtime 제거 검사가 실패했습니다.\n${violations.join("\n")}`
    )
  }

  console.log("legacy admin-api runtime 제거 검사가 통과했습니다.")
}
