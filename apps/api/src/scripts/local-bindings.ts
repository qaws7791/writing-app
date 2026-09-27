import path from "node:path"
import { fileURLToPath } from "node:url"
import { getPlatformProxy } from "wrangler"
import { createWritingAppDatabase } from "@workspace/db/client"

const apiRoot = fileURLToPath(new URL("../..", import.meta.url))
export async function createLocalBindings(persistPath?: string) {
  return getPlatformProxy<ApiBindings>({
    configPath: path.join(apiRoot, "wrangler.jsonc"),
    persist: { path: persistPath ?? path.join(apiRoot, ".wrangler/state/v3") },
    remoteBindings: false,
  })
}
export async function createLocalDatabase(persistPath?: string) {
  const proxy = await createLocalBindings(persistPath)
  return {
    ...createWritingAppDatabase(proxy.env.DB),
    close: () => proxy.dispose(),
  }
}
