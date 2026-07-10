"use client"

import { createContext, useContext, type ReactNode } from "react"

export type ResourceStructureAvailabilityReporter = (
  structureChangesAllowed: boolean
) => void

const ResourceStructureAvailabilityContext =
  createContext<ResourceStructureAvailabilityReporter | null>(null)

export function ResourceStructureAvailabilityProvider({
  children,
  report,
}: {
  readonly children: ReactNode
  readonly report: ResourceStructureAvailabilityReporter
}) {
  return (
    <ResourceStructureAvailabilityContext.Provider value={report}>
      {children}
    </ResourceStructureAvailabilityContext.Provider>
  )
}

export function useResourceStructureAvailabilityReporter(): ResourceStructureAvailabilityReporter {
  const reporter = useContext(ResourceStructureAvailabilityContext)

  if (reporter === null) {
    throw new Error(
      "자료 편집기는 ResourceStructureAvailabilityProvider 안에서 사용해야 합니다."
    )
  }

  return reporter
}
