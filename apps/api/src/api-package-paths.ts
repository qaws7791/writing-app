import { isAbsolute, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const apiPackageRoot = fileURLToPath(new URL("..", import.meta.url))

export function resolveAgainstApiPackage(path: string): string {
  if (isAbsolute(path)) {
    return path
  }
  return resolve(apiPackageRoot, path)
}
