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

  if (!isCompatibleBunVersion(runtime.bunVersion, contract.bunVersion)) {
    errors.push(
      `Bun ${contract.bunVersion} 이상 같은 major가 필요하지만 ${runtime.bunVersion}이 실행 중입니다.`
    )
  }
  if (nodeMajor !== contract.nodeMajor) {
    errors.push(
      `Node.js ${contract.nodeRange}가 필요하지만 ${runtime.nodeVersion}이 실행 중입니다.`
    )
  }

  return errors
}

function isCompatibleBunVersion(
  runtimeVersion: string,
  minimumVersion: string
): boolean {
  const runtime = readSemver(runtimeVersion)
  const minimum = readSemver(minimumVersion)
  if (runtime === null || minimum === null || runtime[0] !== minimum[0]) {
    return false
  }

  return (
    runtime[1] > minimum[1] ||
    (runtime[1] === minimum[1] && runtime[2] >= minimum[2])
  )
}

function readSemver(version: string): readonly [number, number, number] | null {
  const match = /^(\d+)\.(\d+)\.(\d+)$/u.exec(version)
  return match === null
    ? null
    : [Number(match[1]), Number(match[2]), Number(match[3])]
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

  const errors = validateToolchainRuntime(contractResult.contract, {
    bunVersion: Bun.version,
    nodeVersion: process.versions.node,
  })
  if (errors.length > 0) failToolchainCheck(errors)

  console.log(
    `Toolchain contract is valid: Bun ${contractResult.contract.bunVersion}, Node.js ${contractResult.contract.nodeRange}.`
  )
}

function failToolchainCheck(errors: readonly string[]): never {
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

if (import.meta.main) runToolchainCheck()
