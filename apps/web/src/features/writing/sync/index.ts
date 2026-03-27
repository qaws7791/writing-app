// --- Engine (primary entry point) ---
export {
  createSyncEngine,
  type SyncEngine,
  type SyncEngineConfig,
  type DocumentUpdate,
} from "./sync-engine"

// --- Transport (HTTP layer) ---
export {
  createSyncTransport,
  SyncTransportError,
  type SyncTransport,
} from "./sync-transport"

// --- Service Worker lifecycle ---
export {
  registerSyncServiceWorker,
  requestBackgroundSync,
  onServiceWorkerMessage,
} from "./service-worker-bridge"

// --- Local document cache (for hydration before engine starts) ---
export { getDocument, putDocument } from "./local-db"

// --- Shared domain types that cross the module boundary ---
export type {
  Operation,
  VersionSummary,
  VersionDetail,
  SyncPushRequest,
  SyncPushResponse,
  SyncPullResponse,
} from "./types"
