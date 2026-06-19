import fs from "node:fs"
import path from "node:path"

type JsonRecord = Record<string, unknown>

type ExpectedComponentsConfig = {
  readonly aliases: Readonly<Record<string, string>>
  readonly filePath: string
  readonly tailwindCss: string
}

const expectedConfigs: readonly ExpectedComponentsConfig[] = [
  {
    aliases: {
      components: "@/components",
      hooks: "@/hooks",
      lib: "@/lib",
      ui: "@/components/ui",
      utils: "@/lib/utils",
    },
    filePath: "packages/ui/components.json",
    tailwindCss: "src/styles/globals.css",
  },
  {
    aliases: {
      components: "@/components",
      hooks: "@/hooks",
      lib: "@/lib",
      ui: "@workspace/ui/components/ui",
      utils: "@workspace/ui/lib/utils",
    },
    filePath: "apps/web/components.json",
    tailwindCss: "../../packages/ui/src/styles/globals.css",
  },
  {
    aliases: {
      components: "@/components",
      hooks: "@/hooks",
      lib: "@/lib",
      ui: "@workspace/ui/components/ui",
      utils: "@workspace/ui/lib/utils",
    },
    filePath: "apps/admin/components.json",
    tailwindCss: "src/app/globals.css",
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

function readRecord(
  filePath: string,
  parent: JsonRecord,
  propertyName: string
): JsonRecord | null {
  const value = parent[propertyName]

  if (isRecord(value)) {
    return value
  }

  failures.push(`${filePath} must declare an object ${propertyName}.`)
  return null
}

function readString(
  filePath: string,
  parent: JsonRecord,
  propertyName: string
): string | null {
  const value = parent[propertyName]

  if (typeof value === "string") {
    return value
  }

  failures.push(`${filePath} must declare a string ${propertyName}.`)
  return null
}

function readBoolean(
  filePath: string,
  parent: JsonRecord,
  propertyName: string
): boolean | null {
  const value = parent[propertyName]

  if (typeof value === "boolean") {
    return value
  }

  failures.push(`${filePath} must declare a boolean ${propertyName}.`)
  return null
}

function validateComponentsConfig({
  aliases: expectedAliases,
  filePath,
  tailwindCss,
}: ExpectedComponentsConfig) {
  const absoluteFilePath = path.join(repositoryRoot, filePath)
  const config = readJsonFile(absoluteFilePath)

  expectString({
    actual: readString(filePath, config, "$schema"),
    expected: "https://ui.shadcn.com/schema.json",
    filePath,
    label: "$schema",
  })
  expectString({
    actual: readString(filePath, config, "style"),
    expected: "base-luma",
    filePath,
    label: "style",
  })
  expectBoolean({
    actual: readBoolean(filePath, config, "rsc"),
    expected: true,
    filePath,
    label: "rsc",
  })
  expectBoolean({
    actual: readBoolean(filePath, config, "tsx"),
    expected: true,
    filePath,
    label: "tsx",
  })
  expectString({
    actual: readString(filePath, config, "iconLibrary"),
    expected: "lucide",
    filePath,
    label: "iconLibrary",
  })
  expectBoolean({
    actual: readBoolean(filePath, config, "rtl"),
    expected: false,
    filePath,
    label: "rtl",
  })

  validateTailwindConfig({
    expectedCss: tailwindCss,
    filePath,
    tailwind: readRecord(filePath, config, "tailwind"),
  })
  validateAliases({
    aliases: readRecord(filePath, config, "aliases"),
    expectedAliases,
    filePath,
  })
}

function validateTailwindConfig({
  expectedCss,
  filePath,
  tailwind,
}: {
  readonly expectedCss: string
  readonly filePath: string
  readonly tailwind: JsonRecord | null
}) {
  if (tailwind === null) {
    return
  }

  expectString({
    actual: readString(filePath, tailwind, "config"),
    expected: "",
    filePath,
    label: "tailwind.config",
  })
  expectString({
    actual: readString(filePath, tailwind, "css"),
    expected: expectedCss,
    filePath,
    label: "tailwind.css",
  })
  expectString({
    actual: readString(filePath, tailwind, "baseColor"),
    expected: "stone",
    filePath,
    label: "tailwind.baseColor",
  })
  expectBoolean({
    actual: readBoolean(filePath, tailwind, "cssVariables"),
    expected: true,
    filePath,
    label: "tailwind.cssVariables",
  })
  expectString({
    actual: readString(filePath, tailwind, "prefix"),
    expected: "",
    filePath,
    label: "tailwind.prefix",
  })

  const cssPath = path.resolve(
    repositoryRoot,
    path.dirname(filePath),
    expectedCss
  )

  if (!fs.existsSync(cssPath)) {
    failures.push(
      `${filePath} tailwind.css target does not exist: ${expectedCss}.`
    )
  }
}

function validateAliases({
  aliases,
  expectedAliases,
  filePath,
}: {
  readonly aliases: JsonRecord | null
  readonly expectedAliases: Readonly<Record<string, string>>
  readonly filePath: string
}) {
  if (aliases === null) {
    return
  }

  for (const [aliasName, expectedValue] of Object.entries(expectedAliases)) {
    expectString({
      actual: readString(filePath, aliases, aliasName),
      expected: expectedValue,
      filePath,
      label: `aliases.${aliasName}`,
    })
  }
}

function expectString({
  actual,
  expected,
  filePath,
  label,
}: {
  readonly actual: string | null
  readonly expected: string
  readonly filePath: string
  readonly label: string
}) {
  if (actual !== null && actual !== expected) {
    failures.push(`${filePath} ${label} must be ${expected}, got ${actual}.`)
  }
}

function expectBoolean({
  actual,
  expected,
  filePath,
  label,
}: {
  readonly actual: boolean | null
  readonly expected: boolean
  readonly filePath: string
  readonly label: string
}) {
  if (actual !== null && actual !== expected) {
    failures.push(`${filePath} ${label} must be ${expected}, got ${actual}.`)
  }
}

for (const config of expectedConfigs) {
  validateComponentsConfig(config)
}

if (failures.length > 0) {
  console.error("Components config check failed.")

  for (const failure of failures) {
    console.error(`- ${failure}`)
  }

  process.exit(1)
}

console.log("Components config files are in sync.")
