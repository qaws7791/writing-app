import fs from "node:fs"
import path from "node:path"

export type Guardrail = {
  readonly allowedPaths?: readonly string[]
  readonly description: string
  readonly label: string
  readonly pattern: RegExp
  readonly roots: readonly string[]
}

const legacyAdminDesignClassPattern = String.raw`(?:admin-(?:shell(?:__content)?|sidebar(?:__(?:brand|mark|nav|link))?|header|panel|grid|alert|metric-grid|metric-card(?:__label)?|section-heading|toolbar|inline-status|table(?:__title|-wrap)?|course-title-cell|course-thumbnail|status-pill|dialog(?:-backdrop|__actions)?|row-actions|resource-(?:create-panel|form|list(?:-item(?:__icon)?)?)|chat-(?:layout|sidebar-panel|conversation-list|conversation|panel|messages|empty|message|form)|auth-(?:page|card(?:__mark)?|form)|inline-error|form-field)|settings-grid|analytics-grid|course-editor(?:-list|-form-grid|__(?:read-only|summary|workspace))|step-form-(?:list|card|help)|lesson-preview-card)`

const legacyAdminDesignClassRegex = new RegExp(
  [
    String.raw`\.(?:${legacyAdminDesignClassPattern})\b`,
    String.raw`className="[^"]*\b(?:${legacyAdminDesignClassPattern})\b[^"]*"`,
    String.raw`className='[^']*\b(?:${legacyAdminDesignClassPattern})\b[^']*'`,
    `className=\\{\`[^\`]*\\b(?:${legacyAdminDesignClassPattern})\\b[^\`]*\`\\}`,
    String.raw`className=\{[^}\n]*\b(?:${legacyAdminDesignClassPattern})\b[^}\n]*\}`,
  ].join("|"),
  "g"
)

const ignoredDirectories = new Set([
  ".next",
  ".turbo",
  "coverage",
  "dist",
  "node_modules",
])

const ignoredHexPaths = [
  // 이 파일들은 외부 manifest 또는 독립 시각 샘플을 소유해 CSS token을 참조할 수 없다.
  "apps/web/src/app/manifest.ts",
  "apps/web/src/features/landing/ui/landing-content.tsx",
  "apps/storybook/.storybook/storybook-theme.ts",
] as const
const scannedExtensions = new Set([".css", ".ts", ".tsx"])

const guardrails: readonly Guardrail[] = [
  {
    description: "apps/admin/src의 legacy admin 디자인 class 금지",
    label: "legacy admin design class",
    pattern: legacyAdminDesignClassRegex,
    roots: ["apps/admin/src"],
  },
  {
    description: "apps/**, packages/**의 legacy button motion class 금지",
    label: "legacy button motion class",
    pattern: /\bbtn-squish\b/g,
    roots: ["apps", "packages"],
  },
  {
    description: "apps/**, packages/**의 미정의 semantic color alias 금지",
    label: "legacy semantic color alias",
    pattern: /--semantic-color-[a-z0-9-]+/g,
    roots: ["apps", "packages"],
  },
  {
    description:
      "apps/**의 fontSize, lineHeight, letterSpacing inline style 금지",
    label: "inline typography style",
    pattern:
      /style=\{\{[\s\S]*?(?:fontSize|lineHeight|letterSpacing)[\s\S]*?\}\}/g,
    roots: ["apps"],
  },
  {
    allowedPaths: ignoredHexPaths,
    description: "명시적 시각 상수 소유 파일 밖의 raw hex color",
    label: "raw hex color",
    pattern: /#[0-9a-fA-F]{3,8}\b/g,
    roots: ["apps"],
  },
] as const

const repositoryRoot = process.cwd()

function collectFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) {
    return []
  }

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      return ignoredDirectories.has(entry.name) ? [] : collectFiles(entryPath)
    }

    return scannedExtensions.has(path.extname(entry.name)) ? [entryPath] : []
  })
}

export function countGuardrailMatches(
  guardrail: Guardrail,
  root: string = repositoryRoot
): number {
  const files = guardrail.roots.flatMap((scanRoot) =>
    collectFiles(path.join(root, scanRoot))
  )
  const allowedPaths = new Set(guardrail.allowedPaths ?? [])

  const scopedFiles = files.filter(
    (filePath) =>
      !allowedPaths.has(path.relative(root, filePath).replaceAll(path.sep, "/"))
  )

  return scopedFiles.reduce((count, filePath) => {
    const content = fs.readFileSync(filePath, "utf8")

    return count + [...content.matchAll(guardrail.pattern)].length
  }, 0)
}

export function evaluateGuardrails(
  configuredGuardrails: readonly Guardrail[],
  root: string = repositoryRoot
): {
  readonly failures: readonly string[]
  readonly summaries: readonly string[]
} {
  const failures: string[] = []
  const summaries: string[] = []

  for (const guardrail of configuredGuardrails) {
    const count = countGuardrailMatches(guardrail, root)

    if (count > 0) {
      failures.push(
        `${guardrail.label} ${count}건을 발견했다. ${guardrail.description}을 위반했다.`
      )
      continue
    }

    summaries.push(`${guardrail.label}: 위반 없음 (${guardrail.description})`)
  }

  return { failures, summaries }
}

if (import.meta.main) {
  const result = evaluateGuardrails(guardrails)

  for (const summary of result.summaries) {
    console.log(summary)
  }

  if (result.failures.length > 0) {
    console.error("Design system guardrail check failed.")

    for (const failure of result.failures) {
      console.error(`- ${failure}`)
    }

    process.exit(1)
  }

  console.log("Design system guardrails passed.")
}
