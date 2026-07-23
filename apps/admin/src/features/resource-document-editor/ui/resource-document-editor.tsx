"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react"
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin"
import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin"
import { ListPlugin } from "@lexical/react/LexicalListPlugin"
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { TablePlugin } from "@lexical/react/LexicalTablePlugin"
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  type EditorThemeClasses,
  type LexicalEditor,
} from "lexical"
import { DownloadIcon, ImagePlusIcon, SaveIcon } from "lucide-react"
import {
  readResourceDocumentMarkdown,
  replaceResourceDocumentMarkdown,
  resourceDocumentNodes,
  resourceMarkdownTransformers,
} from "@workspace/resource-document/resource-markdown"
import { $createResourceImageNode } from "@workspace/resource-document/resource-image"
import { isAllowedResourceLinkUrl } from "@workspace/resource-document/resource-markdown-validation"
import { Alert, AlertDescription } from "@workspace/ui/components/ui/alert"
import { Button } from "@workspace/ui/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/ui/dialog"
import { Input } from "@workspace/ui/components/ui/input"
import { Label } from "@workspace/ui/components/ui/label"
import { Spinner } from "@workspace/ui/components/ui/spinner"

import { ResourceDraggableBlockPlugin } from "@/features/resource-document-editor/ui/resource-draggable-block-plugin"
import { ResourceFloatingToolbarPlugin } from "@/features/resource-document-editor/ui/resource-floating-toolbar-plugin"
import { ResourceSlashMenuPlugin } from "@/features/resource-document-editor/ui/resource-slash-menu-plugin"
import { ResourceBreadcrumb } from "@/features/resource-document-editor/ui/resource-breadcrumb"
import { createBrowserResourceDocumentApi } from "@/features/resource-document-editor/api/resource-document-api"
import {
  resourceLibraryChangedEvent,
  type AdminResourceDocument,
} from "@/entities/resource-document/model/resource-document"

const resourceEditorTheme = {
  code: "my-5 block overflow-x-auto rounded-xl bg-muted px-4 py-3 font-mono text-sm leading-6",
  heading: {
    h1: "mt-9 mb-3 text-3xl font-black tracking-tight",
    h2: "mt-8 mb-3 text-2xl font-bold tracking-tight",
    h3: "mt-6 mb-2 text-xl font-bold",
  },
  link: "text-primary underline underline-offset-4",
  list: {
    checklist: "my-3 grid list-none gap-1 pl-0",
    listitem: "my-1 ml-6 pl-1",
    listitemChecked: "my-1 ml-7 text-muted-foreground line-through",
    listitemUnchecked: "my-1 ml-7",
    ol: "my-3 list-decimal pl-6",
    ul: "my-3 list-disc pl-6",
  },
  paragraph: "my-2 min-h-7 leading-7",
  quote: "my-5 border-l-4 border-primary/40 pl-4 text-muted-foreground italic",
  table: "my-6 w-full border-collapse text-sm",
  tableCell: "min-w-28 border border-border px-3 py-2 align-top",
  tableCellHeader:
    "min-w-28 border border-border bg-muted px-3 py-2 text-left font-bold",
  tableScrollableWrapper: "my-6 overflow-x-auto",
  text: {
    bold: "font-bold",
    code: "rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]",
    italic: "italic",
    strikethrough: "line-through",
  },
} satisfies EditorThemeClasses

