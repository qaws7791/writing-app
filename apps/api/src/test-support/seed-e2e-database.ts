import path from "node:path"
import { readRequiredE2eEnvironment } from "@workspace/env/e2e-runtime"
import { setupE2eContentDatabase } from "@/test-support/setup-e2e-content-database"
import { setupE2eAuthDatabase } from "@/test-support/setup-e2e-database"

const statePath = path.join(
  path.resolve(readRequiredE2eEnvironment("E2E_RUN_ROOT")),
  "state/v3"
)
await setupE2eContentDatabase(statePath)
await setupE2eAuthDatabase(statePath)
