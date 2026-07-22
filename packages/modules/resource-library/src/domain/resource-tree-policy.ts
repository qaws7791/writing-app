import type {
  ResourceFolderId,
  ResourceNodeId,
  ResourceTreeEntry,
  ResourceTreeNode,
} from "#resource-library/domain/resource-tree-node"

const resourceNameMaxLength = 120
export const resourceMaxNodeCount = 1_000
export const resourceMaxFolderDepth = 3

const resourceNameSegmenter = new Intl.Segmenter("ko", {
  granularity: "grapheme",
})

export type ResourceName = Readonly<{
  name: string
  normalizedName: string
}>

export type ResourceNameValidation =
  | (ResourceName & Readonly<{ status: "valid" }>)
  | Readonly<{
      reason: "empty" | "invalid-character" | "too-long"
      status: "invalid"
    }>

export type ResourceNameChangeValidation =
  | (ResourceName & Readonly<{ status: "valid" }>)
  | Readonly<{
      reason: "conflict" | "empty" | "invalid-character" | "too-long"
      status: "invalid"
    }>

export function normalizeResourceName(name: string): ResourceNameValidation {
  const displayName = name.normalize("NFC").trim()

  if (displayName.length === 0) {
    return { reason: "empty", status: "invalid" }
  }
  if (displayName.length > resourceNameMaxLength) {
    return { reason: "too-long", status: "invalid" }
  }
  if (/\p{Cc}/u.test(displayName)) {
    return { reason: "invalid-character", status: "invalid" }
  }

  return {
    name: displayName,
    normalizedName: displayName.toLowerCase().normalize("NFC"),
    status: "valid",
  }
}

export function createAvailableResourceName(
  baseName: string,
  occupiedNormalizedNames: readonly string[]
): ResourceName {
  const base = normalizeResourceName(baseName)
  if (base.status === "invalid") {
    throw new TypeError("자동 생성할 자료 이름이 유효하지 않습니다.")
  }

  const occupied = new Set(occupiedNormalizedNames)
  if (!occupied.has(base.normalizedName)) {
    return { name: base.name, normalizedName: base.normalizedName }
  }

  let suffixNumber = 2
  while (true) {
    const suffix = ` (${suffixNumber})`
    const candidateName = `${truncateResourceName(
      base.name,
      resourceNameMaxLength - suffix.length
    )}${suffix}`
    const candidate = normalizeResourceName(candidateName)
    if (
      candidate.status === "valid" &&
      !occupied.has(candidate.normalizedName)
    ) {
      return {
        name: candidate.name,
        normalizedName: candidate.normalizedName,
      }
    }
    suffixNumber += 1
  }
}

export function validateResourceNameChange(input: {
  readonly currentNormalizedName: string
  readonly name: string
  readonly occupiedNormalizedNames: readonly string[]
}): ResourceNameChangeValidation {
  const candidate = normalizeResourceName(input.name)
  if (candidate.status === "invalid") return candidate

  if (
    candidate.normalizedName !== input.currentNormalizedName &&
    input.occupiedNormalizedNames.includes(candidate.normalizedName)
  ) {
    return { reason: "conflict", status: "invalid" }
  }
  return candidate
}

export function validateResourceMove(input: {
  readonly destinationAncestorIds: readonly ResourceFolderId[]
  readonly destinationParentId: ResourceFolderId | null
  readonly movingNodeId: ResourceNodeId
}):
  | Readonly<{ status: "valid" }>
  | Readonly<{ reason: "cycle"; status: "invalid" }> {
  return input.destinationParentId === input.movingNodeId ||
    input.destinationAncestorIds.some(
      (ancestorId) => ancestorId === input.movingNodeId
    )
    ? { reason: "cycle", status: "invalid" }
    : { status: "valid" }
}

export type ResourceSubtreeTransition =
  | Readonly<{ nodes: readonly ResourceTreeNode[]; status: "valid" }>
  | Readonly<{
      reason: "invalid-subtree" | "root-not-found"
      status: "invalid"
    }>

export function trashResourceSubtree(
  nodes: readonly ResourceTreeNode[],
  trashRootId: ResourceNodeId
): ResourceSubtreeTransition {
  if (!isConnectedResourceSubtree(nodes, trashRootId)) {
    return {
      reason: nodes.some(({ id }) => id === trashRootId)
        ? "invalid-subtree"
        : "root-not-found",
      status: "invalid",
    }
  }

  return {
    nodes: nodes.map((node) =>
      Object.freeze({ ...node, status: "trashed" as const, trashRootId })
    ),
    status: "valid",
  }
}

export function restoreResourceSubtree(input: {
  readonly nodes: readonly ResourceTreeNode[]
  readonly occupiedTargetSiblingNormalizedNames: readonly string[]
  readonly trashRootId: ResourceNodeId
}): ResourceSubtreeTransition {
  const root = input.nodes.find(({ id }) => id === input.trashRootId)
  if (root === undefined) {
    return { reason: "root-not-found", status: "invalid" }
  }
  if (
    !isConnectedResourceSubtree(input.nodes, input.trashRootId) ||
    input.nodes.some(
      (node) =>
        node.status !== "trashed" || node.trashRootId !== input.trashRootId
    )
  ) {
    return { reason: "invalid-subtree", status: "invalid" }
  }

  const availableRootName = createAvailableResourceName(
    root.name,
    input.occupiedTargetSiblingNormalizedNames
  )
  return {
    nodes: input.nodes.map((node) =>
      Object.freeze({
        ...node,
        ...(node.id === input.trashRootId ? availableRootName : {}),
        status: "active" as const,
        trashRootId: null,
      })
    ),
    status: "valid",
  }
}

export function sortResourceTreeEntries(
  entries: readonly ResourceTreeEntry[]
): readonly ResourceTreeEntry[] {
  return [...entries].sort((left, right) => {
    const byName = left.node.normalizedName.localeCompare(
      right.node.normalizedName,
      "ko"
    )
    return byName === 0 ? left.node.id.localeCompare(right.node.id) : byName
  })
}

function truncateResourceName(name: string, maxLength: number): string {
  let truncatedName = ""
  for (const { segment } of resourceNameSegmenter.segment(name)) {
    if (truncatedName.length + segment.length > maxLength) break
    truncatedName += segment
  }
  return truncatedName
}

function isConnectedResourceSubtree(
  nodes: readonly ResourceTreeNode[],
  rootId: ResourceNodeId
): boolean {
  const nodeIds = new Set(nodes.map(({ id }) => id))
  if (nodeIds.size !== nodes.length || !nodeIds.has(rootId)) return false

  const childIdsByParentId = new Map<ResourceNodeId, ResourceNodeId[]>()
  for (const node of nodes) {
    if (node.id === rootId) continue
    if (node.parentId === null || !nodeIds.has(node.parentId)) return false
    const children = childIdsByParentId.get(node.parentId) ?? []
    children.push(node.id)
    childIdsByParentId.set(node.parentId, children)
  }

  const connected = new Set<ResourceNodeId>()
  const pending: ResourceNodeId[] = [rootId]
  while (pending.length > 0) {
    const nodeId = pending.pop()
    if (nodeId === undefined || connected.has(nodeId)) continue
    connected.add(nodeId)
    pending.push(...(childIdsByParentId.get(nodeId) ?? []))
  }
  return connected.size === nodes.length
}
