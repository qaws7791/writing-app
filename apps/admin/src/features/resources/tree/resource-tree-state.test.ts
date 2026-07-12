import { describe, expect, it } from "vitest"

import {
  reduceResourceTreeState,
  type ResourceTreeState,
  type ResourceTreeStateEvent,
} from "@/features/resources/tree/resource-tree-state"

const initialState: ResourceTreeState = {
  errorMessage: null,
  pendingAction: null,
  workspaceConnectionState: "preparing",
}

describe("자료 트리 상태 reducer", () => {
  it.each<{
    readonly event: ResourceTreeStateEvent
    readonly expectedConnection: ResourceTreeState["workspaceConnectionState"]
    readonly name: string
    readonly state: ResourceTreeState
  }>([
    {
      event: { type: "workspace-connected" },
      expectedConnection: "online",
      name: "연결 성공",
      state: initialState,
    },
    {
      event: { type: "workspace-connection-interrupted" },
      expectedConnection: "preparing",
      name: "초기 연결 중단",
      state: { ...initialState, workspaceConnectionState: "online" },
    },
    {
      event: { type: "workspace-connection-interrupted" },
      expectedConnection: "reconnecting",
      name: "재연결 경고 유지",
      state: { ...initialState, workspaceConnectionState: "reconnecting" },
    },
    {
      event: { type: "workspace-reconnecting" },
      expectedConnection: "reconnecting",
      name: "재연결 경고 전환",
      state: initialState,
    },
  ])(
    "$name 상태를 결정적으로 계산한다",
    ({ event, expectedConnection, state }) => {
      expect(
        reduceResourceTreeState(state, event).workspaceConnectionState
      ).toBe(expectedConnection)
    }
  )

  it("오류와 pending action을 서로 덮어쓰지 않고 갱신한다", () => {
    const node = {
      hasChildren: false,
      id: "document-1",
      kind: "document",
      name: "문서",
      parentId: null,
      sortOrder: 0,
      status: "active",
    } as const
    const withAction = reduceResourceTreeState(initialState, {
      action: { action: "rename", node },
      type: "pending-action-changed",
    })
    const withError = reduceResourceTreeState(withAction, {
      message: "실패",
      type: "error-changed",
    })

    expect(withError).toMatchObject({
      errorMessage: "실패",
      pendingAction: { action: "rename", node },
    })
    expect(initialState).toEqual({
      errorMessage: null,
      pendingAction: null,
      workspaceConnectionState: "preparing",
    })
  })
})
