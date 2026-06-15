import fs from "node:fs"
import path from "node:path"

const roots = ["apps", "packages"] as const
const ignoredDirectories = new Set([
  ".next",
  ".turbo",
  "coverage",
  "dist",
  "node_modules",
])
const ignoredFileNames = new Set([".env.example"])
const scannedExtensions = new Set([
  ".cjs",
  ".cts",
  ".js",
  ".json",
  ".jsx",
  ".mjs",
  ".mts",
  ".ts",
  ".tsx",
])
const rawLocalhostUrlPattern =
  /http:\/\/localhost:(3000|3001|3002|3003|4000|4001)/g

type Match = {
  readonly filePath: string
  readonly line: number
  readonly text: string
}

function collectFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) {
    return []
  }

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      return ignoredDirectories.has(entry.name) ? [] : collectFiles(entryPath)
    }

    if (ignoredFileNames.has(entry.name)) {
      return []
    }

    return scannedExtensions.has(path.extname(entry.name)) ? [entryPath] : []
  })
}

function findRawLocalhostUrls(filePath: string): Match[] {
  const content = fs.readFileSync(filePath, "utf8")

  return content.split(/\r?\n/).flatMap((lineText, index) => {
    const matches = [...lineText.matchAll(rawLocalhostUrlPattern)]

    return matches.map((match) => ({
      filePath,
      line: index + 1,
      text: match[0] ?? "",
    }))
  })
}

const matches = roots.flatMap((root) =>
  collectFiles(path.join(process.cwd(), root)).flatMap(findRawLocalhostUrls)
)

if (matches.length > 0) {
  console.error("Raw localhost URLs are not allowed in apps/** or packages/**.")
  for (const match of matches) {
    console.error(
      `${path.relative(process.cwd(), match.filePath)}:${match.line} ${match.text}`
    )
  }
  process.exit(1)
}

console.log("No raw localhost URLs found in apps/** or packages/**.")
