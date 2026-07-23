import {
  cpSync,
  mkdirSync,
  readdirSync,
  readlinkSync,
  rmSync,
  statSync,
  symlinkSync,
  unlinkSync,
} from "node:fs"
import { dirname, join, relative, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const applicationDefinitions = Object.freeze({
  admin: Object.freeze({ defaultPort: 3001 }),
  web: Object.freeze({ defaultPort: 3000 }),
})

export function resolveStandaloneApplication(
  applicationName,
  rootDirectory = repositoryRoot
) {
  const definition = applicationDefinitions[applicationName]
  if (definition === undefined) {
    throw new Error(
      `unknown Next.js application "${applicationName ?? ""}"; expected "web" or "admin"`
    )
  }

  const applicationDirectory = join(rootDirectory, "apps", applicationName)
  const standaloneRootDirectory = join(
    applicationDirectory,
    ".next",
    "standalone"
  )
  const runtimeDirectory = join(
    standaloneRootDirectory,
    "apps",
    applicationName
  )

  return {
    applicationName,
    defaultPort: definition.defaultPort,
    publicSourceDirectory: join(applicationDirectory, "public"),
    publicTargetDirectory: join(runtimeDirectory, "public"),
    runtimeDirectory,
    serverPath: join(runtimeDirectory, "server.js"),
    standaloneRootDirectory,
    staticSourceDirectory: join(applicationDirectory, ".next", "static"),
    staticTargetDirectory: join(runtimeDirectory, ".next", "static"),
  }
}

export function stageStandaloneAssets(application) {
  assertFile(application.serverPath, application.applicationName)
  assertDirectory(
    application.staticSourceDirectory,
    application.applicationName
  )
  assertDirectory(
    application.publicSourceDirectory,
    application.applicationName
  )
  assertRuntimeTarget(application, application.staticTargetDirectory)
  assertRuntimeTarget(application, application.publicTargetDirectory)

  replaceDirectory(
    application.staticSourceDirectory,
    application.staticTargetDirectory
  )
  replaceDirectory(
    application.publicSourceDirectory,
    application.publicTargetDirectory
  )
}

export async function runStandaloneApplication(
  applicationName,
  rootDirectory = repositoryRoot
) {
  const application = resolveStandaloneApplication(
    applicationName,
    rootDirectory
  )
  stageStandaloneAssets(application)
  repairWindowsStandaloneDirectoryLinks(application.standaloneRootDirectory)

  // 이 launcher는 Turborepo task 밖에서 실행된다.
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  process.env.PORT ??= String(application.defaultPort)
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  process.env.HOSTNAME ??= "127.0.0.1"

  await import(pathToFileURL(application.serverPath).href)
}

export function repairWindowsStandaloneDirectoryLinks(
  standaloneRootDirectory,
  platform = process.platform
) {
  if (platform !== "win32") {
    return 0
  }

  const links = findSymbolicLinks(join(standaloneRootDirectory, "node_modules"))
  let repairedLinkCount = 0

  for (const linkPath of links) {
    const targetPath = resolve(dirname(linkPath), readlinkSync(linkPath))
    if (!statSync(targetPath).isDirectory()) {
      continue
    }

    unlinkSync(linkPath)
    symlinkSync(targetPath, linkPath, "junction")
    repairedLinkCount += 1
  }

  return repairedLinkCount
}

function assertDirectory(path, applicationName) {
  try {
    if (statSync(path).isDirectory()) {
      return
    }
  } catch {
    throw missingBuildOutputError(applicationName, path)
  }

  throw missingBuildOutputError(applicationName, path)
}

function assertFile(path, applicationName) {
  try {
    if (statSync(path).isFile()) {
      return
    }
  } catch {
    throw missingBuildOutputError(applicationName, path)
  }

  throw missingBuildOutputError(applicationName, path)
}

function assertRuntimeTarget(application, targetPath) {
  const targetRelativePath = relative(application.runtimeDirectory, targetPath)
  if (
    targetRelativePath === "" ||
    targetRelativePath === ".." ||
    targetRelativePath.startsWith(`..\\`) ||
    targetRelativePath.startsWith("../")
  ) {
    throw new Error("standalone asset target must stay inside its runtime")
  }
}

function missingBuildOutputError(applicationName, path) {
  return new Error(
    `missing standalone build output for ${applicationName}: ${path}. Run "bun --filter @workspace/${applicationName} build" first.`
  )
}

function replaceDirectory(sourcePath, targetPath) {
  rmSync(targetPath, { force: true, recursive: true })
  mkdirSync(dirname(targetPath), { recursive: true })
  cpSync(sourcePath, targetPath, { recursive: true })
}

function findSymbolicLinks(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name)
    if (entry.isSymbolicLink()) {
      return [entryPath]
    }
    if (entry.isDirectory()) {
      return findSymbolicLinks(entryPath)
    }

    return []
  })
}

const invokedPath = process.argv[1]
if (
  invokedPath !== undefined &&
  resolve(invokedPath) === fileURLToPath(import.meta.url)
) {
  runStandaloneApplication(process.argv[2]).catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
