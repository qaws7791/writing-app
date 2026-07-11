import { readdirSync, readFileSync, appendFileSync } from "node:fs"
import { join } from "node:path"

type WorkspaceManifest = {
  readonly name: string
  readonly scripts?: Readonly<Record<string, string>>
}

const requestedScripts = process.argv.slice(2)
const rows = ["| workspace | CI 범위 |", "| --- | --- |"]

for (const workspace of readWorkspaces()) {
  const supported = requestedScripts.filter(
    (script) =>
      script === "audit" || workspace.manifest.scripts?.[script] !== undefined
  )
  rows.push(
    `| \`${workspace.manifest.name}\` | ${
      supported.length > 0
        ? `실행: ${supported.map((script) => `\`${script}\``).join(", ")}`
        : `제외: ${requestedScripts.map((script) => `\`${script}\``).join(", ")} 스크립트 없음`
    } |`
  )
}

const summary = [`## 15개 workspace 검증 인벤토리`, "", ...rows, ""].join("\n")
console.log(summary)

const summaryPath = process.env["GITHUB_STEP_SUMMARY"]

if (summaryPath !== undefined) {
  appendFileSync(summaryPath, summary)
}

function readWorkspaces(): readonly {
  readonly manifest: WorkspaceManifest
  readonly path: string
}[] {
  return ["apps", "packages"].flatMap((root) =>
    readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .flatMap((entry) => {
        const path = join(root, entry.name)

        try {
          return [
            {
              manifest: JSON.parse(
                readFileSync(join(path, "package.json"), "utf8")
              ) as WorkspaceManifest,
              path,
            },
          ]
        } catch {
          return []
        }
      })
  )
}
