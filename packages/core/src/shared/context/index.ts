import type { LearnerId } from "@workspace/core/modules/learning/domain/learning.ids"

export type RequestActor =
  | {
      readonly kind: "anonymous"
    }
  | {
      readonly kind: "learner"
      readonly learnerId: LearnerId
    }
  | {
      readonly kind: "admin"
      readonly adminId: string
    }

export type RequestContext = {
  readonly actor: RequestActor
  readonly now: Date
  readonly requestId: string
}

export function createAnonymousRequestContext(input: {
  readonly now: Date
  readonly requestId: string
}): RequestContext {
  return {
    actor: { kind: "anonymous" },
    now: input.now,
    requestId: input.requestId,
  }
}
