import { readFileSync } from "node:fs"
import path from "node:path"

type RootManifest = Readonly<{
  engines?: Readonly<{ node?: unknown }>
  packageManager?: unknown
}>

export type LocalToolchain = Readonly<{
  bunVersion: string
  gitVersion: string
  nodeVersion: string
}>

export function requireLocalToolchain(repositoryRoot: string): LocalToolchain {
  const manifest = JSON.parse(
    readFileSync(path.join(repositoryRoot, "package.json"), "utf8")
  ) as RootManifest
  const bunMatch =
    typeof manifest.packageManager === "string"
      ? /^bun@(\d+\.\d+\.\d+)$/u.exec(manifest.packageManager)
      : null
  const nodeMatch =
    typeof manifest.engines?.node === "string"
      ? /^(\d+)\.x$/u.exec(manifest.engines.node)
      : null

  if (bunMatch === null || nodeMatch === null) {
    throw new Error(
      "package.json의 packageManager와 engines.node 도구 계약이 올바르지 않습니다."
    )
  }

  const minimumBunVersion = bunMatch[1]
  if (!isCompatibleBunVersion(Bun.version, minimumBunVersion)) {
    throw new Error(
      `Bun ${minimumBunVersion} 이상 같은 major가 필요합니다. 현재 버전은 ${Bun.version}입니다.`
    )
  }

  const nodeExecutable = Bun.which("node")
  if (nodeExecutable === null) {
    throw new Error(
      `Node.js ${manifest.engines.node} 실행 파일이 PATH에 없습니다.`
    )
  }
  const nodeResult = Bun.spawnSync([nodeExecutable, "--version"], {
    cwd: repositoryRoot,
    stderr: "pipe",
    stdout: "pipe",
  })
  if (nodeResult.exitCode !== 0) {
    throw new Error(
      `Node.js ${manifest.engines.node} 버전을 확인할 수 없습니다.`
    )
  }

  const nodeVersion = new TextDecoder().decode(nodeResult.stdout).trim()
  const actualNodeMajor = /^v?(\d+)\./u.exec(nodeVersion)?.[1]
  if (actualNodeMajor !== nodeMatch[1]) {
    throw new Error(
      `Node.js ${manifest.engines.node}가 필요합니다. 현재 버전은 ${nodeVersion || "unknown"}입니다.`
    )
  }

  const gitExecutable = Bun.which("git")
  if (gitExecutable === null) {
    throw new Error("Git 실행 파일이 PATH에 없습니다.")
  }
  const gitResult = Bun.spawnSync([gitExecutable, "--version"], {
    cwd: repositoryRoot,
    stderr: "pipe",
    stdout: "pipe",
  })
  const gitOutput = new TextDecoder().decode(gitResult.stdout).trim()
  const gitVersion = /^git version (.+)$/u.exec(gitOutput)?.[1]
  if (gitResult.exitCode !== 0 || gitVersion === undefined) {
    throw new Error("Git 버전을 확인할 수 없습니다.")
  }
  const repositoryResult = Bun.spawnSync(
    [gitExecutable, "-C", repositoryRoot, "rev-parse", "--show-toplevel"],
    { stderr: "pipe", stdout: "pipe" }
  )
  if (repositoryResult.exitCode !== 0) {
    throw new Error("현재 디렉터리는 Git checkout이 아닙니다.")
  }

  return { bunVersion: Bun.version, gitVersion, nodeVersion }
}

function isCompatibleBunVersion(
  actualVersion: string,
  minimumVersion: string
): boolean {
  const actual = readSemver(actualVersion)
  const minimum = readSemver(minimumVersion)
  if (actual === null || minimum === null || actual[0] !== minimum[0]) {
    return false
  }

  return (
    actual[1] > minimum[1] ||
    (actual[1] === minimum[1] && actual[2] >= minimum[2])
  )
}

function readSemver(value: string): readonly [number, number, number] | null {
  const match = /^(\d+)\.(\d+)\.(\d+)$/u.exec(value)
  return match === null
    ? null
    : [Number(match[1]), Number(match[2]), Number(match[3])]
}
