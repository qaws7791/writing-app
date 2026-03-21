import { watch } from "node:fs"
import {
  copyFile,
  lstat,
  mkdir,
  readdir,
  symlink,
  rm,
  stat,
} from "node:fs/promises"
import { dirname, resolve } from "node:path"

const apiRoot = resolve(import.meta.dir, "../..")
const workspaceRoot = resolve(apiRoot, "../..")
const shouldWatch = process.env.WORKSPACE_DEPS_WATCH === "1"

const workspaceDependencies = [
  {
    sourceDirectory: resolve(workspaceRoot, "packages/backend-core/dist"),
    sourceNodeModulesDirectory: resolve(
      workspaceRoot,
      "packages/backend-core/node_modules"
    ),
    targetDirectory: resolve(
      apiRoot,
      ".workspace-deps/node_modules/@workspace/backend-core"
    ),
  },
  {
    sourceDirectory: resolve(workspaceRoot, "packages/db/dist"),
    sourceNodeModulesDirectory: resolve(
      workspaceRoot,
      "packages/db/node_modules"
    ),
    targetDirectory: resolve(
      apiRoot,
      ".workspace-deps/node_modules/@workspace/db"
    ),
  },
] as const

const ensureNodeModulesLink = async (
  sourceNodeModulesDirectory: string,
  targetDirectory: string
) => {
  const targetNodeModulesDirectory = resolve(targetDirectory, "node_modules")
  const existingNodeModules = await lstat(targetNodeModulesDirectory).catch(
    () => null
  )

  if (existingNodeModules !== null) {
    return
  }

  await symlink(
    sourceNodeModulesDirectory,
    targetNodeModulesDirectory,
    "junction"
  )
}

const syncFile = async (sourceFilePath: string, targetFilePath: string) => {
  const sourceFileStat = await stat(sourceFilePath)
  const targetFileStat = await stat(targetFilePath).catch(() => null)

  if (
    targetFileStat !== null &&
    targetFileStat.size === sourceFileStat.size &&
    targetFileStat.mtimeMs === sourceFileStat.mtimeMs
  ) {
    return
  }

  await mkdir(dirname(targetFilePath), { recursive: true })
  await copyFile(sourceFilePath, targetFilePath)
}

const syncDirectory = async (
  sourceDirectory: string,
  targetDirectory: string
) => {
  await mkdir(targetDirectory, { recursive: true })

  const sourceEntries = await readdir(sourceDirectory, {
    recursive: false,
    withFileTypes: true,
  })
  const targetEntries = await readdir(targetDirectory, {
    recursive: false,
    withFileTypes: true,
  }).catch(() => [])

  const sourceEntryNames = new Set(sourceEntries.map((entry) => entry.name))

  await Promise.all(
    sourceEntries.map(async (entry) => {
      const sourcePath = resolve(sourceDirectory, entry.name)
      const targetPath = resolve(targetDirectory, entry.name)

      if (entry.isDirectory()) {
        await syncDirectory(sourcePath, targetPath)
        return
      }

      if (entry.isFile()) {
        await syncFile(sourcePath, targetPath)
      }
    })
  )

  await Promise.all(
    targetEntries
      .filter((entry) => !sourceEntryNames.has(entry.name))
      .map((entry) =>
        rm(resolve(targetDirectory, entry.name), {
          force: true,
          recursive: true,
        })
      )
  )
}

const syncWorkspaceDependencies = async () => {
  await Promise.all(
    workspaceDependencies.map(
      async ({
        sourceDirectory,
        sourceNodeModulesDirectory,
        targetDirectory,
      }) => {
        await syncDirectory(sourceDirectory, targetDirectory)
        await ensureNodeModulesLink(sourceNodeModulesDirectory, targetDirectory)
      }
    )
  )
}

await syncWorkspaceDependencies()
console.log("workspace dependency mirror ready")

if (!shouldWatch) {
  process.exit(0)
}

const scheduledSyncs = new Map<string, Timer>()
const watchers = workspaceDependencies.map(({ sourceDirectory }) =>
  watch(sourceDirectory, { recursive: true }, () => {
    const pendingSync = scheduledSyncs.get(sourceDirectory)

    if (pendingSync !== undefined) {
      clearTimeout(pendingSync)
    }

    const nextSync = setTimeout(async () => {
      scheduledSyncs.delete(sourceDirectory)
      await syncWorkspaceDependencies()
    }, 75)

    scheduledSyncs.set(sourceDirectory, nextSync)
  })
)

const stopWatching = () => {
  for (const pendingSync of scheduledSyncs.values()) {
    clearTimeout(pendingSync)
  }

  for (const watcher of watchers) {
    watcher.close()
  }
}

process.on("SIGINT", () => {
  stopWatching()
  process.exit(0)
})

process.on("SIGTERM", () => {
  stopWatching()
  process.exit(0)
})

await new Promise(() => undefined)
