"use client"

import type { ReactNode } from "react"

import type { ResourceTreeApi } from "@/features/resources/resource-library-api"
import type {
  ResourceEventRevisionGapRecorder,
  ResourceEventsConnector,
} from "@/features/resources/resource-events-client"
import type { AdminResourceTreeScope } from "@/features/resources/resource-library-model"
import { ResourceTreeView } from "@/features/resources/tree/resource-tree-view"
import type { InitialResourceTreeState } from "@/features/resources/tree/resource-tree-types"
import { useResourceTreeController } from "@/features/resources/tree/use-resource-tree-controller"

export type { InitialResourceTreeState } from "@/features/resources/tree/resource-tree-types"

export function ResourceTree({
  toolbarEnd,
  ...controllerInput
}: {
  readonly adminId: string
  readonly api: ResourceTreeApi
  readonly connectEvents: ResourceEventsConnector
  readonly eventsServerUrl: string
  readonly initialTree?: InitialResourceTreeState
  readonly onInitialTreeConsumed?: () => void
  readonly onDocumentOpen: () => void
  readonly recordRevisionGap?: ResourceEventRevisionGapRecorder
  readonly scope: AdminResourceTreeScope
  readonly selectedDocumentId?: string
  readonly toolbarEnd?: ReactNode
}) {
  const controller = useResourceTreeController(controllerInput)

  return <ResourceTreeView controller={controller} toolbarEnd={toolbarEnd} />
}
