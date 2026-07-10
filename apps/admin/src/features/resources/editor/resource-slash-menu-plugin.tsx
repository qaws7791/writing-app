"use client"

import { useCallback, useMemo, useState, type FormEvent } from "react"
import { createPortal } from "react-dom"
import { $createCodeNode } from "@lexical/code"
import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from "@lexical/react/LexicalTypeaheadMenuPlugin"
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text"
import {
  $createParagraphNode,
  $getNodeByKey,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  type ElementNode,
  type LexicalEditor,
  type LexicalNode,
  type TextNode,
} from "lexical"
import {
  Code2Icon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ImageIcon,
  ListChecksIcon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  PilcrowIcon,
  QuoteIcon,
  Table2Icon,
  type LucideIcon,
} from "lucide-react"
import { $createResourceHorizontalRuleNode } from "@workspace/resource-document/resource-horizontal-rule"
import { $createResourceImageNode } from "@workspace/resource-document/resource-image"
import { isAllowedResourceImageUrl } from "@workspace/resource-document/resource-markdown-validation"
import { $createResourceTableNodeWithDimensions } from "@workspace/resource-document/resource-table"
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
import { cn } from "@workspace/ui/lib/utils"

type ResourceSlashAction =
  | { readonly kind: "dialog"; readonly dialog: "image" | "table" }
  | {
      readonly execute: (editor: LexicalEditor, targetKey: string) => void
      readonly kind: "execute"
    }

type ResourceSlashDialog = {
  readonly kind: "image" | "table"
  readonly targetKey: string
}

class ResourceSlashOption extends MenuOption {
  readonly action: ResourceSlashAction
  readonly description: string
  readonly Icon: LucideIcon
  readonly keywords: readonly string[]
  readonly label: string

  constructor(input: {
    readonly action: ResourceSlashAction
    readonly description: string
    readonly Icon: LucideIcon
    readonly keywords: readonly string[]
    readonly label: string
  }) {
    super(input.label)
    this.action = input.action
    this.description = input.description
    this.Icon = input.Icon
    this.keywords = input.keywords
    this.label = input.label
  }
}

export function ResourceSlashMenuPlugin() {
  const [editor] = useLexicalComposerContext()
  const [dialog, setDialog] = useState<ResourceSlashDialog | null>(null)
  const [query, setQuery] = useState<string | null>(null)
  const triggerMatch = useBasicTypeaheadTriggerMatch("/", {
    allowWhitespace: true,
    minLength: 0,
  })
  const matchSlashCommand = useCallback(
    (...arguments_: Parameters<typeof triggerMatch>) => {
      const match = triggerMatch(...arguments_)

      if (match === null) return null

      return editor.getEditorState().read(() => {
        const selection = $getSelection()

        if (!$isRangeSelection(selection)) return null

        const block = selection.anchor.getNode().getTopLevelElement()

        return $isParagraphNode(block) ? match : null
      })
    },
    [editor, triggerMatch]
  )
  const options = useMemo(() => createSlashOptions(), [])
  const matchingOptions = useMemo(() => {
    const normalizedQuery = query?.trim().toLocaleLowerCase("ko-KR") ?? ""

    return normalizedQuery === ""
      ? options
      : options.filter((option) =>
          [option.label, ...option.keywords].some((candidate) =>
            candidate.toLocaleLowerCase("ko-KR").includes(normalizedQuery)
          )
        )
  }, [options, query])
  const selectOption = useCallback(
    (
      option: ResourceSlashOption,
      textNodeContainingQuery: TextNode | null,
      closeMenu: () => void
    ) => {
      const queryNodeKey = textNodeContainingQuery?.getKey() ?? null
      const target = textNodeContainingQuery?.getParent()
      const targetKey = $isParagraphNode(target) ? target.getKey() : null

      closeMenu()

      if (targetKey === null) return

      editor.update(
        () => {
          const target = $getNodeByKey(targetKey)

          if (!$isParagraphNode(target)) return

          if (queryNodeKey !== null) $getNodeByKey(queryNodeKey)?.remove()
          target.selectEnd()
        },
        { discrete: true }
      )

      if (option.action.kind === "dialog") {
        setDialog({ kind: option.action.dialog, targetKey })
        return
      }

      option.action.execute(editor, targetKey)
    },
    [editor]
  )

  return (
    <>
      <LexicalTypeaheadMenuPlugin<ResourceSlashOption>
        menuRenderFn={(anchorElementRef, menu) => {
          const anchor = anchorElementRef.current

          return anchor === null
            ? null
            : createPortal(
                <div
                  className="w-80 overflow-hidden rounded-2xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl"
                  role="listbox"
                  aria-label="블록 종류"
                >
                  <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    기본 블록
                  </p>
                  <div className="max-h-80 overflow-y-auto">
                    {menu.options.map((option, index) => {
                      const isSelected = menu.selectedIndex === index
                      const Icon = option.Icon

                      return (
                        <button
                          aria-selected={isSelected}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left outline-none",
                            isSelected
                              ? "bg-secondary text-secondary-foreground"
                              : "hover:bg-muted"
                          )}
                          key={option.key}
                          onClick={() => {
                            menu.selectOptionAndCleanUp(option)
                          }}
                          onMouseDown={(event) => {
                            event.preventDefault()
                          }}
                          onMouseEnter={() => {
                            menu.setHighlightedIndex(index)
                          }}
                          ref={option.setRefElement}
                          role="option"
                          type="button"
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
                            <Icon aria-hidden="true" className="size-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold">
                              {option.label}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {option.description}
                            </span>
                          </span>
                        </button>
                      )
                    })}
                    {menu.options.length === 0 ? (
                      <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                        일치하는 블록이 없습니다.
                      </p>
                    ) : null}
                  </div>
                </div>,
                anchor
              )
        }}
        onQueryChange={setQuery}
        onSelectOption={selectOption}
        options={[...matchingOptions]}
        triggerFn={matchSlashCommand}
      />
      <ResourceImageDialog
        editor={editor}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
        open={dialog?.kind === "image"}
        targetKey={dialog?.kind === "image" ? dialog.targetKey : null}
      />
      <ResourceTableDialog
        editor={editor}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
        open={dialog?.kind === "table"}
        targetKey={dialog?.kind === "table" ? dialog.targetKey : null}
      />
    </>
  )
}

