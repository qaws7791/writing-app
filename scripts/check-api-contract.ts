import { spawnSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

type CommandInput = {
  readonly args: readonly string[]
  readonly command: string
  readonly cwd?: string
  readonly env?: NodeJS.ProcessEnv
}

const repositoryRoot = process.cwd()
const trackedOpenApiPath = path.join(
  repositoryRoot,
  "docs/engineering/contracts/writing-app-api-openapi.json"
)
const trackedGeneratedTypesPath = path.join(
  repositoryRoot,
  "apps/web/src/lib/api/generated/writing-app-api.d.ts"
)
const tempDirectory = fs.mkdtempSync(
  path.join(os.tmpdir(), "writing-app-api-contract-")
)
const generatedOpenApiPath = path.join(
  tempDirectory,
  "writing-app-api-openapi.json"
)
const generatedTypesPath = path.join(tempDirectory, "writing-app-api.d.ts")
const failures: string[] = []

try {
  runCommand({
    args: ["--filter=@workspace/api", "openapi:generate"],
    command: "bun",
    env: {
      WRITING_APP_OPENAPI_OUTPUT_PATH: generatedOpenApiPath,
    },
  })

  runCommand({
    args: [
      "openapi-typescript",
      generatedOpenApiPath,
      "-o",
      generatedTypesPath,
    ],
    command: "bun",
    cwd: path.join(repositoryRoot, "apps/web"),
  })
  runCommand({
    args: ["oxfmt", generatedTypesPath],
    command: "bun",
  })

  compareGeneratedFile({
    actualPath: generatedOpenApiPath,
    expectedPath: trackedOpenApiPath,
    label: "docs/engineering/contracts/writing-app-api-openapi.json",
  })
  compareGeneratedFile({
    actualPath: generatedTypesPath,
    expectedPath: trackedGeneratedTypesPath,
    label: "apps/web/src/lib/api/generated/writing-app-api.d.ts",
  })
} finally {
  fs.rmSync(tempDirectory, { force: true, recursive: true })
}

if (failures.length > 0) {
  console.error(
    [
      "API 계약 산출물이 최신 상태가 아닙니다.",
      ...failures,
      "다음 명령으로 갱신한 뒤 다시 확인하세요:",
      "bun --filter=@workspace/api openapi:generate",
      "bun --filter=@workspace/web api:generate",
    ].join("\n")
  )
  process.exit(1)
}

function runCommand({ args, command, cwd, env }: CommandInput) {
  const result = spawnSync(command, args, {
    cwd: cwd ?? repositoryRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      ...env,
    },
    stdio: "pipe",
  })

  if (result.status === 0) {
    return
  }

  failures.push(
    [
      `${command} ${args.join(" ")} 실행에 실패했습니다.`,
      result.stdout.trim(),
      result.stderr.trim(),
    ]
      .filter(Boolean)
      .join("\n")
  )
}

function compareGeneratedFile({
  actualPath,
  expectedPath,
  label,
}: {
  readonly actualPath: string
  readonly expectedPath: string
  readonly label: string
}) {
  if (!fs.existsSync(actualPath)) {
    failures.push(`${label} 검증 산출물이 생성되지 않았습니다.`)
    return
  }

  const actual = fs.readFileSync(actualPath, "utf8")
  const expected = fs.readFileSync(expectedPath, "utf8")

  if (actual !== expected) {
    failures.push(`${label} 파일이 생성 결과와 다릅니다.`)
  }
}
