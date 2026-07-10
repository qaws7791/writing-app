"use client"

import { useCallback, useEffect, useState, type FormEvent } from "react"
import { createPortal } from "react-dom"
import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { mergeRegister } from "@lexical/utils"
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
  type LexicalEditor,
  type LexicalNode,
  type TextFormatType,
} from "lexical"
import {
  BoldIcon,
  Code2Icon,
  ItalicIcon,
  Link2Icon,
  StrikethroughIcon,
  UnlinkIcon,
  type LucideIcon,
} from "lucide-react"
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

type FloatingToolbarState = {
  readonly bold: boolean
  readonly code: boolean
  readonly italic: boolean
  readonly left: number
  readonly link: boolean
  readonly strikethrough: boolean
  readonly top: number
  readonly visible: boolean
}

type ResourceTextFormat = Extract<
  TextFormatType,
  "bold" | "code" | "italic" | "strikethrough"
>

const hiddenToolbarState: FloatingToolbarState = {
  bold: false,
  code: false,
  italic: false,
  left: 0,
  link: false,
  strikethrough: false,
  top: 0,
  visible: false,
}

export function ResourceFloatingToolbarPlugin() {
  const [editor] = useLexicalComposerContext()
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
  const [toolbar, setToolbar] = useState(hiddenToolbarState)
  const updateToolbar = useCallback(() => {
    const selection = $getSelection()
    const nativeSelection = window.getSelection()

    if (
      !$isRangeSelection(selection) ||
      selection.isCollapsed() ||
      nativeSelection === null ||
      nativeSelection.rangeCount === 0
    ) {
      setToolbar(hiddenToolbarState)
      return
    }

    const range = nativeSelection.getRangeAt(0)
    const rectangle = range.getBoundingClientRect()

    if (rectangle.width === 0 && rectangle.height === 0) {
      setToolbar(hiddenToolbarState)
      return
    }

    let node: LexicalNode | null = selection.anchor.getNode()
    let isLink = false

    while (node !== null) {
      if ($isLinkNode(node)) {
        isLink = true
        break
      }
      node = node.getParent()
    }

    setToolbar({
      bold: selection.hasFormat("bold"),
      code: selection.hasFormat("code"),
      italic: selection.hasFormat("italic"),
      left: rectangle.left + rectangle.width / 2,
      link: isLink,
      strikethrough: selection.hasFormat("strikethrough"),
      top: rectangle.top - 10,
      visible: true,
    })
  }, [])

  useEffect(() => {
    function readToolbarState(): void {
      editor.getEditorState().read(updateToolbar)
    }

    const unregister = mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateToolbar()
          return false
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(updateToolbar)
      })
    )

    window.addEventListener("resize", readToolbarState)
    document.addEventListener("scroll", readToolbarState, true)

    return () => {
      document.removeEventListener("scroll", readToolbarState, true)
      window.removeEventListener("resize", readToolbarState)
      unregister()
    }
  }, [editor, updateToolbar])

  if (!toolbar.visible && !isLinkDialogOpen) return null

  return (
    <>
      {toolbar.visible
        ? createPortal(
            <div
              aria-label="텍스트 서식"
              className="fixed z-40 flex -translate-x-1/2 -translate-y-full items-center gap-0.5 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg"
              role="toolbar"
              style={{ left: toolbar.left, top: toolbar.top }}
            >
              <FormatButton
                active={toolbar.bold}
                format="bold"
                Icon={BoldIcon}
                label="굵게"
                onFormat={(format) => {
                  formatResourceSelection(editor, format)
                }}
              />
              <FormatButton
                active={toolbar.italic}
                format="italic"
                Icon={ItalicIcon}
                label="기울임"
                onFormat={(format) => {
                  formatResourceSelection(editor, format)
                }}
              />
              <FormatButton
                active={toolbar.strikethrough}
                format="strikethrough"
                Icon={StrikethroughIcon}
                label="취소선"
                onFormat={(format) => {
                  formatResourceSelection(editor, format)
                }}
              />
              <FormatButton
                active={toolbar.code}
                format="code"
                Icon={Code2Icon}
                label="인라인 코드"
                onFormat={(format) => {
                  formatResourceSelection(editor, format)
                }}
              />
              <Button
                aria-label={toolbar.link ? "링크 제거" : "링크 추가"}
                aria-pressed={toolbar.link}
                onClick={() => {
                  if (toolbar.link) {
                    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
                    return
                  }

                  setIsLinkDialogOpen(true)
                }}
                onMouseDown={(event) => {
                  event.preventDefault()
                }}
                size="icon-xs"
                type="button"
                variant={toolbar.link ? "secondary" : "ghost"}
              >
                {toolbar.link ? (
                  <UnlinkIcon aria-hidden="true" />
                ) : (
                  <Link2Icon aria-hidden="true" />
                )}
              </Button>
            </div>,
            document.body
          )
        : null}
      <ResourceLinkDialog
        editor={editor}
        onOpenChange={setIsLinkDialogOpen}
        open={isLinkDialogOpen}
      />
    </>
  )
}

export function formatResourceSelection(
  editor: LexicalEditor,
  format: ResourceTextFormat
): void {
  editor.update(
    () => {
      const selection = $getSelection()

      if (!$isRangeSelection(selection)) return

      selection.formatText(format)
    },
    { discrete: true }
  )
}

function FormatButton({
  active,
  format,
  Icon,
  label,
  onFormat,
}: {
  readonly active: boolean
  readonly format: ResourceTextFormat
  readonly Icon: LucideIcon
  readonly label: string
  readonly onFormat: (format: ResourceTextFormat) => void
}) {
  return (
    <Button
      aria-label={label}
      aria-pressed={active}
      onClick={() => {
        onFormat(format)
      }}
      onMouseDown={(event) => {
        event.preventDefault()
      }}
      size="icon-xs"
      type="button"
      variant={active ? "secondary" : "ghost"}
    >
      <Icon aria-hidden="true" />
    </Button>
  )
}

function ResourceLinkDialog({
  editor,
  onOpenChange,
  open,
}: {
  readonly editor: ReturnType<typeof useLexicalComposerContext>[0]
  readonly onOpenChange: (open: boolean) => void
  readonly open: boolean
}) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [url, setUrl] = useState("")

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const normalizedUrl = url.trim()

    if (!isAllowedResourceLinkUrl(normalizedUrl)) {
      setErrorMessage(
        "HTTP(S), 메일, 전화 또는 사이트 내부 링크만 사용할 수 있습니다."
      )
      return
    }

    editor.dispatchCommand(TOGGLE_LINK_COMMAND, normalizedUrl)
    setErrorMessage(null)
    setUrl("")
    onOpenChange(false)
    editor.focus()
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>링크 추가</DialogTitle>
          <DialogDescription>
            선택한 텍스트에 연결할 주소를 입력합니다.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={submit}>
          <div className="grid gap-2">
            <Label htmlFor="resource-link-url">링크 주소</Label>
            <Input
              id="resource-link-url"
              onChange={(event) => {
                setUrl(event.currentTarget.value)
              }}
              placeholder="https://example.com"
              value={url}
            />
          </div>
          {errorMessage === null ? null : (
            <Alert role="alert" tone="danger">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              onClick={() => {
                onOpenChange(false)
              }}
              type="button"
              variant="outline"
            >
              취소
            </Button>
            <Button type="submit">적용</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