function createSlashOptions(): readonly ResourceSlashOption[] {
  return [
    createBlockOption({
      createBlock: $createParagraphNode,
      description: "일반 텍스트를 작성합니다.",
      Icon: PilcrowIcon,
      keywords: ["본문", "텍스트", "paragraph"],
      label: "본문",
    }),
    createBlockOption({
      createBlock: () => $createHeadingNode("h1"),
      description: "가장 큰 제목을 만듭니다.",
      Icon: Heading1Icon,
      keywords: ["제목", "heading", "h1"],
      label: "제목 1",
    }),
    createBlockOption({
      createBlock: () => $createHeadingNode("h2"),
      description: "중간 크기 제목을 만듭니다.",
      Icon: Heading2Icon,
      keywords: ["제목", "heading", "h2"],
      label: "제목 2",
    }),
    createBlockOption({
      createBlock: () => $createHeadingNode("h3"),
      description: "작은 제목을 만듭니다.",
      Icon: Heading3Icon,
      keywords: ["제목", "heading", "h3"],
      label: "제목 3",
    }),
    createCommandOption({
      command: INSERT_UNORDERED_LIST_COMMAND,
      description: "글머리 기호 목록을 만듭니다.",
      Icon: ListIcon,
      keywords: ["목록", "bullet", "list"],
      label: "글머리 목록",
    }),
    createCommandOption({
      command: INSERT_ORDERED_LIST_COMMAND,
      description: "번호가 있는 목록을 만듭니다.",
      Icon: ListOrderedIcon,
      keywords: ["목록", "number", "ordered"],
      label: "번호 목록",
    }),
    createCommandOption({
      command: INSERT_CHECK_LIST_COMMAND,
      description: "완료 여부를 표시하는 목록을 만듭니다.",
      Icon: ListChecksIcon,
      keywords: ["할 일", "체크", "todo", "check"],
      label: "할 일 목록",
    }),
    createBlockOption({
      createBlock: $createQuoteNode,
      description: "인용문을 강조해 표시합니다.",
      Icon: QuoteIcon,
      keywords: ["인용", "quote"],
      label: "인용",
    }),
    createBlockOption({
      createBlock: $createCodeNode,
      description: "GFM 코드 블록을 만듭니다.",
      Icon: Code2Icon,
      keywords: ["코드", "code"],
      label: "코드 블록",
    }),
    new ResourceSlashOption({
      action: {
        execute: (editor, targetKey) => {
          replaceSlashParagraph(
            editor,
            targetKey,
            $createResourceHorizontalRuleNode
          )
        },
        kind: "execute",
      },
      description: "내용 사이에 구분선을 추가합니다.",
      Icon: MinusIcon,
      keywords: ["구분선", "선", "divider", "horizontal"],
      label: "구분선",
    }),
    new ResourceSlashOption({
      action: { dialog: "table", kind: "dialog" },
      description: "행과 열을 지정해 GFM 표를 만듭니다.",
      Icon: Table2Icon,
      keywords: ["표", "table"],
      label: "표",
    }),
    new ResourceSlashOption({
      action: { dialog: "image", kind: "dialog" },
      description: "HTTPS 이미지 URL을 삽입합니다.",
      Icon: ImageIcon,
      keywords: ["이미지", "사진", "image", "url"],
      label: "이미지",
    }),
  ]
}

function createBlockOption({
  createBlock,
  description,
  Icon,
  keywords,
  label,
}: {
  readonly createBlock: () => ElementNode
  readonly description: string
  readonly Icon: LucideIcon
  readonly keywords: readonly string[]
  readonly label: string
}): ResourceSlashOption {
  return new ResourceSlashOption({
    action: {
      execute: (editor, targetKey) => {
        replaceSlashParagraph(editor, targetKey, createBlock)
      },
      kind: "execute",
    },
    description,
    Icon,
    keywords,
    label,
  })
}

