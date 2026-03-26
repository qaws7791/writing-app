export type {
  WritingContent,
  WritingDetail,
  WritingMark,
  WritingNode,
  WritingSummary,
  HomeSnapshot,
  JsonValue,
} from "@/domain/writing/model/writing.types"

export {
  createEmptyWritingContent,
  writingContentToHtml,
  writingContentToPlainText,
  getWritingMetrics,
} from "@/domain/writing/model/writing.service"

export {
  type WritingSyncState,
  type EditorWritingSnapshot,
  areWritingSnapshotsEqual,
  consumeRedirectWritingSnapshot,
  createWritingSnapshotFromDetail,
  createEditorWritingSnapshot,
  createEmptyEditorWritingSnapshot,
  hasMeaningfulWritingInput,
  normalizeWritingTitle,
  persistRedirectWritingSnapshot,
  serializeWritingSnapshot,
} from "@/domain/writing/model/writing-sync.service"
