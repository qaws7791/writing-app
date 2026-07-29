import fs from "node:fs"
import path from "node:path"

interface WorkflowScriptReference {
  readonly line: number
  readonly name: string
  readonly workflow: string
}

const bunRunPattern = /\bbun run\s+(?<name>[^\s"';|&]+)/gu

function collectReferences(
  workflow: string,
  source: string
): readonly WorkflowScriptReference[] {
  return source.split("\n").flatMap((text, index) =>
    [...text.matchAll(bunRunPattern)].flatMap((match) => {
      const name = match.groups?.name
      if (name === undefined || name.startsWith("-")) return []
      return [{ line: index + 1, name, workflow }]
    })
  )
}

function readRootScriptNames(repositoryRoot: string): ReadonlySet<string> {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(repositoryRoot, "package.json"), "utf8")
  ) as { readonly scripts?: Readonly<Record<string, string>> }
  return new Set(Object.keys(manifest.scripts ?? {}))
}

function runWorkflowScriptCheck(): void {
  const repositoryRoot = path.resolve(import.meta.dir, "..")
  const workflowDirectory = path.join(repositoryRoot, ".github", "workflows")
  const scriptNames = readRootScriptNames(repositoryRoot)

  const references = fs
    .readdirSync(workflowDirectory)
    .filter((entry) => entry.endsWith(".yml") || entry.endsWith(".yaml"))
    .flatMap((entry) =>
      collectReferences(
        path.posix.join(".github/workflows", entry),
        fs.readFileSync(path.join(workflowDirectory, entry), "utf8")
      )
    )

  const missing = references.filter(
    (reference) => !scriptNames.has(reference.name)
  )
  if (missing.length > 0) {
    for (const reference of missing) {
      console.error(
        `- ${reference.workflow}:${reference.line}: 루트 package.json에 "${reference.name}" script가 없습니다.`
      )
    }
    process.exit(1)
  }

  console.log(
    `workflow의 bun run 참조 ${references.length}개가 모두 루트 package.json script에 존재합니다.`
  )
}

if (import.meta.main) runWorkflowScriptCheck()
