import { readFileSync } from "node:fs"
import path from "node:path"

interface ToolchainManifest {
  readonly engines?: {
    readonly node?: unknown
  }
  readonly packageManager?: unknown
}

export interface ToolchainContract {
  readonly bunVersion: string
  readonly nodeMajor: number
  readonly nodeRange: string
}

export type ToolchainContractResult =
  | {
      readonly contract: ToolchainContract
      readonly kind: "valid"
    }
  | {
      readonly errors: readonly string[]
      readonly kind: "invalid"
    }

export interface ToolchainRuntime {
  readonly bunVersion: string
  readonly nodeVersion: string
}

interface WorkflowJob {
  readonly body: string
  readonly name: string
}

const qualityGatesActionReferences = [
  "actions/cache@caa296126883cff596d87d8935842f9db880ef25",
  "actions/checkout@df4cb1c069e1874edd31b4311f1884172cec0e10",
  "actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38",
  "actions/setup-python@ece7cb06caefa5fff74198d8649806c4678c61a1",
  "actions/upload-artifact@b7c566a772e6b6bfb58ed0dc250532a479d7789f",
  "docker/setup-buildx-action@bb05f3f5519dd87d3ba754cc423b652a5edd6d2c",
  "oven-sh/setup-bun@0c5077e51419868618aeaa5fe8019c62421857d6",
] as const

const immutableActionReferencePattern = /^[^@\s]+@[0-9a-f]{40}$/u

export function readToolchainContract(input: unknown): ToolchainContractResult {
  if (typeof input !== "object" || input === null) {
    return { errors: ["root package.json은 객체여야 합니다."], kind: "invalid" }
  }

  const manifest = input as ToolchainManifest
  const errors: string[] = []
  const packageManager = manifest.packageManager
  const nodeRange = manifest.engines?.node
  const bunMatch =
    typeof packageManager === "string"
      ? /^bun@(\d+\.\d+\.\d+)$/u.exec(packageManager)
      : null
  const nodeMatch =
    typeof nodeRange === "string" ? /^(\d+)\.x$/u.exec(nodeRange) : null

  if (bunMatch === null) {
    errors.push("packageManager는 bun@<exact semver> 형식이어야 합니다.")
  }
  if (nodeMatch === null) {
    errors.push("engines.node는 <major>.x 형식이어야 합니다.")
  }
  if (errors.length > 0 || bunMatch === null || nodeMatch === null) {
    return { errors, kind: "invalid" }
  }

  return {
    contract: {
      bunVersion: bunMatch[1] ?? "",
      nodeMajor: Number(nodeMatch[1]),
      nodeRange,
    },
    kind: "valid",
  }
}

export function validateToolchainRuntime(
  contract: ToolchainContract,
  runtime: ToolchainRuntime
): readonly string[] {
  const errors: string[] = []
  const nodeMajor = Number(/^v?(\d+)\./u.exec(runtime.nodeVersion)?.[1])

  if (runtime.bunVersion !== contract.bunVersion) {
    errors.push(
      `Bun ${contract.bunVersion}이 필요하지만 ${runtime.bunVersion}이 실행 중입니다.`
    )
  }
  if (nodeMajor !== contract.nodeMajor) {
    errors.push(
      `Node.js ${contract.nodeRange}가 필요하지만 ${runtime.nodeVersion}이 실행 중입니다.`
    )
  }

  return errors
}

export function validateQualityGatesToolchain(
  contract: ToolchainContract,
  workflow: string
): readonly string[] {
  const jobs = readWorkflowJobs(workflow)
  if (jobs.length === 0) {
    return ["quality-gates.yml에 job이 없습니다."]
  }

  return jobs.flatMap((job) => validateWorkflowJob(contract, job))
}

