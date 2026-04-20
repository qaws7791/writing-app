import fs from "node:fs"
import path from "node:path"

const GENERATED_SPEC_PATH = path.resolve(
  import.meta.dirname,
  "../../../apps/api/.generated/openapi.json"
)
const OUTPUT_PATH = path.resolve(import.meta.dirname, "../src/openapi.json")

async function main() {
  if (!fs.existsSync(GENERATED_SPEC_PATH)) {
    throw new Error(`Generated spec not found: ${GENERATED_SPEC_PATH}`)
  }

  const spec = JSON.parse(fs.readFileSync(GENERATED_SPEC_PATH, "utf8"))
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(spec, null, 2))
  console.log(`Saved: ${OUTPUT_PATH}`)
}

main().catch((error) => {
  console.error("Failed to fetch OpenAPI spec:", error)
  process.exit(1)
})
