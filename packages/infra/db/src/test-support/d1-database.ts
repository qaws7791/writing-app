import { Miniflare, convertV4MiniflareOptions } from "miniflare"

import {
  createWritingAppDatabase,
  type WritingAppDatabaseClient,
} from "#db/client"

export async function createInMemoryWritingAppDatabase(): Promise<WritingAppDatabaseClient> {
  const runtime = new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      script:
        "export default { fetch() { return new Response(null, { status: 404 }) } }",
      compatibilityDate: "2026-09-26",
      d1Databases: ["DB"],
    })
  )
  try {
    const binding = await runtime.getD1Database("DB")
    const database = createWritingAppDatabase(binding)
    return { ...database, close: () => runtime.dispose() }
  } catch (cause) {
    await runtime.dispose()
    throw cause
  }
}
