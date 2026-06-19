import fs from "node:fs"
import path from "node:path"

type JsonRecord = Record<string, unknown>

type WorkspacePackage = {
  readonly directory: string
  readonly exports: readonly string[]
  readonly name: string
  readonly scripts: ReadonlySet<string>
}

type Route = {
  readonly method: string
  readonly path: string
}

const markdownRoots = [
  "README.md",
  "CONTEXT.md",
  "ARCHITECTURE.md",
  "BACKEND.md",
  "FRONTEND.md",
  "DOMAIN.md",
  "GLOSSARY.md",
  "docs/design",
  "docs/engineering",
] as const

const adminRouteSources = [
  {
    filePath: "apps/admin-api/src/routes/health.route.ts",
  },
  {
    filePath: "apps/admin-api/src/routes/dashboard.route.ts",
  },
  {
    filePath: "apps/admin-api/src/routes/analytics.route.ts",
  },
  {
    filePath: "apps/admin-api/src/routes/courses.route.ts",
  },
  {
    filePath: "apps/admin-api/src/routes/curriculum-editor.route.ts",
  },
  {
    filePath: "apps/admin-api/src/routes/users.route.ts",
  },
  {
    filePath: "apps/admin-api/src/routes/settings.route.ts",
  },
] as const

const repositoryRoot = process.cwd()
const failures: string[] = []

function readJsonFile(filePath: string): JsonRecord {
  const value: unknown = JSON.parse(fs.readFileSync(filePath, "utf8"))

  if (!isRecord(value)) {
    throw new Error(`${filePath} must contain a JSON object.`)
  }

  return value
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : []
}

function readScripts(value: unknown): ReadonlySet<string> {
  if (!isRecord(value)) {
    return new Set()
  }

  return new Set(Object.keys(value))
}

function normalizePath(filePath: string): string {
  return filePath.replaceAll(path.sep, "/")
}

function collectMarkdownFiles(): string[] {
  return markdownRoots.flatMap((rootPath) => {
    const absolutePath = path.join(repositoryRoot, rootPath)

    if (!fs.existsSync(absolutePath)) {
      return []
    }

    const stat = fs.statSync(absolutePath)

    if (stat.isFile()) {
      return rootPath.endsWith(".md") ? [rootPath] : []
    }

    return collectFiles(absolutePath)
      .filter((filePath) => filePath.endsWith(".md"))
      .map((filePath) => normalizePath(path.relative(repositoryRoot, filePath)))
  })
}

function collectFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name)

    return entry.isDirectory() ? collectFiles(entryPath) : [entryPath]
  })
}

function discoverWorkspacePackages(): Map<string, WorkspacePackage> {
  const rootPackageJson = readJsonFile(
    path.join(repositoryRoot, "package.json")
  )
  const workspaceGlobs = readStringArray(rootPackageJson["workspaces"])
  const packages = new Map<string, WorkspacePackage>()

  for (const workspaceGlob of workspaceGlobs) {
    if (!workspaceGlob.endsWith("/*")) {
      failures.push(`Unsupported workspace glob: ${workspaceGlob}`)
      continue
    }

    const rootDirectory = workspaceGlob.slice(0, -2)
    const absoluteRootDirectory = path.join(repositoryRoot, rootDirectory)

    if (!fs.existsSync(absoluteRootDirectory)) {
      failures.push(`Workspace root does not exist: ${rootDirectory}`)
      continue
    }

    for (const entry of fs.readdirSync(absoluteRootDirectory, {
      withFileTypes: true,
    })) {
      const directory = normalizePath(path.join(rootDirectory, entry.name))
      const manifestPath = path.join(repositoryRoot, directory, "package.json")

      if (!entry.isDirectory() || !fs.existsSync(manifestPath)) {
        continue
      }

      const manifest = readJsonFile(manifestPath)
      const name = manifest["name"]

      if (typeof name !== "string" || name.length === 0) {
        failures.push(`${directory}/package.json must declare a package name.`)
        continue
      }

      packages.set(name, {
        directory,
        exports: readExportKeys(manifest["exports"]),
        name,
        scripts: readScripts(manifest["scripts"]),
      })
    }
  }

  return packages
}

