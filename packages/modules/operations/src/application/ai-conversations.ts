import { err, ok, type Result } from "@workspace/kernel/result"
import type { AdminId, ConversationId } from "@workspace/types/ids"

import type {
  AiConversationHistory,
  AiConversationSummary,
  AiMessage,
} from "#operations/domain/ai-conversation"
import type { OperationsError } from "#operations/domain/operations-error"
import type {
  AiConversationRepository,
  AiProviderPort,
  OperationsClock,
  OperationsProviderFailureObserver,
} from "#operations/application/ports/operations-ports"

export type AiConversationQueries = Readonly<{
  readConversation: (
    input: Readonly<{
      adminId: AdminId
      conversationId: ConversationId
      messagePage: number
      messagePageSize: number
    }>
  ) => Promise<Result<AiConversationHistory, OperationsError>>
  readConversations: (
    input: Readonly<{
      adminId: AdminId
      page: number
      pageSize: number
    }>
  ) => Promise<Result<readonly AiConversationSummary[], OperationsError>>
}>

export type AiStreamingApplication = Readonly<{
  finishAssistantMessage: (
    input: Readonly<{
      content: string
      conversationId: ConversationId
    }>
  ) => Promise<Result<AiMessage, OperationsError>>
  startMessage: (
    input: Readonly<{
      adminId: AdminId
      conversationId: ConversationId | null
      message: string
      signal: AbortSignal
    }>
  ) => Promise<
    Result<
      Readonly<{
        history: AiConversationHistory
        stream: AsyncIterable<string>
      }>,
      OperationsError
    >
  >
}>

export function createAiConversationQueries(
  repository: AiConversationRepository
): AiConversationQueries {
  return Object.freeze({
    async readConversation(input) {
      try {
        const conversation = await repository.readConversation(input)
        return conversation === null
          ? err({ kind: "not-found", target: "ai-conversation" })
          : ok(conversation)
      } catch {
        return err({
          kind: "persistence-failed",
          operation: "read-ai-conversation",
        })
      }
    },
    async readConversations(input) {
      try {
        return ok(await repository.readConversations(input))
      } catch {
        return err({
          kind: "persistence-failed",
          operation: "read-ai-conversations",
        })
      }
    },
  })
}

export function createAiStreamingApplication(input: {
  readonly clock: OperationsClock
  readonly provider: AiProviderPort | null
  readonly providerFailureObserver: OperationsProviderFailureObserver
  readonly repository: AiConversationRepository
}): AiStreamingApplication {
  return Object.freeze({
    async finishAssistantMessage(command) {
      try {
        return ok(
          await input.repository.saveAssistantMessage({
            ...command,
            now: input.clock.now(),
          })
        )
      } catch {
        return err({
          kind: "persistence-failed",
          operation: "save-ai-assistant-message",
        })
      }
    },
    async startMessage(command) {
      if (input.provider === null) {
        observeProviderFailure(input.providerFailureObserver, {
          kind: "operations-ai-provider-failed",
          operation: "stream-text",
          reason: "provider-unavailable",
        })
        return err({ kind: "provider-unavailable" })
      }

      let history: AiConversationHistory | null
      try {
        history = await input.repository.createUserMessage({
          adminId: command.adminId,
          conversationId: command.conversationId,
          message: command.message,
          now: input.clock.now(),
        })
      } catch {
        return err({
          kind: "persistence-failed",
          operation: "save-ai-user-message",
        })
      }
      if (history === null) {
        return err({ kind: "not-found", target: "ai-conversation" })
      }

      try {
        const stream = await input.provider.streamText(createPrompt(history), {
          maxOutputTokens: 2_000,
          signal: command.signal,
        })
        return ok({
          history,
          stream: observeProviderStream(
            stream,
            input.providerFailureObserver,
            command.signal
          ),
        })
      } catch {
        const failure = classifyProviderFailure(command.signal)
        if (failure.observedReason !== null) {
          observeProviderFailure(input.providerFailureObserver, {
            kind: "operations-ai-provider-failed",
            operation: "stream-text",
            reason: failure.observedReason,
          })
        }
        return err({ kind: failure.errorKind })
      }
    },
  })
}

async function* observeProviderStream(
  stream: AsyncIterable<string>,
  observer: OperationsProviderFailureObserver,
  signal: AbortSignal
): AsyncIterable<string> {
  try {
    yield* stream
  } catch (error) {
    const failure = classifyProviderFailure(signal)
    if (failure.observedReason !== null) {
      observeProviderFailure(observer, {
        kind: "operations-ai-provider-failed",
        operation: "stream-text",
        reason: failure.observedReason,
      })
    }
    throw error
  }
}

function classifyProviderFailure(signal: AbortSignal): Readonly<{
  errorKind: "provider-failed" | "provider-timeout" | "request-aborted"
  observedReason: "provider-failed" | "provider-timeout" | null
}> {
  if (!signal.aborted) {
    return { errorKind: "provider-failed", observedReason: "provider-failed" }
  }
  if (signal.reason === "provider-timeout") {
    return {
      errorKind: "provider-timeout",
      observedReason: "provider-timeout",
    }
  }
  return { errorKind: "request-aborted", observedReason: null }
}

function observeProviderFailure(
  observer: OperationsProviderFailureObserver,
  event: Parameters<OperationsProviderFailureObserver>[0]
): void {
  try {
    observer(event)
  } catch {
    return
  }
}

function createPrompt(history: AiConversationHistory): string {
  return history.messages
    .map((message) => `${message.role}: ${message.content}`)
    .join("\n")
}
