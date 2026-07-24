import path from "node:path"
import { eq } from "drizzle-orm"

import { curriculumVersionIdSchema } from "@workspace/contracts/content/ids"
import { createWritingAppDatabase } from "@workspace/db/client"
import { courseCurriculumVersions } from "@workspace/content/schema"

if (import.meta.main) {
  const databaseUrl = readE2eDatabaseUrl(process.env)
  const curriculumVersionId = curriculumVersionIdSchema.parse(Bun.argv[2])
  const database = createWritingAppDatabase(databaseUrl)
  let rejected = false

  try {
    try {
      database.db
        .update(courseCurriculumVersions)
        .set({ title: "허용되면 안 되는 발행본 변경" })
        .where(eq(courseCurriculumVersions.id, curriculumVersionId))
        .run()
    } catch {
      rejected = true
    }

    if (!rejected) {
      throw new Error("DB가 published curriculum mutation을 허용했습니다.")
    }
  } finally {
    database.close()
  }
}

function readE2eDatabaseUrl(environment: NodeJS.ProcessEnv): string {
  const databaseUrl = environment["E2E_DATABASE_URL"]
  const e2eRunRoot = environment["E2E_RUN_ROOT"]
  if (databaseUrl === undefined || e2eRunRoot === undefined) {
    throw new Error("E2E_DATABASE_URL과 E2E_RUN_ROOT가 필요합니다.")
  }

  const resolvedDatabaseUrl = path.resolve(databaseUrl.replace(/^file:/u, ""))
  const expectedDatabaseUrl = path.join(
    path.resolve(e2eRunRoot),
    "writing-app.sqlite"
  )
  if (resolvedDatabaseUrl !== expectedDatabaseUrl) {
    throw new Error("published mutation 검증 대상이 E2E DB가 아닙니다.")
  }

  return resolvedDatabaseUrl
}