function readExportKeys(value: unknown): string[] {
  if (!isRecord(value)) {
    return []
  }

  return Object.keys(value)
}

function validateDocumentedCommands(
  markdownFiles: readonly string[],
  packages: ReadonlyMap<string, WorkspacePackage>
) {
  const rootPackageJson = readJsonFile(
    path.join(repositoryRoot, "package.json")
  )
  const rootScripts = readScripts(rootPackageJson["scripts"])
  const packageNames = new Set(packages.keys())

  for (const filePath of markdownFiles) {
    const content = fs.readFileSync(path.join(repositoryRoot, filePath), "utf8")

    for (const command of content.matchAll(/\bbun run ([\w:.-]+)/g)) {
      const scriptName = command[1] ?? ""

      if (scriptName.startsWith("--")) {
        continue
      }

      if (!rootScripts.has(scriptName)) {
        failures.push(
          `${filePath} references missing root script ${scriptName}.`
        )
      }
    }

    for (const command of content.matchAll(
      /\bbun (?:run )?--filter(?:=|\s+)([^\s`]+) ([\w:.-]+)/g
    )) {
      const packageName = command[1] ?? ""
      const scriptName = command[2] ?? ""
      const workspacePackage = packages.get(packageName)

      if (!packageNames.has(packageName) || workspacePackage === undefined) {
        failures.push(`${filePath} references missing package ${packageName}.`)
        continue
      }

      if (!workspacePackage.scripts.has(scriptName)) {
        failures.push(
          `${filePath} references missing ${packageName} script ${scriptName}.`
        )
      }
    }
  }
}

function validateDocumentedWorkspaceImports(
  markdownFiles: readonly string[],
  packages: ReadonlyMap<string, WorkspacePackage>
) {
  for (const filePath of markdownFiles) {
    const content = fs.readFileSync(path.join(repositoryRoot, filePath), "utf8")

    for (const match of content.matchAll(
      /@workspace\/[a-z0-9-]+(?:\/[A-Za-z0-9._{}/*-]+)?/g
    )) {
      const specifier = match[0] ?? ""

      if (specifier.includes("{") || specifier.includes("*")) {
        continue
      }

      validateWorkspaceImport(filePath, specifier, packages)
    }
  }
}

function validateWorkspaceImport(
  filePath: string,
  specifier: string,
  packages: ReadonlyMap<string, WorkspacePackage>
) {
  const [, packageSegment = "", subpath = ""] =
    specifier.match(/^(@workspace\/[a-z0-9-]+)(?:\/(.+))?$/) ?? []
  const workspacePackage = packages.get(packageSegment)

  if (workspacePackage === undefined) {
    failures.push(`${filePath} references missing package ${packageSegment}.`)
    return
  }

  if (subpath.length === 0) {
    return
  }

  const exportKey = `./${subpath}`

  if (!hasExport(workspacePackage.exports, exportKey)) {
    failures.push(`${filePath} references missing export ${specifier}.`)
  }
}

function hasExport(exports: readonly string[], exportKey: string): boolean {
  return exports.some((candidate) => {
    if (candidate === exportKey) {
      return true
    }

    if (!candidate.endsWith("*")) {
      return false
    }

    return exportKey.startsWith(candidate.slice(0, -1))
  })
}

function validateBackendRouteDocumentation() {
  const backendDocument = fs.readFileSync(
    path.join(repositoryRoot, "BACKEND.md"),
    "utf8"
  )
  const documentedApiRoutes = extractDocumentedRoutes(
    backendDocument,
    "## `apps/api`",
    "## `apps/admin-api`"
  )
  const documentedAdminRoutes = extractDocumentedRoutes(
    backendDocument,
    "## `apps/admin-api`",
    "## `packages/core`"
  )

  reportRouteDrift({
    actualRoutes: readApiRoutes(),
    documentedRoutes: documentedApiRoutes,
    label: "BACKEND.md apps/api routes",
  })
  reportRouteDrift({
    actualRoutes: readAdminRoutes(),
    documentedRoutes: documentedAdminRoutes,
    label: "BACKEND.md apps/admin-api routes",
  })
}

function extractDocumentedRoutes(
  document: string,
  startHeading: string,
  endHeading: string
): Route[] {
  const startIndex = document.indexOf(startHeading)
  const endIndex = document.indexOf(endHeading)

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    failures.push(`Could not find route section ${startHeading}.`)
    return []
  }

  const section = document.slice(startIndex, endIndex)
  const routePattern = /\b(GET|POST|PUT|PATCH|DELETE) ([^`,\n]+)/g

  return [...section.matchAll(routePattern)].map((match) => ({
    method: match[1] ?? "",
    path: normalizeRoutePath(match[2] ?? ""),
  }))
}

function normalizeRoutePath(routePath: string): string {
  const pathWithoutQuery = routePath.trim().split("?")[0] ?? ""

  return (
    pathWithoutQuery.replaceAll(/\{([^}]+)\}/g, ":$1").replace(/\/$/, "") || "/"
  )
}

function readApiRoutes(): Route[] {
  const routeFiles = collectFiles(path.join(repositoryRoot, "apps/api/src"))
    .filter((filePath) => filePath.endsWith(".routes.ts"))
    .map((filePath) => fs.readFileSync(filePath, "utf8"))
  const routePattern = /method:\s*"([a-z]+)"[\s\S]*?path:\s*"([^"]+)"/g
  const routes = routeFiles.flatMap((content) =>
    [...content.matchAll(routePattern)].map((match) => ({
      method: (match[1] ?? "").toUpperCase(),
      path: normalizeRoutePath(match[2] ?? ""),
    }))
  )

  return [
    ...routes,
    {
      method: "GET",
      path: "/openapi",
    },
    {
      method: "GET",
      path: "/api/auth/*",
    },
    {
      method: "POST",
      path: "/api/auth/*",
    },
  ]
}

