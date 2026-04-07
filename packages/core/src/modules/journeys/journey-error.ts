import type { JourneyId, SessionId } from "../../shared/brand/index"
import {
  createNotFoundError,
  type NotFoundError,
} from "../../shared/error/index"

export type JourneyNotFoundError = NotFoundError & {
  readonly entity: "journey"
  readonly id?: JourneyId
}

export type SessionNotFoundError = NotFoundError & {
  readonly entity: "session"
  readonly id?: SessionId
}

export type JourneyModuleError = JourneyNotFoundError | SessionNotFoundError

export function journeyNotFound(
  message: string,
  journeyId?: JourneyId
): JourneyNotFoundError {
  return {
    ...createNotFoundError(message, { entity: "journey", id: journeyId }),
    entity: "journey",
    id: journeyId,
  }
}

export function sessionNotFound(
  message: string,
  sessionId?: SessionId
): SessionNotFoundError {
  return {
    ...createNotFoundError(message, { entity: "session", id: sessionId }),
    entity: "session",
    id: sessionId,
  }
}
