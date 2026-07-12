"use client"

import { useMemo, useState, useTransition } from "react"
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin"
import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin"
import { ListPlugin } from "@lexical/react/LexicalListPlugin"
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { TablePlugin } from "@lexical/react/LexicalTablePlugin"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import type { EditorThemeClasses } from "lexical"
import {
  CloudCheckIcon,
  CloudUploadIcon,
  DownloadIcon,
  LoaderCircleIcon,
  LockIcon,
  TriangleAlertIcon,
  type LucideIcon,
} from "lucide-react"
import {
  resourceDocumentNodes,
  readResourceDocumentMarkdown,
  resourceMarkdownTransformers,
} from "@workspace/resource-document/resource-markdown"
import { isAllowedResourceLinkUrl } from "@workspace/resource-document/resource-markdown-validation"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import { Button } from "@workspace/ui/components/ui/button"
import { Spinner } from "@workspace/ui/components/ui/spinner"
import { cn } from "@workspace/ui/lib/utils"

import {
  type ResourceDocumentCollaborationConnector,
  type ResourceDocumentCollaborationClient,
  type ResourceDocumentSyncState,
} from "@/features/resources/editor/resource-document-collaboration-client"
import { ResourceDocumentCollaborationPlugin } from "@/features/resources/editor/resource-document-collaboration-plugin"
import { ResourceDraggableBlockPlugin } from "@/features/resources/editor/resource-draggable-block-plugin"
import { ResourceFloatingToolbarPlugin } from "@/features/resources/editor/resource-floating-toolbar-plugin"
import { ResourceSlashMenuPlugin } from "@/features/resources/editor/resource-slash-menu-plugin"
import {
  ResourceBreadcrumb,
  ResourceDocumentMetadata,
} from "@/features/resources/resource-breadcrumb"
import {
  formatResourceExactDate,
  formatResourceRelativeDate,
} from "@/features/resources/resource-document-date"
import {
  createBrowserResourceLibraryApi,
  type ResourceDocumentEditorApi,
} from "@/features/resources/resource-library-api"
import { type ResourceWorkspaceDocumentSyncState } from "@/features/resources/resource-workspace-sync"
import { useResourceWorkspaceSync } from "@/features/resources/resource-workspace-sync-context"
import type { AdminResourceActiveDocument } from "@/features/resources/resource-library-model"
import type { AdminApiBaseUrl } from "@/runtime-config"

const editorTransformers = [...resourceMarkdownTransformers]

const resourceEditorTheme = {
  code: "my-5 block overflow-x-auto rounded-xl bg-muted px-4 py-3 font-mono text-sm leading-6",
  heading: {
    h1: "mt-9 mb-3 text-3xl font-black tracking-tight text-foreground",
    h2: "mt-8 mb-3 text-2xl font-bold tracking-tight text-foreground",
    h3: "mt-6 mb-2 text-xl font-bold text-foreground",
  },
  link: "text-primary underline decoration-primary/40 underline-offset-4",
  list: {
    checklist: "my-3 grid list-none gap-1 pl-0",
    listitem: "my-1 ml-6 pl-1",
    listitemChecked:
      "relative my-1 ml-7 list-none text-muted-foreground line-through before:absolute before:-left-7 before:top-1 before:size-4 before:rounded before:bg-primary before:content-['✓'] before:text-center before:text-xs before:font-bold before:leading-4 before:text-primary-foreground",
    listitemUnchecked:
      "relative my-1 ml-7 list-none before:absolute before:-left-7 before:top-1 before:size-4 before:rounded before:border before:border-border before:bg-background before:content-['']",
    ol: "my-3 list-decimal pl-6",
    ul: "my-3 list-disc pl-6",
  },
  paragraph: "my-2 min-h-7 leading-7 text-foreground",
  quote: "my-5 border-l-4 border-primary/40 pl-4 text-muted-foreground italic",
  table: "my-6 w-full border-collapse overflow-hidden text-sm",
  tableCell: "min-w-28 border border-border px-3 py-2 align-top",
  tableCellHeader:
    "min-w-28 border border-border bg-muted px-3 py-2 text-left font-bold align-top",
  tableScrollableWrapper: "my-6 overflow-x-auto",
  text: {
    bold: "font-bold",
    code: "rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]",
    italic: "italic",
    strikethrough: "line-through",
  },
} satisfies EditorThemeClasses

const initialSyncState: ResourceDocumentSyncState = {
  kind: "connecting",
  message: "공동 편집 서버에 연결 중",
}

