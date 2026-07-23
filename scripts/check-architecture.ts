import fs from "node:fs"
import path from "node:path"

interface RootManifest {
  readonly workspaces?: readonly string[]
}

const repositoryRoot = path.resolve(import.meta.dir, "..")
const manifest = (await Bun.file(
  path.join(repositoryRoot, "package.json")
).json()) as RootManifest
const workspaceGlobs = manifest.workspaces

if (
  workspaceGlobs === undefined ||
  workspaceGlobs.some((workspaceGlob) => typeof workspaceGlob !== "string")
) {
  throw new Error("package.json workspaces를 읽을 수 없습니다.")
}

const workspaceDirectories = [
  ...new Set(
    workspaceGlobs.flatMap((workspaceGlob) =>
      [
        ...new Bun.Glob(`${workspaceGlob}/package.json`).scanSync({
          cwd: repositoryRoot,
          onlyFiles: true,
        }),
      ].map((manifestPath) => path.dirname(manifestPath))
    )
  ),
].sort()

for (const workspaceDirectory of workspaceDirectories) {
  const tsconfigPath = path.join(
    repositoryRoot,
    workspaceDirectory,
    "tsconfig.json"
  )
  if (!fs.existsSync(tsconfigPath)) continue

  const child = Bun.spawn(
    [
      path.join(repositoryRoot, "node_modules/.bin/depcruise"),
      workspaceDirectory,
      "--config",
      path.join(repositoryRoot, "dependency-cruiser.config.mjs"),
      "--ts-config",
      tsconfigPath,
      "--output-type",
      "err",
    ],
    {
      cwd: repositoryRoot,
      stderr: "inherit",
      stdout: "inherit",
    }
  )

  if ((await child.exited) !== 0) {
    throw new Error(`${workspaceDirectory} dependency 검사가 실패했습니다.`)
  }
}

console.log(
  `Architecture 검사가 ${workspaceDirectories.length}개 workspace를 통과했습니다.`
)
