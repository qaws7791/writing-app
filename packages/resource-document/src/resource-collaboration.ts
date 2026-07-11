import type { Binding, Provider, UserState } from "@lexical/yjs"
import {
  createBinding,
  createUndoManager,
  syncLexicalUpdateToYjs,
  syncYjsChangesToLexical,
} from "@lexical/yjs"
import type { LexicalEditor, LexicalNode } from "lexical"
import {
  $getRoot,
  $isElementNode,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_EDITOR,
  REDO_COMMAND,
  SKIP_COLLAB_TAG,
  UNDO_COMMAND,
} from "lexical"
import type { Doc as YjsDocument, Text as YjsText, YEvent } from "yjs"
import {
  applyUpdate,
  Doc,
  encodeStateAsUpdate,
  encodeStateVector,
  UndoManager,
} from "yjs"

import {
  createResourceDocumentEditor,
  readResourceDocumentMarkdown,
  replaceResourceDocumentMarkdown,
  type InvalidResourceMarkdown,
  type ResourceMarkdownNormalization,
} from "#resource-document/resource-markdown"
import {
  $validateResourceDocumentStructure,
  type ResourceDocumentStructureValidation,
} from "#resource-document/resource-lexical-validation"
import { validateResourceMarkdown } from "#resource-document/resource-markdown-validation"

type DirectResourceDocumentCollaboration = {
  readonly binding: Binding
  disconnect(): void
}

export type ResourceDocumentCollaboration =
  DirectResourceDocumentCollaboration & {
    getRemoteValidation(): ResourceDocumentStructureValidation
  }

export type ConnectResourceDocumentCollaborationInput = {
  readonly document: YjsDocument
  readonly editor: LexicalEditor
  readonly id: string
  readonly onRemoteValidationChange: (
    validation: ResourceDocumentStructureValidation
  ) => void
  readonly provider: Provider
}

export function connectResourceDocumentCollaboration({
  document,
  editor,
  id,
  onRemoteValidationChange,
  provider,
}: ConnectResourceDocumentCollaborationInput): ResourceDocumentCollaboration {
  const clearResult = replaceResourceDocumentMarkdown(editor, "")

  if (clearResult.status === "invalid") {
    throw new Error("공동 편집 연결 전에 화면 문서를 초기화하지 못했습니다.")
  }

  const validationDocument = new Doc()
  const validationCollaboration = createDirectHeadlessCollaboration({
    document: validationDocument,
    id: `${id}:validation`,
  })
  const editorDocument = new Doc()
  const editorCollaboration = connectDirectResourceDocumentCollaboration({
    document: editorDocument,
    editor,
    id,
    provider,
  })
  const validationToEditorOrigin = Symbol("validation-to-editor")
  const editorToNetworkOrigin = Symbol("editor-to-network")
  let remoteValidation: ResourceDocumentStructureValidation = {
    status: "valid",
  }
  let previousReportedValidation: string | null = null
  let disconnected = false

  const reportValidation = (
    validation: ResourceDocumentStructureValidation
  ) => {
    remoteValidation = validation
    const serializedValidation = JSON.stringify(validation)

    if (serializedValidation !== previousReportedValidation) {
      previousReportedValidation = serializedValidation
      onRemoteValidationChange(validation)
    }
  }
  const mirrorValidatedNetworkState = (update: Uint8Array) => {
    let validation: ResourceDocumentStructureValidation

    try {
      applyUpdate(validationDocument, update)
      validation = validationCollaboration.editor.read(() =>
        $validateResourceDocumentStructure()
      )
    } catch {
      reportValidation({
        issues: [{ code: "invalid-collaboration-state" }],
        status: "invalid",
      })
      return
    }

    reportValidation(validation)

    if (validation.status === "invalid") {
      return
    }

    const safeUpdate = encodeStateAsUpdate(
      validationDocument,
      encodeStateVector(editorDocument)
    )

    applyUpdate(editorDocument, safeUpdate, validationToEditorOrigin)
  }
  const onNetworkUpdate = (update: Uint8Array) => {
    mirrorValidatedNetworkState(update)
  }
  const onEditorUpdate = (update: Uint8Array, origin: unknown) => {
    if (origin !== validationToEditorOrigin) {
      applyUpdate(document, update, editorToNetworkOrigin)
    }
  }

  document.on("update", onNetworkUpdate)
  editorDocument.on("update", onEditorUpdate)
  mirrorValidatedNetworkState(encodeStateAsUpdate(document))
  editor.update(() => undefined, { discrete: true })

  return {
    binding: editorCollaboration.binding,
    disconnect() {
      if (disconnected) {
        return
      }

      disconnected = true
      document.off("update", onNetworkUpdate)
      editorDocument.off("update", onEditorUpdate)

      try {
        editorCollaboration.disconnect()
      } finally {
        try {
          validationCollaboration.disconnect()
        } finally {
          try {
            editorDocument.destroy()
          } finally {
            try {
              validationDocument.destroy()
            } finally {
              replaceResourceDocumentMarkdown(editor, "")
            }
          }
        }
      }
    },
    getRemoteValidation() {
      return remoteValidation
    },
  }
}

