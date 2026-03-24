import fs from "node:fs"
import path from "node:path"

const SPEC_URL = "http://localhost:3010/openapi.json"
const OUTPUT_PATH = path.resolve(import.meta.dirname, "../src/openapi.json")

async function main() {
  const response = await fetch(SPEC_URL)
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`)
  }
  const spec = await response.json()
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(spec, null, 2))
  console.log(`Saved: ${OUTPUT_PATH}`)
}

main().catch((error) => {
  console.error("Failed to fetch OpenAPI spec:", error)
  process.exit(1)
})