function readAdminRoutes(): Route[] {
  const routes: Route[] = [
    {
      method: "GET",
      path: "/api/auth/*",
    },
    {
      method: "POST",
      path: "/api/auth/*",
    },
    {
      method: "GET",
      path: "/openapi",
    },
  ]
  const routePattern = /method:\s*"([a-z]+)"[\s\S]*?path:\s*"([^"]+)"/g

  for (const source of adminRouteSources) {
    const content = fs.readFileSync(
      path.join(repositoryRoot, source.filePath),
      "utf8"
    )

    for (const match of content.matchAll(routePattern)) {
      routes.push({
        method: (match[1] ?? "").toUpperCase(),
        path: normalizeRoutePath(match[2] ?? ""),
      })
    }
  }

  return routes
}

function reportRouteDrift({
  actualRoutes,
  documentedRoutes,
  label,
}: {
  readonly actualRoutes: readonly Route[]
  readonly documentedRoutes: readonly Route[]
  readonly label: string
}) {
  const actual = new Set(actualRoutes.map(formatRoute))
  const documented = new Set(documentedRoutes.map(formatRoute))

  for (const route of [...actual].sort()) {
    if (!documented.has(route)) {
      failures.push(`${label} is missing ${route}.`)
    }
  }

  for (const route of [...documented].sort()) {
    if (!actual.has(route)) {
      failures.push(`${label} documents stale route ${route}.`)
    }
  }
}

function formatRoute(route: Route): string {
  return `${route.method} ${route.path}`
}

const markdownFiles = collectMarkdownFiles()
const packages = discoverWorkspacePackages()

validateDocumentedCommands(markdownFiles, packages)
validateDocumentedWorkspaceImports(markdownFiles, packages)
validateBackendRouteDocumentation()

if (failures.length > 0) {
  console.error("Document drift check failed.")

  for (const failure of failures) {
    console.error(`- ${failure}`)
  }

  process.exit(1)
}

console.log("Document drift smoke checks passed.")
