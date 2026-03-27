// repositories
export {
  createWritingRepository,
  createLocalWritingRepository,
  type WritingRepository,
  type AutosaveWritingResult,
  type CreateWritingInput,
  type WritingRepositoryMode,
} from "./repositories/writing-repository"
export {
  createVersionDataSource,
  type VersionDataSource,
} from "./repositories/version-data-source"
// sync
export {
  createSyncEngine,
  type SyncEngine,
  type SyncEngineConfig,
  type DocumentUpdate,
  createSyncTransport,
  SyncTransportError,
  type SyncTransport,
  registerSyncServiceWorker,
  requestBackgroundSync,
  onServiceWorkerMessage,
  getDocument,
  putDocument,
  type Operation,
  type VersionSummary,
  type VersionDetail,
  type SyncPushRequest,
  type SyncPushResponse,
  type SyncPullResponse,
} from "./sync"

// hooks
export { writingQueryKeys, versionQueryKeys } from "./hooks/writing-query-keys"
export { useDocumentHydration } from "./hooks/use-document-hydration"
export {
  useEditorLeaveGuard,
  type FlushPendingWritingResult,
} from "./hooks/use-editor-leave-guard"
export { useSyncEngine, type SyncStatus } from "./hooks/use-sync-engine"
export { useCreateWritingMutation } from "./hooks/use-create-writing-mutation"
export { useWritingDetailQuery } from "./hooks/use-writing-detail-query"
export { useWritingListQuery } from "./hooks/use-writing-list-query"
export { useWritingPromptQuery } from "./hooks/use-writing-prompt-query"
export { useAutosaveWritingMutation } from "./hooks/use-autosave-writing-mutation"
export { useDeleteWritingMutation } from "./hooks/use-delete-writing-mutation"
export { useSaveVersionMutation } from "./hooks/use-save-version-mutation"
export { useEditorWriting } from "./hooks/use-editor-writing"
export { useWritingAutosave } from "./hooks/use-writing-autosave"
export { useVersionHistory } from "./hooks/use-version-history"

// components
export { CreateWritingCard } from "./components/create-writing-card"
export { WritingListItem } from "./components/writing-list-item"
export { WritingListSection } from "./components/writing-list-section"
export { SyncStatusIndicator } from "./components/sync-status-indicator"
export { default as WritingBodyEditor } from "./components/writing-body-editor"
export { WritingEditorBody } from "./components/writing-editor-body"
export { WritingEditorHeader } from "./components/writing-editor-header"
export { WritingEditorDialogs } from "./components/writing-editor-dialogs"
export { WritingExportModal } from "./components/writing-export-modal"
export { WritingVersionHistoryModal } from "./components/writing-version-history-modal"