type ConnectDirectResourceDocumentCollaborationInput = Omit<
  ConnectResourceDocumentCollaborationInput,
  "onRemoteValidationChange"
>

function connectDirectResourceDocumentCollaboration({
  document,
  editor,
  id,
  provider,
}: ConnectDirectResourceDocumentCollaborationInput): DirectResourceDocumentCollaboration {
  const documentMap = new Map([[id, document]])
  const binding = createBinding(editor, provider, id, document, documentMap)
  const sharedRoot = binding.root.getSharedType()
  const undoManager = createUndoManager(binding, sharedRoot)
  const onYjsTreeChanges = (
    events: YEvent<YjsText>[],
    transaction: YEvent<YjsText>["transaction"]
  ) => {
    if (transaction.origin === binding) {
      return
    }

    syncYjsChangesToLexical(
      binding,
      provider,
      events,
      transaction.origin instanceof UndoManager,
      () => undefined
    )
  }

  sharedRoot.observeDeep(onYjsTreeChanges)
  const removeUpdateListener = editor.registerUpdateListener(
    ({
      dirtyElements,
      dirtyLeaves,
      editorState,
      normalizedNodes,
      prevEditorState,
      tags,
    }) => {
      if (tags.has(SKIP_COLLAB_TAG)) {
        return
      }

      syncLexicalUpdateToYjs(
        binding,
        provider,
        prevEditorState,
        editorState,
        dirtyElements,
        dirtyLeaves,
        normalizedNodes,
        tags
      )
    }
  )
  const removeUndoCommands = registerCollaborationUndo(editor, undoManager)

  return {
    binding,
    disconnect() {
      sharedRoot.unobserveDeep(onYjsTreeChanges)
      removeUndoCommands()
      removeUpdateListener()
      undoManager.destroy()
      binding.root.destroy(binding)
    },
  }
}

function registerCollaborationUndo(
  editor: LexicalEditor,
  undoManager: UndoManager
): () => void {
  const updateAvailability = () => {
    editor.dispatchCommand(CAN_UNDO_COMMAND, undoManager.undoStack.length > 0)
    editor.dispatchCommand(CAN_REDO_COMMAND, undoManager.redoStack.length > 0)
  }
  const removeUndoCommand = editor.registerCommand(
    UNDO_COMMAND,
    () => {
      undoManager.undo()
      return true
    },
    COMMAND_PRIORITY_EDITOR
  )
  const removeRedoCommand = editor.registerCommand(
    REDO_COMMAND,
    () => {
      undoManager.redo()
      return true
    },
    COMMAND_PRIORITY_EDITOR
  )

  undoManager.on("stack-item-added", updateAvailability)
  undoManager.on("stack-item-popped", updateAvailability)
  undoManager.on("stack-cleared", updateAvailability)
  updateAvailability()

  return () => {
    undoManager.off("stack-item-added", updateAvailability)
    undoManager.off("stack-item-popped", updateAvailability)
    undoManager.off("stack-cleared", updateAvailability)
    removeRedoCommand()
    removeUndoCommand()
  }
}

export type HeadlessResourceDocumentCollaboration =
  DirectResourceDocumentCollaboration & {
    readonly editor: LexicalEditor
  }

export type CreateHeadlessResourceDocumentCollaborationInput = {
  readonly document: YjsDocument
  readonly id: string
}

export function createHeadlessResourceDocumentCollaboration({
  document,
  id,
}: CreateHeadlessResourceDocumentCollaborationInput): HeadlessResourceDocumentCollaboration {
  return createDirectHeadlessCollaboration({ document, id })
}

function createDirectHeadlessCollaboration({
  document,
  id,
}: CreateHeadlessResourceDocumentCollaborationInput): HeadlessResourceDocumentCollaboration {
  const editor = createResourceDocumentEditor()
  const collaboration = connectDirectResourceDocumentCollaboration({
    document,
    editor,
    id,
    provider: createHeadlessProvider(),
  })

  return {
    ...collaboration,
    editor,
  }
}

