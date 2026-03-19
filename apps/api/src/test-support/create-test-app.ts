import { mkdtempSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import { createApiDependencies } from "../bootstrap.js"

export function createTestApi() {
  const directory = mkdtempSync(join(tmpdir(), "writing-api-"))
  const databasePath = join(directory, "test.sqlite")
  const dependencies = createApiDependencies({
    databasePath,
    devUserId: "dev-user",
    devUserNickname: "테스트 사용자",
    port: 0,
  })

  return {
    app: dependencies.app,
    close: dependencies.close,
    databasePath,
  }
}
