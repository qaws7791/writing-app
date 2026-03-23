export {
  createSyncEngine,
  type SyncEngine,
  type SyncEngineConfig,
  type DocumentUpdate,
} from "./sync-engine"
export {
  createSyncTransport,
  SyncTransportError,
  type SyncTransport,
} from "./sync-transport"
export { getLocalDb } from "./local-db"
export {
  captureContentChange,
  captureTitleChange,
  captureFullSnapshot,
} from "./change-capture"
export { resolveConflict, applyServerState } from "./conflict-resolver"
export {
  createTabCoordinator,
  type TabCoordinator,
} from "./multi-tab-coordinator"
export {
  syncMachine,
  type SyncMachineContext,
  type SyncMachineEvent,
} from "./sync-machine"
export {
  registerSyncServiceWorker,
  requestBackgroundSync,
  onServiceWorkerMessage,
} from "./service-worker-bridge"
export type {
  Operation,
  LocalDocument,
  PendingTransaction,
  LocalVersion,
  SyncState,
  TabMessage,
} from "./types"
