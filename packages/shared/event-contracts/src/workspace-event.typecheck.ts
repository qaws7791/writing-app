import type {
  WorkspaceEventMap,
  WorkspaceEventName,
} from "#event-contracts/workspace-event"

type WorkspaceContext =
  | "ai-feedback"
  | "content"
  | "identity"
  | "learning"
  | "resource-library"
type CanonicalEventName = `${WorkspaceContext}.${string}`

const eventHandlers = {
  "ai-feedback.completed": (_event) => undefined,
  "content.curriculum-published": (_event) => undefined,
  "identity.user-status-changed": (_event) => undefined,
  "learning.lesson-completed": (_event) => undefined,
  "resource-library.document-saved": (_event) => undefined,
} satisfies {
  readonly [TName in WorkspaceEventName]: (
    event: WorkspaceEventMap[TName]
  ) => void
}

const canonicalEventNames: readonly CanonicalEventName[] = Object.keys(
  eventHandlers
) as WorkspaceEventName[]
void canonicalEventNames

type EventTypeMatchesMapKey = {
  readonly [TName in WorkspaceEventName]: WorkspaceEventMap[TName]["type"] extends TName
    ? TName extends WorkspaceEventMap[TName]["type"]
      ? true
      : false
    : false
}

const eventTypeMatchesMapKey = {
  "ai-feedback.completed": true,
  "content.curriculum-published": true,
  "identity.user-status-changed": true,
  "learning.lesson-completed": true,
  "resource-library.document-saved": true,
} satisfies EventTypeMatchesMapKey
void eventTypeMatchesMapKey
