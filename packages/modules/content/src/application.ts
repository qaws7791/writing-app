import type { WritingAppDatabase } from "@workspace/db/client"

import {
  createContentApplication as createContentApplicationFromDependencies,
  type ContentApplication,
} from "#content/application/content-application"
import type { ContentApplicationDependencies } from "#content/application/ports/content-ports"
import { createDrizzleContentRepository } from "#content/infrastructure/persistence/content-drizzle-repository"

export type CreateContentApplicationInput = Omit<
  ContentApplicationDependencies,
  "repository"
> & {
  readonly database: WritingAppDatabase
}

export function createContentApplication(
  input: CreateContentApplicationInput
): ContentApplication {
  return createContentApplicationFromDependencies({
    ...input,
    repository: createDrizzleContentRepository(input.database),
  })
}

export { normalizeVersionedStepContentOrThrow } from "#content/domain/content-normalization"
export { seedContentDatabase } from "#content/infrastructure/persistence/seed"
export type {
  ContentApplication,
  ContentError,
} from "#content/application/content-application"
