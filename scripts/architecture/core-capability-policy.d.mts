export type CoreCapabilityImportViolation = {
  readonly importedCapability: string
  readonly importerCapability: string
  readonly moduleSource: string
}

export const approvedCoreCrossCapabilityImportMap: Readonly<
  Record<string, readonly string[]>
>

export const canonicalCoreCapabilityContractSources: readonly string[]

export function readCoreCapabilityImportViolation(input: {
  readonly moduleSource: string
  readonly sourcePath: string
}): CoreCapabilityImportViolation | null

export function isForbiddenCoreCapabilityContractSource(
  moduleSource: string
): boolean
