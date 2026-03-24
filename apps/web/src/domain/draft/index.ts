export type {
  DraftContent,
  DraftDetail,
  DraftMark,
  DraftNode,
  DraftSummary,
  HomeSnapshot,
  JsonValue,
} from "@/domain/draft/model/draft.types"

export {
  createEmptyDraftContent,
  draftContentToHtml,
  draftContentToPlainText,
  getDraftMetrics,
} from "@/domain/draft/model/draft.service"

export {
  type DraftSyncState,
  type EditorDraftSnapshot,
  areDraftSnapshotsEqual,
  consumeRedirectDraftSnapshot,
  createDraftSnapshotFromDetail,
  createEditorDraftSnapshot,
  createEmptyEditorDraftSnapshot,
  hasMeaningfulDraftInput,
  normalizeDraftTitle,
  persistRedirectDraftSnapshot,
  serializeDraftSnapshot,
} from "@/domain/draft/model/draft-sync.service"