function createCommandOption({
  command,
  description,
  Icon,
  keywords,
  label,
}: {
  readonly command:
    | typeof INSERT_CHECK_LIST_COMMAND
    | typeof INSERT_ORDERED_LIST_COMMAND
    | typeof INSERT_UNORDERED_LIST_COMMAND
  readonly description: string
  readonly Icon: LucideIcon
  readonly keywords: readonly string[]
  readonly label: string
}): ResourceSlashOption {
  return new ResourceSlashOption({
    action: {
      execute: (editor, targetKey) => {
        editor.update(
          () => {
            const target = $getNodeByKey(targetKey)

            if ($isParagraphNode(target) && target.isEmpty()) {
              target.selectEnd()
            }
          },
          { discrete: true }
        )
        editor.dispatchCommand(command, undefined)
      },
      kind: "execute",
    },
    description,
    Icon,
    keywords,
    label,
  })
}

function ResourceImageDialog({
  editor,
  onOpenChange,
  open,
  targetKey,
}: {
  readonly editor: LexicalEditor
  readonly onOpenChange: (open: boolean) => void
  readonly open: boolean
  readonly targetKey: string | null
}) {
  const [alt, setAlt] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [url, setUrl] = useState("")

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const normalizedAlt = alt.trim()
    const normalizedUrl = url.trim()

    if (normalizedAlt === "") {
      setErrorMessage("이미지 대체 텍스트를 입력해 주세요.")
      return
    }

    if (!isAllowedResourceImageUrl(normalizedUrl)) {
      setErrorMessage("이미지는 HTTPS URL만 사용할 수 있습니다.")
      return
    }

    if (
      targetKey === null ||
      !replaceSlashParagraph(editor, targetKey, () =>
        $createResourceImageNode({ alt: normalizedAlt, url: normalizedUrl })
      )
    ) {
      setErrorMessage("이미지를 삽입할 문단을 찾을 수 없습니다.")
      return
    }
    setAlt("")
    setErrorMessage(null)
    setUrl("")
    onOpenChange(false)
    editor.focus()
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>URL 이미지 삽입</DialogTitle>
          <DialogDescription>
            업로드 없이 공개 HTTPS 이미지 주소와 대체 텍스트를 입력합니다.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={submit}>
          <div className="grid gap-2">
            <Label htmlFor="resource-image-url">이미지 URL</Label>
            <Input
              id="resource-image-url"
              onChange={(event) => {
                setUrl(event.currentTarget.value)
              }}
              placeholder="https://example.com/image.png"
              type="url"
              value={url}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="resource-image-alt">대체 텍스트</Label>
            <Input
              id="resource-image-alt"
              onChange={(event) => {
                setAlt(event.currentTarget.value)
              }}
              value={alt}
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
            <Button type="submit">삽입</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ResourceTableDialog({
  editor,
  onOpenChange,
  open,
  targetKey,
}: {
  readonly editor: LexicalEditor
  readonly onOpenChange: (open: boolean) => void
  readonly open: boolean
  readonly targetKey: string | null
}) {
  const [columns, setColumns] = useState("3")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [rows, setRows] = useState("3")

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const columnCount = Number(columns)
    const rowCount = Number(rows)

    if (
      !Number.isSafeInteger(columnCount) ||
      !Number.isSafeInteger(rowCount) ||
      columnCount < 1 ||
      rowCount < 1
    ) {
      setErrorMessage("행과 열은 1 이상의 정수로 입력해 주세요.")
      return
    }

    if (
      targetKey === null ||
      !replaceSlashParagraph(editor, targetKey, () =>
        $createResourceTableNodeWithDimensions(rowCount, columnCount)
      )
    ) {
      setErrorMessage("표를 삽입할 문단을 찾을 수 없습니다.")
      return
    }
    setErrorMessage(null)
    onOpenChange(false)
    editor.focus()
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>표 삽입</DialogTitle>
          <DialogDescription>
            GFM 표의 행과 열 개수를 입력합니다. 첫 행은 제목 행이 됩니다.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={submit}>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="resource-table-rows">행</Label>
              <Input
                id="resource-table-rows"
                min={1}
                onChange={(event) => {
                  setRows(event.currentTarget.value)
                }}
                step={1}
                type="number"
                value={rows}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="resource-table-columns">열</Label>
              <Input
                id="resource-table-columns"
                min={1}
                onChange={(event) => {
                  setColumns(event.currentTarget.value)
                }}
                step={1}
                type="number"
                value={columns}
              />
            </div>
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
            <Button type="submit">삽입</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function replaceSlashParagraph(
  editor: LexicalEditor,
  targetKey: string,
  createNode: () => LexicalNode
): boolean {
  let replaced = false

  editor.update(
    () => {
      const target = $getNodeByKey(targetKey)

      if (!$isParagraphNode(target) || !target.isEmpty()) return

      target.replace(createNode())
      replaced = true
    },
    { discrete: true }
  )

  return replaced
}
