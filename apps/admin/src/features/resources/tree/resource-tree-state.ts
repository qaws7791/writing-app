"use client"

import { useCallback, useReducer } from "react"

import type { ResourceWorkspaceConnectionState } from "@/features/resources/resource-workspace-state"
import type { PendingTreeAction } from "@/features/resources/tree/resource-tree-types"

export type ResourceTreeState = {
  readonly errorMessage: string | null
  readonly pendingAction: PendingTreeAction | null
  readonly workspaceConnectionState: ResourceWorkspaceConnectionState
}

export type ResourceTreeStateEvent =
  | { readonly message: string | null; readonly type: "error-changed" }
  | {
      readonly action: PendingTreeAction | null
      readonly type: "pending-action-changed"
    }
  | { readonly type: "workspace-connected" }
  | { readonly type: "workspace-connection-interrupted" }
  | { readonly type: "workspace-reconnecting" }

export function reduceResourceTreeState(
  state: ResourceTreeState,
  event: ResourceTreeStateEvent
): ResourceTreeState {
  switch (event.type) {
    case "error-changed":
      return { ...state, errorMessage: event.message }
    case "pending-action-changed":
      return { ...state, pendingAction: event.action }
    case "workspace-connected":
      return { ...state, workspaceConnectionState: "online" }
    case "workspace-connection-interrupted":
      return state.workspaceConnectionState === "reconnecting"
        ? state
        : { ...state, workspaceConnectionState: "preparing" }
    case "workspace-reconnecting":
      return { ...state, workspaceConnectionState: "reconnecting" }
  }
}

export function useResourceTreeState(initialErrorMessage: string | null) {
  const [state, dispatch] = useReducer(reduceResourceTreeState, {
    errorMessage: initialErrorMessage,
    pendingAction: null,
    workspaceConnectionState: "preparing",
  })

  const reportConnectionInterrupted = useCallback(() => {
    dispatch({ type: "workspace-connection-interrupted" })
  }, [])
  const reportConnected = useCallback(() => {
    dispatch({ type: "workspace-connected" })
  }, [])
  const reportReconnecting = useCallback(() => {
    dispatch({ type: "workspace-reconnecting" })
  }, [])
  const setErrorMessage = useCallback((message: string | null) => {
    dispatch({ message, type: "error-changed" })
  }, [])
  const setPendingAction = useCallback((action: PendingTreeAction | null) => {
    dispatch({ action, type: "pending-action-changed" })
  }, [])

  return {
    ...state,
    reportConnectionInterrupted,
    reportConnected,
    reportReconnecting,
    setErrorMessage,
    setPendingAction,
  }
}