export function validateQualityGatesActionReferences(
  workflow: string
): readonly string[] {
  const actionReferences = workflow.split(/\r?\n/u).flatMap((line) => {
    const match = /^\s*(?:-\s+)?uses:\s+([^\s#]+)/u.exec(line)
    return match === null ? [] : [match[1] ?? ""]
  })
  const errors: string[] = []

  for (const actionReference of qualityGatesActionReferences) {
    if (!actionReferences.includes(actionReference)) {
      errors.push(
        `quality-gates.yml: required immutable action pin이 없습니다: ${actionReference}`
      )
    }
  }
  for (const actionReference of actionReferences) {
    if (!immutableActionReferencePattern.test(actionReference)) {
      errors.push(
        `quality-gates.yml: action은 full commit SHA로 고정해야 합니다: ${actionReference}`
      )
    }
  }

  return errors
}

function readWorkflowJobs(workflow: string): readonly WorkflowJob[] {
  const lines = workflow.split(/\r?\n/u)
  const jobsStart = lines.findIndex((line) => line === "jobs:")
  if (jobsStart < 0) return []

  const jobs: WorkflowJob[] = []
  let currentName: string | undefined
  let currentLines: string[] = []

  for (const line of lines.slice(jobsStart + 1)) {
    const jobMatch = /^ {2}([a-z0-9-]+):$/u.exec(line)
    if (jobMatch !== null) {
      if (currentName !== undefined) {
        jobs.push({ body: currentLines.join("\n"), name: currentName })
      }
      currentName = jobMatch[1]
      currentLines = []
      continue
    }
    if (currentName !== undefined) currentLines.push(line)
  }

  if (currentName !== undefined) {
    jobs.push({ body: currentLines.join("\n"), name: currentName })
  }

  return jobs
}

function validateWorkflowJob(
  contract: ToolchainContract,
  job: WorkflowJob
): readonly string[] {
  const errors: string[] = []
  const nodeSetup = job.body.indexOf(
    "uses: actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38"
  )
  const nodeVersion = job.body.indexOf(`node-version: ${contract.nodeRange}`)
  const bunSetup = job.body.indexOf(
    "uses: oven-sh/setup-bun@0c5077e51419868618aeaa5fe8019c62421857d6"
  )
  const bunVersion = job.body.indexOf(`bun-version: ${contract.bunVersion}`)
  const preflight = job.body.indexOf("run: bun run check:toolchain")
  const install = job.body.indexOf("run: bun install")

  if (nodeSetup < 0 || nodeVersion < 0) {
    errors.push(`${job.name}: Node.js ${contract.nodeRange} setup이 없습니다.`)
  }
  if (bunSetup < 0 || bunVersion < 0) {
    errors.push(`${job.name}: Bun ${contract.bunVersion} setup이 없습니다.`)
  }
  if (preflight < 0) {
    errors.push(`${job.name}: check:toolchain preflight가 없습니다.`)
  }
  if (install < 0) {
    errors.push(`${job.name}: bun install 단계가 없습니다.`)
  }
  if (
    nodeSetup >= 0 &&
    bunSetup >= 0 &&
    preflight >= 0 &&
    install >= 0 &&
    (nodeSetup > preflight || bunSetup > preflight || preflight > install)
  ) {
    errors.push(
      `${job.name}: toolchain setup, preflight, install 순서가 올바르지 않습니다.`
    )
  }

  return errors
}

function runToolchainCheck(): void {
  const repositoryRoot = path.resolve(import.meta.dir, "..")
  const manifest = JSON.parse(
    readFileSync(path.join(repositoryRoot, "package.json"), "utf8")
  ) as unknown
  const contractResult = readToolchainContract(manifest)

  if (contractResult.kind === "invalid") {
    failToolchainCheck(contractResult.errors)
  }

  const workflow = readFileSync(
    path.join(repositoryRoot, ".github", "workflows", "quality-gates.yml"),
    "utf8"
  )
  const errors = [
    ...validateToolchainRuntime(contractResult.contract, {
      bunVersion: Bun.version,
      nodeVersion: process.versions.node,
    }),
    ...validateQualityGatesToolchain(contractResult.contract, workflow),
    ...validateQualityGatesActionReferences(workflow),
  ]

  if (errors.length > 0) failToolchainCheck(errors)

  console.log(
    `Toolchain contract is in sync: Bun ${contractResult.contract.bunVersion}, Node.js ${contractResult.contract.nodeRange}.`
  )
}

function failToolchainCheck(errors: readonly string[]): never {
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

if (import.meta.main) runToolchainCheck()