export function ResourceDocumentEditor({
  document,
}: {
  readonly document: AdminResourceDocument
}) {
  const api = useMemo(() => createBrowserResourceDocumentApi(), [])
  const [editor, setEditor] = useState<LexicalEditor | null>(null)
  const [title, setTitle] = useState(document.name)
  const [version, setVersion] = useState(document.version)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [latestConflict, setLatestConflict] =
    useState<AdminResourceDocument | null>(null)
  const [anchorElement, setAnchorElement] = useState<HTMLDivElement | null>(
    null
  )
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [imageAlt, setImageAlt] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const markDirty = useCallback(() => setDirty(true), [])

  useEffect(() => {
    if (!dirty) return
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener("beforeunload", warnBeforeUnload)
    return () => window.removeEventListener("beforeunload", warnBeforeUnload)
  }, [dirty])

  useEffect(() => {
    const revalidate = async () => {
      const result = await api.getResourceDocument(document.id)
      if (result.status === "error" || result.value.version === version) return
      if (dirty) {
        setLatestConflict(result.value)
        setMessage("다른 탭이나 기기에서 저장한 변경 사항이 있습니다.")
        return
      }
      if (editor !== null) {
        replaceResourceDocumentMarkdown(editor, result.value.contentMarkdown)
      }
      setTitle(result.value.name)
      setVersion(result.value.version)
      setDirty(false)
      setMessage("최신 저장본을 불러왔습니다.")
    }
    window.addEventListener("focus", revalidate)
    return () => window.removeEventListener("focus", revalidate)
  }, [api, dirty, document.id, editor, version])

  const save = async () => {
    if (editor === null || saving) return
    const markdown = readResourceDocumentMarkdown(editor)
    if (markdown.status === "invalid") {
      setMessage("현재 본문을 Markdown으로 변환하지 못했습니다.")
      return
    }
    setSaving(true)
    const result = await api.saveResourceDocument(document.id, version, {
      contentMarkdown: markdown.markdown,
      name: title,
    })
    setSaving(false)
    if (result.status === "conflict") {
      setLatestConflict(result.latest)
      setMessage("다른 탭이나 기기에서 먼저 저장했습니다.")
      return
    }
    if (result.status === "error") {
      setMessage(result.message)
      return
    }
    setVersion(result.value.version)
    setTitle(result.value.name)
    setDirty(false)
    setMessage("저장했습니다.")
    window.dispatchEvent(new Event(resourceLibraryChangedEvent))
  }

  return (
    <article className="mx-auto grid w-full max-w-5xl gap-5 px-8 pt-10 pb-32">
      <header className="grid gap-4 border-b border-border pb-5">
        <ResourceBreadcrumb currentName={title} path={document.path} />
        <div className="flex items-center gap-3">
          <Input
            aria-label="문서 제목"
            className="h-auto flex-1 border-0 px-0 text-3xl font-black shadow-none focus-visible:ring-0"
            maxLength={120}
            onChange={(event) => {
              setTitle(event.target.value)
              setDirty(true)
            }}
            value={title}
          />
          <Button
            onClick={() => setImageDialogOpen(true)}
            type="button"
            variant="outline"
          >
            <ImagePlusIcon aria-hidden="true" />
            이미지
          </Button>
          <Button
            onClick={async () => {
              const result = await api.exportResourceDocument(document.id)
              if (result.status === "error") {
                setMessage(result.error.message)
                return
              }
              downloadMarkdownFile(result.value)
            }}
            type="button"
            variant="outline"
          >
            <DownloadIcon aria-hidden="true" />
            내보내기
          </Button>
          <Button
            disabled={!dirty || saving || title.trim().length === 0}
            onClick={() => void save()}
            type="button"
          >
            {saving ? (
              <Spinner aria-hidden="true" />
            ) : (
              <SaveIcon aria-hidden="true" />
            )}
            저장
          </Button>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            수정 {new Date(document.updatedAt).toLocaleString("ko-KR")}
          </span>
          <span aria-live="polite">
            {dirty ? "저장하지 않은 변경 사항" : (message ?? "저장됨")}
          </span>
        </div>
      </header>

      {latestConflict === null ? null : (
        <Alert role="alert" tone="danger">
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>
              최신 저장본은 ‘{latestConflict.name}’(버전{" "}
              {latestConflict.version})입니다.
            </span>
            <span className="flex gap-2">
              <Button
                onClick={() => {
                  if (editor !== null) {
                    replaceResourceDocumentMarkdown(
                      editor,
                      latestConflict.contentMarkdown
                    )
                  }
                  setTitle(latestConflict.name)
                  setVersion(latestConflict.version)
                  setDirty(false)
                  setLatestConflict(null)
                  setMessage("최신 저장본을 불러왔습니다.")
                }}
                size="sm"
                type="button"
                variant="outline"
              >
                최신 내용 불러오기
              </Button>
              <Button
                onClick={() => {
                  setVersion(latestConflict.version)
                  setLatestConflict(null)
                  setDirty(true)
                  setMessage("현재 편집본을 다음 저장에 사용합니다.")
                }}
                size="sm"
                type="button"
              >
                현재 편집본 유지
              </Button>
            </span>
          </AlertDescription>
        </Alert>
      )}

      <LexicalComposer
        initialConfig={{
          namespace: `resource-document-${document.id}`,
          nodes: [...resourceDocumentNodes],
          onError: (error) => {
            throw error
          },
          theme: resourceEditorTheme,
        }}
      >
        <ResourceDocumentStatePlugin
          initialMarkdown={document.contentMarkdown}
          onChange={markDirty}
          onEditor={setEditor}
        />
        <div className="relative min-h-[60vh]" ref={setAnchorElement}>
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                aria-label="자료 본문"
                className="min-h-[60vh] outline-none [&_hr]:my-8 [&_img]:my-6 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-2xl [&_img]:border [&_img]:border-border"
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
            placeholder={
              <p className="pointer-events-none absolute top-2 left-0 text-muted-foreground">
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
          <MarkdownShortcutPlugin
            transformers={[...resourceMarkdownTransformers]}
          />
          <ResourceSlashMenuPlugin />
          <ResourceFloatingToolbarPlugin />
          {anchorElement === null ? null : (
            <ResourceDraggableBlockPlugin anchorElement={anchorElement} />
          )}
        </div>
      </LexicalComposer>

      <Dialog onOpenChange={setImageDialogOpen} open={imageDialogOpen}>
        <DialogContent>
          <form
            onSubmit={(event) =>
              void uploadImage(event, {
                altText: imageAlt,
                api,
                documentId: document.id,
                editor,
                file: imageFile,
                onError: setMessage,
                onFinished: () => setUploading(false),
                onStart: () => setUploading(true),
                onSuccess: () => {
                  setDirty(true)
                  setImageAlt("")
                  setImageFile(null)
                  setImageDialogOpen(false)
                  setMessage(
                    "이미지를 본문에 추가했습니다. 문서를 저장해 확정하세요."
                  )
                },
              })
            }
          >
            <DialogHeader>
              <DialogTitle>이미지 업로드</DialogTitle>
              <DialogDescription>
                JPEG, PNG, WebP 파일을 5MB까지 올릴 수 있습니다.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="resource-image-file">이미지 파일</Label>
                <Input
                  accept="image/jpeg,image/png,image/webp"
                  id="resource-image-file"
                  onChange={(event) =>
                    setImageFile(event.target.files?.[0] ?? null)
                  }
                  required
                  type="file"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="resource-image-alt">대체 텍스트</Label>
                <Input
                  id="resource-image-alt"
                  maxLength={500}
                  onChange={(event) => setImageAlt(event.target.value)}
                  placeholder="이미지에서 사람이 알아야 할 내용"
                  required
                  value={imageAlt}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                disabled={
                  uploading ||
                  imageFile === null ||
                  imageAlt.trim().length === 0
                }
                type="submit"
              >
                {uploading ? <Spinner aria-hidden="true" /> : null}
                업로드
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </article>
  )
}

function ResourceDocumentStatePlugin({
  initialMarkdown,
  onChange,
  onEditor,
}: {
  readonly initialMarkdown: string
  readonly onChange: () => void
  readonly onEditor: (editor: LexicalEditor) => void
}) {
  const [editor] = useLexicalComposerContext()
  useEffect(() => {
    const validation = replaceResourceDocumentMarkdown(editor, initialMarkdown)
    if (validation.status === "invalid") {
      throw new Error("저장된 Markdown을 편집기에 불러오지 못했습니다.")
    }
    onEditor(editor)
    let ready = false
    const readyTimer = window.setTimeout(() => {
      ready = true
    }, 0)
    const unregister = editor.registerUpdateListener(
      ({ dirtyElements, dirtyLeaves }) => {
        if (ready && (dirtyElements.size > 0 || dirtyLeaves.size > 0)) {
          onChange()
        }
      }
    )
    return () => {
      window.clearTimeout(readyTimer)
      unregister()
    }
  }, [editor, initialMarkdown, onChange, onEditor])

  return null
}

async function uploadImage(
  event: FormEvent<HTMLFormElement>,
  input: {
    readonly altText: string
    readonly api: ReturnType<typeof createBrowserResourceDocumentApi>
    readonly documentId: string
    readonly editor: LexicalEditor | null
    readonly file: File | null
    readonly onError: (message: string) => void
    readonly onFinished: () => void
    readonly onStart: () => void
    readonly onSuccess: () => void
  }
): Promise<void> {
  event.preventDefault()
  if (input.file === null || input.editor === null) return
  input.onStart()
  const result = await input.api.uploadResourceImage(
    input.documentId,
    input.file,
    input.altText.trim()
  )
  input.onFinished()
  if (result.status === "error") {
    input.onError(result.message)
    return
  }
  input.editor.update(() => {
    const image = $createResourceImageNode({
      alt: result.value.altText,
      url: result.value.url,
    })
    const selection = $getSelection()
    const block = $isRangeSelection(selection)
      ? selection.anchor.getNode().getTopLevelElement()
      : null
    if (block === null) $getRoot().append(image, $createParagraphNode())
    else block.insertAfter(image).insertAfter($createParagraphNode())
  })
  input.onSuccess()
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