export function ResourceDocumentEditor({
  apiBaseUrl,
  document,
}: {
  readonly apiBaseUrl: AdminApiBaseUrl
  readonly document: AdminResourceActiveDocument
}) {
  const workspaceSync = useResourceWorkspaceSync()
  const api = useMemo(
    () => createBrowserResourceLibraryApi(apiBaseUrl),
    [apiBaseUrl]
  )
  const connectCollaboration = useMemo<ResourceDocumentCollaborationConnector>(
    () =>
      ({ editor, onSyncStateChange }) => {
        const lease = workspaceSync.attachDocument({
          documentId: document.id,
          editor,
        })
        const unsubscribe = lease.subscribe((state) => {
          onSyncStateChange(toEditorSyncState(state))
        })

        return {
          disconnect() {
            unsubscribe()
            lease.release()
          },
          retry() {
            void lease.retry()
          },
        }
      },
    [document.id, workspaceSync]
  )

  return (
    <ResourceDocumentEditorSurface
      api={api}
      connectCollaboration={connectCollaboration}
      document={document}
    />
  )
}

function toEditorSyncState(
  state: ResourceWorkspaceDocumentSyncState
): ResourceDocumentSyncState {
  switch (state.kind) {
    case "loading":
      return { kind: "connecting", message: state.message }
    case "saving":
      return { kind: "syncing", message: state.message }
    case "synchronized":
      return { kind: "saved", message: state.message }
    case "pending-offline":
      return { kind: "reconnecting", message: state.message }
    case "error":
    case "invalid":
    case "readonly":
      return state
  }
}

