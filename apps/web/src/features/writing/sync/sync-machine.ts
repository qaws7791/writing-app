import { assign, setup } from "xstate"

import type { DraftContent } from "@workspace/core"

// --- Context ---

export type SyncMachineContext = {
  draftId: number
  baseVersion: number
  retryCount: number
  maxRetries: number
  lastSyncedAt: string | null
  pendingCount: number
  error: string | null
  isOnline: boolean
  conflictData: {
    serverVersion: number
    serverContent: DraftContent
    serverTitle: string
  } | null
}

// --- Events ---

export type SyncMachineEvent =
  | { type: "CHANGE_DETECTED" }
  | { type: "FLUSH" }
  | { type: "SYNC_SUCCESS"; serverVersion: number }
  | {
      type: "SYNC_CONFLICT"
      serverVersion: number
      serverContent: DraftContent
      serverTitle: string
    }
  | { type: "SYNC_ERROR"; error: string }
  | { type: "CONFLICT_RESOLVED"; baseVersion: number }
  | { type: "NETWORK_ONLINE" }
  | { type: "NETWORK_OFFLINE" }
  | { type: "FORCE_PULL" }

// --- Constants ---

const DEBOUNCE_MS = 300
const PERIODIC_PULL_MS = 30_000
const RETRY_MS = 1_000

// --- Machine ---

export const syncMachine = setup({
  types: {
    context: {} as SyncMachineContext,
    events: {} as SyncMachineEvent,
    input: {} as { draftId: number; baseVersion: number },
  },
  delays: {
    debounce: DEBOUNCE_MS,
    periodicPull: PERIODIC_PULL_MS,
    retry: RETRY_MS,
  },
  guards: {
    canRetry: ({ context }) => context.retryCount < context.maxRetries,
  },
}).createMachine({
  id: "sync",
  type: "parallel",
  context: ({ input }) => ({
    draftId: input.draftId,
    baseVersion: input.baseVersion,
    retryCount: 0,
    maxRetries: 5,
    lastSyncedAt: null,
    pendingCount: 0,
    error: null,
    isOnline: true,
    conflictData: null,
  }),
  states: {
    networkMonitor: {
      initial: "online",
      states: {
        online: {
          on: {
            NETWORK_OFFLINE: {
              target: "offline",
              actions: assign({ isOnline: false }),
            },
          },
        },
        offline: {
          on: {
            NETWORK_ONLINE: {
              target: "online",
              actions: assign({ isOnline: true }),
            },
          },
        },
      },
    },
    periodicPull: {
      initial: "waiting",
      states: {
        waiting: {
          after: {
            periodicPull: "pulling",
          },
          on: {
            FORCE_PULL: "pulling",
          },
        },
        pulling: {
          always: "waiting",
        },
      },
    },
    syncCore: {
      initial: "idle",
      states: {
        idle: {
          on: {
            CHANGE_DETECTED: "debouncing",
          },
        },
        debouncing: {
          after: {
            debounce: "syncing",
          },
          on: {
            CHANGE_DETECTED: "debouncing",
          },
        },
        syncing: {
          on: {
            SYNC_SUCCESS: {
              target: "idle",
              actions: assign(({ event }) => ({
                lastSyncedAt: new Date().toISOString(),
                error: null,
                retryCount: 0,
                baseVersion: event.serverVersion,
              })),
            },
            SYNC_CONFLICT: {
              target: "resolving",
              actions: assign(({ event }) => ({
                conflictData: {
                  serverVersion: event.serverVersion,
                  serverContent: event.serverContent,
                  serverTitle: event.serverTitle,
                },
              })),
            },
            SYNC_ERROR: [
              {
                target: "retrying",
                guard: "canRetry",
                actions: assign(({ context, event }) => ({
                  retryCount: context.retryCount + 1,
                  error: event.error,
                })),
              },
              {
                target: "error",
                actions: assign(({ event }) => ({
                  error: event.error,
                })),
              },
            ],
            CHANGE_DETECTED: "syncing",
            NETWORK_OFFLINE: "idle",
          },
        },
        retrying: {
          after: {
            retry: "syncing",
          },
          on: {
            CHANGE_DETECTED: "debouncing",
            NETWORK_OFFLINE: "idle",
            NETWORK_ONLINE: "syncing",
          },
        },
        resolving: {
          on: {
            CONFLICT_RESOLVED: {
              target: "idle",
              actions: assign(({ event }) => ({
                retryCount: 0,
                error: null,
                conflictData: null,
                baseVersion: event.baseVersion,
              })),
            },
          },
        },
        error: {
          on: {
            CHANGE_DETECTED: "debouncing",
            NETWORK_ONLINE: "debouncing",
          },
        },
      },
    },
  },
})
