"use client"

import { useState } from "react"
import { Clock01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { ScrollArea } from "@workspace/ui/components/scroll-area"

type VersionItem = {
  id: string
  createdAt: string
  label: string
  preview: string
}

type WritingVersionHistoryModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  getContent: () => { title: string; bodyHtml: string }
  versions?: VersionItem[]
}

const mockVersions: VersionItem[] = [
  {
    id: "1",
    createdAt: "2025-03-18 14:30",
    label: "현재 버전",
    preview: "글의 미리보기 내용이 여기에 표시됩니다...",
  },
  {
    id: "2",
    createdAt: "2025-03-18 12:15",
    label: "자동 저장",
    preview: "이전 버전의 내용 미리보기...",
  },
]

export function WritingVersionHistoryModal({
  open,
  onOpenChange,
  getContent,
  versions = mockVersions,
}: WritingVersionHistoryModalProps) {
  const [selectedVersion, setSelectedVersion] = useState<VersionItem | null>(
    versions[0] ?? null
  )

  const { title, bodyHtml } = getContent()
  const isCurrentVersion = selectedVersion?.id === versions[0]?.id
  const previewContent = selectedVersion
    ? isCurrentVersion
      ? `<h1>${title || "제목 없음"}</h1>${bodyHtml || "<p>내용이 없습니다.</p>"}`
      : `<p>${selectedVersion.preview}</p>`
    : ""

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[85vh] max-h-[600px] flex-col gap-0 p-0 sm:max-w-4xl"
        showCloseButton
      >
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} />
            버전 기록
          </DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <div className="flex flex-1 flex-col border-b md:border-e md:border-b-0">
            <div className="px-4 py-2 text-xs font-medium text-muted-foreground">
              미리보기
            </div>
            <ScrollArea className="flex-1 px-6 pb-6">
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{
                  __html: previewContent,
                }}
              />
            </ScrollArea>
          </div>

          <div className="flex w-full flex-col md:w-72 md:min-w-0">
            <div className="px-4 py-2 text-xs font-medium text-muted-foreground">
              버전 목록
            </div>
            <ScrollArea className="flex-1">
              <ul className="flex flex-col gap-0 p-2">
                {versions.map((version) => (
                  <li key={version.id}>
                    <button
                      type="button"
                      className="w-full rounded-md px-4 py-3 text-left text-sm transition-colors hover:bg-accent data-selected:bg-accent data-selected:font-medium"
                      data-selected={
                        selectedVersion?.id === version.id ? "" : undefined
                      }
                      onClick={() => setSelectedVersion(version)}
                    >
                      <div className="font-medium">{version.label}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {version.createdAt}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
