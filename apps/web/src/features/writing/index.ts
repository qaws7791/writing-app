// repositories
export {
  createAppRepository,
  type AppRepository,
  type AutosaveDraftResult,
  type CreateDraftInput,
  type AppRepositoryMode,
} from "./repositories/app-repository"
export {
  createDraftDataSource,
  type DraftDataSource,
} from "./repositories/draft-data-source"
export {
  createDraftListDataSource,
  type DraftListDataSource,
} from "./repositories/draft-list-data-source"
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
} from "./sync/sync-engine"
export {
  createSyncTransport,
  SyncTransportError,
  type SyncTransport,
} from "./sync/sync-transport"
export { getLocalDb } from "./sync/local-db"
export {
  captureContentChange,
  captureTitleChange,
  captureFullSnapshot,
} from "./sync/change-capture"
export { resolveConflict, applyServerState } from "./sync/conflict-resolver"
export {
  createTabCoordinator,
  type TabCoordinator,
} from "./sync/multi-tab-coordinator"
export {
  syncMachine,
  type SyncMachineContext,
  type SyncMachineEvent,
} from "./sync/sync-machine"
export {
  registerSyncServiceWorker,
  requestBackgroundSync,
  onServiceWorkerMessage,
} from "./sync/service-worker-bridge"
export type {
  Operation,
  LocalDocument,
  PendingTransaction,
  LocalVersion,
  SyncState,
  TabMessage,
} from "./sync/types"

// hooks
export { draftQueryKeys, versionQueryKeys } from "./hooks/draft-query-keys"
export { useDocumentHydration } from "./hooks/use-document-hydration"
export {
  useEditorLeaveGuard,
  type FlushPendingDraftResult,
} from "./hooks/use-editor-leave-guard"
export { useSyncEngine, type SyncStatus } from "./hooks/use-sync-engine"
export { useCreateDraftMutation } from "./hooks/use-create-draft-mutation"
export { useDraftDetailQuery } from "./hooks/use-draft-detail-query"
export { useDraftListQuery } from "./hooks/use-draft-list-query"
export { useDraftPromptQuery } from "./hooks/use-draft-prompt-query"
export { useAutosaveDraftMutation } from "./hooks/use-autosave-draft-mutation"
export { useDeleteDraftMutation } from "./hooks/use-delete-draft-mutation"
export { useSaveVersionMutation } from "./hooks/use-save-version-mutation"
export { useEditorDraft } from "./hooks/use-editor-draft"
export { useDraftAutosave } from "./hooks/use-draft-autosave"
export { useVersionHistory } from "./hooks/use-version-history"

// components
export { CreateDraftCard } from "./components/create-draft-card"
export { DraftListItem } from "./components/draft-list-item"
export { DraftListSection } from "./components/draft-list-section"
export { SyncStatusIndicator } from "./components/sync-status-indicator"
export { default as WritingBodyEditor } from "./components/writing-body-editor"
export { WritingEditorBody } from "./components/writing-editor-body"
export { WritingEditorHeader } from "./components/writing-editor-header"
export { WritingEditorDialogs } from "./components/writing-editor-dialogs"
export { WritingExportModal } from "./components/writing-export-modal"
export { WritingVersionHistoryModal } from "./components/writing-version-history-modal"
