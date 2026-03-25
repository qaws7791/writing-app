// repositories
export {
  createAppRepository,
  type AppRepository,
  type AutosaveDraftResult,
  type CreateDraftInput,
  type AppRepositoryMode,
} from "./repositories/app-repository"
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
export { useDocumentHydration } from "./hooks/use-document-hydration"
export {
  useEditorLeaveGuard,
  type FlushPendingDraftResult,
} from "./hooks/use-editor-leave-guard"
export { useSyncEngine, type SyncStatus } from "./hooks/use-sync-engine"
export { useWritingPage, type WritingPageProps } from "./hooks/use-writing-page"

// components
export { SyncStatusIndicator } from "./components/sync-status-indicator"
export { default as WritingBodyEditor } from "./components/writing-body-editor"
export { WritingPageBody } from "./components/writing-page-body"
export { WritingPageHeader } from "./components/writing-page-header"
export { WritingPageDialogs } from "./components/writing-page-dialogs"
export { WritingExportModal } from "./components/writing-export-modal"
export { WritingVersionHistoryModal } from "./components/writing-version-history-modal"