export type ResourceDocumentSnapshotResult =
  | InvalidResourceMarkdown
  | {
      readonly snapshot: Uint8Array
      readonly status: "valid"
    }

export type ApplyResourceDocumentUpdateResult =
  | Extract<ResourceMarkdownNormalization, { readonly status: "invalid" }>
  | {
      readonly markdown: string
      readonly nodeCount: number
      readonly snapshot: Uint8Array
      readonly status: "valid"
    }

export function applyResourceDocumentUpdate(
  snapshot: Uint8Array,
  update: Uint8Array
): ApplyResourceDocumentUpdateResult {
  const document = new Doc()

  try {
    try {
      applyUpdate(document, snapshot)
      applyUpdate(document, update)
    } catch {
      return {
        issues: [{ code: "invalid-collaboration-state" }],
        status: "invalid",
      }
    }

    const nextSnapshot = encodeStateAsUpdate(document)
    const projection =
      projectResourceDocumentSnapshotWithNodeCount(nextSnapshot)

    return projection.status === "invalid"
      ? projection
      : {
          markdown: projection.markdown,
          nodeCount: projection.nodeCount,
          snapshot: nextSnapshot,
          status: "valid",
        }
  } finally {
    document.destroy()
  }
}

export function createResourceDocumentSnapshot(
  markdown: string
): ResourceDocumentSnapshotResult {
  const document = new Doc()
  let collaboration: HeadlessResourceDocumentCollaboration | null = null

  try {
    collaboration = createHeadlessResourceDocumentCollaboration({
      document,
      id: "resource-document-snapshot",
    })
    const result = replaceResourceDocumentMarkdown(
      collaboration.editor,
      markdown
    )

    if (result.status === "invalid") {
      return result
    }

    return {
      snapshot: encodeStateAsUpdate(document),
      status: "valid",
    }
  } finally {
    destroyHeadlessCollaboration(document, collaboration)
  }
}

export function projectResourceDocumentSnapshot(
  snapshot: Uint8Array
): ResourceMarkdownNormalization {
  const projection = projectResourceDocumentSnapshotWithNodeCount(snapshot)

  return projection.status === "invalid"
    ? projection
    : { markdown: projection.markdown, status: "valid" }
}

type ResourceDocumentProjectionWithNodeCount =
  | Extract<ResourceMarkdownNormalization, { readonly status: "invalid" }>
  | {
      readonly markdown: string
      readonly nodeCount: number
      readonly status: "valid"
    }

function projectResourceDocumentSnapshotWithNodeCount(
  snapshot: Uint8Array
): ResourceDocumentProjectionWithNodeCount {
  const document = new Doc()
  let collaboration: HeadlessResourceDocumentCollaboration | null = null

  try {
    collaboration = createHeadlessResourceDocumentCollaboration({
      document,
      id: "resource-document-projection",
    })

    try {
      applyUpdate(document, snapshot)
    } catch {
      return {
        issues: [{ code: "invalid-collaboration-state" }],
        status: "invalid",
      }
    }

    let projection: ResourceMarkdownNormalization

    try {
      projection = readResourceDocumentMarkdown(collaboration.editor)
    } catch {
      return {
        issues: [{ code: "invalid-collaboration-state" }],
        status: "invalid",
      }
    }

    if (projection.status === "invalid") {
      return projection
    }

    const result = validateResourceMarkdown(projection.markdown)

    return result.status === "invalid"
      ? result
      : {
          markdown: projection.markdown,
          nodeCount: collaboration.editor
            .getEditorState()
            .read(() => countLexicalNodes($getRoot())),
          status: "valid",
        }
  } finally {
    destroyHeadlessCollaboration(document, collaboration)
  }
}

function countLexicalNodes(node: LexicalNode): number {
  if (!$isElementNode(node)) return 1

  return node
    .getChildren()
    .reduce((count, child) => count + countLexicalNodes(child), 1)
}

function destroyHeadlessCollaboration(
  document: YjsDocument,
  collaboration: HeadlessResourceDocumentCollaboration | null
): void {
  try {
    collaboration?.disconnect()
  } finally {
    document.destroy()
  }
}

function createHeadlessProvider(): Provider {
  const emptyStates = new Map<number, UserState>()

  return {
    awareness: {
      getLocalState: () => null,
      getStates: () => emptyStates,
      off: () => undefined,
      on: () => undefined,
      setLocalState: () => undefined,
      setLocalStateField: () => undefined,
    },
    connect: () => undefined,
    disconnect: () => undefined,
    off: () => undefined,
    on: () => undefined,
  }
}
