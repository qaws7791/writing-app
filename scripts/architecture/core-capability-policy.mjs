export const approvedCoreCrossCapabilityImportMap = Object.freeze({})

export const canonicalCoreCapabilityContractSources = Object.freeze([
  "@workspace/contracts/admin/ai-chat-data",
  "@workspace/contracts/admin/content-data",
  "@workspace/contracts/admin/dashboard-analytics-data",
  "@workspace/contracts/admin/identity-data",
  "@workspace/contracts/admin/resource-library-data",
  "@workspace/contracts/admin/settings-data",
  "@workspace/contracts/learning/read-data",
  "@workspace/contracts/learning/step-data",
])

const canonicalCoreCapabilityContractSourceSet = new Set(
  canonicalCoreCapabilityContractSources
)

/**
 * @param {{ readonly moduleSource: string; readonly sourcePath: string }} input
 * @returns {{
 *   readonly importedCapability: string
 *   readonly importerCapability: string
 *   readonly moduleSource: string
 * } | null}
 */
export function readCoreCapabilityImportViolation({
  moduleSource,
  sourcePath,
}) {
  const importerCapability = readCoreCapabilityFromSourcePath(sourcePath)
  const importedCapability = readCoreCapabilityFromModuleSource(moduleSource)

  if (
    importerCapability === null ||
    importedCapability === null ||
    importerCapability === importedCapability
  ) {
    return null
  }

  const approvedModuleSources =
    approvedCoreCrossCapabilityImportMap[importerCapability]

  if (
    Array.isArray(approvedModuleSources) &&
    approvedModuleSources.includes(moduleSource)
  ) {
    return null
  }

  return {
    importedCapability,
    importerCapability,
    moduleSource,
  }
}

/**
 * @param {string} moduleSource
 * @returns {boolean}
 */
export function isForbiddenCoreCapabilityContractSource(moduleSource) {
  const isCapabilityContractSource = [
    "@workspace/contracts/admin",
    "@workspace/contracts/learning",
  ].some(
    (capabilitySource) =>
      moduleSource === capabilitySource ||
      moduleSource.startsWith(`${capabilitySource}/`)
  )

  return (
    isCapabilityContractSource &&
    !canonicalCoreCapabilityContractSourceSet.has(moduleSource)
  )
}

/**
 * @param {string} sourcePath
 * @returns {string | null}
 */
function readCoreCapabilityFromSourcePath(sourcePath) {
  const normalizedSourcePath = sourcePath.replaceAll("\\", "/")
  const coreSourceMarker = "packages/core/src/"
  const markerIndex = normalizedSourcePath.lastIndexOf(coreSourceMarker)
  const coreRelativePath =
    markerIndex === -1
      ? normalizedSourcePath.replace(/^\.\//u, "")
      : normalizedSourcePath.slice(markerIndex + coreSourceMarker.length)

  return coreRelativePath.match(/^modules\/([^/]+)(?:\/|$)/u)?.[1] ?? null
}

/**
 * @param {string} moduleSource
 * @returns {string | null}
 */
function readCoreCapabilityFromModuleSource(moduleSource) {
  return moduleSource.match(/^#core\/modules\/([^/]+)(?:\/|$)/u)?.[1] ?? null
}
