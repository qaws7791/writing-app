import { readdir, readFile, writeFile } from "node:fs/promises"
import { basename, resolve } from "node:path"

const audiences = ["admin", "learner"] as const
const generatedRoot = resolve(import.meta.dir, "../../.generated")
const handlerNamePattern = /^export const (\w+MockHandler\d*) =/gmu

export async function generateMswHandlerExports(
  root = generatedRoot
): Promise<void> {
  await Promise.all(
    audiences.map(async (audience) => {
      const directory = resolve(root, audience, "mocks")
      const entries = await readdir(directory, { withFileTypes: true })
      const implementationFiles = entries.filter(
        (entry) =>
          entry.isFile() &&
          entry.name.endsWith(".msw.ts") &&
          entry.name !== "index.msw.ts"
      )
      if (implementationFiles.length !== 1) {
        throw new Error(
          `${audience} MSW implementation file count must be 1, received ${implementationFiles.length}.`
        )
      }

      const implementationFile = implementationFiles[0]
      if (implementationFile === undefined) {
        throw new Error(`${audience} MSW implementation file is missing.`)
      }

      const implementation = await readFile(
        resolve(directory, implementationFile.name),
        "utf8"
      )
      const handlerNames = [...implementation.matchAll(handlerNamePattern)]
        .map((match) => match[1])
        .filter((name): name is string => name !== undefined)
        .sort(compareCodeUnits)
      if (handlerNames.length === 0) {
        throw new Error(`${audience} MSW handlers are missing.`)
      }

      const importPath = `./${basename(implementationFile.name, ".ts")}`
      const output = [
        `import * as generated from "${importPath}"`,
        "",
        ...handlerNames.flatMap((handlerName) => [
          `export const ${handlerName}: (`,
          "  override: Exclude<",
          `    Parameters<typeof generated.${handlerName}>[0],`,
          "    undefined",
          "  >,",
          `  options?: Parameters<typeof generated.${handlerName}>[1]`,
          `) => ReturnType<typeof generated.${handlerName}> =`,
          `  generated.${handlerName}`,
          "",
        ]),
      ].join("\n")

      await writeFile(resolve(directory, "handlers.ts"), output, "utf8")
    })
  )
}

function compareCodeUnits(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

if (import.meta.main) {
  await generateMswHandlerExports()
}
