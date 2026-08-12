import { userIdSchema } from "@workspace/contracts/identity/admin-ids"
import type { ContentApplication } from "@workspace/content/ports"
import type { WritingAppDatabase } from "@workspace/db/client"
import type { IdentityModule } from "@workspace/identity/module"
import {
  createLearningModule,
  type LearningModule,
} from "@workspace/learning/module"
import type { LearningIdentityQueryPort } from "@workspace/learning/ports"
import type { Clock } from "@workspace/kernel/clock"

export function composeLearningModule(input: {
  readonly clock: Clock
  readonly content: ContentApplication
  readonly cursorSigningSecret: string
  readonly database: WritingAppDatabase
  readonly readIdentity: () => IdentityModule
}): LearningModule {
  return createLearningModule({
    clock: input.clock,
    content: input.content,
    cursorSigningSecret: input.cursorSigningSecret,
    database: input.database,
    identity: createLearningIdentityQueryPort(input.readIdentity),
    presentationSecret: input.cursorSigningSecret,
  })
}

function createLearningIdentityQueryPort(
  readIdentity: () => IdentityModule
): LearningIdentityQueryPort {
  return {
    async readLearnerStatus(learnerId) {
      const result = await readIdentity().learningQuery.readLearnerStatus(
        userIdSchema.parse(learnerId)
      )
      return result.mapErr((error) => ({
        kind:
          error.kind === "identity-not-found" ||
          error.kind === "identity-conflict"
            ? error.kind
            : ("identity-validation-failed" as const),
      }))
    },
  }
}
