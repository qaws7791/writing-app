import { seedApplicationDatabase } from "@/db/seed"
import { createLocalDatabase } from "@/scripts/local-bindings"

if (import.meta.main) {
  const client = await createLocalDatabase()
  try {
    await seedApplicationDatabase(client)
  } finally {
    await client.close()
  }
}
