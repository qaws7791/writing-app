import type { JourneyId, SessionId, StepId } from "../../shared/brand/index"
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

export type StepNotFoundError = NotFoundError & {
  readonly entity: "step"
  readonly id?: StepId
}

export type JourneyModuleError =
  | JourneyNotFoundError
  | SessionNotFoundError
  | StepNotFoundError

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

export function stepNotFound(
  message: string,
  stepId?: StepId
): StepNotFoundError {
  return {
    ...createNotFoundError(message, { entity: "step", id: stepId }),
    entity: "step",
    id: stepId,
  }
}