export function ResourceDocumentEditorSurface({
  api,
  connectCollaboration,
  document,
  writeClipboardText = writeBrowserClipboardText,
}: {
  readonly api: ResourceDocumentEditorApi
  readonly connectCollaboration: ResourceDocumentCollaborationConnector
  readonly document: AdminResourceActiveDocument
  readonly writeClipboardText?: (text: string) => Promise<void>
}) {
  const [anchorElement, setAnchorElement] = useState<HTMLDivElement | null>(
    null
  )
  const currentDocument = document
  const [exportError, setExportError] = useState<string | null>(null)
  const [isExporting, startExportTransition] = useTransition()
  const [syncState, setSyncState] = useState(initialSyncState)
  const [collaborationClient, setCollaborationClient] =
    useState<ResourceDocumentCollaborationClient | null>(null)

  return (
    <article className="mx-auto grid w-full max-w-5xl gap-6 px-6 pt-16 pb-32 md:px-12 md:pt-12">
      <header className="grid gap-4 border-b border-border/60 pb-6">
        <ResourceBreadcrumb
          currentName={currentDocument.name}
          path={currentDocument.path}
        />
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="min-w-0 flex-1 text-3xl font-black tracking-tight text-foreground md:text-4xl">
            {currentDocument.name}
          </h1>
          <Button
            disabled={syncState.kind !== "saved" || isExporting}
            onClick={() => {
              startExportTransition(async () => {
                const result = await api.exportResourceDocument(
                  currentDocument.id
                )

                if (result.status === "error") {
                  setExportError(result.error.message)
                  return
                }

                downloadMarkdownFile(result.value)
                setExportError(null)
              })
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            {isExporting ? (
              <Spinner aria-hidden="true" />
            ) : (
              <DownloadIcon aria-hidden="true" />
            )}
            Markdown 내보내기
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ResourceDocumentMetadata
            createdBy={currentDocument.createdBy.name}
            exactUpdatedAt={formatResourceExactDate(currentDocument.updatedAt)}
            relativeUpdatedAt={formatResourceRelativeDate(
              currentDocument.updatedAt
            )}
            updatedBy={currentDocument.updatedBy.name}
          />
          <ResourceSyncStatus state={syncState} />
        </div>
      </header>
      {exportError === null ? null : (
        <Alert role="alert" tone="danger">
          <AlertDescription>{exportError}</AlertDescription>
        </Alert>
      )}
      <LexicalComposer
        initialConfig={{
          editorState: null,
          namespace: `resource-document-${document.id}`,
          nodes: [...resourceDocumentNodes],
          onError: (error) => {
            throw error
          },
          theme: resourceEditorTheme,
        }}
      >
        <ResourceSyncRecovery
          client={collaborationClient}
          state={syncState}
          writeClipboardText={writeClipboardText}
        />
        <div
          className="relative -mx-3 min-h-[60vh] px-3 md:-mx-10 md:px-10"
          ref={setAnchorElement}
        >
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                aria-label="자료 본문"
                className="min-h-[60vh] outline-none [&_hr]:my-8 [&_hr]:border-border [&_img]:my-6 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-2xl [&_img]:border [&_img]:border-border"
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
            placeholder={
              <p className="pointer-events-none absolute top-2 left-3 text-muted-foreground md:left-10">
                내용을 입력하거나 / 명령어를 사용하세요.
              </p>
            }
          />
          <ListPlugin />
          <CheckListPlugin />
          <LinkPlugin validateUrl={isAllowedResourceLinkUrl} />
          <TablePlugin
            hasCellBackgroundColor={false}
            hasCellMerge={false}
            hasHorizontalScroll
          />
          <MarkdownShortcutPlugin transformers={editorTransformers} />
          <ResourceSlashMenuPlugin />
          <ResourceFloatingToolbarPlugin />
          <ResourceDocumentCollaborationPlugin
            connect={connectCollaboration}
            documentId={document.id}
            onSyncStateChange={setSyncState}
            onClientChange={setCollaborationClient}
          />
          {anchorElement === null ? null : (
            <ResourceDraggableBlockPlugin anchorElement={anchorElement} />
          )}
        </div>
      </LexicalComposer>
    </article>
  )
}

function ResourceSyncRecovery({
  client,
  state,
  writeClipboardText,
}: {
  readonly client: ResourceDocumentCollaborationClient | null
  readonly state: ResourceDocumentSyncState
  readonly writeClipboardText: (text: string) => Promise<void>
}) {
  const [editor] = useLexicalComposerContext()
  const [copyMessage, setCopyMessage] = useState<string | null>(null)
  const [isCopying, startCopyTransition] = useTransition()

  if (state.kind !== "error" && state.kind !== "invalid") return null

  return (
    <Alert role="alert" tone="danger">
      <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
        <span>{state.message}</span>
        <span className="flex items-center gap-2">
          {state.kind === "error" ? (
            <Button
              disabled={client === null}
              onClick={() => {
                client?.retry()
              }}
              size="sm"
              type="button"
              variant="outline"
            >
              동기화 다시 시도
            </Button>
          ) : null}
          <Button
            disabled={isCopying}
            onClick={() => {
              startCopyTransition(async () => {
                const projection = readResourceDocumentMarkdown(editor)

                if (projection.status === "invalid") {
                  setCopyMessage(
                    "현재 본문을 Markdown으로 변환하지 못했습니다."
                  )
                  return
                }

                try {
                  await writeClipboardText(projection.markdown)
                  setCopyMessage("현재 Markdown을 클립보드에 복사했습니다.")
                } catch {
                  setCopyMessage(
                    "현재 Markdown을 클립보드에 복사하지 못했습니다."
                  )
                }
              })
            }}
            size="sm"
            type="button"
            variant="outline"
          >
            {isCopying ? <Spinner aria-hidden="true" /> : null}
            현재 Markdown 복사
          </Button>
        </span>
        {copyMessage === null ? null : (
          <span aria-live="polite" className="basis-full" role="status">
            {copyMessage}
          </span>
        )}
      </AlertDescription>
    </Alert>
  )
}

function ResourceSyncStatus({
  state,
}: {
  readonly state: ResourceDocumentSyncState
}) {
  const presentation = readSyncStatusPresentation(state)
  const Icon = presentation.Icon

  return (
    <span
      aria-label={state.message}
      aria-live="polite"
      className={cn(
        "inline-flex min-h-5 items-center gap-2 text-xs font-medium sm:w-64 sm:shrink-0 sm:justify-end",
        presentation.className
      )}
      role="status"
    >
      <Icon
        aria-hidden="true"
        className={cn("size-4", presentation.iconClass)}
      />
      {state.message}
    </span>
  )
}

function readSyncStatusPresentation(state: ResourceDocumentSyncState): {
  readonly className: string
  readonly Icon: LucideIcon
  readonly iconClass?: string
} {
  switch (state.kind) {
    case "saved":
      return { className: "text-muted-foreground", Icon: CloudCheckIcon }
    case "syncing":
      return {
        className: "text-primary",
        Icon: CloudUploadIcon,
        iconClass: "animate-pulse motion-reduce:animate-none",
      }
    case "connecting":
    case "reconnecting":
      return {
        className: "text-primary",
        Icon: LoaderCircleIcon,
        iconClass: "animate-spin motion-reduce:animate-none",
      }
    case "error":
    case "invalid":
      return { className: "text-destructive", Icon: TriangleAlertIcon }
    case "readonly":
      return { className: "text-muted-foreground", Icon: LockIcon }
  }
}

function downloadMarkdownFile(file: {
  readonly fileName: string
  readonly markdown: string
}): void {
  const url = URL.createObjectURL(
    new Blob([file.markdown], { type: "text/markdown;charset=utf-8" })
  )
  const anchor = document.createElement("a")

  anchor.download = file.fileName
  anchor.href = url
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

async function writeBrowserClipboardText(text: string): Promise<void> {
  if (navigator.clipboard === undefined) {
    throw new Error("브라우저가 클립보드 쓰기를 지원하지 않습니다.")
  }

  await navigator.clipboard.writeText(text)
}
