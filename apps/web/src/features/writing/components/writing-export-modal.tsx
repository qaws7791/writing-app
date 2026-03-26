"use client"
import { Download01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import TurndownService from "turndown"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"

type ExportFormat = "txt" | "markdown"

type WritingExportModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  getContent: () => { title: string; bodyHtml: string; bodyText: string }
}

const turndown = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
})

function htmlToMarkdown(html: string): string {
  return turndown.turndown(html)
}

export function WritingExportModal({
  open,
  onOpenChange,
  getContent,
}: WritingExportModalProps) {
  const handleExport = (format: ExportFormat) => {
    const { title, bodyHtml, bodyText } = getContent()
    const bodyMarkdown = htmlToMarkdown(bodyHtml)

    let content: string
    let filename: string
    let mimeType: string

    if (format === "txt") {
      content = [title, bodyText].filter(Boolean).join("\n\n")
      filename = `${title || "제목 없음"}.txt`
      mimeType = "text/plain"
    } else {
      content = `# ${title}\n\n${bodyMarkdown}`
      filename = `${title || "제목 없음"}.md`
      mimeType = "text/markdown"
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={Download01Icon} strokeWidth={2} />
            파일로 내보내기
          </DialogTitle>
          <DialogDescription>
            원하는 형식으로 글을 다운로드할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            className="w-full justify-start"
            variant="outline"
            onClick={() => handleExport("txt")}
          >
            텍스트 (.txt)
          </Button>
          <Button
            className="w-full justify-start"
            variant="outline"
            onClick={() => handleExport("markdown")}
          >
            마크다운 (.md)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
