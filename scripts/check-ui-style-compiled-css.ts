import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

export type UiStyleSentinel = {
  readonly label: string
  readonly marker: string
}

export const uiStyleSentinels: readonly UiStyleSentinel[] = [
  { label: "typography plugin", marker: ".prose" },
  { label: "animation plugin", marker: "--tw-enter-opacity" },
  { label: "semantic token", marker: "--action-primary-bg:" },
  { label: "custom utility", marker: ".btn-squish" },
]

const buildTargets = [
  { name: "web", outputDirectory: "apps/web/.next/static/chunks" },
  { name: "admin", outputDirectory: "apps/admin/.next/static/chunks" },
  { name: "storybook", outputDirectory: "apps/storybook/dist/assets" },
] as const

export function findMissingUiStyleSentinels(
  compiledCss: string
): readonly UiStyleSentinel[] {
  return uiStyleSentinels.filter(
    (sentinel) => !compiledCss.includes(sentinel.marker)
  )
}

if (import.meta.main) {
  const repositoryRoot = join(import.meta.dirname, "..")
  const failures: string[] = []

  for (const target of buildTargets) {
    const outputDirectory = join(repositoryRoot, target.outputDirectory)
    const cssFiles = collectCssFiles(outputDirectory)

    if (cssFiles.length === 0) {
      failures.push(
        `${target.name}: compiled CSS가 없습니다. 먼저 production build를 실행하세요.`
      )
      continue
    }

    const compiledCss = cssFiles
      .map((filePath) => readFileSync(filePath, "utf8"))
      .join("\n")
    const missing = findMissingUiStyleSentinels(compiledCss)

    if (missing.length > 0) {
      failures.push(
        `${target.name}: ${missing.map((sentinel) => sentinel.label).join(", ")} 누락`
      )
      continue
    }

    console.log(
      `${target.name}: compiled CSS ${cssFiles.length}개에서 UI style sentinel ${uiStyleSentinels.length}개 확인`
    )
  }

  if (failures.length > 0) {
    throw new Error(
      `UI style compiled CSS check failed.\n- ${failures.join("\n- ")}`
    )
  }
}

function collectCssFiles(directory: string): readonly string[] {
  if (!existsSync(directory)) return []

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name)
    if (entry.isDirectory()) return collectCssFiles(entryPath)
    return entry.isFile() && entry.name.endsWith(".css") ? [entryPath] : []
  })
}
