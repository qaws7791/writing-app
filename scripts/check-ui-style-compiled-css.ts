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
  { label: "chart semantic token", marker: "--chart-1:" },
  {
    label: "button press state",
    marker:
      ":active:not(:disabled):not([aria-haspopup=true]):not([aria-expanded=true]){transform:scale(var(--motion-press-scale))}",
  },
  { label: "danger background utility", marker: ".bg-danger" },
  { label: "danger foreground border utility", marker: "border-danger-fg" },
]

export const adminUiStyleSentinels: readonly UiStyleSentinel[] = [
  { label: "admin foreground background utility", marker: ".bg-fg-default{" },
]

const buildTargets = [
  {
    name: "web",
    outputDirectory: "apps/web/.next/static/chunks",
    sentinels: uiStyleSentinels,
  },
  {
    name: "admin",
    outputDirectory: "apps/admin/.next/static/chunks",
    sentinels: [...uiStyleSentinels, ...adminUiStyleSentinels],
  },
  {
    name: "storybook",
    outputDirectory: "apps/storybook/dist/assets",
    sentinels: uiStyleSentinels,
  },
] as const

export function findMissingUiStyleSentinels(
  compiledCss: string,
  sentinels: readonly UiStyleSentinel[] = uiStyleSentinels
): readonly UiStyleSentinel[] {
  return sentinels.filter((sentinel) => !compiledCss.includes(sentinel.marker))
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
    const missing = findMissingUiStyleSentinels(compiledCss, target.sentinels)

    if (missing.length > 0) {
      failures.push(
        `${target.name}: ${missing.map((sentinel) => sentinel.label).join(", ")} 누락`
      )
      continue
    }

    console.log(
      `${target.name}: compiled CSS ${cssFiles.length}개에서 UI style sentinel ${target.sentinels.length}개 확인`
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
